import { useEffect, useRef, useState } from 'react';
import type { Memory } from '../services/MemoryStore';
import type { CloudMemoryStore } from '../services/CloudMemoryStore';
export function MemoryPanel({ store, onClose, onChange }: { store: CloudMemoryStore; onClose: () => void; onChange: () => void }) {
  const panelRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    panelRef.current?.querySelector<HTMLElement>('button')?.focus();
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key !== 'Tab') return;
      const elements = panelRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input, textarea');
      if (!elements?.length) return;
      const first = elements[0], last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', keyboard);
    return () => { document.removeEventListener('keydown', keyboard); previous?.focus(); };
  }, [onClose]);
  const [memories, setMemories] = useState(() => store.list());
  const [enabled, setEnabled] = useState(store.enabled());
  const [text, setText] = useState('');
  const [editing, setEditing] = useState<Memory | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(true);
  const refresh = () => { setMemories(store.list()); setEnabled(store.enabled()); onChange(); };
  useEffect(() => { let active = true; void store.refresh().then(() => { if (active) { setMemories(store.list()); setEnabled(store.enabled()); onChange(); } }).catch(reason => { if (active) setError(reason instanceof Error ? reason.message : 'Bellek yüklenemedi.'); }).finally(() => { if (active) setBusy(false); }); return () => { active = false; }; }, [store, onChange]);
  const run = async (action: () => Promise<unknown>) => { setBusy(true); setError(''); try { await action(); refresh(); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Bellek eşitlenemedi.'); } finally { setBusy(false); } };
  const save = () => run(async () => { await store.save(text, editing?.category, editing?.id); setText(''); setEditing(null); });
  return <div className="modal-backdrop" onClick={onClose}><section ref={panelRef} className="memory-panel" role="dialog" aria-modal="true" aria-labelledby="memory-title" onClick={e => e.stopPropagation()}>
    <header><div><span className="eyebrow">SANA ÖZEL</span><h2 id="memory-title">Nova’nın belleği</h2></div><button onClick={onClose} aria-label="Belleği kapat">×</button></header>
    <div className="memory-toggle"><div><strong>Kişisel bilgileri hatırla</strong><p>Adın, eğitimin, hedeflerin ve tercihlerin gibi açıkça paylaştığın bilgileri hatırlar.</p></div><input aria-label="Belleği etkinleştir" type="checkbox" disabled={busy} checked={enabled} onChange={e => { const checked = e.target.checked; void run(() => store.setEnabled(checked)); }} /></div>
    <p className="memory-disclosure">Belleğin hesabına özel olarak güvenli veritabanında saklanır; aynı hesapla giriş yaptığın tüm cihazlarda kullanılır. Açıkken yanıtı kişiselleştirmek için AI sunucusuna gönderilir. Şifre ve hassas bilgiler kaydedilmez.</p>
    {busy && <p className="settings-help" role="status">Bellek eşitleniyor…</p>}
    <form className="memory-form" onSubmit={e => { e.preventDefault(); void save(); }}><label htmlFor="memory-input">{editing ? 'Kaydı düzenle' : 'Nova neyi hatırlasın?'}</label><textarea id="memory-input" value={text} onChange={e => setText(e.target.value)} maxLength={300} placeholder="Örneğin: İktisat öğrencisiyim, açıklamaları örneklerle öğreniyorum." required /><div><small>{text.length}/300</small>{editing && <button type="button" onClick={() => { setEditing(null); setText(''); }}>Vazgeç</button>}<button className="primary-button" type="submit" disabled={busy}>{editing ? 'Güncelle' : 'Belleğe ekle'}</button></div></form>
    {error && <p role="alert" className="auth-error">{error}</p>}
    <div className="memory-heading"><h3>Kaydedilenler <span>{memories.length}/30</span></h3><button disabled={busy} onClick={() => void run(() => store.refresh())}>Yenile</button>{memories.length > 0 && <button className="danger" disabled={busy} onClick={() => { if (confirm('Tüm cihazlardaki bellek kayıtları silinsin mi?')) void run(() => store.clear()); }}>Tümünü sil</button>}</div>
    <div className="memory-list">{memories.length ? memories.map(memory => <article key={memory.id}><span className="memory-category">{memory.category}</span><p>{memory.text}</p><div><button disabled={busy} onClick={() => { setEditing(memory); setText(memory.text); }}>Düzenle</button><button disabled={busy} onClick={() => void run(() => store.remove(memory.id))}>Sil</button></div></article>) : <div className="memory-empty"><span>◈</span><h3>Birlikte tanışarak başlayalım.</h3><p>“İktisat öğrencisiyim” veya “Hedefim yüksek lisans yapmak” dediğinde Nova bunu burada hatırlar.</p></div>}</div>
  </section></div>;
}
