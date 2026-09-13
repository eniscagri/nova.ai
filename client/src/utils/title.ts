export function titleFromMessage(text: string): string {
  const cleaned = text.replace(/[`*_#>[\]{}]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!cleaned) return 'Yeni sohbet';
  const words = cleaned.split(' ').slice(0, 5).map((word) => word.length > 2 ? word[0].toLocaleUpperCase('tr-TR') + word.slice(1) : word);
  return words.join(' ').slice(0, 54);
}
