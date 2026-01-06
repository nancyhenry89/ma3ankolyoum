import { LocalNotifications } from '@capacitor/local-notifications'

const REMINDER_ID = 1001

type Lang = 'ar' | 'en'

function getReminderCopy(lang: Lang) {
  if (lang === 'en') {
    return {
      title: 'Together Every Day',
      body: '📖 Open the app and read today’s message',
      testBody: '✅ Test notification (in 3 seconds)',
    }
  }
  return {
    title: 'معًا كل يوم',
    body: '📖 افتح التطبيق واقرأ رسالة اليوم',
    testBody: '✅ إشعار تجريبي (بعد 3 ثواني)',
  }
}

export async function requestReminderPermission() {
  const perm = await LocalNotifications.requestPermissions()
  return perm.display === 'granted'
}

export async function scheduleDailyReminder(hour: number, minute: number, lang: Lang) {
  const granted = await requestReminderPermission()
  if (!granted) return false

  const copy = getReminderCopy(lang)

  // امسحي القديم عشان ميتكررّش
  await LocalNotifications.cancel({ notifications: [{ id: REMINDER_ID }] })

  await LocalNotifications.schedule({
    notifications: [
      {
        id: REMINDER_ID,
        title: copy.title,
        body: copy.body,
        schedule: { repeats: true, on: { hour, minute } },
        extra: { route: '/' },
      },
    ],
  })

  return true
}

export async function disableDailyReminder() {
  await LocalNotifications.cancel({ notifications: [{ id: REMINDER_ID }] })
}

export async function sendTestReminder(lang: Lang) {
  const granted = await requestReminderPermission()
  if (!granted) return false

  const copy = getReminderCopy(lang)

  await LocalNotifications.schedule({
    notifications: [
      {
        id: 9999,
        title: copy.title,
        body: copy.testBody,
        schedule: { at: new Date(Date.now() + 3000) },
      },
    ],
  })

  return true
}
