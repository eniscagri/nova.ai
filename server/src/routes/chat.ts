import { Router } from 'express';
import { z } from 'zod';
import type { AiProvider, ConversationStyle } from '../providers/AiProvider.js';

const payloadSchema = z.object({ messages: z.array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().trim().min(1) }).strict()).min(1), stream: z.boolean().optional(), conversationStyle: z.enum(['dengeli', 'futbol', 'basketbol', 'kitap', 'girisimci', 'sakin_koc', 'ekonomist']).optional(), webSearch: z.enum(['auto', 'on', 'off']).default('auto'), memories: z.array(z.string().trim().min(1).max(300)).max(30).default([]) }).strict();

function errorPayload(error: unknown, timedOut: boolean) {
  if (timedOut) return { status: 504, code: 'AI_TIMEOUT', message: 'AI servisi zamanında yanıt vermedi.' };
  if (error instanceof Error && error.message.includes('OPENAI_API_KEY')) return { status: 503, code: 'AI_NOT_CONFIGURED', message: 'AI bağlantısı henüz yapılandırılmadı.' };
  const status = typeof error === 'object' && error !== null && 'status' in error && typeof error.status === 'number' ? error.status : 502;
  if (status === 401 || status === 403) return { status, code: 'AI_AUTH_ERROR', message: 'AI bağlantısı doğrulanamadı.' };
  if (status === 429) return { status, code: 'AI_RATE_LIMITED', message: 'AI servisi şu anda yoğun. Lütfen biraz sonra tekrar deneyin.' };
  if (status >= 500) return { status: 502, code: 'AI_PROVIDER_ERROR', message: 'AI servisine şu anda ulaşılamıyor.' };
  const message = error instanceof Error ? error.message : '';
  if (message.includes('OPENAI_API_KEY')) return { status: 503, code: 'AI_NOT_CONFIGURED', message: 'AI bağlantısı henüz yapılandırılmadı.' };
  return { status: 502, code: 'AI_PROVIDER_ERROR', message: 'AI servisine şu anda ulaşılamıyor.' };
}

export function chatRouter(provider: AiProvider, timeoutMs: number, maxMessageLength: number, maxMessages: number) {
  const router = Router();
  router.post('/chat', async (req, res) => {
    const parsed = payloadSchema.safeParse(req.body);
    if (!parsed.success || parsed.data.messages.length > maxMessages || parsed.data.messages.some((m) => m.content.length > maxMessageLength)) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Mesaj biçimi veya uzunluğu geçersiz.' } }); return;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), Math.max(timeoutMs, parsed.data.webSearch === 'off' ? 0 : 90000));
    const disconnected = () => { if (!res.writableEnded) controller.abort(); };
    res.on('close', disconnected);
    try {
      if (parsed.data.stream && provider.supportsStreaming && provider.stream) {
        res.status(200).set({ 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
        res.flushHeaders();
        for await (const event of provider.stream(parsed.data.messages, controller.signal, parsed.data.conversationStyle as ConversationStyle | undefined, parsed.data)) {
          if (typeof event === 'string') res.write(`event: delta\ndata: ${JSON.stringify({ delta: event })}\n\n`);
          else res.write(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
        }
        res.write('event: done\ndata: {}\n\n');
        res.end();
        return;
      }
      const result = await provider.chat(parsed.data.messages, controller.signal, parsed.data.conversationStyle as ConversationStyle | undefined, parsed.data);
      if (!result.content?.trim()) throw new Error('Provider returned an empty response');
      res.json({ message: { role: 'assistant', content: result.content }, sources: result.sources ?? [], provider: provider.name, streaming: false });
    } catch (error) {
      const failure = errorPayload(error, controller.signal.aborted);
      if (res.headersSent) { res.write(`event: error\ndata: ${JSON.stringify({ error: { code: failure.code, message: failure.message } })}\n\n`); res.end(); }
      else res.status(failure.status).json({ error: { code: failure.code, message: failure.message } });
    } finally { clearTimeout(timer); res.off('close', disconnected); }
  });
  return router;
}
