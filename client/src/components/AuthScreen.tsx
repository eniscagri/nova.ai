import { useState, type FormEvent } from 'react';
import type { NovaSession } from '../services/SupabaseAuth';
import { SupabaseAuth } from '../services/SupabaseAuth';

type Mode = 'login' | 'register' | 'recover';
const auth = new SupabaseAuth();

export function AuthScreen({ onAuthenticated }: { onAuthenticated: (session: NovaSession) => void }) {
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [unconfirmedEmail, setUnconfirmedEmail] = useState('');
  const [busy, setBusy] = useState(false);

  const changeMode = (next: Mode) => {
    setMode(next);
    setError('');
    setNotice('');
    setPassword('');
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setNotice('');
    setBusy(true);
    try {
      if (mode === 'login') {
        onAuthenticated(await auth.login(email, password));
      } else if (mode === 'register') {
        const result = await auth.register(name, username, email, password);
        if (result.session) onAuthenticated(result.session);
        else {
          setUnconfirmedEmail(email.trim());
          setNotice('Hesabını doğrulamak için e-posta adresine gönderilen bağlantıyı aç. Ardından burada giriş yapabilirsin.');
          setMode('login');
        }
      } else {
        await auth.requestPasswordReset(email);
        setNotice('Şifre yenileme bağlantısı e-posta adresine gönderildi. Gelen kutunu ve gereksiz klasörünü kontrol et.');
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Hesap işlemi tamamlanamadı.');
    } finally {
      setBusy(false);
    }
  };

  const resendConfirmation = async () => {
    const address = unconfirmedEmail || email.trim();
    if (!address) {
      setError('Önce e-posta adresini yaz.');
      return;
    }
    setError('');
    setNotice('');
    setBusy(true);
    try {
      await auth.resendConfirmation(address);
      setNotice('Yeni doğrulama bağlantısı gönderildi. Gelen kutunu ve gereksiz klasörünü kontrol et.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Doğrulama e-postası gönderilemedi.');
    } finally {
      setBusy(false);
    }
  };

  const continueWithGoogle = async () => {
    setError('');
    setNotice('');
    setBusy(true);
    try {
      await auth.continueWithGoogle();
      setNotice('Google ile giriş için açılan pencereden devam et. İşlem tamamlanınca Nova’ya döneceksin.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Google ile giriş başlatılamadı.');
    } finally {
      setBusy(false);
    }
  };

  const title = mode === 'login' ? 'Tekrar hoş geldin' : mode === 'register' ? 'Nova hesabını oluştur' : 'Şifreni yenile';
  const subtitle = mode === 'login'
    ? 'Sohbetlerine ve topluluğuna kaldığın yerden devam et.'
    : mode === 'register'
      ? 'Profilin, keşfet alanın ve kişisel sohbet alanın birkaç saniyede hazır.'
      : 'E-posta adresine güvenli bir yenileme bağlantısı göndereceğiz.';

  return <main className="auth-page">
    <section className="auth-art" aria-hidden="true">
      <img className="auth-cover" src="/nova-cover.png" alt="" />
      <div className="auth-brand"><img className="auth-logo" src="/nova-logo.png" alt="" /><span>NOVA AI</span></div>
      <div className="auth-copy"><p className="eyebrow">DÜŞÜN · ÜRET · KEŞFET</p><h1>Fikirlerin için sakin bir alan.</h1><p>Yaz, sor, tasarla. İstersen seçtiğin düşünceleri Nova topluluğuyla paylaş.</p></div>
      <div className="auth-note">Sohbetlerin cihazında kalır. Paylaşım yalnızca sen seçtiğinde yapılır.</div>
    </section>
    <section className="auth-panel">
      <div className="auth-mobile-brand"><img className="auth-logo" src="/nova-logo.png" alt="" /> NOVA AI</div>
      <div className="auth-card">
        <div className="auth-heading"><p className="eyebrow">NOVA HESAP</p><h2>{title}</h2><p>{subtitle}</p></div>
        <form onSubmit={submit} className="auth-form">
          {mode === 'register' && <><label>Adın<input autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Adın soyadın" required minLength={2} maxLength={60} /></label><label>Kullanıcı adı<input autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value.toLocaleLowerCase('tr-TR').replace(/ı/g, 'i').replace(/[^a-z0-9_]/g, ''))} placeholder="nova_fikir" required minLength={3} maxLength={24} pattern="[a-z0-9_]{3,24}" /><small className="auth-field-note">Keşfet alanında @{username || 'kullanici_adi'} olarak görünür.</small></label></>}
          <label>E-posta<input autoComplete="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="ornek@email.com" required /></label>
          {mode !== 'recover' && <label>Şifre<input autoComplete={mode === 'login' ? 'current-password' : 'new-password'} type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder={mode === 'login' ? 'Şifren' : 'En az 10 karakter'} required minLength={mode === 'login' ? 1 : 10} maxLength={128} /></label>}
          {error && <p className="auth-error" role="alert">{error}</p>}
          {notice && <p className="auth-notice" role="status">{notice}</p>}
          <button className="auth-submit" disabled={busy}>{busy ? 'İşleniyor…' : mode === 'login' ? 'Giriş yap' : mode === 'register' ? 'Hesap oluştur' : 'Bağlantı gönder'} <span>→</span></button>
        </form>
        {mode !== 'recover' && <>
          <div className="auth-divider"><span>veya</span></div>
          <button className="auth-google-button" type="button" onClick={() => void continueWithGoogle()} disabled={busy} aria-label="Google ile giriş yap"><span className="google-mark" aria-hidden="true">G</span> Google ile giriş yap</button>
        </>}
        {mode === 'login' && <button className="auth-text-button" type="button" onClick={() => void resendConfirmation()} disabled={busy}>Doğrulama e-postasını tekrar gönder</button>}
        {mode === 'login' && <button className="auth-text-button" onClick={() => changeMode('recover')}>Şifremi unuttum</button>}
        {mode === 'recover' && <button className="auth-text-button" onClick={() => changeMode('login')}>Girişe dön</button>}
        <p className="auth-switch">{mode === 'login' ? 'Henüz hesabın yok mu?' : 'Zaten hesabın var mı?'} <button onClick={() => changeMode(mode === 'login' ? 'register' : 'login')}>{mode === 'login' ? 'Kayıt ol' : 'Giriş yap'}</button></p>
      </div>
    </section>
  </main>;
}
