import { useEffect, useRef, useState } from 'react';
export function Composer({ onSend, generating, onStop }: { onSend: (text: string) => void; generating: boolean; onStop: () => void }) {
  const [value, setValue] = useState(''); const ref = useRef<HTMLTextAreaElement>(null);
  const resize = () => { const el = ref.current; if (el) { el.style.height = 'auto'; el.style.height = `${Math.min(el.scrollHeight, 160)}px`; } };
  useEffect(resize, [value]);
  const submit = () => { const text = value.trim(); if (!text || generating) return; onSend(text); setValue(''); };
  return <form className="composer" onSubmit={(event) => { event.preventDefault(); submit(); }}><textarea ref={ref} value={value} onChange={(event) => setValue(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); submit(); } }} placeholder="Mesajınızı yazın…" aria-label="Mesajınızı yazın" rows={1} disabled={generating} enterKeyHint="send"/>{generating ? <button className="stop-generating" type="button" onClick={onStop} aria-label="Yanıtı durdur" title="Yanıtı durdur">■</button> : <button type="submit" disabled={!value.trim()} aria-label="Mesajı gönder">↑</button>}</form>;
}
