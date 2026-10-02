import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AuthScreen } from './components/AuthScreen';
import { ChatComposer as Composer } from './components/ChatComposer';
import { Explore } from './components/Explore';
import { ProfilePage } from './components/ProfilePage';
import { MessageList } from './components/MessageList';
import { Settings } from './components/Settings';
import { ModernSidebar as Sidebar } from './components/ModernSidebar';
import { ChatWelcome as Welcome } from './components/ChatWelcome';
import { MemoryPanel } from './components/MemoryPanel';
import { CloudMemoryStore } from './services/CloudMemoryStore';
import { supabaseMemoryGateway, previewMemoryGateway } from './services/SupabaseMemoryGateway';
import { Icon } from './components/Icon';
import { LocalNotifications } from '@capacitor/local-notifications';
import { App as NativeApp } from '@capacitor/app';
import { LocalStorageChatStorage } from './services/LocalStorageChatStorage';
import { listenForNativeAuthRedirect, novaSessionFrom, SupabaseAuth, type NovaSession } from './services/SupabaseAuth';
import { SocialService, type ConversationStyle, type SocialProfile } from './services/SocialService';
import { personalSuggestions } from './services/PersonalSuggestions';
import type { Memory } from './services/MemoryStore';
import { conversationTones } from './services/ConversationTones';
import { supabase, supabaseConfigured } from './services/supabase';
import { HttpAiProvider } from './services/ai/HttpAiProvider';
import type { Chat, Message, Source, ThemePreference, WebSearchMode } from './types/chat';
import { id } from './utils/id';
import { titleFromMessage } from './utils/title';
import { disableUsageReminders, enableUsageReminders, markUsageReminderPrompted, scheduleUsageReminders, usageReminderPrompted, usageRemindersEnabled, usageRemindersSupported } from './services/UsageReminders';

const ai = new HttpAiProvider();
const accountAuth = new SupabaseAuth();
type Screen = 'chat' | 'explore' | 'profile';
const preview = import.meta.env.DEV && new URLSearchParams(location.search).get('preview') === '1';

