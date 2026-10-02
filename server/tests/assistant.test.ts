import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { once } from 'node:events';
import { extractMemories, type Memory } from '../../client/src/services/MemoryStore.js';
import { CloudMemoryStore, type MemoryGateway } from '../../client/src/services/CloudMemoryStore.js';
import { OpenAIProvider } from '../src/providers/OpenAIProvider.js';
import { chatRouter } from '../src/routes/chat.js';
import { renderCitations } from '../src/services/Citations.js';
import type { AiProvider, AiStreamEvent } from '../src/providers/AiProvider.js';

test('account memory synchronizes two devices, isolates accounts, and respects remote disabling/deletion', async () => {
  const data = new Map<string, { enabled: boolean; memories: Map<string, Memory> }>();
  const account = (owner: string) => { if (!data.has(owner)) data.set(owner, { enabled: true, memories: new Map() }); return data.get(owner)!; };
  let offline = false;
  const gateway: MemoryGateway = {
    async load(owner) { if (offline) throw new Error('offline'); const value = account(owner); return { enabled: value.enabled, memories: [...value.memories.values()] }; },
    async setEnabled(owner, enabled) { account(owner).enabled = enabled; },
    async save(owner, memory, slot) { account(owner).memories.set(slot, memory); },
    async remove(owner, id) { for (const [slot, m] of account(owner).memories) if (m.id === id) account(owner).memories.delete(slot); },
    async clear(owner) { account(owner).memories.clear(); },
  };
    const alice = new CloudMemoryStore('alice', gateway);
    const tablet = new CloudMemoryStore('alice', gateway);
    const bob = new CloudMemoryStore('bob', gateway);
    assert.equal((await alice.capture("Adım Deniz. Ankara'da yaşıyorum. İktisat öğrencisiyim.")).length, 3);
    assert.equal((await bob.context()).length, 0);
    assert.equal((await tablet.context()).length, 3);
    await tablet.capture("İşletme öğrencisiyim.");
    await alice.refresh();
    assert.equal(alice.list().filter(m => m.category === 'Eğitim').length, 1);
    assert.match((await alice.context()).join(' '), /İşletme/);
    assert.equal(extractMemories('Adım ne? Şifrem: abc123. Arkadaşım doktor.').length, 0);
    await assert.rejects(alice.save('IBAN numaram TR123'), /hassas/);
    await tablet.setEnabled(false);
    assert.deepEqual(await alice.context(), []);
    assert.deepEqual(await alice.capture('Adım Ayşe.'), []);
    await tablet.setEnabled(true);
    const id = alice.list()[0].id;
    await tablet.remove(id);
    await alice.refresh();
    assert.ok(!alice.list().some(m => m.id === id));
    offline = true;
    await assert.rejects(alice.context(), /offline/);
    assert.deepEqual(alice.list(), []);
    assert.equal(alice.enabled(), false);
    offline = false;
    await tablet.clear();
    assert.deepEqual(await alice.context(), []);
});

test('citations become clickable and reject non-http sources', () => {
  const text = 'Gelir vergisi. SOURCE';
  const result = renderCitations(text, [
    { type: 'url_citation', start_index: 14, end_index: 20, title: 'GİB', url: 'https://gib.gov.tr/vergi' },
    { type: 'url_citation', url: 'javascript:alert(1)', title: 'Unsafe' },
  ]);
  assert.match(result.content, /\[GİB\]\(<https:\/\/gib.gov.tr\/vergi>\)/);
  assert.equal(result.sources.length, 1);
});

test('OpenAI integration sends expert context and actually enables/disables web tools', async () => {
  const app = express();
  app.use(express.json());
  const requests: Record<string, unknown>[] = [];
  app.post('/responses', (req, res) => {
    requests.push(req.body);
    res.json({ id: 'resp_test', object: 'response', status: 'completed', model: 'gpt-5.2', output: [{ type: 'message', id: 'msg_test', role: 'assistant', status: 'completed', content: [{ type: 'output_text', text: 'Doğrulanmış bilgi. SOURCE', annotations: [{ type: 'url_citation', start_index: 18, end_index: 24, title: 'TCMB', url: 'https://tcmb.gov.tr/' }] }] }] });
  });
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const previous = process.env.OPENAI_BASE_URL;
  process.env.OPENAI_BASE_URL = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
  try {
    const provider = new OpenAIProvider('gpt-5.2', 'local-test-key');
    const result = await provider.chat([{ role: 'user', content: 'Güncel vergi oranları nedir?' }], new AbortController().signal, 'ekonomist', { webSearch: 'auto', memories: ['Eğitim: İktisat öğrencisiyim'] });
    assert.deepEqual(requests[0].tools, [{ type: 'web_search' }]);
    assert.equal(requests[0].tool_choice, 'required');
    assert.match(String(requests[0].instructions), /Nova Ekonomist/);
    assert.match(String(requests[0].instructions), /gib.gov.tr/);
    assert.match(String(requests[0].instructions), /İktisat öğrencisiyim/);
    assert.equal(result.sources?.[0].title, 'TCMB');
    assert.match(result.content, /\[TCMB\]/);
    await provider.chat([{ role: 'user', content: 'Bugünkü faiz nedir?' }], new AbortController().signal, 'dengeli', { webSearch: 'off' });
    assert.equal(requests[1].tools, undefined);
    assert.match(String(requests[1].instructions), /Web search is disabled/);
    assert.equal(requests[1].store, false);
  } finally {
    if (previous === undefined) delete process.env.OPENAI_BASE_URL; else process.env.OPENAI_BASE_URL = previous;
    server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve()));
  }
});

test('chat streaming forwards search activity, final cited text and sources; rejects oversized memory', async () => {
  let received: unknown;
  let receivedStyle: unknown;
  const provider: AiProvider = {
    name: 'test', isConfigured: true, supportsStreaming: true,
    async chat() { return { content: 'OK' }; },
    async *stream(_messages, _signal, _style, context): AsyncIterable<AiStreamEvent> {
      received = context;
      receivedStyle = _style;
      yield { type: 'searching' }; yield 'Yanıt';
      yield { type: 'content', content: 'Yanıt [GİB](https://gib.gov.tr)' };
      yield { type: 'sources', sources: [{ title: 'GİB', url: 'https://gib.gov.tr' }] };
    },
  };
  const app = express(); app.use(express.json()); app.use(chatRouter(provider, 1000, 12000, 60));
  const server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
  const url = `http://127.0.0.1:${(server.address() as { port: number }).port}/chat`;
  try {
    const body = { messages: [{ role: 'user', content: 'KDV nedir?' }], stream: true, conversationStyle: 'ekonomist', webSearch: 'on', memories: ['İktisat öğrencisiyim'] };
    const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const stream = await response.text();
    assert.equal(response.status, 200);
    for (const event of ['searching', 'delta', 'content', 'sources', 'done']) assert.ok(stream.includes(`event: ${event}`));
    assert.equal(receivedStyle, 'ekonomist');
    assert.equal((received as { webSearch: string }).webSearch, 'on');
    const invalid = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body, memories: ['a'.repeat(301)] }) });
    assert.equal(invalid.status, 400);
  } finally { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
});
