import type { Message } from '../../types/chat';
import type { AiProvider } from './AiProvider';
import type { ConversationStyle } from '../SocialService';
import { apiBaseUrl as baseUrl } from '../api';
export class HttpAiProvider implements AiProvider {
  async health(): Promise<boolean> { try { const response = await fetch(`${baseUrl}/api/health`, { signal: AbortSignal.timeout(5000) }); const body = await response.json() as { status?: string; ai?: { configured?: boolean } }; return response.ok && body.status === 'ok' && body.ai?.configured === true; } catch { return false; } }
  async chat(messages: Message[], onDelta?: (delta: string) => void, signal?: AbortSignal, style: ConversationStyle = 'dengeli'): Promise<string> {
    let response: Response;
    const timeout = AbortSignal.timeout(35000);
    const requestSignal = signal ? AbortSignal.any([signal, timeout]) : timeout;
    try { response = await fetch(`${baseUrl}/api/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: messages.map(({ role, content }) => ({ role, content })), stream: Boolean(onDelta), conversationStyle: style }), signal: requestSignal }); }
    catch { throw new Error('NETWORK'); }
    if (!response.ok) {
      const body = await response.json().catch(() => null) as { error?: { code?: unknown; message?: unknown } } | null;
      const code = typeof body?.error?.code === 'string' ? body.error.code : 'API';
      const message = typeof body?.error?.message === 'string' ? body.error.message : '';
      throw new Error(message ? `${code}:${message}` : code);
    }
    if (response.headers.get('content-type')?.includes('text/event-stream')) return this.readStream(response, onDelta);
    const body: unknown = await response.json().catch(() => null);
    if (!body || typeof body !== 'object') throw new Error('API');
    const content = (body as { message?: { content?: unknown } }).message?.content;
    if (typeof content !== 'string' || !content.trim()) throw new Error('MALFORMED');
    return content;
  }

  private async readStream(response: Response, onDelta?: (delta: string) => void): Promise<string> {
    if (!response.body) throw new Error('MALFORMED');
    const reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = ''; let content = ''; let completed = false;
    while (true) {
      const next = await reader.read(); if (next.done) break;
      buffer += decoder.decode(next.value, { stream: true });
      const events = buffer.split('\n\n'); buffer = events.pop() ?? '';
      for (const event of events) {
        const type = event.match(/^event: (.+)$/m)?.[1]; const raw = event.match(/^data: (.+)$/m)?.[1];
        if (!raw) continue;
        const data = JSON.parse(raw) as { delta?: unknown; error?: { message?: string } };
        if (type === 'done') completed = true;
        if (type === 'error') throw new Error(data.error?.message ?? 'API');
        if (type === 'delta' && typeof data.delta === 'string') { content += data.delta; onDelta?.(data.delta); }
      }
    }
    if (!completed || !content.trim()) throw new Error('MALFORMED');
    return content;
  }
}
