import type { Chat } from '../types/chat';
export interface ChatStorage { getChats(): Promise<Chat[]>; saveChat(chat: Chat): Promise<void>; deleteChat(id: string): Promise<void>; clearChats(): Promise<void>; }
