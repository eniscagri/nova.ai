import { useEffect, useRef } from 'react';
import type { Message } from '../types/chat';
import { MarkdownMessage } from './MarkdownMessage';

function Avatar({ role }: { role: Message['role'] }) {
  return <div className={`avatar ${role === 'assistant' ? 'nova-avatar' : ''}`} aria-hidden="true">{role === 'assistant' ? <img src="/nova.svg" alt="" /> : 'S'}</div>;
}

export function MessageList({ messages, loading }: { messages: Message[]; loading: boolean }) {
  const endRef = useRef<HTMLDivElement>(null);
  const nearBottom = useRef(true);
  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => { const element = event.currentTarget; nearBottom.current = element.scrollHeight - element.scrollTop - element.clientHeight < 120; };
  useEffect(() => { if (nearBottom.current) endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [messages, loading]);
  const copy = async (content: string) => { await navigator.clipboard.writeText(content); };
  return <section className="messages" onScroll={handleScroll} aria-live="polite">{messages.map((message) => <article className={`message ${message.role}`} key={message.id}><Avatar role={message.role} /><div className="message-body">{message.role === 'assistant' ? <MarkdownMessage content={message.content} /> : <p>{message.content}</p>}<button className="copy-message" type="button" onClick={() => copy(message.content)} aria-label="Mesajı kopyala">Kopyala</button></div></article>)}{loading && <article className="message assistant"><Avatar role="assistant" /><div className="message-body loading"><span /><span /><span /><small>Yanıt hazırlanıyor</small></div></article>}<div ref={endRef} /></section>;
}
