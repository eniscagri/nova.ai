import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);

export type AuthUser = { id: string; name: string; email: string; createdAt: number };
type StoredUser = AuthUser & { passwordHash: string; recoveryHash: string };
type StoredSession = { id: string; tokenHash: string; userId: string; expiresAt: number };
type AuthData = { version: 1; users: StoredUser[]; sessions: StoredSession[] };

export class AuthError extends Error {
  constructor(public readonly status: number, public readonly code: string, message: string) { super(message); }
}

const emptyData = (): AuthData => ({ version: 1, users: [], sessions: [] });
const normalizeEmail = (email: string) => email.trim().toLowerCase();
const publicUser = ({ id, name, email, createdAt }: StoredUser): AuthUser => ({ id, name, email, createdAt });
const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex');

async function secureHash(value: string, salt = randomBytes(16).toString('hex')) {
  const derived = await scryptAsync(value, salt, 64) as Buffer;
  return `${salt}:${derived.toString('hex')}`;
}

async function verifyHash(value: string, stored: string) {
  const [salt, expected] = stored.split(':');
  if (!salt || !expected) return false;
  const candidate = await secureHash(value, salt);
  const candidateBytes = Buffer.from(candidate.split(':')[1], 'hex');
  const expectedBytes = Buffer.from(expected, 'hex');
  return candidateBytes.length === expectedBytes.length && timingSafeEqual(candidateBytes, expectedBytes);
}

export class AuthService {
  private data: AuthData = emptyData();
  private writeQueue: Promise<void> = Promise.resolve();

  constructor(private readonly dataPath = resolve(process.cwd(), 'data', 'auth-users.json'), private readonly sessionDays = 30) {}

  async initialize() {
    try {
      const parsed: unknown = JSON.parse(await readFile(this.dataPath, 'utf8'));
      if (typeof parsed === 'object' && parsed !== null && Array.isArray((parsed as AuthData).users) && Array.isArray((parsed as AuthData).sessions)) this.data = parsed as AuthData;
    } catch (error) {
      if (!(error instanceof Error) || !('code' in error) || error.code !== 'ENOENT') throw error;
    }
    await this.pruneSessions();
  }

  async register(input: { name: string; email: string; password: string }) {
    const email = normalizeEmail(input.email);
    if (this.data.users.some((user) => user.email === email)) throw new AuthError(409, 'EMAIL_IN_USE', 'Bu e-posta ile zaten bir hesap var.');
    const recoveryCode = `NOVA-${randomBytes(6).toString('hex').toUpperCase()}`;
    const now = Date.now();
    const user: StoredUser = {
      id: randomBytes(16).toString('hex'), name: input.name.trim(), email, createdAt: now,
      passwordHash: await secureHash(input.password), recoveryHash: await secureHash(recoveryCode)
    };
    this.data.users.push(user);
    const session = this.createSession(user.id);
    await this.persist();
    return { user: publicUser(user), token: session, recoveryCode };
  }

  async login(input: { email: string; password: string }) {
    const user = this.data.users.find((item) => item.email === normalizeEmail(input.email));
    if (!user || !(await verifyHash(input.password, user.passwordHash))) throw new AuthError(401, 'INVALID_CREDENTIALS', 'E-posta veya şifre doğru değil.');
    const session = this.createSession(user.id);
    await this.persist();
    return { user: publicUser(user), token: session };
  }

  async resetPassword(input: { email: string; recoveryCode: string; password: string }) {
    const user = this.data.users.find((item) => item.email === normalizeEmail(input.email));
    if (!user || !(await verifyHash(input.recoveryCode.trim().toUpperCase(), user.recoveryHash))) throw new AuthError(400, 'RECOVERY_FAILED', 'E-posta veya kurtarma kodu doğru değil.');
    user.passwordHash = await secureHash(input.password);
    this.data.sessions = this.data.sessions.filter((session) => session.userId !== user.id);
    const session = this.createSession(user.id);
    await this.persist();
    return { user: publicUser(user), token: session };
  }

  async session(token: string) {
    const stored = this.data.sessions.find((item) => item.tokenHash === tokenHash(token) && item.expiresAt > Date.now());
    if (!stored) throw new AuthError(401, 'SESSION_EXPIRED', 'Oturum süresi doldu. Lütfen yeniden giriş yapın.');
    const user = this.data.users.find((item) => item.id === stored.userId);
    if (!user) throw new AuthError(401, 'SESSION_EXPIRED', 'Oturum süresi doldu. Lütfen yeniden giriş yapın.');
    return publicUser(user);
  }

  async logout(token: string) {
    const hash = tokenHash(token);
    const before = this.data.sessions.length;
    this.data.sessions = this.data.sessions.filter((item) => item.tokenHash !== hash);
    if (this.data.sessions.length !== before) await this.persist();
  }

  private createSession(userId: string) {
    const token = randomBytes(32).toString('base64url');
    this.data.sessions.push({ id: randomBytes(16).toString('hex'), tokenHash: tokenHash(token), userId, expiresAt: Date.now() + this.sessionDays * 86_400_000 });
    return token;
  }

  private async pruneSessions() {
    const before = this.data.sessions.length;
    this.data.sessions = this.data.sessions.filter((session) => session.expiresAt > Date.now());
    if (before !== this.data.sessions.length) await this.persist();
  }

  private async persist() {
    const snapshot = JSON.stringify(this.data, null, 2);
    this.writeQueue = this.writeQueue.then(async () => {
      await mkdir(dirname(this.dataPath), { recursive: true });
      const temporaryPath = `${this.dataPath}.tmp`;
      await writeFile(temporaryPath, snapshot, { encoding: 'utf8', mode: 0o600 });
      await rename(temporaryPath, this.dataPath);
    });
    await this.writeQueue;
  }
}
