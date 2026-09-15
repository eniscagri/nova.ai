import type { Message } from '../../types/chat';
export interface AiProvider { chat(messages: Message[], onDelta?: (delta: string) => void, signal?: AbortSignal): Promise<string>; health(): Promise<boolean>; }
