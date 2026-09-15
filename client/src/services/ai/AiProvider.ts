import type { Message } from '../../types/chat';
import type { ConversationStyle } from '../SocialService';
export interface AiProvider { chat(messages: Message[], onDelta?: (delta: string) => void, signal?: AbortSignal, style?: ConversationStyle): Promise<string>; health(): Promise<boolean>; }
