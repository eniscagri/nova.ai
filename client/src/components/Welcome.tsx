import type { ReactNode } from 'react';

interface Suggestion { id: string; title: string; description: string; prompt: string; icon: ReactNode; }
interface WelcomeProps { choose: (prompt: string) => void; }

function PlanIcon() { return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M8 3.8v3.1M16 3.8v3.1M4.8 9.2h14.4M6.7 5.5h10.6c1.05 0 1.9.85 1.9 1.9v10.2c0 1.05-.85 1.9-1.9 1.9H6.7a1.9 1.9 0 0 1-1.9-1.9V7.4c0-1.05.85-1.9 1.9-1.9Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/><path d="m8.4 14 2.1 2.1 4.9-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function IdeaIcon() { return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9.3 18.2h5.4M9.8 21h4.4M8 14.8c-1.25-.95-2-2.42-2-4.05a6 6 0 1 1 12 0c0 1.63-.75 3.1-2 4.05-.73.56-1.17 1.42-1.17 2.32H9.17c0-.9-.44-1.76-1.17-2.32Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 2v1.4M4.6 5.1l1 1M19.4 5.1l-1 1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>; }
function CodeIcon() { return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m8.6 7.2-4.3 4.8 4.3 4.8M15.4 7.2l4.3 4.8-4.3 4.8M13.4 4.8l-2.8 14.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function LearnIcon() { return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4.5 5.7c2.6-.7 5.1-.32 7.5 1.15v12.1c-2.4-1.47-4.9-1.85-7.5-1.15V5.7ZM19.5 5.7c-2.6-.7-5.1-.32-7.5 1.15v12.1c2.4-1.47 4.9-1.85 7.5-1.15V5.7Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/><path d="M12 6.85v12.1" stroke="currentColor" strokeWidth="1.7"/></svg>; }

const SUGGESTIONS: Suggestion[] = [
  { id: 'plan', title: 'Günümü planla', description: 'Hedeflerine göre uygulanabilir bir gün planı oluştur.', prompt: 'Bugün için hedeflerime uygun, uygulanabilir bir plan oluştur.', icon: <PlanIcon /> },
  { id: 'idea', title: 'Bir fikir geliştir', description: 'Yeni bir proje veya iş fikrini birlikte şekillendir.', prompt: 'Bana özgün ve uygulanabilir bir iş fikri geliştir.', icon: <IdeaIcon /> },
  { id: 'code', title: 'Bu kodu açıkla', description: 'Karmaşık kodları sade adımlarla anlamama yardımcı ol.', prompt: 'Aşağıdaki kodu adım adım, sade bir dille açıkla:\n\n', icon: <CodeIcon /> },
  { id: 'learn', title: 'Bugün ne öğreneyim?', description: 'Seviyene ve zamanına uygun bir öğrenme rotası hazırla.', prompt: 'Bugün ne öğrenmeliyim? Seviyeme uygun kısa bir öğrenme planı oluştur.', icon: <LearnIcon /> },
];

const STARTERS = ['Bir e-posta taslağı yaz', 'Haftalık öğrenme planı hazırla', 'Bir fikrimi değerlendir'];

export function Welcome({ choose }: WelcomeProps) {
  return <main className="welcome">
    <div className="welcome-ambient welcome-ambient-one" aria-hidden="true" />
    <div className="welcome-ambient welcome-ambient-two" aria-hidden="true" />
    <div className="welcome-inner">
      <section className="welcome-hero" aria-labelledby="welcome-title">
        <div className="welcome-orbit" aria-hidden="true"><img className="nova-mark" src="/nova.svg" alt="" /></div>
        <span className="welcome-kicker"><span /> NOVA AI</span>
        <h1 id="welcome-title">Bugün neyi ileri taşıyoruz?</h1>
        <p>Bir fikir, plan veya cevapla başlayalım. Nova AI yanında.</p>
      </section>
      <div className="welcome-starters" aria-label="Hızlı başlangıç önerileri">
        {STARTERS.map((starter) => <button key={starter} type="button" onClick={() => choose(starter)}><span>↗</span>{starter}</button>)}
      </div>
      <section className="welcome-prompts" aria-label="Başlangıç seçenekleri">
        <div className="welcome-section-heading"><span>HIZLI BAŞLANGIÇ</span><small>Bir konu seç veya aşağıdan mesajını yaz.</small></div>
        <div className="prompt-grid">
          {SUGGESTIONS.map(({ id, title, description, prompt, icon }) => <button key={id} type="button" className="prompt-card" onClick={() => choose(prompt)} aria-label={`Şu konudan başla: ${title}`}>
            <div className="prompt-card-header"><span className="prompt-icon">{icon}</span><span className="prompt-title">{title}</span></div>
            <p className="prompt-description">{description}</p><span className="prompt-action-icon" aria-hidden="true">→</span>
          </button>)}
        </div>
      </section>
    </div>
  </main>;
}
