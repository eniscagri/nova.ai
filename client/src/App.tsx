import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AuthScreen } from './components/AuthScreen';
import { Composer } from './components/Composer';
import { MessageList } from './components/MessageList';
import { Settings } from './components/Settings';
import { Sidebar } from './components/Sidebar';
import { Welcome } from './components/Welcome';
import { AuthApi, type AuthSession } from './services/AuthApi';
import { LocalStorageChatStorage } from './services/LocalStorageChatStorage';
import { HttpAiProvider } from './services/ai/HttpAiProvider';
import type { Chat, Message, ThemePreference } from './types/chat';
import { id } from './utils/id';
import { titleFromMessage } from './utils/title';

const storage = new LocalStorageChatStorage();
const ai = new HttpAiProvider();
const auth = new AuthApi();

export default function App() {
  // 1. State Yönetimi
  const [session, setSession] = useState<AuthSession | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [drawer, setDrawer] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const activeRequest = useRef<AbortController | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastFailedPrompt, setLastFailedPrompt] = useState<string | null>(null); // Hata kurtarma için
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [connected, setConnected] = useState(false);
  const [theme, setTheme] = useState<ThemePreference>(
    () => (localStorage.getItem('nova-ai-theme') as ThemePreference) || 'system'
  );

  // 2. Oturum (Auth) Başlatma
  useEffect(() => {
    const saved = auth.savedSession();
    if (!saved) {
      setAuthReady(true);
      return;
    }

    auth.session(saved.token)
      .then((user) => setSession({ token: saved.token, user }))
      .catch(() => auth.clear())
      .finally(() => setAuthReady(true));
  }, []);

  // 3. Veri Yükleme (Sohbetler ve AI Durumu)
  useEffect(() => {
    if (!session) return;

    storage.getChats().then((saved) => {
      const ordered = saved.sort((a, b) => b.updatedAt - a.updatedAt);
      setChats(ordered);
      // Her uygulama açılışında kullanıcıyı önce boş Yeni sohbet alanına getir.
      // Geçmiş silinmez; kullanıcı dilediğinde sol menüden geri dönebilir.
      setActiveId(null);
    });

    ai.health().then(setConnected);
  }, [session]);

  // 4. Dinamik Tema Yönetimi (Sistem değişikliklerini dinler)
  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      const isDark = theme === 'dark' || (theme === 'system' && mediaQuery.matches);
      root.dataset.theme = isDark ? 'dark' : 'light';
    };

    applyTheme();
    localStorage.setItem('nova-ai-theme', theme);

    mediaQuery.addEventListener('change', applyTheme);
    return () => mediaQuery.removeEventListener('change', applyTheme);
  }, [theme]);

  // 5. Memoization ve Callback'ler (Gereksiz Render'ları Önler)
  const active = useMemo(() => chats.find((c) => c.id === activeId) ?? null, [chats, activeId]);

  const persist = useCallback(async (chat: Chat) => {
    await storage.saveChat(chat);
    setChats((prev) => [chat, ...prev.filter((item) => item.id !== chat.id)].sort((a, b) => b.updatedAt - a.updatedAt));
  }, []);

  const createChat = useCallback(() => {
    const now = Date.now();
    const newChat = { id: id(), title: 'Yeni sohbet', createdAt: now, updatedAt: now, messages: [] };
    void persist(newChat);
    setActiveId(newChat.id);
    setError(null);
    setDrawer(false);
  }, [persist]);

  // 6. Gelişmiş Mesaj Gönderme Akışı (Optimistic UI & Stream Güvenliği)
  const send = useCallback(async (content: string) => {
    const text = content.trim();
    if (!text || loading) return;

    setError(null);
    setLastFailedPrompt(null);
    setLoading(true);

    const now = Date.now();
    let currentChat = active ?? {
      id: id(),
      title: titleFromMessage(text),
      createdAt: now,
      updatedAt: now,
      messages: []
    };

    if (!active) setActiveId(currentChat.id);

    const userMsg: Message = { id: id(), role: 'user', content: text, createdAt: now };
    const assistantMsgId = id();
    const pendingMsg: Message = { id: assistantMsgId, role: 'assistant', content: '', createdAt: now + 1 };

    // Başlığı sadece ilk mesajda güncelle
    const isFirstMessage = currentChat.messages.length === 0;
    const updatedChat = {
      ...currentChat,
      title: isFirstMessage ? titleFromMessage(text) : currentChat.title,
      updatedAt: Date.now(),
      messages: [...currentChat.messages, userMsg, pendingMsg]
    };

    // Arayüzü hızlıca (Optimistic) güncelle
    setChats((prev) => [updatedChat, ...prev.filter((c) => c.id !== updatedChat.id)]);

    const controller = new AbortController();
    activeRequest.current = controller;
    let accumulated = '';
    try {
      const response = await ai.chat(updatedChat.messages.slice(0, -1), (delta) => {
        accumulated += delta;
        // Stream sırasında sadece aktif sohbetin içeriğini güncelliyoruz
        setChats((prev) =>
          prev.map((c) => {
            if (c.id !== updatedChat.id) return c;
            return {
              ...c,
              messages: c.messages.map((m) => (m.id === assistantMsgId ? { ...m, content: accumulated } : m))
            };
          })
        );
      }, controller.signal);

      // Stream bittiğinde son hali kaydet
      const finalChat = {
        ...updatedChat,
        updatedAt: Date.now(),
        messages: updatedChat.messages.map((m) => (m.id === assistantMsgId ? { ...m, content: response || accumulated } : m))
      };

      await persist(finalChat);
      setConnected(true);
    } catch {
      if (controller.signal.aborted) {
        const stoppedChat = {
          ...updatedChat,
          updatedAt: Date.now(),
          messages: accumulated.trim()
            ? updatedChat.messages.map((m) => (m.id === assistantMsgId ? { ...m, content: accumulated } : m))
            : updatedChat.messages.slice(0, -1)
        };
        await persist(stoppedChat);
        return;
      }
      // Hata durumunda boş asistan mesajını sil (Rollback)
      const rollbackChat = {
        ...updatedChat,
        messages: updatedChat.messages.slice(0, -1) // pendingMsg'yi çıkar
      };
      await persist(rollbackChat);

      setLastFailedPrompt(text); // Tekrar deneme için metni sakla
      setError('Bir sorun oluştu. AI servisine şu anda ulaşılamıyor.');
      setConnected(false);
    } finally {
      if (activeRequest.current === controller) activeRequest.current = null;
      setLoading(false);
    }
  }, [active, loading, persist]);

  const stopGenerating = useCallback(() => activeRequest.current?.abort(), []);

  // 7. Yardımcı Fonksiyonlar
  const rename = useCallback(async (chat: Chat) => {
    const title = prompt('Sohbet adı', chat.title)?.trim();
    if (title && title !== chat.title) {
      await persist({ ...chat, title: title.slice(0, 80), updatedAt: Date.now() });
    }
  }, [persist]);

  const remove = useCallback(async (chat: Chat) => {
    if (!confirm(`“${chat.title}” silinsin mi? Bu işlem geri alınamaz.`)) return;
    await storage.deleteChat(chat.id);
    setChats((prev) => {
      const remaining = prev.filter((item) => item.id !== chat.id);
      if (activeId === chat.id) setActiveId(remaining[0]?.id ?? null);
      return remaining;
    });
  }, [activeId]);

  const clear = useCallback(async () => {
    if (!confirm('Tüm sohbet geçmişi silinsin mi? Bu işlem geri alınamaz.')) return;
    await storage.clearChats();
    setChats([]);
    setActiveId(null);
    setSettingsOpen(false);
  }, []);

  const logout = useCallback(async () => {
    if (!session) return;
    try { await auth.logout(session.token); } catch { /* Ignore */ }
    auth.clear();
    setSession(null);
    setChats([]);
    setActiveId(null);
    setSettingsOpen(false);
    setDrawer(false);
  }, [session]);

  // 8. Render Dönüşleri
  if (!authReady) {
    return (
      <main className="auth-loading">
        <img className="auth-logo" src="/nova.svg" alt="Nova AI" />
        <p>Nova AI hazırlanıyor…</p>
      </main>
    );
  }

  if (!session) {
    return <AuthScreen onAuthenticated={(next) => { auth.save(next); setSession(next); }} />;
  }

  return (
    <div className="app-shell">
      <Sidebar
        chats={chats}
        activeId={activeId}
        open={drawer}
        query={query}
        setQuery={setQuery}
        onNew={createChat}
        onSelect={setActiveId}
        onRename={rename}
        onDelete={remove}
        onSettings={() => setSettingsOpen(true)}
        onClose={() => setDrawer(false)}
      />

      <main className="chat-main">
        <header className="topbar">
          <button className="hamburger" onClick={() => setDrawer(true)} aria-label="Sohbet menüsünü aç">☰</button>
          <div className="conversation-title">
            <strong>{active?.title ?? 'Nova AI'}</strong>
            <small className={connected ? 'status-ready' : 'status-offline'}>
              <i />{connected ? 'AI bağlantısı hazır' : 'Bağlantı kontrol ediliyor'}
            </small>
          </div>
          <button className="account-chip" onClick={() => setSettingsOpen(true)} aria-label="Hesap ve ayarları aç">
            <span>{session.user.name.slice(0, 1).toLocaleUpperCase('tr-TR')}</span>
            <b>{session.user.name.split(' ')[0]}</b>
          </button>
          <button className="new-mobile" onClick={createChat} aria-label="Yeni sohbet">＋</button>
        </header>

        {active?.messages.length ? (
          <MessageList messages={active.messages} loading={loading && !active.messages.at(-1)?.content} />
        ) : (
          <Welcome choose={send} />
        )}

        {error && (
          <div className="error-toast" role="alert">
            {error}
            {lastFailedPrompt && (
              <button onClick={() => send(lastFailedPrompt)}>Tekrar dene</button>
            )}
          </div>
        )}

        <Composer onSend={send} generating={loading} onStop={stopGenerating} />
      </main>

      <Settings
        open={settingsOpen}
        theme={theme}
        connected={connected}
        user={session.user}
        onTheme={setTheme}
        onClear={clear}
        onLogout={logout}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}
