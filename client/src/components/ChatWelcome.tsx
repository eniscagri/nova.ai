import { Icon } from './Icon';
export function ChatWelcome({ name, economist }: { name: string; economist: boolean }) {
  const firstName = name.trim().split(/\s+/)[0]?.slice(0, 32);
  return <section className="welcome"><div className="welcome-inner"><span className="welcome-emblem"><Icon name={economist ? 'chart' : 'spark'} /></span><div className="welcome-kicker">{economist ? 'NOVA EKONOMİST' : 'SANA ÖZEL BİR ALAN'}</div><h1>{firstName && firstName !== 'Misafir' ? `Merhaba, ${firstName}.` : 'Bugün aklında ne var?'}</h1><p>{economist ? 'Ekonomi, vergi ve derslerin için birlikte ilerleyelim.' : 'Bugün ne üzerine konuşmak istersin?'}</p><p className="welcome-plus-hint">Sana uygun başlangıçlar için mesaj kutusundaki + düğmesine dokun.</p></div></section>;
}
