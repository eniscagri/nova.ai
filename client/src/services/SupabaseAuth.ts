import type { Session, User } from '@supabase/supabase-js';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { supabase } from './supabase';
import { apiBaseUrl } from './api';

export type NovaUser = {
  id: string;
  name: string;
  email: string;
  createdAt: number;
};

export type NovaSession = { token: string; user: NovaUser };

const nameFromUser = (user: User) => {
  const supplied = user.user_metadata?.display_name;
  if (typeof supplied === 'string' && supplied.trim()) return supplied.trim();
  return user.email?.split('@')[0] || 'Nova kullanıcısı';
};

export const novaSessionFrom = (session: Session): NovaSession => ({
  token: session.access_token,
  user: {
    id: session.user.id,
    name: nameFromUser(session.user),
    email: session.user.email ?? '',
    createdAt: new Date(session.user.created_at).getTime()
  }
});

const friendlyAuthError = (message: string) => {
  if (/invalid login credentials/i.test(message)) return 'E-posta veya şifre doğru değil.';
  if (/email not confirmed/i.test(message)) return 'Önce e-posta adresine gelen doğrulama bağlantısını aç.';
  if (/already registered/i.test(message)) return 'Bu e-posta ile bir hesap zaten var. Giriş yapmayı dene.';
  if (/password should be/i.test(message)) return 'Şifren en az 10 karakter olmalı.';
  if (/rate limit/i.test(message)) return 'Çok fazla deneme yapıldı. Birkaç dakika sonra tekrar dene.';
  if (/provider is not enabled|unsupported provider/i.test(message)) return 'Google ile giriş henüz etkinleştirilmemiş. Lütfen biraz sonra tekrar dene.';
  return 'Hesap işlemi şu anda tamamlanamıyor. Lütfen tekrar dene.';
};

const usernameFor = (value: string) => value.toLocaleLowerCase('tr-TR').replace(/ı/g, 'i').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9_]/g, '').slice(0, 24);

export const authRedirectUrl = Capacitor.isNativePlatform() ? 'com.novaai.chat://auth' : `${window.location.origin}/`;

export async function listenForNativeAuthRedirect(): Promise<() => void> {
  if (!Capacitor.isNativePlatform()) return () => undefined;
  const exchange = async (url: string) => {
    if (!url.startsWith('com.novaai.chat://auth')) return;
    const callback = new URL(url);
    const code = callback.searchParams.get('code');
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) throw error;
      await Browser.close();
      return;
    }
    // Supports a callback already opened by an earlier app version using implicit OAuth.
    const fragment = new URLSearchParams(callback.hash.replace(/^#/, ''));
    const accessToken = fragment.get('access_token');
    const refreshToken = fragment.get('refresh_token');
    if (accessToken && refreshToken) {
      const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
      if (error) throw error;
      await Browser.close();
    }
  };
  const listener = await App.addListener('appUrlOpen', ({ url }) => { void exchange(url); });
  const initial = await App.getLaunchUrl();
  if (initial?.url) await exchange(initial.url);
  return () => { void listener.remove(); };
}

export class SupabaseAuth {
  async login(email: string, password: string): Promise<NovaSession> {
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error || !data.session) throw new Error(friendlyAuthError(error?.message ?? ''));
    return novaSessionFrom(data.session);
  }

  async register(name: string, username: string, email: string, password: string): Promise<{ session: NovaSession | null; confirmationNeeded: boolean }> {
    const normalizedUsername = usernameFor(username);
    if (!/^[a-z0-9_]{3,24}$/.test(normalizedUsername)) throw new Error('Kullanıcı adı 3–24 karakter olmalı; yalnızca harf, rakam ve alt çizgi kullanabilirsin.');
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: authRedirectUrl, data: { display_name: name.trim(), username: normalizedUsername } }
    });
    if (error) throw new Error(friendlyAuthError(error.message));
    return { session: data.session ? novaSessionFrom(data.session) : null, confirmationNeeded: !data.session };
  }

  async resendConfirmation(email: string): Promise<void> {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim(),
      options: { emailRedirectTo: authRedirectUrl }
    });
    if (error) throw new Error(friendlyAuthError(error.message));
  }

  async continueWithGoogle(): Promise<void> {
    const native = Capacitor.isNativePlatform();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: authRedirectUrl, skipBrowserRedirect: native }
    });
    if (error || (native && !data.url)) throw new Error(friendlyAuthError(error?.message ?? ''));
    if (native && data.url) await Browser.open({ url: data.url, windowName: 'Nova ile giriş' });
  }

  async requestPasswordReset(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: authRedirectUrl });
    if (error) throw new Error(friendlyAuthError(error.message));
  }

  async logout() { await supabase.auth.signOut(); }

  async deleteAccount(accessToken: string): Promise<void> {
    const response = await fetch(`${apiBaseUrl}/api/account`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ confirmation: 'SİL' })
    });
    if (response.ok) return;
    const body = await response.json().catch(() => null) as { error?: { message?: unknown } } | null;
    if (typeof body?.error?.message === 'string') throw new Error(body.error.message);
    throw new Error('Hesap silme şu anda tamamlanamadı. Lütfen tekrar dene.');
  }
}
