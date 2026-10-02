export type Role = 'user' | 'assistant';
export interface Source { title: string; url: string }
export type WebSearchMode = 'auto' | 'on' | 'off';
export interface ChatOptions { webSearch: WebSearchMode; memories: string[]; onSources?: (sources: Source[]) => void; onStatus?: (status: string) => void; onNotice?: (notice: string) => void }
export interface Message { id: string; role: Role; content: string; createdAt: number; sources?: Source[]; }
export interface Chat { id: string; title: string; createdAt: number; updatedAt: number; messages: Message[]; }
export type ThemePreference = 'system' | 'light' | 'dark';
