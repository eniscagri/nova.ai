export type Role = 'user' | 'assistant';
export interface Message { id: string; role: Role; content: string; createdAt: number; }
export interface Chat { id: string; title: string; createdAt: number; updatedAt: number; messages: Message[]; }
export type ThemePreference = 'system' | 'light' | 'dark';
