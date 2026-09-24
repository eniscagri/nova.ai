import 'dotenv/config';
import { mkdir, writeFile, rename } from 'node:fs/promises';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { defaultInstructionsPath } from './services/AiInstructions.js';

const value = process.argv.slice(2).join(' ').trim();
if (!value || value.length > 12000) {
  console.error('Kullanım: npm run ai:talimat -- "Bir stilist gibi çalış. Önce bütçe ve kullanım amacını sor." (1–12000 karakter)');
  process.exitCode = 1;
} else {
  const path = process.env.AI_INSTRUCTIONS_FILE || defaultInstructionsPath;
  await mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.${randomUUID()}.tmp`;
  await writeFile(temporary, value + '\n', { encoding: 'utf8', mode: 0o600 });
  await rename(temporary, path);
  console.info('Özel AI talimatı kaydedildi. Sonraki yanıttan itibaren uygulanır.');
}
