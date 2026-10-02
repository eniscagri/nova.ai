import { extractMemories, type Memory, isSensitiveMemory } from './MemoryStore';
export interface MemoryGateway {
  load(ownerId: string): Promise<{ enabled: boolean; memories: Memory[] }>;
  setEnabled(ownerId: string, enabled: boolean): Promise<void>;
  save(ownerId: string, memory: Memory, slot: string): Promise<void>;
  remove(ownerId: string, id: string): Promise<void>;
  clear(ownerId: string): Promise<void>;
}
export class CloudMemoryStore {
  private memories: Memory[] = [];
  private active = false;
  constructor(private ownerId: string, private gateway: MemoryGateway) {}
  list() { return this.memories; }
  enabled() { return this.active; }
  forget() { this.memories = []; this.active = false; }
  async refresh() {
    try { const state = await this.gateway.load(this.ownerId); this.memories = state.memories; this.active = state.enabled; }
    catch (error) { this.forget(); throw error; }
  }
  async setEnabled(enabled: boolean) { await this.gateway.setEnabled(this.ownerId, enabled); this.active = enabled; }
  async save(text: string, category = 'Not', memoryId?: string) {
    const trimmed = text.trim();
    if (!trimmed || trimmed.length > 300) throw new Error('Bellek kaydı 1–300 karakter olmalı.');
    if (isSensitiveMemory(trimmed)) throw new Error('Şifre, kimlik, finansal hesap veya hassas bilgiler belleğe kaydedilmez.');
    await this.refresh();
    const existing = this.memories.find(m => m.id === memoryId || m.text.toLocaleLowerCase('tr-TR') === trimmed.toLocaleLowerCase('tr-TR'));
    if (!existing && this.memories.length >= 30) throw new Error('Bellek dolu. Yeni kayıt için bir kaydı sil.');
    const memory = { id: existing?.id ?? crypto.randomUUID(), category, text: trimmed, updatedAt: Date.now() };
    const slot = category === 'Not' ? `not:${memory.id}` : category;
    await this.gateway.save(this.ownerId, memory, slot);
    await this.refresh();
    return this.memories;
  }
  async capture(message: string) {
    await this.refresh();
    if (!this.active) return [];
    const added: Memory[] = [];
    for (const fact of extractMemories(message)) {
      if (this.memories.some(m => m.text.toLocaleLowerCase('tr-TR') === fact.text.toLocaleLowerCase('tr-TR'))) continue;
      const existing = fact.category === 'Not' ? undefined : this.memories.find(m => m.category === fact.category);
      await this.save(fact.text, fact.category, existing?.id);
      const saved = this.memories.find(m => m.text === fact.text);
      if (saved) added.push(saved);
    }
    return added;
  }
  async remove(id: string) { await this.gateway.remove(this.ownerId, id); await this.refresh(); }
  async clear() { await this.gateway.clear(this.ownerId); await this.refresh(); }
  async context() { await this.refresh(); return this.active ? this.memories.filter(m => !isSensitiveMemory(m.text)).map(m => `${m.category}: ${m.text}`.slice(0, 300)) : []; }
}
