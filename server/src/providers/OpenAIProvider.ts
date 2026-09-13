import OpenAI from 'openai';
import type { AiMessage, AiProvider, AiResponse } from './AiProvider.js';

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
    const response = await this.client.responses.create({
      model: this.model,
      input: messages,
      store: false
    }, { signal });
    if (!response.output_text?.trim()) throw new Error('OpenAI returned an empty response');
    return { content: response.output_text, model: response.model };
  }

  async *stream(messages: AiMessage[], signal: AbortSignal): AsyncIterable<string> {
    if (!this.client) throw new Error('OPENAI_API_KEY is not configured');
    const stream = await this.client.responses.create({
      model: this.model,
      input: messages,
      store: false,
      stream: true
    }, { signal });
    for await (const event of stream) {
      if (event.type === 'response.output_text.delta') yield event.delta;
      if (event.type === 'error') throw new Error(event.message);
    }
  }
}
