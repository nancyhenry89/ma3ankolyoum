// src/utils/reminders.ts
import { LocalNotifications } from '@capacitor/local-notifications'
import { Preferences } from '@capacitor/preferences'
import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'

const REMINDER_ID = 1001
const TEST_ID = 9999

type Lang = 'ar' | 'en'

const PREF_EXACT_ASKED = 'reminder_exact_asked'
const PREF_ENABLED = 'reminder_enabled'
const PREF_HOUR = 'reminder_hour'
const PREF_MINUTE = 'reminder_minute'
const PREF_LANG = 'reminder_lang'
const PREF_TZ = 'reminder_timezone'

// ✅ Missed-day warning
const MISS_WARN_BASE_ID = 200000
const PREF_MISS_WARN_LAST = 'reminder_miss_warn_last' // YYYY-MM-DD
const PREF_MISS_WARN_ENABLED = 'reminder_miss_warn_enabled'

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

function getMissedDayCopy(lang: Lang) {
  if (lang === 'en') {
    return {
      title: 'Together Every Day',
      body: '⚠️ You missed yesterday. If you miss one more day, your streak will reset.',
    }
  }
  return {
    title: 'معًا كل يوم',
    body: '⚠️ فاتك يوم امبارح. لو فاتك يوم كمان الستريك هيتصفّر.',
  }
}

function getTZ() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown'
}

function notifSoundForPlatform() {
  // iOS only: needs filename with extension inside bundle
  if (Capacitor.getPlatform() === 'ios') return 'reminder_sound.wav'
  // Android: channel handles it
  return undefined
}

function idFromISO(iso: string) {
  // iso = YYYY-MM-DD -> number like 20260228
  const n = Number(iso.replaceAll('-', ''))
  return MISS_WARN_BASE_ID + (Number.isFinite(n) ? (n % 100000) : 0)
}

/**
 * Android 12+ : exact alarms can be disabled by user setting.
 * ✅ Only open system settings when userInitiated === true
 * ✅ Ask only once (PREF_EXACT_ASKED)
 */
async function ensureExactAlarmAllowedIfPossible(userInitiated: boolean): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  if (Capacitor.getPlatform() !== 'android') return
  if (!userInitiated) return

  const asked = await Preferences.get({ key: PREF_EXACT_ASKED })
  if (asked.value === '1') return

  const anyLN = LocalNotifications as any
  try {
    if (typeof anyLN.checkExactNotificationSetting === 'function') {
      const res = await anyLN.checkExactNotificationSetting()
      const enabled = typeof res === 'boolean' ? res : Boolean(res?.value ?? res?.enabled ?? res?.exact)

      if (!enabled && typeof anyLN.changeExactNotificationSetting === 'function') {
        // ✅ set before opening settings (so we don't loop)
        await Preferences.set({ key: PREF_EXACT_ASKED, value: '1' })
        await anyLN.changeExactNotificationSetting()
      }
    }
  } catch {
    // ignore
  }
}

/** ✅ Use this on a user action only (toggle / test) */
export async function requestReminderPermission() {
  const perm = await LocalNotifications.requestPermissions()
  return perm.display === 'granted'
}

/** ✅ Safe check (no prompt) */
export async function hasReminderPermission() {
  const perm = await LocalNotifications.checkPermissions()
  return perm.display === 'granted'
}

/** useful for UI */
export async function isDailyReminderEnabled() {
  const en = await Preferences.get({ key: PREF_ENABLED })
  return (en.value ?? '') === '1'
}

/** useful for UI */
export async function isMissedDayWarningEnabled() {
  const v = await Preferences.get({ key: PREF_MISS_WARN_ENABLED })
  // ✅ default OFF
  return (v.value ?? '0') === '1'
}

export async function setMissedDayWarningEnabled(enabled: boolean) {
  await Preferences.set({ key: PREF_MISS_WARN_ENABLED, value: enabled ? '1' : '0' })
}

