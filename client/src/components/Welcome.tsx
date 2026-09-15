import React, { type ReactNode } from 'react';

// 1. Tip Tanımlamaları
interface Suggestion {
  id: string;
  title: string;
  description: string;
  icon: ReactNode;
}

interface WelcomeProps {
  choose: (prompt: string) => void;
}

// 2. Veri Yapısı (Emojiler yerine SVG ikonlar ve açıklayıcı metinler)
const SUGGESTIONS: Suggestion[] = [
  {
    id: 'design',
    title: 'Bir web sitesi tasarla',
    description: 'Modern, esnek ve erişilebilir bir arayüz prototipi çıkar.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect width="18" height="18" x="3" y="3" rx="2" />
        <path d="M3 9h18" />
        <path d="M9 21V9" />
      </svg>
    )
  },
  {
    id: 'code',
    title: 'Bu kodu açıkla',
    description: 'Karmaşık bir fonksiyonun veya algoritmanın mantığını çöz.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    )
  },
  {
    id: 'business',
    title: 'Bir iş fikri geliştir',
    description: 'Yeni bir proje için pazar analizi ve strateji oluştur.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 2v20" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    )
  },
  {
    id: 'learn',
    title: 'Bugün ne öğrenmeliyim?',
    description: 'Yazılım yeteneklerine değer katacak yeni bir teknoloji keşfet.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    )
  }
];

// 3. Bileşen (Component)
export function Welcome({ choose }: WelcomeProps) {
  return (
    <main className="welcome">
      <div className="welcome-orbit" aria-hidden="true">
        <img className="nova-mark" src="/nova.svg" alt="Nova AI" />
      </div>

      <header className="welcome-header">
        <span className="eyebrow">NOVA AI</span>
        <h1>Merhaba</h1>
        <p>Düşün, üret, keşfet. Nereden başlamak istersin?</p>
      </header>

      <div className="prompt-grid">
        {SUGGESTIONS.map(({ id, title, description, icon }) => (
          <button
            key={id}
            className="prompt-card"
            onClick={() => choose(title)}
            aria-label={`Şu konudan başla: ${title}`}
          >
            <div className="prompt-card-header">
              <span className="prompt-icon">{icon}</span>
              <span className="prompt-title">{title}</span>
            </div>

            <p className="prompt-description">{description}</p>

            <div className="prompt-action-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </div>
          </button>
        ))}
      </div>
    </main>
  );
}
