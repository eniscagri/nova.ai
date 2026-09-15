import type { Chat } from '../types/chat';
import type { ChatStorage } from './ChatStorage';
const LEGACY_KEY = 'nova-ai-chats-v1';
export class LocalStorageChatStorage implements ChatStorage {
  private readonly key: string;

  constructor(accountId: string) {
    this.key = `nova-ai-chats-v2:${accountId}`;
  }

  async getChats(): Promise<Chat[]> {
    try {
      const current = localStorage.getItem(this.key);
      if (current !== null) return this.parse(current);


      const legacy = this.parse(localStorage.getItem(LEGACY_KEY) ?? '[]');
      if (legacy.length) localStorage.setItem(this.key, JSON.stringify(legacy));
      return legacy;
    } catch { return []; }
  }

  async saveChat(chat: Chat): Promise<void> {
    const chats = await this.getChats();
    const index = chats.findIndex((item) => item.id === chat.id);
    if (index >= 0) chats[index] = chat; else chats.unshift(chat);
    localStorage.setItem(this.key, JSON.stringify(chats));
  }

  async deleteChat(id: string): Promise<void> {
    localStorage.setItem(this.key, JSON.stringify((await this.getChats()).filter((chat) => chat.id !== id)));
  }

  async clearChats(): Promise<void> { localStorage.removeItem(this.key); }

  private parse(value: string): Chat[] {
    const data = JSON.parse(value) as unknown;
    return Array.isArray(data) ? data as Chat[] : [];
  }
}
