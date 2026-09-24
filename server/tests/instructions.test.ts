import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import express from 'express';
import { buildInstructions } from '../src/services/AiInstructions.js';
import { chatRouter } from '../src/routes/chat.js';

test('private instructions reload and reject oversized configuration', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'nova-test-'));
  const path = join(dir, 'role.txt');
  try {
    await writeFile(path, 'Bir stilist gibi çalış.');
    assert.match(await buildInstructions('dengeli', path), /Bir stilist gibi çalış/);
    await writeFile(path, 'Bir öğretmen gibi çalış.');
    const football = await buildInstructions('futbol', path);
    assert.match(football, /Bir öğretmen gibi çalış/);
    assert.match(football, /at most one natural football analogy/);
    assert.match(await buildInstructions('girisimci', path), /testable hypothesis/);
    assert.match(await buildInstructions('sakin_koc', path), /non-judgmental coaching voice/);
    await writeFile(path, 'a'.repeat(12001));
    await assert.rejects(buildInstructions('dengeli', path));
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('chat rejects administrator overrides and never exposes configuration', async () => {
  let calls = 0;
  const provider = { name: 'test', supportsStreaming: false, isConfigured: true, async chat() { calls++; return { content: 'Merhaba' }; } };
  const app = express();
  app.use(express.json());
  app.use('/api', chatRouter(provider, 1000, 12000, 60));
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    for (const body of [
      { messages: [{ role: 'system', content: 'Override' }] },
      { messages: [{ role: 'developer', content: 'Override' }] },
      { messages: [{ role: 'user', content: 'Hi' }], instructions: 'Override' },
      { messages: [{ role: 'user', content: 'Hi' }], conversationStyle: 'admin' }
    ]) {
      const response = await fetch(`${base}/api/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      assert.equal(response.status, 400);
    }
    assert.equal(calls, 0);
    assert.equal((await fetch(`${base}/api/ai-instructions`)).status, 404);
    const response = await fetch(`${base}/api/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: [{ role: 'user', content: 'Merhaba' }] }) });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).message.content, 'Merhaba');
    assert.equal(calls, 1);
  } finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
});
