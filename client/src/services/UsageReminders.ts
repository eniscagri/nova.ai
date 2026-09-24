import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

const enabledKey = 'nova-ai-reminders-enabled';
const promptedKey = 'nova-ai-reminders-prompted';
const scheduledKey = 'nova-ai-reminders-scheduled-at';
const notificationIds = [62001, 62002, 62003, 62004];
const refreshAfterMs = 5 * 24 * 60 * 60 * 1000;

const reminderMessages = [
  { title: 'Bir fikrin mi var?', body: 'Nova ile iki dakikada netleştir.' },
  { title: 'Bugün neyi kolaylaştırabiliriz?', body: 'Planını Nova ile küçük adımlara böl.' },
  { title: 'Kısa bir mola, taze bir fikir', body: 'Nova’ya ne düşündüğünü yaz.' },
  { title: 'Hazırsan başlayalım', body: 'Bugünün hedefini birlikte netleştirelim.' },
  { title: 'Nova yanında', body: 'Aklındaki soruyu yaz, birlikte ilerleyelim.' },
];

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function nextReminderDates() {
  const dates: Date[] = [];
  const cursor = new Date();
  cursor.setSeconds(0, 0);
  for (let index = 0; index < notificationIds.length; index += 1) {
    cursor.setDate(cursor.getDate() + randomInt(2, 4));
    cursor.setHours(randomInt(10, 19), randomInt(0, 3) * 15, 0, 0);
    dates.push(new Date(cursor));
  }
  return dates;
}

export function usageRemindersSupported() {
  return Capacitor.isNativePlatform();
}

export function usageRemindersEnabled() {
  return localStorage.getItem(enabledKey) === 'true';
}

export function usageReminderPrompted() {
  return localStorage.getItem(promptedKey) === 'true';
}

export function markUsageReminderPrompted() {
  localStorage.setItem(promptedKey, 'true');
}

async function cancelNovaReminders() {
  if (!usageRemindersSupported()) return;
  await LocalNotifications.cancel({ notifications: notificationIds.map((id) => ({ id })) });
}

export async function scheduleUsageReminders(force = false) {
  if (!usageRemindersSupported() || !usageRemindersEnabled()) return;
  const lastScheduled = Number(localStorage.getItem(scheduledKey) ?? 0);
  if (!force && Date.now() - lastScheduled < refreshAfterMs) return;

  const permission = await LocalNotifications.checkPermissions();
  if (permission.display !== 'granted') return;

  if (Capacitor.getPlatform() === 'android') {
    await LocalNotifications.createChannel({
      id: 'nova-reminders',
      name: 'Nova hatırlatmaları',
      description: 'Nova AI kullanım ve fikir hatırlatmaları',
      importance: 3,
    });
  }

  await cancelNovaReminders();
  const dates = nextReminderDates();
  await LocalNotifications.schedule({
    notifications: dates.map((at, index) => {
      const message = reminderMessages[randomInt(0, reminderMessages.length - 1)];
      return {
        id: notificationIds[index],
        title: message.title,
        body: message.body,
        schedule: { at },
        channelId: Capacitor.getPlatform() === 'android' ? 'nova-reminders' : undefined,
        autoCancel: true,
        extra: { destination: 'chat', source: 'usage-reminder' },
      };
    }),
  });
  localStorage.setItem(scheduledKey, String(Date.now()));
}

export async function enableUsageReminders() {
  if (!usageRemindersSupported()) return false;
  const current = await LocalNotifications.checkPermissions();
  const permission = current.display === 'granted' ? current : await LocalNotifications.requestPermissions();
  markUsageReminderPrompted();
  if (permission.display !== 'granted') {
    localStorage.setItem(enabledKey, 'false');
    return false;
  }
  localStorage.setItem(enabledKey, 'true');
  await scheduleUsageReminders(true);
  return true;
}

export async function disableUsageReminders() {
  localStorage.setItem(enabledKey, 'false');
  localStorage.removeItem(scheduledKey);
  await cancelNovaReminders();
}
