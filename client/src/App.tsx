import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AuthScreen } from './components/AuthScreen';
import { Composer } from './components/Composer';
import { Explore } from './components/Explore';
import { ProfilePage } from './components/ProfilePage';
import { MessageList } from './components/MessageList';
import { Settings } from './components/Settings';
import { Sidebar } from './components/Sidebar';
import { Welcome } from './components/Welcome';
import { LocalStorageChatStorage } from './services/LocalStorageChatStorage';
import { listenForNativeAuthRedirect, novaSessionFrom, SupabaseAuth, type NovaSession } from './services/SupabaseAuth';
import { type ConversationStyle } from './services/SocialService';
import { supabase, supabaseConfigured } from './services/supabase';
import { HttpAiProvider } from './services/ai/HttpAiProvider';
import type { Chat, Message, ThemePreference } from './types/chat';
import { id } from './utils/id';
import { titleFromMessage } from './utils/title';
import { disableUsageReminders, enableUsageReminders, markUsageReminderPrompted, scheduleUsageReminders, usageReminderPrompted, usageRemindersEnabled, usageRemindersSupported } from './services/UsageReminders';

const ai = new HttpAiProvider();
const accountAuth = new SupabaseAuth();
type Screen = 'chat' | 'explore' | 'profile';

export default function App() {
  const [session, setSession] = useState<NovaSession | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [screen, setScreen] = useState<Screen>('chat');
  const [drawer, setDrawer] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationStyle, setConversationStyle] = useState<ConversationStyle>('dengeli');
  const [sharedDraft, setSharedDraft] = useState<string | null>(null);
  const activeRequest = useRef<AbortController | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastFailedPrompt, setLastFailedPrompt] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [connected, setConnected] = useState(false);
  const [theme, setTheme] = useState<ThemePreference>(() => (localStorage.getItem('nova-ai-theme') as ThemePreference) || 'system');
  const [remindersEnabled, setRemindersEnabled] = useState(usageRemindersEnabled);
  const [reminderPromptOpen, setReminderPromptOpen] = useState(false);
  const storage = useMemo(() => session ? new LocalStorageChatStorage(session.user.id) : null, [session?.user.id]);

  useEffect(() => {
    if (!supabaseConfigured) { setAuthReady(true); return; }
    let active = true;
    let removeNativeListener: () => void = () => {};
    void listenForNativeAuthRedirect().then((remove) => { removeNativeListener = remove; });
    void supabase.auth.getSession().then(({ data }) => {
      if (active) setSession(data.session ? novaSessionFrom(data.session) : null);
    }).finally(() => { if (active) setAuthReady(true); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
      if (active) setSession(next ? novaSessionFrom(next) : null);
    });
    return () => { active = false; removeNativeListener(); listener.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!storage) return;
    void storage.getChats().then((saved) => {
      setChats(saved.sort((a, b) => b.updatedAt - a.updatedAt));
      setActiveId(null);
      setScreen('chat');
    });
    void ai.health().then(setConnected);
  }, [storage]);

  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const applyTheme = () => { root.dataset.theme = theme === 'dark' || (theme === 'system' && mediaQuery.matches) ? 'dark' : 'light'; };
    applyTheme();
    localStorage.setItem('nova-ai-theme', theme);
    mediaQuery.addEventListener('change', applyTheme);
    return () => mediaQuery.removeEventListener('change', applyTheme);
  }, [theme]);

  useEffect(() => {
    if (!session || !usageRemindersSupported()) return;
    if (remindersEnabled) void scheduleUsageReminders();
    if (!remindersEnabled && !usageReminderPrompted()) {
      const timer = window.setTimeout(() => setReminderPromptOpen(true), 1800);
      return () => window.clearTimeout(timer);
    }
  }, [session?.user.id, remindersEnabled]);

  const active = useMemo(() => chats.find((chat) => chat.id === activeId) ?? null, [chats, activeId]);
  const persist = useCallback(async (chat: Chat) => {
    if (!storage) return;
    await storage.saveChat(chat);
    setChats((previous) => [chat, ...previous.filter((item) => item.id !== chat.id)].sort((a, b) => b.updatedAt - a.updatedAt));
  }, [storage]);

  const createChat = useCallback(() => {
    const now = Date.now();
    const next = { id: id(), title: 'Yeni sohbet', createdAt: now, updatedAt: now, messages: [] };
    void persist(next);
    setActiveId(next.id);
    setScreen('chat');
    setSharedDraft(null);
    setError(null);
    setDrawer(false);
  }, [persist]);

  const send = useCallback(async (content: string) => {
    const text = content.trim();
    if (!text || loading || !storage) return;
    setScreen('chat');
    setError(null);
    setLastFailedPrompt(null);
    setLoading(true);
    const now = Date.now();
    const currentChat = active ?? { id: id(), title: titleFromMessage(text), createdAt: now, updatedAt: now, messages: [] };
    if (!active) setActiveId(currentChat.id);
    const userMsg: Message = { id: id(), role: 'user', content: text, createdAt: now };
    const assistantMsgId = id();
    const pendingMsg: Message = { id: assistantMsgId, role: 'assistant', content: '', createdAt: now + 1 };
    const updatedChat = { ...currentChat, title: currentChat.messages.length === 0 ? titleFromMessage(text) : currentChat.title, updatedAt: Date.now(), messages: [...currentChat.messages, userMsg, pendingMsg] };
    setChats((previous) => [updatedChat, ...previous.filter((chat) => chat.id !== updatedChat.id)]);
    const controller = new AbortController();
    activeRequest.current = controller;
    let accumulated = '';
    try {
      const response = await ai.chat(updatedChat.messages.slice(0, -1), (delta) => {
        accumulated += delta;
        setChats((previous) => previous.map((chat) => chat.id !== updatedChat.id ? chat : { ...chat, messages: chat.messages.map((message) => message.id === assistantMsgId ? { ...message, content: accumulated } : message) }));
      }, controller.signal, conversationStyle);
      await persist({ ...updatedChat, updatedAt: Date.now(), messages: updatedChat.messages.map((message) => message.id === assistantMsgId ? { ...message, content: response || accumulated } : message) });
      setConnected(true);
    } catch (reason) {
      if (controller.signal.aborted) {
        await persist({ ...updatedChat, updatedAt: Date.now(), messages: accumulated.trim() ? updatedChat.messages.map((message) => message.id === assistantMsgId ? { ...message, content: accumulated } : message) : updatedChat.messages.slice(0, -1) });
        return;
      }
      await persist({ ...updatedChat, messages: updatedChat.messages.slice(0, -1) });
      setLastFailedPrompt(text);
      const providerMessage = reason instanceof Error ? reason.message.split(':').slice(1).join(':').trim() : '';
      setError(providerMessage || 'Bir sorun oluştu. AI servisine şu anda ulaşılamıyor.');
      setConnected(false);
    } finally {
      if (activeRequest.current === controller) activeRequest.current = null;
      setLoading(false);
    }
  }, [active, conversationStyle, loading, persist, storage]);

  const stopGenerating = useCallback(() => activeRequest.current?.abort(), []);
  const rename = useCallback(async (chat: Chat) => {
    const title = prompt('Sohbet adı', chat.title)?.trim();
    if (title && title !== chat.title) await persist({ ...chat, title: title.slice(0, 80), updatedAt: Date.now() });
  }, [persist]);
  const remove = useCallback(async (chat: Chat) => {
    if (!storage || !confirm(`“${chat.title}” silinsin mi? Bu işlem geri alınamaz.`)) return;
    await storage.deleteChat(chat.id);
    setChats((previous) => { const remaining = previous.filter((item) => item.id !== chat.id); if (activeId === chat.id) setActiveId(remaining[0]?.id ?? null); return remaining; });
  }, [activeId, storage]);
  const clear = useCallback(async () => {
    if (!storage || !confirm('Tüm sohbet geçmişi silinsin mi? Bu işlem geri alınamaz.')) return;
    await storage.clearChats(); setChats([]); setActiveId(null); setSettingsOpen(false);
  }, [storage]);
  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null); setChats([]); setActiveId(null); setSettingsOpen(false); setDrawer(false);
  }, []);
  const deleteAccount = useCallback(async () => {
    if (!session) return;
    await accountAuth.deleteAccount(session.token);
    await storage?.clearChats();
    await supabase.auth.signOut();
    setSession(null); setChats([]); setActiveId(null); setSettingsOpen(false); setDrawer(false);
  }, [session, storage]);
  const showExplore = useCallback(() => { setScreen('explore'); setDrawer(false); setError(null); }, []);
  const showProfile = useCallback(() => { setScreen('profile'); setDrawer(false); setError(null); }, []);
  const changeReminders = useCallback(async (enabled: boolean) => {
    if (!enabled) {
      await disableUsageReminders();
      setRemindersEnabled(false);
      setReminderPromptOpen(false);
      return;
    }
    const granted = await enableUsageReminders();
    setRemindersEnabled(granted);
    setReminderPromptOpen(false);
    if (!granted) alert('Bildirim izni verilmedi. İstersen cihaz ayarlarından daha sonra açabilirsin.');
  }, []);
  const dismissReminderPrompt = useCallback(() => {
    markUsageReminderPrompted();
    setReminderPromptOpen(false);
  }, []);

  if (!authReady) return <main className="auth-loading"><img className="auth-logo" src="/nova-logo.png" alt="Nova AI" /><p>Nova AI hazırlanıyor…</p></main>;
  if (!supabaseConfigured) return <main className="auth-loading"><img className="auth-logo" src="/nova-logo.png" alt="Nova AI" /><p>Hesap bağlantısı henüz yapılandırılmadı.</p></main>;
  if (!session) return <AuthScreen onAuthenticated={setSession} />;

  return <div className="app-shell">
    <Sidebar chats={chats} activeId={screen === 'chat' ? activeId : null} open={drawer} query={query} setQuery={setQuery} onNew={createChat} onSelect={(chatId) => { setActiveId(chatId); setScreen('chat'); setSharedDraft(null); }} onRename={rename} onDelete={remove} onExplore={showExplore} onProfile={showProfile} onSettings={() => setSettingsOpen(true)} onClose={() => setDrawer(false)} />
    <main className="chat-main">
      <header className="topbar">
        <button className="hamburger" onClick={() => setDrawer(true)} aria-label="Sohbet menüsünü aç">☰</button>
        <div className="conversation-title"><strong>{screen === 'explore' ? 'Keşfet' : screen === 'profile' ? 'Profilim' : active?.title ?? 'Nova AI'}</strong><small className={connected ? 'status-ready' : 'status-offline'}><i />{screen === 'explore' ? 'Nova topluluğu' : screen === 'profile' ? 'Hesabın ve paylaşımların' : connected ? 'AI bağlantısı hazır' : 'Bağlantı kontrol ediliyor'}</small></div>
        <button className="account-chip" onClick={showProfile} aria-label="Profilimi aç"><span>{session.user.name.slice(0, 1).toLocaleUpperCase('tr-TR')}</span><b>{session.user.name.split(' ')[0]}</b></button>
        <button className="new-mobile" onClick={createChat} aria-label="Yeni sohbet">＋</button>
      </header>
      {screen === 'explore' ? <Explore userId={session.user.id} onStartChat={createChat} onStyleChange={setConversationStyle} sharedDraft={sharedDraft} onShared={() => setSharedDraft(null)} /> : screen === 'profile' ? <ProfilePage userId={session.user.id} onStartChat={createChat} onStyleChange={setConversationStyle} /> : <>
        {active?.messages.length ? <MessageList messages={active.messages} loading={loading && !active.messages.at(-1)?.content} onShare={(content) => { setSharedDraft(content); setScreen('explore'); }} /> : <Welcome choose={send} />}
        {error && <div className="error-toast" role="alert">{error}{lastFailedPrompt && <button onClick={() => void send(lastFailedPrompt)}>Tekrar dene</button>}</div>}
        <Composer onSend={send} generating={loading} onStop={stopGenerating} />
      </>}
    </main>
    <Settings open={settingsOpen} theme={theme} user={session.user} onTheme={setTheme} onClear={clear} onLogout={() => void logout()} onDeleteAccount={deleteAccount} remindersEnabled={remindersEnabled} onReminders={changeReminders} onClose={() => setSettingsOpen(false)} />
    {reminderPromptOpen && <div className="modal-backdrop reminder-backdrop" role="presentation"><section className="reminder-prompt" role="dialog" aria-modal="true" aria-labelledby="reminder-title"><span className="reminder-bell" aria-hidden="true">♢</span><p className="eyebrow">NOVA HATIRLATMALARI</p><h2 id="reminder-title">Nova sana ara sıra hatırlatsın mı?</h2><p>Fikirlerini geliştirmek ve planlarını sürdürmek için birkaç günde bir, yalnızca gündüz saatlerinde kısa bildirimler gönderebilir.</p><div><button onClick={dismissReminderPrompt}>Şimdi değil</button><button onClick={() => void changeReminders(true)}>Bildirimleri aç</button></div></section></div>}
  </div>;
}
