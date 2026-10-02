import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { reminderPlan, reminderIds } from './ReminderPlan';
const enabledKey = 'nova-ai-reminders-enabled';
const promptedKey = 'nova-ai-reminders-prompted';
const planKey = 'nova-ai-reminders-plan';
const planVersion = 'weekly-v2';
export const usageRemindersSupported = () => Capacitor.isNativePlatform();
export const usageRemindersEnabled = () => localStorage.getItem(enabledKey) === 'true';
export const usageReminderPrompted = () => localStorage.getItem(promptedKey) === 'true';
export const markUsageReminderPrompted = () => localStorage.setItem(promptedKey, 'true');
async function channel() {
  if (Capacitor.getPlatform() === 'android') await LocalNotifications.createChannel({ id: 'nova-reminders', name: 'Nova hatırlatmaları', description: 'Haftada iki kısa fikir ve planlama hatırlatması', importance: 3 });
}
async function cancelNovaReminders() {
  if (usageRemindersSupported()) await LocalNotifications.cancel({ notifications: reminderIds.map(id => ({ id })) });
}
export async function scheduleUsageReminders(force = false) {
  if (!usageRemindersSupported() || !usageRemindersEnabled()) return false;
  if ((await LocalNotifications.checkPermissions()).display !== 'granted') {
    localStorage.setItem(enabledKey, 'false'); localStorage.removeItem(planKey); return false;
  }
  const pending = await LocalNotifications.getPending();
  if (!force && localStorage.getItem(planKey) === planVersion && reminderPlan.every(item => pending.notifications.some(notification => notification.id === item.id))) return true;
  await channel();
  await cancelNovaReminders();
  await LocalNotifications.schedule({ notifications: reminderPlan.map(({ weekday, hour, minute, ...message }) => ({ ...message, schedule: { on: { weekday, hour, minute }, allowWhileIdle: true }, channelId: Capacitor.getPlatform() === 'android' ? 'nova-reminders' : undefined, autoCancel: true, extra: { destination: 'chat', source: 'usage-reminder' } })) });
  localStorage.setItem(planKey, planVersion);
  return true;
}
export async function enableUsageReminders() {
  if (!usageRemindersSupported()) return false;
  const current = await LocalNotifications.checkPermissions();
  const permission = current.display === 'granted' ? current : await LocalNotifications.requestPermissions();
  markUsageReminderPrompted();
  if (permission.display !== 'granted') { localStorage.setItem(enabledKey, 'false'); return false; }
  localStorage.setItem(enabledKey, 'true');
  try { return await scheduleUsageReminders(true); }
  catch (reason) { localStorage.setItem(enabledKey, 'false'); localStorage.removeItem(planKey); await cancelNovaReminders(); throw reason; }
}
export async function disableUsageReminders() {
  await cancelNovaReminders();
  localStorage.setItem(enabledKey, 'false'); localStorage.removeItem(planKey);
}
export async function testUsageReminder() {
  if (!usageRemindersSupported() || !usageRemindersEnabled()) throw new Error('Önce kullanım hatırlatmalarını aç.');
  if ((await LocalNotifications.checkPermissions()).display !== 'granted') throw new Error('Cihaz ayarlarından Nova bildirimlerine izin ver.');
  await channel();
  await LocalNotifications.schedule({ notifications: [{ id: 62005, title: 'Nova bildirimleri hazır', body: 'Hatırlatmalar açık. Aklındaki bir fikri birlikte geliştirelim.', schedule: { at: new Date(Date.now() + 5000), allowWhileIdle: true }, channelId: Capacitor.getPlatform() === 'android' ? 'nova-reminders' : undefined, autoCancel: true, extra: { destination: 'chat', source: 'usage-reminder-test' } }] });
}
