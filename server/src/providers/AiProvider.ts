export type AiRole = 'user' | 'assistant';
export interface AiMessage { role: AiRole; content: string }
export interface AiResponse { content: string; model?: string }
export interface AiProvider {
  readonly name: string;
  readonly supportsStreaming: boolean;
  readonly isConfigured: boolean;
  chat(messages: AiMessage[], signal: AbortSignal): Promise<AiResponse>;
  stream?(messages: AiMessage[], signal: AbortSignal): AsyncIterable<string>;
}
