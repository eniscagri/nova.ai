import OpenAI from 'openai';
import type { Response } from 'openai/resources/responses/responses';
import type { AiContext, AiMessage, AiProvider, AiResponse, AiStreamEvent, ConversationStyle } from './AiProvider.js';
import { buildInstructions } from '../services/AiInstructions.js';
import { contextInstructions, requiresSearch } from '../services/AssistantContext.js';
import { renderCitations } from '../services/Citations.js';

export function responseContent(response: Response) {
  const parts = response.output.flatMap(item => item.type === 'message' ? item.content.filter(part => part.type === 'output_text') : []);
  const rendered = parts.map(part => renderCitations(part.text, part.annotations));
  return { content: rendered.map(part => part.content).join('\n') || response.output_text, sources: Array.from(new Map(rendered.flatMap(part => part.sources).map(source => [source.url, source])).values()) };
}

export class OpenAIProvider implements AiProvider {
  readonly name = 'openai';
  readonly supportsStreaming = true;
  readonly isConfigured: boolean;
  private readonly client?: OpenAI;
  constructor(private readonly model: string, apiKey: string | undefined) {
    this.isConfigured = Boolean(apiKey);
    this.client = apiKey ? new OpenAI({ apiKey }) : undefined;
  }
  private async request(messages: AiMessage[], style: ConversationStyle, context: AiContext) {
    return { model: this.model, input: messages, instructions: `${await buildInstructions(style)}\n\n${contextInstructions(context)}`, store: false as const,
      ...(context.webSearch !== 'off' ? { tools: [{ type: 'web_search' as const }], tool_choice: requiresSearch(messages, context) ? 'required' as const : 'auto' as const } : {}) };
  }
  async chat(messages: AiMessage[], signal: AbortSignal, style: ConversationStyle = 'dengeli', context: AiContext = {}): Promise<AiResponse> {
    if (!this.client) throw new Error('OPENAI_API_KEY is not configured');
    const response = await this.client.responses.create(await this.request(messages, style, context), { signal });
    if (response.status !== 'completed' || !response.output_text?.trim()) throw new Error('AI response incomplete');
    return { ...responseContent(response), model: response.model };
  }
  async *stream(messages: AiMessage[], signal: AbortSignal, style: ConversationStyle = 'dengeli', context: AiContext = {}): AsyncIterable<AiStreamEvent> {
    if (!this.client) throw new Error('OPENAI_API_KEY is not configured');
    const stream = await this.client.responses.create({ ...await this.request(messages, style, context), stream: true }, { signal });
    let completed = false;
    let hasText = false;
    for await (const event of stream) {
      if (event.type === 'response.web_search_call.in_progress') yield { type: 'searching' };
      if (event.type === 'response.output_text.delta') { hasText ||= Boolean(event.delta.trim()); yield event.delta; }
      if (event.type === 'response.completed') { completed = true; const result = responseContent(event.response); yield { type: 'content', content: result.content }; yield { type: 'sources', sources: result.sources }; }
      if (event.type === 'error' || event.type === 'response.failed' || event.type === 'response.incomplete') throw new Error('AI response incomplete');
    }
    if (!completed || !hasText) throw new Error('AI response incomplete');
  }
}
