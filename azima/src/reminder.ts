import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

/** Daily reminder on Android (generic wording, nothing sensitive on the lock screen). */
export async function setReminder(on: boolean, time: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await LocalNotifications.cancel({ notifications: [{ id: 1 }] });
    if (!on) return;
    const p = await LocalNotifications.requestPermissions();
    if (p.display !== 'granted') return;
    const [hour, minute] = time.split(':').map(Number);
    await LocalNotifications.schedule({ notifications: [{ id: 1, title: 'عزيمة', body: 'وقت متابعة يومك 💪', schedule: { on: { hour, minute }, allowWhileIdle: true } }] });
  } catch (e) { console.error(e); }
}
