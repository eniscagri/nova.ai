import { useState } from 'react';
import { Browser } from '@capacitor/browser';
import type { AuthUser } from '../services/AuthApi';
import type { ThemePreference } from '../types/chat';
import { apiBaseUrl } from '../services/api';
import type { ConversationStyle } from '../services/SocialService';
import { conversationTones } from '../services/ConversationTones';
import { usageRemindersSupported } from '../services/UsageReminders';

// Prop'ları ayrı bir interface'e alarak okunabilirliği artırdık
interface SettingsProps {
  tone: ConversationStyle;
  onTone: (tone: ConversationStyle) => Promise<void>;
  open: boolean;
  theme: ThemePreference;
  user: AuthUser;
  onTheme: (theme: ThemePreference) => void;
  onClear: () => void;
  onLogout: () => void;
  onDeleteAccount: () => Promise<void>;
  remindersEnabled: boolean;
  onReminders: (enabled: boolean) => Promise<void>;
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
  remindersEnabled,
  onReminders,
  onClose,
  tone,
  onTone,
}: SettingsProps) {
  const [deleting, setDeleting] = useState(false);
  const [toneBusy, setToneBusy] = useState(false);
  const [toneError, setToneError] = useState('');
  const [notificationBusy, setNotificationBusy] = useState(false);
  const [notificationError, setNotificationError] = useState('');
  const updateNotifications = async (action: () => Promise<void>) => {
    setNotificationBusy(true); setNotificationError('');
    try { await action(); }
    catch (reason) { setNotificationError(reason instanceof Error ? reason.message : 'Bildirim ayarı kaydedilemedi.'); }
    finally { setNotificationBusy(false); }
  };
  const changeTone = async (next: ConversationStyle) => { setToneBusy(true); setToneError(''); try { await onTone(next); } catch (reason) { setToneError(reason instanceof Error ? reason.message : 'Ton kaydedilemedi.'); } finally { setToneBusy(false); } };
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

        <h3>Nova’nın tonu</h3>
        <p className="settings-help">İhtiyacına uygun anlatımı seç. Tüm tonlarda her konuda soru sorabilirsin; seçimin hesabına kaydedilir.</p>
        <fieldset className="tone-options" disabled={toneBusy}>
          <legend className="sr-only">Nova tonu</legend>
          {[...new Set(conversationTones.map(item => item.group))].map(group => <div className="tone-group" key={group}>
            <h4>{group}</h4>
            <div className="tone-grid">{conversationTones.filter(item => item.group === group).map(item => <label className={`tone-option${tone === item.value ? ' selected' : ''}`} key={item.value}>
              <input type="radio" name="nova-tone" value={item.value} checked={tone === item.value} onChange={() => void changeTone(item.value)} />
              <span><strong>{item.label}</strong><small>{item.detail}</small></span>
            </label>)}</div>
          </div>)}
        </fieldset>
        {toneBusy && <p className="settings-help" role="status">Ton hesabına kaydediliyor…</p>}
        {toneError && <p className="auth-error" role="alert">{toneError}</p>}
        <hr />
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

        <div className="notification-setting">
          <div>
            <h3>Kullanım hatırlatmaları</h3>
            <p className="settings-help">Haftada iki kısa hatırlatma: salı 18.00 ve cumartesi 12.00, cihazının yerel saatine göre. İstediğin zaman kapatabilirsin.</p>
          </div>
          <label className="settings-switch">
            <input aria-label="Kullanım hatırlatmalarını etkinleştir" type="checkbox" disabled={notificationBusy || !usageRemindersSupported()} checked={remindersEnabled} onChange={(event) => { const checked = event.target.checked; void updateNotifications(() => onReminders(checked)); }} />
            <span aria-hidden="true" />
            <b>{remindersEnabled ? 'Açık' : 'Kapalı'}</b>
          </label>
        </div>

        <hr />

        {!usageRemindersSupported() && <p className="settings-help">Hatırlatmalar Android uygulamasında kullanılabilir.</p>}
        {notificationError && <p className="auth-error" role="alert">{notificationError}</p>}
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
