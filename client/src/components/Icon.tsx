export type IconName = 'new' | 'search' | 'memory' | 'globe' | 'book' | 'chart' | 'settings' | 'menu' | 'arrow' | 'spark' | 'users' | 'user' | 'chevron';
const paths: Record<IconName, string> = {
  new: 'M12 5v14M5 12h14', search: 'M21 21l-4.5-4.5M19 10.5a8.5 8.5 0 1 1-17 0 8.5 8.5 0 0 1 17 0',
  memory: 'M9 3H7a2 2 0 0 0-2 2v2M15 3h2a2 2 0 0 1 2 2v2M19 15v2a2 2 0 0 1-2 2h-2M9 19H7a2 2 0 0 1-2-2v-2M9 9h6v6H9zM12 1v4M12 19v4M1 12h4M19 12h4',
  globe: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0M3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18',
  book: 'M12 6v15M12 6C8 3 5 3 2 4v15c4-1 7 0 10 2 3-2 6-3 10-2V4c-3-1-6-1-10 2',
  chart: 'M3 3v18h18M7 15l5-5 4 3 5-7', settings: 'M12 3l2 3 4 1 1 4-1 4-4 1-2 3-2-3-4-1-1-4 1-4 4-1zM15 11a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
  menu: 'M4 6h16M4 12h16M4 18h16', arrow: 'M12 19V5M6 11l6-6 6 6', spark: 'M12 3l3 6 6 3-6 3-3 6-3-6-6-3 6-3z',
  users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0M22 21v-2a4 4 0 0 0-3-4M17 3a4 4 0 0 1 0 8',
  user: 'M20 21v-2a6 6 0 0 0-6-6h-4a6 6 0 0 0-6 6v2M16 6a4 4 0 1 1-8 0 4 4 0 0 1 8 0', chevron: 'M6 9l6 6 6-6',
};
export function Icon({ name }: { name: IconName }) { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>; }
