import { useState, type ComponentPropsWithoutRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import hljs from 'highlight.js';

function Code({ className, children, ...props }: ComponentPropsWithoutRef<'code'>) {
  const [copied, setCopied] = useState(false);
  const language = /language-(\w+)/.exec(className ?? '')?.[1];
  const text = String(children).replace(/\n$/, '');
  const isBlock = Boolean(language) || text.includes('\n');
  if (!isBlock) return <code className="inline-code" {...props}>{children}</code>;
  const html = language && hljs.getLanguage(language) ? hljs.highlight(text, { language }).value : hljs.highlightAuto(text).value;
  const copy = async () => { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1200); };
  return <span className="code-card"><span className="code-top"><span>{language ?? 'text'}</span><button type="button" onClick={copy} aria-label="Kod bloğunu kopyala">{copied ? 'Kopyalandı' : 'Kopyala'}</button></span><pre><code className="hljs" dangerouslySetInnerHTML={{ __html: html }} /></pre></span>;
}

export function MarkdownMessage({ content }: { content: string }) {
  return <div className="markdown"><ReactMarkdown remarkPlugins={[remarkGfm]} components={{ code: Code, a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer">{children}</a> }}>{content}</ReactMarkdown></div>;
}
