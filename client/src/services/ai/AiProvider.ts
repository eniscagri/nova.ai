import type { Message } from '../../types/chat';
export interface AiProvider { chat(messages: Message[], onDelta?: (delta: string) => void): Promise<string>; health(): Promise<boolean>; }
