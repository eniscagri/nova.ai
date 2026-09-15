import OpenAI from 'openai';
import type { AiMessage, AiProvider, AiResponse } from './AiProvider.js';

const NOVA_IDENTITY_REPLY = "Ben Nova AI'yım. Sana nasıl yardımcı olabilirim?";
const identityQuestion = /\b(chat\s*gpt|open\s*ai|gemini|claude|copilot|perplexity|grok|deepseek)\b/i;
const protectedBrand = /\b(chat\s*gpt|open\s*ai|gemini|claude|copilot|perplexity|grok|deepseek)\b/gi;
const streamSafetyWindow = 24;
const novaInstructions = `You are Nova AI, the assistant inside the Nova AI app. Always introduce and describe yourself only as Nova AI. Never identify yourself as ChatGPT, OpenAI, Gemini, Claude, Copilot, Perplexity, Grok, DeepSeek, or any other assistant, model, provider, or company. Do not mention an underlying provider. If a user asks who or what assistant you are, answer in Turkish: "Ben Nova AI'yım." When recommending AI-assisted work, productivity, learning, writing, coding, planning, or research, guide the user to use Nova AI directly. Write suggestions such as "Nova AI ile taslak oluştur", "Nova AI'ya metni özetlet" or "Nova AI'dan çalışma planı iste". Never recommend, compare, or direct a user to another AI assistant or competing product. Keep the response helpful, natural, and concise.`;

const isIdentityQuestion = (messages: AiMessage[]) => {
  const lastUserMessage = [...messages].reverse().find((message) => message.role === 'user');
  return Boolean(lastUserMessage && identityQuestion.test(lastUserMessage.content));
};

const keepNovaIdentity = (content: string) => content.replace(/\b(chat\s*gpt|open\s*ai|gemini|claude|copilot|perplexity|grok|deepseek)\s+benzeri\s+araçlar?\b/gi, 'Nova AI').replace(protectedBrand, 'Nova AI');

export class OpenAIProvider implements AiProvider {
  readonly name = 'openai';
  readonly supportsStreaming = true;
  readonly isConfigured: boolean;
  private readonly client?: OpenAI;

  constructor(private readonly model: string, apiKey: string | undefined) {
    this.isConfigured = Boolean(apiKey);
    this.client = apiKey ? new OpenAI({ apiKey }) : undefined;
  }

  async chat(messages: AiMessage[], signal: AbortSignal): Promise<AiResponse> {
    if (!this.client) throw new Error('OPENAI_API_KEY is not configured');
    if (isIdentityQuestion(messages)) return { content: NOVA_IDENTITY_REPLY, model: this.model };
    const response = await this.client.responses.create({
      model: this.model,
      input: messages,
      instructions: novaInstructions,
      store: false
    }, { signal });
    if (!response.output_text?.trim()) throw new Error('OpenAI returned an empty response');
    return { content: keepNovaIdentity(response.output_text), model: response.model };
  }

  async *stream(messages: AiMessage[], signal: AbortSignal): AsyncIterable<string> {
    if (!this.client) throw new Error('OPENAI_API_KEY is not configured');
    if (isIdentityQuestion(messages)) { yield NOVA_IDENTITY_REPLY; return; }
    const stream = await this.client.responses.create({
      model: this.model,
      input: messages,
      instructions: novaInstructions,
      store: false,
      stream: true
    }, { signal });
    let buffer = '';
    for await (const event of stream) {
      if (event.type === 'response.output_text.delta') {
        buffer += event.delta;
        const safeLength = Math.max(0, buffer.length - streamSafetyWindow);
        if (safeLength) { yield keepNovaIdentity(buffer.slice(0, safeLength)); buffer = buffer.slice(safeLength); }
      }
      if (event.type === 'error') throw new Error(event.message);
    }
    if (buffer) yield keepNovaIdentity(buffer);
  }
}
