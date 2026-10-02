import type { IconName } from '../components/Icon';
import type { ConversationStyle } from './SocialService';
import { isSensitiveMemory, type Memory } from './MemoryStore';

export type Suggestion = { id: string; icon: IconName; title: string; detail: string; prompt: string };
export function personalSuggestions({ tone, interests = [], memories = [] }: { tone: ConversationStyle; interests?: string[]; memories?: Memory[] }): Suggestion[] {
  const result: Suggestion[] = [];
  const safe = memories.filter(memory => !isSensitiveMemory(memory.text));
  const education = safe.find(memory => memory.category === 'Eğitim');
  const goal = safe.find(memory => memory.category === 'Hedef');
  if (education) result.push({ id: 'education', icon: 'book', title: 'Derslerine çalış', detail: 'Sana uygun örnekler ve alıştırmalar', prompt: `Eğitim bilgim: ${education.text}. Çalışmak istediğim dersi ve konuyu sor; seviyeme uygun örneklerle bir çalışma planı hazırlayalım.` });
  if (goal) result.push({ id: 'goal', icon: 'spark', title: 'Hedefine bir adım at', detail: 'Bugün yapabileceğin küçük bir adım', prompt: `Hedefimle ilgili notum: ${goal.text}. Mevcut durumumu sor ve bugün başlayabileceğim somut bir adım belirleyelim.` });
  if (tone === 'ekonomist') result.push(
    { id: 'market', icon: 'chart', title: 'Piyasaları incele', detail: 'BIST ve finansal analiz', prompt: 'Borsa İstanbul’da bir şirketi temel analizle incelemek için hangi finansal oranlara bakmalıyım? Örnek bir analiz çerçevesi oluştur.' },
    { id: 'tax', icon: 'globe', title: 'Vergiyi araştır', detail: 'Güncel mevzuat ve resmî kaynaklar', prompt: 'Türkiye’de gelir vergisini araştırmak istiyorum. Önce yılı ve gelir türünü sor; güncel GİB kaynaklarıyla açıkla.' });
  for (const interest of interests.filter(value => value.trim() && !isSensitiveMemory(value)).slice(0, 3)) {
    const topic = interest.trim().slice(0, 60);
    result.push({ id: `interest:${topic}`, icon: 'book', title: `${topic} keşfet`, detail: 'İlgi alanına göre yeni bir başlangıç', prompt: `${topic} ilgi alanım hakkında yeni bir şey öğrenmek istiyorum. Önce hangi yönüyle ilgilendiğimi ve seviyemi sor, sonra birlikte ilerleyelim.` });
  }
  const toneTopics: Partial<Record<ConversationStyle, string>> = { futbol: 'Yaratıcı fikirler', basketbol: 'Teknoloji', kitap: 'Öğrenmek istediğim konu', girisimci: 'İş ve projelerim', sakin_koc: 'Günlük planım' };
  const topic = toneTopics[tone];
  if (topic) result.push({ id: 'tone', icon: 'spark', title: `${topic} üzerine konuş`, detail: 'Seçtiğin Nova tonuna uygun', prompt: `${topic} üzerine konuşmak istiyorum. Önce bugün neye odaklanmak istediğimi sor.` });
  result.push(
    { id: 'idea', icon: 'spark', title: 'Bir fikir geliştir', detail: 'Aklındakini birlikte şekillendirelim', prompt: 'Bir fikir geliştirmek istiyorum. Becerilerimi ve hedeflerimi öğrenerek yardımcı ol.' },
    { id: 'learn', icon: 'book', title: 'Yeni bir şey öğren', detail: 'Seviyene uygun bir öğrenme planı', prompt: 'Yeni bir konu öğrenmek istiyorum. Seviyeme ve ilgi alanlarıma uygun bir öğrenme planı yapalım.' },
    { id: 'plan', icon: 'chart', title: 'Gününü planla', detail: 'Önceliklerinden başlayalım', prompt: 'Bugünümü planlamak istiyorum. Önce önceliklerimi ve ayırabileceğim zamanı sor.' });
  return result.filter((item, index, all) => all.findIndex(other => other.id === item.id) === index).slice(0, 3);
}
