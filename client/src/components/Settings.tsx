import { useState } from 'react';
import { Browser } from '@capacitor/browser';
import type { AuthUser } from '../services/AuthApi';
import type { ThemePreference } from '../types/chat';
import { apiBaseUrl } from '../services/api';

// Prop'ları ayrı bir interface'e alarak okunabilirliği artırdık
interface SettingsProps {
  open: boolean;
  theme: ThemePreference;
  user: AuthUser;
  onTheme: (theme: ThemePreference) => void;
  onClear: () => void;
  onLogout: () => void;
  onDeleteAccount: () => Promise<void>;
  onClose: () => void;
}

export function Settings({
  open,
  theme,
  user,
  onTheme,
  onClear,
  onLogout,
  onDeleteAccount,
  onClose,
}: SettingsProps) {
  const [deleting, setDeleting] = useState(false);
  if (!open) return null;

  const openLegalPage = async (path: string) => { await Browser.open({ url: `${apiBaseUrl}${path}`, windowName: 'Nova AI' }); };
  const deleteAccount = async () => {
    if (!confirm('Hesabın, profilin ve topluluk paylaşımların kalıcı olarak silinecek. Devam etmek istiyor musun?')) return;
    if (prompt('Onaylamak için SİL yaz.') !== 'SİL') return;
    setDeleting(true);
    try { await onDeleteAccount(); }
    catch (reason) { alert(reason instanceof Error ? reason.message : 'Hesap silme tamamlanamadı.'); setDeleting(false); }
  };

  // Tema seçeneklerini daha düzenli render edebilmek için bir diziye aldık
  const themeOptions: { value: ThemePreference; label: string }[] = [
    { value: 'system', label: 'Sistem' },
    { value: 'light', label: 'Açık' },
    { value: 'dark', label: 'Koyu' },
  ];

  return (
    <div className="modal-backdrop" role="presentation">
      <section
        className="settings-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
      >
        <header>
          <h2 id="settings-title">Ayarlar</h2>
          <button onClick={onClose} aria-label="Ayarları kapat">
            &times;
          </button>
        </header>

        <section className="account-summary">
          {/* slice(0, 1) yerine charAt(0) kullanmak daha yaygın ve performanslı bir yaklaşımdır */}
          <span>{user.name.charAt(0).toUpperCase()}</span>
          <div>
            <strong>{user.name}</strong>
            <small>{user.email}</small>
          </div>
        </section>

        <button className="logout-button" onClick={onLogout}>
          Çıkış yap <span>&rarr;</span>
        </button>

        <div className="legal-links" aria-label="Yasal bilgiler">
          <button onClick={() => void openLegalPage('/privacy-policy')}>Gizlilik Politikası</button>
          <button onClick={() => void openLegalPage('/terms')}>Kullanım Koşulları</button>
        </div>

        <h3>Görünüm</h3>
        <div className="theme-selector">
          {themeOptions.map(({ value, label }) => (
            <label className="radio" key={value}>
              <input
                type="radio"
                name="theme"
                checked={theme === value}
                onChange={() => onTheme(value)}
              />
              {label}
            </label>
          ))}
        </div>

        <hr />

        <h3>Sohbet geçmişi</h3>
        <button className="outline-danger" onClick={onClear}>
          Sohbet geçmişini temizle
        </button>

        <hr />

        <h3>Hesap silme</h3>
        <p className="settings-help">Hesabın, profilin ve topluluk paylaşımların kalıcı olarak silinir. Bu işlem geri alınamaz.</p>
        <button className="outline-danger" onClick={() => void deleteAccount()} disabled={deleting}>
          {deleting ? 'Hesap siliniyor…' : 'Hesabımı kalıcı olarak sil'}
        </button>
      </section>
    </div>
  );
}
