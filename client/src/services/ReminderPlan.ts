// Sunday = 1 in Capacitor's ScheduleOn weekday format. Two daytime reminders/week.
export const reminderPlan = [
  { id: 62001, title: 'Bir fikrin mi var?', body: 'Nova ile iki dakikada netleştir.', weekday: 3 as const, hour: 18, minute: 0 },
  { id: 62002, title: 'Haftana küçük bir adım ekle', body: 'Aklındaki soruyu veya yeni hedefini Nova’ya yaz.', weekday: 7 as const, hour: 12, minute: 0 },
];
export const reminderIds = [62001, 62002, 62003, 62004, 62005];
