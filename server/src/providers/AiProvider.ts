export type AiRole = 'user' | 'assistant';
export interface AiMessage { role: AiRole; content: string }
export interface Source { title: string; url: string }
export interface AiContext { webSearch?: 'auto' | 'on' | 'off'; memories?: string[] }
export type AiStreamEvent = string | { type: 'sources'; sources: Source[] } | { type: 'content'; content: string } | { type: 'searching' };
export interface AiResponse { content: string; model?: string; sources?: Source[] }
export type ConversationStyle = 'dengeli' | 'futbol' | 'basketbol' | 'kitap' | 'girisimci' | 'sakin_koc' | 'ekonomist';
export interface AiProvider {
  readonly name: string;
  readonly supportsStreaming: boolean;
  readonly isConfigured: boolean;
  chat(messages: AiMessage[], signal: AbortSignal, conversationStyle?: ConversationStyle, context?: AiContext): Promise<AiResponse>;
  stream?(messages: AiMessage[], signal: AbortSignal, conversationStyle?: ConversationStyle, context?: AiContext): AsyncIterable<AiStreamEvent>;
}
