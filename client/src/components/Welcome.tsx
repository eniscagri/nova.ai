const prompts = ['Bir web sitesi tasarla', 'Bu kodu açıkla', 'Bir iş fikri geliştir', 'Bugün ne öğrenmeliyim?'];

export function Welcome({ choose }: { choose: (prompt: string) => void }) {
  return <main className="welcome"><div className="welcome-orbit" aria-hidden="true"><div className="nova-mark">✦</div></div><span className="eyebrow">NOVA AI</span><h1>Merhaba 👋</h1><p>Düşün, üret, keşfet. Nereden başlamak istersin?</p><div className="prompt-grid">{prompts.map((prompt) => <button key={prompt} onClick={() => choose(prompt)}>{prompt}<span>↗</span></button>)}</div></main>;
}
