import { readFile, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';

const configPath = 'capacitor.config.json';
const original = await readFile(configPath, 'utf8');
const config = JSON.parse(original);

// This switch is written only to Android's generated debug assets. It allows an
// emulator to reach the local backend at 10.0.2.2; the source config is restored
// before the command completes, so standard Android builds stay HTTPS-only.
config.android = { ...(config.android ?? {}), allowMixedContent: true };
await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');

try {
  const executable = process.platform === 'win32' ? (process.env.ComSpec ?? 'C:\\Windows\\System32\\cmd.exe') : 'npx';
  const argumentsList = process.platform === 'win32' ? ['/d', '/s', '/c', 'npx cap sync android'] : ['cap', 'sync', 'android'];
  const exitCode = await new Promise((resolve, reject) => {
    const child = spawn(executable, argumentsList, { stdio: 'inherit' });
    child.once('error', reject);
    child.once('exit', (code) => resolve(code ?? 1));
  });
  if (exitCode !== 0) process.exitCode = Number(exitCode);
} finally {
  await writeFile(configPath, original, 'utf8');
}
