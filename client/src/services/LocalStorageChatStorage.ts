import type { Chat } from '../types/chat';
import type { ChatStorage } from './ChatStorage';
const KEY = 'nova-ai-chats-v1';
export class LocalStorageChatStorage implements ChatStorage {
  async getChats(): Promise<Chat[]> { try { const data = JSON.parse(localStorage.getItem(KEY) ?? '[]'); return Array.isArray(data) ? data : []; } catch { return []; } }
  async saveChat(chat: Chat): Promise<void> { const chats = await this.getChats(); const index = chats.findIndex((item) => item.id === chat.id); if (index >= 0) chats[index] = chat; else chats.unshift(chat); localStorage.setItem(KEY, JSON.stringify(chats)); }
  async deleteChat(id: string): Promise<void> { localStorage.setItem(KEY, JSON.stringify((await this.getChats()).filter((chat) => chat.id !== id))); }
  async clearChats(): Promise<void> { localStorage.removeItem(KEY); }
}
