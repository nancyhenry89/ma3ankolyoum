// src/utils/reminders.ts
import { LocalNotifications } from '@capacitor/local-notifications'
import { Preferences } from '@capacitor/preferences'
import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'

const REMINDER_ID = 1001
const TEST_ID = 9999

type Lang = 'ar' | 'en'

const PREF_ENABLED = 'reminder_enabled'
const PREF_HOUR = 'reminder_hour'
const PREF_MINUTE = 'reminder_minute'
const PREF_LANG = 'reminder_lang'
const PREF_TZ = 'reminder_timezone'

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

function getTZ() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown'
}

/** Android 12+ : exact alarms can be disabled by user setting */
async function ensureExactAlarmAllowedIfPossible(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  if (Capacitor.getPlatform() !== 'android') return

  // These APIs exist on newer Capacitor versions. Guard for older versions.
  const anyLN = LocalNotifications as any
  try {
    if (typeof anyLN.checkExactNotificationSetting === 'function') {
      const res = await anyLN.checkExactNotificationSetting()
      const enabled =
        typeof res === 'boolean' ? res : Boolean(res?.value ?? res?.enabled ?? res?.exact)

      if (!enabled && typeof anyLN.changeExactNotificationSetting === 'function') {
        // Opens system UI where user can enable "Alarms & reminders" / exact alarms
        await anyLN.changeExactNotificationSetting()
      }
    }
  } catch {
    // ignore: device/OS/plugin may not support it
  }
}

export async function requestReminderPermission() {
  const perm = await LocalNotifications.requestPermissions()
  return perm.display === 'granted'
}

/** (Recommended) call once in app bootstrap */
export async function initReminderSystem() {
  // Android channel (safe no-op on iOS)
  try {
    await LocalNotifications.createChannel({
      id: 'daily',
      name: 'Daily reminders',
      description: 'Daily reminder to read today’s message',
      importance: 4, // HIGH
      visibility: 1, // PUBLIC
      // sound: undefined, // default
      // vibration: true, // default
    })
  } catch {
    // ignore
  }

  // Handle tap on notification
  try {
    await LocalNotifications.addListener('localNotificationActionPerformed', (ev: any) => {
      // If you use router, you can handle ev.notification.extra.route in a central place.
      // Example:
      // const route = ev?.notification?.extra?.route
      // if (route) router.push(route)
      void ev
    })
  } catch {
    // ignore
  }

  // Reschedule on app resume if timezone changed (fixes +1h shifts after travel/DST)
  App.addListener('appStateChange', async (state) => {
    if (!state.isActive) return
    await resyncReminderIfNeeded()
  })
}

async function saveReminderPrefs(hour: number, minute: number, lang: Lang, enabled: boolean) {
  await Preferences.set({ key: PREF_HOUR, value: String(hour) })
  await Preferences.set({ key: PREF_MINUTE, value: String(minute) })
  await Preferences.set({ key: PREF_LANG, value: lang })
  await Preferences.set({ key: PREF_ENABLED, value: enabled ? '1' : '0' })
  await Preferences.set({ key: PREF_TZ, value: getTZ() })
}

async function readReminderPrefs(): Promise<{
  enabled: boolean
  hour: number
  minute: number
  lang: Lang
  tz: string
} | null> {
  const [en, h, m, l, tz] = await Promise.all([
    Preferences.get({ key: PREF_ENABLED }),
    Preferences.get({ key: PREF_HOUR }),
    Preferences.get({ key: PREF_MINUTE }),
    Preferences.get({ key: PREF_LANG }),
    Preferences.get({ key: PREF_TZ }),
  ])

  const enabled = (en.value ?? '') === '1'
  const hour = Number(h.value)
  const minute = Number(m.value)
  const lang = (l.value === 'en' ? 'en' : 'ar') as Lang
  const lastTz = tz.value ?? 'unknown'

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null
  return { enabled, hour, minute, lang, tz: lastTz }
}

export async function scheduleDailyReminder(hour: number, minute: number, lang: Lang) {
  const granted = await requestReminderPermission()
  if (!granted) return false

  await ensureExactAlarmAllowedIfPossible()

  const copy = getReminderCopy(lang)

  // cancel old one to avoid duplicates
  await LocalNotifications.cancel({ notifications: [{ id: REMINDER_ID }] })

  // schedule
  await LocalNotifications.schedule({
    notifications: [
      {
        id: REMINDER_ID,
        title: copy.title,
        body: copy.body,

        // Android: ensure it uses your channel + high priority
        channelId: 'daily',

        // Helps Android in Doze (may still be delayed on some OEMs)
        schedule: { repeats: true, on: { hour, minute }, allowWhileIdle: true },

        // iOS extras (safe on Android too)
        // sound: undefined, // use default
        // badge: 1, // uncomment if you want badge count

        extra: { route: '/' },
      },
    ],
  })

  await saveReminderPrefs(hour, minute, lang, true)
  return true
}

export async function disableDailyReminder() {
  await LocalNotifications.cancel({ notifications: [{ id: REMINDER_ID }] })
  await saveReminderPrefs(0, 0, 'ar', false)
}

export async function sendTestReminder(lang: Lang) {
  const granted = await requestReminderPermission()
  if (!granted) return false

  const copy = getReminderCopy(lang)

  await LocalNotifications.cancel({ notifications: [{ id: TEST_ID }] })

  await LocalNotifications.schedule({
    notifications: [
      {
        id: TEST_ID,
        title: copy.title,
        body: copy.testBody,
        channelId: 'daily',
        schedule: { at: new Date(Date.now() + 3000), allowWhileIdle: true },
        extra: { route: '/' },
      },
    ],
  })

  return true
}

/**
 * Call on app resume (already done in initReminderSystem) or manually.
 * Re-schedules if timezone changed (prevents 1-hour offsets after travel/DST).
 */
export async function resyncReminderIfNeeded() {
  const prefs = await readReminderPrefs()
  if (!prefs) return
  if (!prefs.enabled) return

  const nowTz = getTZ()
  if (prefs.tz !== nowTz) {
    await scheduleDailyReminder(prefs.hour, prefs.minute, prefs.lang)
    // scheduleDailyReminder saves the new tz
  }
}
