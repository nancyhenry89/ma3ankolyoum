import { LocalNotifications } from '@capacitor/local-notifications'

const REMINDER_ID = 1001

export async function requestReminderPermission() {
  const perm = await LocalNotifications.requestPermissions()
  return perm.display === 'granted'
}

export async function scheduleDailyReminder(hour: number, minute: number) {
  const granted = await requestReminderPermission()
  if (!granted) return false

  // امسحي القديم عشان ميتكررّش
  await LocalNotifications.cancel({ notifications: [{ id: REMINDER_ID }] })

  await LocalNotifications.schedule({
    notifications: [
      {
        id: REMINDER_ID,
        title: 'معًا كل يوم',
        body: '📖 افتح التطبيق واقرأ رسالة اليوم',
        schedule: { repeats: true, on: { hour, minute } },
        extra: { route: '/' }, // هيفتح الهوم (Message اليوم)
      },
    ],
  })

  return true
}

export async function disableDailyReminder() {
  await LocalNotifications.cancel({ notifications: [{ id: REMINDER_ID }] })
}

export async function sendTestReminder() {
  const granted = await requestReminderPermission()
  if (!granted) return false

  await LocalNotifications.schedule({
    notifications: [
      {
        id: 9999,
        title: 'معًا كل يوم',
        body: '✅ إشعار تجريبي (بعد 3 ثواني)',
        schedule: { at: new Date(Date.now() + 3000) },
      },
    ],
  })

  return true
}
