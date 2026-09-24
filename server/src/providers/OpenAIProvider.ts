import OpenAI from 'openai';
import type { AiMessage, AiProvider, AiResponse, ConversationStyle } from './AiProvider.js';
import { buildInstructions } from '../services/AiInstructions.js';

export class OpenAIProvider implements AiProvider {
  readonly name = 'openai';
  readonly supportsStreaming = true;
  readonly isConfigured: boolean;
  private readonly client?: OpenAI;
  constructor(private readonly model: string, apiKey: string | undefined) {
    this.isConfigured = Boolean(apiKey);
    this.client = apiKey ? new OpenAI({ apiKey }) : undefined;
  }
  async chat(messages: AiMessage[], signal: AbortSignal, style: ConversationStyle = 'dengeli'): Promise<AiResponse> {
    if (!this.client) throw new Error('OPENAI_API_KEY is not configured');
    const response = await this.client.responses.create({ model: this.model, input: messages, instructions: await buildInstructions(style), store: false }, { signal });
    if (response.status !== 'completed' || !response.output_text?.trim()) throw new Error('AI response incomplete');
    return { content: response.output_text, model: response.model };
  }
  async *stream(messages: AiMessage[], signal: AbortSignal, style: ConversationStyle = 'dengeli'): AsyncIterable<string> {
    if (!this.client) throw new Error('OPENAI_API_KEY is not configured');
    const stream = await this.client.responses.create({ model: this.model, input: messages, instructions: await buildInstructions(style), store: false, stream: true }, { signal });
    let completed = false;
    let hasText = false;
    for await (const event of stream) {
      if (event.type === 'response.output_text.delta') { hasText ||= Boolean(event.delta.trim()); yield event.delta; }
      if (event.type === 'response.completed') completed = true;
      if (event.type === 'error' || event.type === 'response.failed' || event.type === 'response.incomplete') throw new Error('AI response incomplete');
    }
    if (!completed || !hasText) throw new Error('AI response incomplete');
  }
}
