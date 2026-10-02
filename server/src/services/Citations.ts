import type { Source } from '../providers/AiProvider.js';
type Citation = { type: string; url?: string; title?: string; start_index?: number; end_index?: number };
export function renderCitations(text: string, annotations: Citation[]): { content: string; sources: Source[] } {
  const citations = annotations.filter(a => a.type === 'url_citation' && a.url && /^https?:\/\//i.test(a.url));
  const sources = Array.from(new Map(citations.map(a => [a.url!, { url: a.url!, title: a.title || new URL(a.url!).hostname }])).values());
  let content = text;
  for (const citation of [...citations].sort((a, b) => (b.start_index ?? 0) - (a.start_index ?? 0))) {
    if (citation.start_index === undefined || citation.end_index === undefined) continue;
    const label = (citation.title || new URL(citation.url!).hostname).replace(/[\[\]\\]/g, '');
    const link = `[${label}](<${citation.url!.replace(/[<>]/g, '')}>)`;
    content = content.slice(0, citation.start_index) + link + content.slice(citation.end_index);
  }
  content = content.replace(/cite[^]*/g, '');
  return { content, sources };
}