export default function App() {
  const [session, setSession] = useState<NovaSession | null>(preview ? { token: '', user: { id: 'design-preview', name: 'Misafir', email: '', createdAt: 0 } } : null);
  const [authReady, setAuthReady] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [screen, setScreen] = useState<Screen>('chat');
  const [drawer, setDrawer] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [webSearch, setWebSearch] = useState<WebSearchMode>('auto');
  const [memoryOpen, setMemoryOpen] = useState(false);
  const closeMemory = useCallback(() => setMemoryOpen(false), []);
  const [memoryCount, setMemoryCount] = useState(0);
  const [personalMemories, setPersonalMemories] = useState<{ ownerId: string; items: Memory[] }>({ ownerId: '', items: [] });
  const [personalProfile, setPersonalProfile] = useState<SocialProfile | null>(null);
  const [memoryEnabled, setMemoryEnabled] = useState(true);
  const [memoryNotice, setMemoryNotice] = useState('');
  const [activity, setActivity] = useState('');
  const [aiNotice, setAiNotice] = useState('');
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
  const memoryStore = useMemo(() => session ? new CloudMemoryStore(session.user.id, preview ? previewMemoryGateway() : supabaseMemoryGateway) : null, [session?.user.id]);
  const refreshMemory = useCallback(() => { if (memoryStore) { setMemoryCount(memoryStore.list().length); setMemoryEnabled(memoryStore.enabled()); setPersonalMemories({ ownerId: session?.user.id ?? '', items: [...memoryStore.list()] }); } }, [memoryStore, session?.user.id]);
  useEffect(() => {
    let active = true;
    setPersonalMemories({ ownerId: '', items: [] });
    const refresh = () => { void memoryStore?.refresh().then(() => { if (active) refreshMemory(); }).catch(() => { if (active) { setMemoryEnabled(false); setMemoryCount(0); setPersonalMemories({ ownerId: '', items: [] }); } }); };
    refresh();
    window.addEventListener('focus', refresh);
    const visible = () => { if (document.visibilityState === 'visible') refresh(); };
    document.addEventListener('visibilitychange', visible);
    return () => { active = false; window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', visible); };
  }, [memoryStore, refreshMemory]);
  useEffect(() => { let active = true; if (session && !preview) void new SocialService().profile(session.user.id).then(profile => { if (active) { setPersonalProfile(profile); if (profile) setConversationStyle(profile.conversation_style); } }).catch(() => { if (active) setPersonalProfile(null); }); return () => { active = false; }; }, [session?.user.id, screen]);
  const matchingProfile = personalProfile?.id === session?.user.id ? personalProfile : null;
  const suggestions = useMemo(() => personalSuggestions({ tone: conversationStyle, interests: matchingProfile?.interests, memories: memoryEnabled && personalMemories.ownerId === session?.user.id ? personalMemories.items : [] }), [conversationStyle, matchingProfile, memoryEnabled, personalMemories, session?.user.id]);
  const changeTone = useCallback(async (tone: ConversationStyle) => { if (!session) return; if (!preview) await new SocialService().saveTone(session.user.id, tone); setConversationStyle(tone); }, [session?.user.id]);
  useEffect(() => { if (!memoryNotice) return; const timer = setTimeout(() => setMemoryNotice(''), 7000); return () => clearTimeout(timer); }, [memoryNotice]);

  useEffect(() => {
    if (preview) { setAuthReady(true); return; }
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
    if (remindersEnabled) void scheduleUsageReminders().then(enabled => setRemindersEnabled(Boolean(enabled))).catch(() => { setRemindersEnabled(false); setError('Hatırlatmalar ayarlanamadı. Ayarlar bölümünden tekrar dene.'); });
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
    setAiNotice('');
    setDrawer(false);
  }, [persist]);

  useEffect(() => {
    if (!session || !usageRemindersSupported()) return;
    let disposed = false;
    const listeners = Promise.all([
      LocalNotifications.addListener('localNotificationActionPerformed', action => { if (action.notification.extra?.destination === 'chat') createChat(); }),
      NativeApp.addListener('appStateChange', state => { if (state.isActive && usageRemindersEnabled()) void scheduleUsageReminders().then(enabled => { if (!disposed) setRemindersEnabled(Boolean(enabled)); }).catch(() => { if (!disposed) setRemindersEnabled(false); }); }),
    ]);
    return () => { disposed = true; void listeners.then(handles => handles.forEach(handle => void handle.remove())); };
  }, [session?.user.id, createChat]);

  const send = useCallback(async (content: string) => {
    if (preview) { setError('Bu ekran tasarım önizlemesi. Gerçek sohbet için hesabınla giriş yapmalısın.'); return; }
    const text = content.trim();
    if (!text || loading || !storage) return;
    setScreen('chat');
    setError(null);
    setLastFailedPrompt(null);
    setLoading(true);
    setActivity('Nova düşünüyor…');
    const controller = new AbortController();
    activeRequest.current = controller;
    let memoryContext: string[] = [];
    try {
      const saved = await memoryStore?.capture(text) ?? [];
      memoryContext = await memoryStore?.context() ?? [];
      refreshMemory();
      if (saved.length) setMemoryNotice(`${saved.length} bilgi hesap belleğine kaydedildi`);
    } catch { setMemoryEnabled(false); setMemoryNotice('Bellek eşitlenemedi; bu yanıt bellek kullanılmadan hazırlanacak.'); }
    if (controller.signal.aborted) { activeRequest.current = null; setLoading(false); setActivity(''); return; }
    const now = Date.now();
    const currentChat = active ?? { id: id(), title: titleFromMessage(text), createdAt: now, updatedAt: now, messages: [] };
    if (!active) setActiveId(currentChat.id);
    const userMsg: Message = { id: id(), role: 'user', content: text, createdAt: now };
    const assistantMsgId = id();
    const pendingMsg: Message = { id: assistantMsgId, role: 'assistant', content: '', createdAt: now + 1 };
    const updatedChat = { ...currentChat, title: currentChat.messages.length === 0 ? titleFromMessage(text) : currentChat.title, updatedAt: Date.now(), messages: [...currentChat.messages, userMsg, pendingMsg] };
    setChats((previous) => [updatedChat, ...previous.filter((chat) => chat.id !== updatedChat.id)]);
    let accumulated = '';
    let sources: Source[] = [];
    try {
      const response = await ai.chat(updatedChat.messages.slice(0, -1), (delta) => {
        accumulated += delta;
        setChats((previous) => previous.map((chat) => chat.id !== updatedChat.id ? chat : { ...chat, messages: chat.messages.map((message) => message.id === assistantMsgId ? { ...message, content: accumulated } : message) }));
      }, controller.signal, conversationStyle, { webSearch, memories: memoryContext, onSources: value => { sources = value; }, onStatus: setActivity, onNotice: setAiNotice });
      await persist({ ...updatedChat, updatedAt: Date.now(), messages: updatedChat.messages.map((message) => message.id === assistantMsgId ? { ...message, content: response || accumulated, sources } : message) });
      setConnected(true);
    } catch (reason) {
      if (controller.signal.aborted) {
        await persist({ ...updatedChat, updatedAt: Date.now(), messages: accumulated.trim() ? updatedChat.messages.map((message) => message.id === assistantMsgId ? { ...message, content: accumulated } : message) : updatedChat.messages.slice(0, -1) });
        return;
      }
      await persist({ ...updatedChat, messages: updatedChat.messages.slice(0, -1) });
      setLastFailedPrompt(text);
      const providerMessage = reason instanceof Error ? (reason.message.includes(':') ? reason.message.split(':').slice(1).join(':').trim() : reason.message === 'NETWORK' ? 'Sunucuya ulaşılamıyor. Bağlantını kontrol et.' : reason.message) : '';
      setError(providerMessage || 'Bir sorun oluştu. AI servisine şu anda ulaşılamıyor.');
      setConnected(false);
    } finally {
      if (activeRequest.current === controller) activeRequest.current = null;
      setLoading(false);
      setActivity('');
    }
  }, [active, conversationStyle, loading, persist, storage, memoryStore, refreshMemory, webSearch]);

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
    if (preview) { location.href = '/'; return; }
    await supabase.auth.signOut();
    setSession(null); setChats([]); setActiveId(null); setSettingsOpen(false); setDrawer(false); setMemoryOpen(false); setMemoryNotice('');
    setAiNotice('');
  }, []);
  const deleteAccount = useCallback(async () => {
    if (preview) throw new Error('Tasarım önizlemesinde hesap işlemleri yapılmaz.');
    if (!session) return;
    await accountAuth.deleteAccount(session.token);
    await storage?.clearChats();
    memoryStore?.forget();
    await supabase.auth.signOut();
    setSession(null); setChats([]); setActiveId(null); setSettingsOpen(false); setDrawer(false);
  }, [session, storage, memoryStore]);
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
  if (!supabaseConfigured && !preview) return <main className="auth-loading"><img className="auth-logo" src="/nova-logo.png" alt="Nova AI" /><p>Hesap bağlantısı henüz yapılandırılmadı.</p>{import.meta.env.DEV && <a className="preview-link" href="/?preview=1">Yeni görünümü incele →</a>}</main>;
  if (!session) return <AuthScreen onAuthenticated={setSession} />;

  return <div className="app-shell">
    <Sidebar chats={chats} activeId={screen === 'chat' ? activeId : null} open={drawer} query={query} setQuery={setQuery} onNew={createChat} onSelect={(chatId) => { setActiveId(chatId); setScreen('chat'); setSharedDraft(null); }} onRename={rename} onDelete={remove} onExplore={() => preview ? setError('Keşfet için hesabınla giriş yap.') : showExplore()} onProfile={() => preview ? setSettingsOpen(true) : showProfile()} onSettings={() => setSettingsOpen(true)} onClose={() => setDrawer(false)} onMemory={() => setMemoryOpen(true)} name={session.user.name} memoryCount={memoryCount} />
    <main className={`chat-main ${screen === 'chat' && !active?.messages.length ? 'empty-chat' : ''}`}>
      <header className="topbar">
        <button className="hamburger" onClick={() => setDrawer(true)} aria-label="Sohbet menüsünü aç"><Icon name="menu" /></button>
        <div className="conversation-title"><strong>{screen === 'chat' ? 'Nova AI' : screen === 'explore' ? 'Keşfet' : 'Profilim'}</strong></div>
        {screen === 'chat' && <button className="tone-chip" onClick={() => setSettingsOpen(true)}>{conversationTones.find(tone => tone.value === conversationStyle)?.label ?? 'Net ve dengeli'}<Icon name="chevron" /></button>}
        <button className="account-chip" onClick={() => preview ? setSettingsOpen(true) : showProfile()} aria-label="Profilimi aç"><span>{session.user.name.slice(0, 1).toLocaleUpperCase('tr-TR')}</span><b>{session.user.name.split(' ')[0]}</b></button>
        <button className="new-mobile" onClick={createChat} aria-label="Yeni sohbet">＋</button>
      </header>
      {screen === 'explore' ? <Explore userId={session.user.id} onStartChat={createChat} onStyleChange={setConversationStyle} sharedDraft={sharedDraft} onShared={() => setSharedDraft(null)} /> : screen === 'profile' ? <ProfilePage userId={session.user.id} onStartChat={createChat} onStyleChange={setConversationStyle} /> : <>
        {active?.messages.length ? <MessageList messages={active.messages} loading={loading && !active.messages.at(-1)?.content} onShare={(content) => { setSharedDraft(content); setScreen('explore'); }} /> : <Welcome name={matchingProfile?.display_name || session.user.name} economist={conversationStyle === 'ekonomist'} />}
        {loading && <div className="activity-status" role="status">{activity}</div>}
        {aiNotice && <div className="activity-status" role="status">{aiNotice}</div>}
        {error && <div className="error-toast" role="alert">{error}{lastFailedPrompt && <button onClick={() => void send(lastFailedPrompt)}>Tekrar dene</button>}</div>}
        <Composer suggestions={suggestions} onSend={send} generating={loading} onStop={stopGenerating} webSearch={webSearch} onWebSearch={setWebSearch} memoryEnabled={memoryEnabled} onMemory={() => setMemoryOpen(true)} />
      </>}
    </main>
    {memoryOpen && memoryStore && <MemoryPanel store={memoryStore} onClose={closeMemory} onChange={refreshMemory} />}
    {memoryNotice && <button className="memory-notice" role="status" onClick={() => { setMemoryNotice(''); setMemoryOpen(true); }}><Icon name="memory" />{memoryNotice}<span>Görüntüle →</span></button>}
    <Settings open={settingsOpen} theme={theme} user={session.user} tone={conversationStyle} onTone={changeTone} onTheme={setTheme} onClear={clear} onLogout={() => void logout()} onDeleteAccount={deleteAccount} remindersEnabled={remindersEnabled} onReminders={changeReminders} onClose={() => setSettingsOpen(false)} />
    {reminderPromptOpen && <div className="modal-backdrop reminder-backdrop" role="presentation"><section className="reminder-prompt" role="dialog" aria-modal="true" aria-labelledby="reminder-title"><span className="reminder-bell" aria-hidden="true">♢</span><p className="eyebrow">NOVA HATIRLATMALARI</p><h2 id="reminder-title">Nova sana ara sıra hatırlatsın mı?</h2><p>Haftada iki kısa hatırlatma: salı 18.00 ve cumartesi 12.00. İstediğin zaman ayarlardan kapatabilirsin.</p><div><button onClick={dismissReminderPrompt}>Şimdi değil</button><button onClick={() => void changeReminders(true)}>Bildirimleri aç</button></div></section></div>}
  </div>;
}
