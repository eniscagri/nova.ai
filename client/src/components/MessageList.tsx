import { useEffect, useRef } from 'react';
import type { Message } from '../types/chat';
import { MarkdownMessage } from './MarkdownMessage';

export function MessageList({ messages, loading }: { messages: Message[]; loading: boolean }) {
  const endRef = useRef<HTMLDivElement>(null);
  const nearBottom = useRef(true);
  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => { const el = event.currentTarget; nearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120; };
  useEffect(() => { if (nearBottom.current) endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [messages, loading]);
  const copy = async (content: string) => { await navigator.clipboard.writeText(content); };
  return <section className="messages" onScroll={handleScroll} aria-live="polite">
    {messages.map((message) => <article className={`message ${message.role}`} key={message.id}><div className="avatar" aria-hidden="true">{message.role === 'user' ? 'S' : 'N'}</div><div className="message-body">{message.role === 'assistant' ? <MarkdownMessage content={message.content} /> : <p>{message.content}</p>}<button className="copy-message" type="button" onClick={() => copy(message.content)} aria-label="Mesajı kopyala">Kopyala</button></div></article>)}
    {loading && <article className="message assistant"><div className="avatar" aria-hidden="true">N</div><div className="message-body loading"><span /><span /><span /><small>Yanıt hazırlanıyor</small></div></article>}
    <div ref={endRef} />
  </section>;
}
