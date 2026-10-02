import { useEffect, useRef, useState } from 'react';
import type { WebSearchMode } from '../types/chat';
import { Icon } from './Icon';
import type { Suggestion } from '../services/PersonalSuggestions';
type Props = { suggestions: Suggestion[]; onSend: (text: string) => void; generating: boolean; onStop: () => void; webSearch: WebSearchMode; onWebSearch: (value: WebSearchMode) => void; memoryEnabled: boolean; onMemory: () => void };
export function ChatComposer({ suggestions, onSend, generating, onStop, webSearch, onWebSearch, memoryEnabled, onMemory }: Props) {
  const [value, setValue] = useState('');
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const areaRef = useRef<HTMLDivElement>(null);
  const plusRef = useRef<HTMLButtonElement>(null);
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (!suggestionsOpen) return;
    const outside = (event: PointerEvent) => { if (!areaRef.current?.contains(event.target as Node)) setSuggestionsOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { setSuggestionsOpen(false); plusRef.current?.focus(); } };
    document.addEventListener('pointerdown', outside); document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
  }, [suggestionsOpen]);
  useEffect(() => { if (generating) setSuggestionsOpen(false); }, [generating]);
  useEffect(() => { const el = ref.current; if (el) { el.style.height = 'auto'; el.style.height = `${Math.min(el.scrollHeight, 180)}px`; } }, [value]);
  const submit = () => { if (!value.trim() || generating) return; onSend(value.trim()); setValue(''); };
  return <div className="composer-area" ref={areaRef}>
    {suggestionsOpen && <section className="composer-suggestions" id="personal-suggestions" aria-label="Sana özel başlangıçlar">
      <header><div><strong>Sana özel başlangıçlar</strong><small>Profilin, Nova tonun ve açık belleğine göre</small></div><button type="button" onClick={() => { setSuggestionsOpen(false); plusRef.current?.focus(); }} aria-label="Önerileri kapat">×</button></header>
      {suggestions.map(item => <button className="composer-suggestion" type="button" key={item.id} onClick={() => { setValue(previous => previous.trim() ? `${previous.trim()}\n\n${item.prompt}` : item.prompt); setSuggestionsOpen(false); ref.current?.focus(); }}><Icon name={item.icon} /><span><strong>{item.title}</strong><small>{item.detail}</small></span><span aria-hidden="true">↗</span></button>)}
    </section>}
    <form className="composer" onSubmit={e => { e.preventDefault(); submit(); }}>
      <textarea ref={ref} value={value} onChange={e => setValue(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); submit(); } }} placeholder="Nova’ya bir şey sor…" aria-label="Mesajını yaz" rows={1} disabled={generating} enterKeyHint="send" />
      <div className="composer-toolbar">
        <button ref={plusRef} className="composer-plus" type="button" aria-label="Sana özel önerileri aç" aria-expanded={suggestionsOpen} aria-controls="personal-suggestions" disabled={generating} onClick={() => setSuggestionsOpen(open => !open)}><Icon name="new" /></button>
        <label className={`web-control ${webSearch !== 'off' ? 'is-active' : ''}`}><Icon name="globe" /><select aria-label="Web araması" value={webSearch} onChange={e => onWebSearch(e.target.value as WebSearchMode)}><option value="auto">Web · Otomatik</option><option value="on">Web · Her zaman</option><option value="off">Web · Kapalı</option></select></label>
        <button type="button" className="memory-chip" onClick={onMemory} aria-label={`Bellek ${memoryEnabled ? 'açık' : 'kapalı'}`}><Icon name="memory" /><span>Bellek {memoryEnabled ? 'açık' : 'kapalı'}</span></button>
        {generating ? <button className="send-button stop-generating" type="button" onClick={onStop} aria-label="Yanıtı durdur">■</button> : <button className="send-button" type="submit" disabled={!value.trim()} aria-label="Mesajı gönder"><Icon name="arrow" /></button>}
      </div>
    </form><p className="composer-note">Nova hata yapabilir. Önemli bilgileri ve güncel kaynakları kontrol et.</p>
  </div>;
}
