export type Memory = { id: string; category: string; text: string; updatedAt: number };
const sensitive = /şifre|parola|password|api.?key|gizli|secret|token|kimlik|tc\s*no|iban|kart\s*(numara|no)|sağlık|hastal|tanı|ilaç|dinim|siyasi|cinsel|\b\d{10,}\b/iu;
export const isSensitiveMemory = (text: string) => sensitive.test(text);
export function extractMemories(message: string): { category: string; text: string }[] {
  const facts: { category: string; text: string }[] = [];
  for (const sentence of message.split(/[.!\n]+/).map(s => s.trim()).filter(Boolean)) {
    if (sentence.length < 4 || sentence.length > 300 || sentence.includes('?') || sensitive.test(sentence)) continue;
    let category: string | undefined;
    if (/^(benim\s+)?adım\s+\p{L}/iu.test(sentence)) category = 'İsim';
    else if (/^[^,;:]{2,50}['’](da|de|ta|te)\s+yaşıyorum$/iu.test(sentence)) category = 'Şehir';
    else if (/^(ben\s+)?[^,;:]{2,80}\s+(okuyorum|öğrencisiyim|mezunuyum)$/iu.test(sentence)) category = 'Eğitim';
    else if (/^(ben\s+)?[^,;:]{2,70}\s+olarak\s+çalışıyorum$/iu.test(sentence)) category = 'Meslek';
    else if (/^(ben\s+)?(yazılımcı|muhasebeci|öğretmen|öğrenci|mühendis|ekonomist|avukat|doktor|işletmeci|girişimci)(yım|yim|ım|im|um|üm)$/iu.test(sentence)) category = 'Meslek';
    else if (/^(hedefim|amacım|tercihim|ilgi alanım|hobim)\s+/iu.test(sentence)) category = /^(hedefim|amacım)/iu.test(sentence) ? 'Hedef' : 'Tercih';
    else if (/^(bunu hatırla|hatırla|unutma)\s*:/iu.test(sentence)) category = 'Not';
    if (category) facts.push({ category, text: sentence.replace(/^(bunu hatırla|hatırla|unutma)\s*:\s*/iu, '') });
  }
  return facts;
}
