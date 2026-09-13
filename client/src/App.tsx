import { useEffect, useMemo, useState } from 'react';
import { Composer } from './components/Composer';
import { MessageList } from './components/MessageList';
import { Settings } from './components/Settings';
import { Sidebar } from './components/Sidebar';
import { Welcome } from './components/Welcome';
import { LocalStorageChatStorage } from './services/LocalStorageChatStorage';
import { HttpAiProvider } from './services/ai/HttpAiProvider';
import type { Chat, Message, ThemePreference } from './types/chat';
import { id } from './utils/id';
import { titleFromMessage } from './utils/title';

const storage = new LocalStorageChatStorage(); const ai = new HttpAiProvider();
export default function App() {
  const [chats, setChats] = useState<Chat[]>([]); const [activeId, setActiveId] = useState<string | null>(null); const [drawer, setDrawer] = useState(false); const [query, setQuery] = useState(''); const [loading, setLoading] = useState(false); const [error, setError] = useState<string | null>(null); const [settings, setSettings] = useState(false); const [connected, setConnected] = useState(false); const [theme, setTheme] = useState<ThemePreference>(() => (localStorage.getItem('nova-ai-theme') as ThemePreference) || 'system');
  useEffect(() => { storage.getChats().then((saved) => { const ordered = saved.sort((a, b) => b.updatedAt - a.updatedAt); setChats(ordered); setActiveId(ordered[0]?.id ?? null); }); ai.health().then(setConnected); }, []);
  useEffect(() => { const root = document.documentElement; const dark = theme === 'dark' || (theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches); root.dataset.theme = dark ? 'dark' : 'light'; localStorage.setItem('nova-ai-theme', theme); }, [theme]);
  const active = useMemo(() => chats.find((chat) => chat.id === activeId) ?? null, [chats, activeId]);
  const persist = async (chat: Chat) => { await storage.saveChat(chat); setChats((items) => [chat, ...items.filter((item) => item.id !== chat.id)].sort((a, b) => b.updatedAt - a.updatedAt)); };
  const createChat = () => { const now = Date.now(); const chat = { id: id(), title: 'Yeni sohbet', createdAt: now, updatedAt: now, messages: [] }; persist(chat); setActiveId(chat.id); setError(null); setDrawer(false); };
  const send = async (content: string) => {
    let chat: Chat;
    if (active) chat = active;
    else { const now = Date.now(); chat = { id: id(), title: titleFromMessage(content), createdAt: now, updatedAt: now, messages: [] }; setActiveId(chat.id); }
    const user: Message = { id: id(), role: 'user', content, createdAt: Date.now() };
    const updated = { ...chat, title: chat.messages.length ? chat.title : titleFromMessage(content), updatedAt: Date.now(), messages: [...chat.messages, user] };
    await persist(updated); setError(null); setLoading(true);
    const assistantId = id(); let accumulated = '';
    const pending: Message = { id: assistantId, role: 'assistant', content: '', createdAt: Date.now() };
    setChats((items) => items.map((item) => item.id === updated.id ? { ...updated, messages: [...updated.messages, pending] } : item));
    try {
      const response = await ai.chat(updated.messages, (delta) => {
        accumulated += delta;
        setChats((items) => items.map((item) => item.id === updated.id ? { ...item, messages: item.messages.map((message) => message.id === assistantId ? { ...message, content: accumulated } : message) } : item));
      });
      await persist({ ...updated, updatedAt: Date.now(), messages: [...updated.messages, { ...pending, content: response }] });
      setConnected(true);
    } catch {
      await persist(updated);
      setError('Bir sorun oluştu. AI servisine şu anda ulaşılamıyor.'); setConnected(false);
    } finally { setLoading(false); }
  };
  const rename = async (chat: Chat) => { const title = prompt('Sohbet adı', chat.title)?.trim(); if (title) await persist({ ...chat, title: title.slice(0, 80), updatedAt: Date.now() }); };
  const remove = async (chat: Chat) => { if (!confirm(`“${chat.title}” silinsin mi? Bu işlem geri alınamaz.`)) return; await storage.deleteChat(chat.id); const remaining = chats.filter((item) => item.id !== chat.id); setChats(remaining); setActiveId(activeId === chat.id ? remaining[0]?.id ?? null : activeId); };
  const clear = async () => { if (!confirm('Tüm sohbet geçmişi silinsin mi? Bu işlem geri alınamaz.')) return; await storage.clearChats(); setChats([]); setActiveId(null); setSettings(false); };
  return <div className="app-shell"><Sidebar chats={chats} activeId={activeId} open={drawer} query={query} setQuery={setQuery} onNew={createChat} onSelect={setActiveId} onRename={rename} onDelete={remove} onSettings={() => setSettings(true)} onClose={() => setDrawer(false)} /><main className="chat-main"><header className="topbar"><button className="hamburger" onClick={() => setDrawer(true)} aria-label="Sohbet menüsünü aç">☰</button><div><strong>{active?.title ?? 'Nova AI'}</strong><small className={connected ? 'status-ready' : 'status-offline'}><i />{connected ? 'AI bağlantısı hazır' : 'Bağlantı kontrol ediliyor'}</small></div><button className="new-mobile" onClick={createChat} aria-label="Yeni sohbet">＋</button></header>{active?.messages.length ? <MessageList messages={active.messages} loading={loading && !active.messages.at(-1)?.content} /> : <Welcome choose={send} />}{error && <div className="error-toast" role="alert">{error}<button onClick={() => active?.messages.length && send(active.messages.at(-1)?.content ?? '')}>Tekrar dene</button></div>}<Composer onSend={send} disabled={loading} /></main><Settings open={settings} theme={theme} connected={connected} onTheme={setTheme} onClear={clear} onClose={() => setSettings(false)} /></div>;
}
