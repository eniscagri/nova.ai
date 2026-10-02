import test from 'node:test';
import assert from 'node:assert/strict';
import { HttpAiProvider } from '../../client/src/services/ai/HttpAiProvider.js';

test('old strict server receives compatible request and streamed reply reaches the client', async () => {
  const original = globalThis.fetch;
  let notice = '';
  let delta = '';
  let calls = 0;
  globalThis.fetch = async (url, init) => {
    if (String(url).endsWith('/health')) return Response.json({ status: 'ok', ai: { configured: true } });
    calls++;
    const body = JSON.parse(String(init?.body));
    assert.deepEqual(Object.keys(body).sort(), ['conversationStyle', 'messages', 'stream']);
    assert.equal(body.conversationStyle, 'dengeli');
    assert.equal(body.messages.length, 60);
    assert.match(body.messages[0].content, /Nova Ekonomist/);
    assert.match(body.messages[0].content, /İktisat öğrencisiyim/);
    assert.equal(body.messages.at(-1).content, 'Merhaba 59');
    return new Response('event: delta\ndata: {"delta":"Merhaba!"}\n\nevent: done\ndata: {}\n\n', { headers: { 'content-type': 'text/event-stream' } });
  };
  try {
    const provider = new HttpAiProvider('https://test.invalid/api-root');
    assert.equal(await provider.health(), true);
    const messages = Array.from({ length: 60 }, (_, n) => ({ id: String(n), role: 'user' as const, content: `Merhaba ${n}`, createdAt: n }));
    const answer = await provider.chat(messages, value => { delta += value; }, undefined, 'ekonomist', { webSearch: 'on', memories: ['İktisat öğrencisiyim'], onNotice: value => { notice = value; } });
    assert.equal(answer, 'Merhaba!');
    assert.equal(delta, answer);
    assert.match(notice, /web araması henüz etkin değil/);
    assert.equal(calls, 1);
  } finally { globalThis.fetch = original; }
});

test('updated server receives web and memory options without legacy context', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    if (String(url).endsWith('/health')) return Response.json({ status: 'ok', ai: { configured: true, chatProtocol: 2 } });
    const body = JSON.parse(String(init?.body));
    assert.equal(body.conversationStyle, 'ekonomist');
    assert.equal(body.webSearch, 'on');
    assert.deepEqual(body.memories, ['İktisat öğrencisiyim']);
    assert.equal(body.messages.length, 1);
    return Response.json({ message: { content: 'Kaynaklı yanıt' }, sources: [{ title: 'Kaynak', url: 'https://example.com' }] });
  };
  try {
    const provider = new HttpAiProvider('https://test.invalid');
    let notice = 'old';
    let sources: unknown;
    assert.equal(await provider.chat([{ id: '1', role: 'user', content: 'Merhaba', createdAt: 0 }], undefined, undefined, 'ekonomist', { webSearch: 'on', memories: ['İktisat öğrencisiyim'], onNotice: value => { notice = value; }, onSources: value => { sources = value; } }), 'Kaynaklı yanıt');
    assert.equal(notice, '');
    assert.deepEqual(sources, [{ title: 'Kaynak', url: 'https://example.com' }]);
  } finally { globalThis.fetch = original; }
});