/** (Recommended) call once in app bootstrap */
export async function initReminderSystem() {
  // Android channel (safe no-op on iOS)
  try {
    await LocalNotifications.createChannel({
      id: 'daily_v2',
      name: 'Daily reminders',
      description: 'Daily reminder to read today’s message',
      importance: 4, // HIGH
      visibility: 1, // PUBLIC
      sound: 'reminder_sound', // ✅ no extension
    })
  } catch {
    // ignore
  }

  // Handle tap on notification
  try {
    await LocalNotifications.addListener('localNotificationActionPerformed', (ev: any) => {
      // You can route based on ev.notification.extra.route
      void ev
    })
  } catch {
    // ignore
  }

  // ✅ On resume: ONLY resync if timezone changed, and NEVER prompt for permission/settings
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

/** useful for UI */
export async function getDailyReminderPrefsPublic() {
  return await readReminderPrefs()
}

/**
 * ✅ Schedules the daily reminder.
 * - If userInitiated=false (app resume / silent resync): NO permission prompt, NO settings UI.
 * - If userInitiated=true (toggle/test): we can request permission and open exact-alarm settings if needed.
 */
export async function scheduleDailyReminder(
  hour: number,
  minute: number,
  lang: Lang,
  userInitiated = false
) {
  if (!Capacitor.isNativePlatform()) return false

  // ✅ Avoid permission prompt unless user initiated
  if (userInitiated) {
    const granted = await requestReminderPermission()
    if (!granted) return false
  } else {
    const ok = await hasReminderPermission()
    if (!ok) return false
  }

  // ✅ Only opens settings on user action (and only once)
  await ensureExactAlarmAllowedIfPossible(userInitiated)

  const copy = getReminderCopy(lang)

  // cancel old one to avoid duplicates
  await LocalNotifications.cancel({ notifications: [{ id: REMINDER_ID }] })

  await LocalNotifications.schedule({
    notifications: [
      {
        id: REMINDER_ID,
        title: copy.title,
        body: copy.body,
        channelId: 'daily_v2',
        sound: notifSoundForPlatform(), // ✅ iOS only
        schedule: { repeats: true, on: { hour, minute }, allowWhileIdle: true },
        extra: { route: '/' },
      },
    ],
  })

  await saveReminderPrefs(hour, minute, lang, true)
  return true
}

export async function disableDailyReminder() {
  if (!Capacitor.isNativePlatform()) return
  await LocalNotifications.cancel({ notifications: [{ id: REMINDER_ID }] })
  await saveReminderPrefs(0, 0, 'ar', false)
}

/** ✅ Only call on user action (button) */
export async function sendTestReminder(lang: Lang) {
  if (!Capacitor.isNativePlatform()) return false

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
        channelId: 'daily_v2',
        sound: notifSoundForPlatform(), // ✅ iOS only
        schedule: { at: new Date(Date.now() + 3000), allowWhileIdle: true },
        extra: { route: '/' },
      },
    ],
  })

  return true
}

/**
 * ✅ Missed-one-day warning (silent)
 * - depends on user toggle (PREF_MISS_WARN_ENABLED)
 * - NO permission prompt
 * - sends at most once per dayISO
 */
export async function maybeSendMissedOneDayWarning(todayISO: string, lang: Lang) {
  if (!Capacitor.isNativePlatform()) return false

  const warnEnabled = await isMissedDayWarningEnabled()
  if (!warnEnabled) return false

  const ok = await hasReminderPermission()
  if (!ok) return false

  const last = await Preferences.get({ key: PREF_MISS_WARN_LAST })
  if (last.value === todayISO) return false

  const copy = getMissedDayCopy(lang)
  const id = idFromISO(todayISO)

  await LocalNotifications.cancel({ notifications: [{ id }] })

  await LocalNotifications.schedule({
    notifications: [
      {
        id,
        title: copy.title,
        body: copy.body,
        channelId: 'daily_v2',
        sound: notifSoundForPlatform(), // iOS only
        schedule: { at: new Date(Date.now() + 1500), allowWhileIdle: true },
        extra: { route: '/' },
      },
    ],
  })

  await Preferences.set({ key: PREF_MISS_WARN_LAST, value: todayISO })
  return true
}

/**
 * ✅ Call on app resume (already wired in initReminderSystem).
 * Re-schedules if timezone changed, WITHOUT prompting permissions/settings.
 */
export async function resyncReminderIfNeeded() {
  if (!Capacitor.isNativePlatform()) return

  const prefs = await readReminderPrefs()
  if (!prefs?.enabled) return

  // ✅ if permission isn't granted, do nothing silently
  const ok = await hasReminderPermission()
  if (!ok) return

  const nowTz = getTZ()
  if (prefs.tz !== nowTz) {
    // ✅ silent reschedule (no permission prompt, no settings UI)
    await scheduleDailyReminder(prefs.hour, prefs.minute, prefs.lang, false)
  }
}