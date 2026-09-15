import { apiBaseUrl } from './api';

export type AuthUser = { id: string; name: string; email: string; createdAt: number };
export type AuthSession = { token: string; user: AuthUser };
type RegisterResult = AuthSession & { recoveryCode: string };

const sessionKey = 'nova-ai-session';
const errorMessage = async (response: Response) => {
  const data = await response.json().catch(() => null) as { error?: { message?: unknown } } | null;
  return typeof data?.error?.message === 'string' ? data.error.message : 'Hesap işlemi şu anda tamamlanamıyor.';
};

export class AuthApi {
  savedSession(): AuthSession | null {
    try { const parsed = JSON.parse(localStorage.getItem(sessionKey) ?? 'null') as AuthSession | null; return parsed?.token && parsed.user ? parsed : null; } catch { return null; }
  }
  save(session: AuthSession) { localStorage.setItem(sessionKey, JSON.stringify(session)); }
  clear() { localStorage.removeItem(sessionKey); }
  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${apiBaseUrl}${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) }, signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error(await errorMessage(response));
    return response.status === 204 ? undefined as T : await response.json() as T;
  }
  async register(input: { name: string; email: string; password: string }): Promise<RegisterResult> { return this.request('/api/auth/register', { method: 'POST', body: JSON.stringify(input) }); }
  async login(input: { email: string; password: string }): Promise<AuthSession> { return this.request('/api/auth/login', { method: 'POST', body: JSON.stringify(input) }); }
  async resetPassword(input: { email: string; recoveryCode: string; password: string }): Promise<AuthSession> { return this.request('/api/auth/reset-password', { method: 'POST', body: JSON.stringify(input) }); }
  async session(token: string): Promise<AuthUser> { const result = await this.request<{ user: AuthUser }>('/api/auth/session', { headers: { Authorization: `Bearer ${token}` } }); return result.user; }
  async logout(token: string) { await this.request<void>('/api/auth/logout', { method: 'POST', headers: { Authorization: `Bearer ${token}` } }); }
}
