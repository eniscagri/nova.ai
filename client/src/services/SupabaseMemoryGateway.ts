import { supabase } from './supabase';
import type { MemoryGateway } from './CloudMemoryStore';
const failure = (error: { message: string; code?: string } | null) => {
  if (!error) return;
  if (error.code === '42P01' || error.code === 'PGRST205') throw new Error('Hesap belleği henüz etkinleştirilmedi. Lütfen daha sonra tekrar dene.');
  throw new Error('Bellek eşitlenemedi. İnternet bağlantını kontrol edip tekrar dene.');
};
export const supabaseMemoryGateway: MemoryGateway = {
  async load(ownerId) {
    const [settings, memories] = await Promise.all([
      supabase.from('user_memory_settings').select('enabled').eq('owner_id', ownerId).maybeSingle(),
      supabase.from('user_memories').select('id,category,content,updated_at').eq('owner_id', ownerId).order('updated_at', { ascending: false }).limit(30),
    ]);
    failure(settings.error); failure(memories.error);
    return { enabled: settings.data?.enabled ?? true, memories: (memories.data ?? []).map(m => ({ id: m.id, category: m.category, text: m.content, updatedAt: new Date(m.updated_at).getTime() })) };
  },
  async setEnabled(ownerId, enabled) { const { error } = await supabase.from('user_memory_settings').upsert({ owner_id: ownerId, enabled }, { onConflict: 'owner_id' }); failure(error); },
  async save(ownerId, memory, slot) {
    const { error } = await supabase.from('user_memories').upsert({ id: memory.id, owner_id: ownerId, slot, category: memory.category, content: memory.text, updated_at: new Date().toISOString() }, { onConflict: 'owner_id,slot' }); failure(error);
  },
  async remove(ownerId, id) { const { error } = await supabase.from('user_memories').delete().eq('owner_id', ownerId).eq('id', id); failure(error); },
  async clear(ownerId) { const { error } = await supabase.from('user_memories').delete().eq('owner_id', ownerId); failure(error); },
};
// In-memory development fixtures have no production account or network access.
export function previewMemoryGateway(): MemoryGateway {
  let state: Awaited<ReturnType<MemoryGateway['load']>> = { enabled: true, memories: [] };
  return { async load() { return structuredClone(state); }, async setEnabled(_ownerId, enabled) { state.enabled = enabled; }, async save(_ownerId, memory) { state.memories = [memory, ...state.memories.filter(m => m.id !== memory.id)]; }, async remove(_ownerId, id) { state.memories = state.memories.filter(m => m.id !== id); }, async clear() { state.memories = []; } };
}
