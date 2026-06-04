import Papa from "papaparse"

export const DAILY_PRAYER_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTSmCgXqksv08trGdtoPWYaAkSdR2_npMTuC2RDAz3HgmhwT0Us94_NjLMcH-olgZikigKXevxd0kTl/pub?gid=0&single=true&output=csv"

export type WeekdayKey =
  | "sunday"
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"

export type PrayerRow = {
  weekday_key: WeekdayKey
  weekday_ar: string
  cta_title: string
  page_title: string
  section_order: number
  section_title: string
  prayer_text: string
  is_default_open: boolean
  is_active: boolean
}

export type PrayerDayData = {
  weekdayKey: WeekdayKey
  weekdayAr: string
  ctaTitle: string
  pageTitle: string
  sections: PrayerRow[]
  defaultOpenIndex: number
}

const AR_DAY_MAP: Record<WeekdayKey, string> = {
  sunday: "الأحد",
  monday: "الاثنين",
  tuesday: "الثلاثاء",
  wednesday: "الأربعاء",
  thursday: "الخميس",
  friday: "الجمعة",
  saturday: "السبت",
}

const JS_DAY_TO_KEY: WeekdayKey[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
]

const CSV_CACHE_KEY = "mk_daily_prayer_rows_v2"
const CSV_CACHE_TIME_KEY = "mk_daily_prayer_rows_v2_time"
const DAY_CACHE_PREFIX = "mk_daily_prayer_day_v2_"
const CSV_CACHE_TTL_MS = 1000 * 60 * 60 * 12 // 12 hours

function norm(v: any) {
  return String(v ?? "").trim()
}

function toBool(v: any, fallback = true) {
  const s = norm(v).toLowerCase()
  if (!s) return fallback
  return ["1", "true", "yes", "y", "on"].includes(s)
}

function toOrder(v: any, fallback = 999) {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

function normalizeWeekdayKey(v: any): WeekdayKey | null {
  const s = norm(v).toLowerCase()
  if (
    s === "sunday" ||
    s === "monday" ||
    s === "tuesday" ||
    s === "wednesday" ||
    s === "thursday" ||
    s === "friday" ||
    s === "saturday"
  ) {
    return s
  }
  return null
}

export function getTodayWeekdayKey(date = new Date()): WeekdayKey {
  return JS_DAY_TO_KEY[date.getDay()]
}

export function getWeekdayKeyFromISO(dateISO?: string): WeekdayKey {
  if (!dateISO) return getTodayWeekdayKey()

  const safe = String(dateISO).substring(0, 10)
  const d = new Date(`${safe}T12:00:00`)

  if (Number.isNaN(d.getTime())) return getTodayWeekdayKey()
  return getTodayWeekdayKey(d)
}

export function getArabicWeekdayName(key: WeekdayKey): string {
  return AR_DAY_MAP[key]
}

export function getDefaultCtaTitle(key: WeekdayKey) {
  return `صلاة يوم ${getArabicWeekdayName(key)}`
}

export function getDefaultPageTitle(key: WeekdayKey) {
  return `صلاة يوم ${getArabicWeekdayName(key)}`
}

function getDayCacheKey(weekdayKey: WeekdayKey) {
  return `${DAY_CACHE_PREFIX}${weekdayKey}`
}

function readCsvCache(): PrayerRow[] | null {
  try {
    const raw = localStorage.getItem(CSV_CACHE_KEY)
    const rawTime = localStorage.getItem(CSV_CACHE_TIME_KEY)

    if (!raw || !rawTime) return null

    const savedAt = Number(rawTime)
    if (!Number.isFinite(savedAt)) return null

    const expired = Date.now() - savedAt > CSV_CACHE_TTL_MS
    if (expired) return null

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return null

    return parsed as PrayerRow[]
  } catch {
    return null
  }
}

function writeCsvCache(rows: PrayerRow[]) {
  try {
    localStorage.setItem(CSV_CACHE_KEY, JSON.stringify(rows))
    localStorage.setItem(CSV_CACHE_TIME_KEY, String(Date.now()))
  } catch {
    // ignore storage errors
  }
}

function readDayCache(weekdayKey: WeekdayKey): PrayerDayData | null {
  try {
    const raw = localStorage.getItem(getDayCacheKey(weekdayKey))
    if (!raw) return null

    const parsed = JSON.parse(raw)
    return {
      weekdayKey: normalizeWeekdayKey(parsed?.weekdayKey) || weekdayKey,
      weekdayAr: norm(parsed?.weekdayAr) || getArabicWeekdayName(weekdayKey),
      ctaTitle: norm(parsed?.ctaTitle) || getDefaultCtaTitle(weekdayKey),
      pageTitle: norm(parsed?.pageTitle) || getDefaultPageTitle(weekdayKey),
      sections: Array.isArray(parsed?.sections) ? parsed.sections : [],
      defaultOpenIndex: Number.isFinite(parsed?.defaultOpenIndex)
        ? parsed.defaultOpenIndex
        : -1,
    }
  } catch {
    return null
  }
}

function writeDayCache(weekdayKey: WeekdayKey, data: PrayerDayData) {
  try {
    localStorage.setItem(getDayCacheKey(weekdayKey), JSON.stringify(data))
  } catch {
    // ignore storage errors
  }
}

export function clearDailyPrayerNewCache() {
  try {
    localStorage.removeItem(CSV_CACHE_KEY)
    localStorage.removeItem(CSV_CACHE_TIME_KEY)

    for (const key of JS_DAY_TO_KEY) {
      localStorage.removeItem(getDayCacheKey(key))
    }
  } catch {
    // ignore
  }
}

function buildPrayerDayData(allRows: PrayerRow[], weekdayKey: WeekdayKey): PrayerDayData {
  const dayRows = allRows
    .filter((r) => r.weekday_key === weekdayKey && r.is_active)
    .sort((a, b) => a.section_order - b.section_order)

  const weekdayAr = getArabicWeekdayName(weekdayKey)

  const ctaTitle = dayRows[0]?.cta_title || `صلاة يوم ${weekdayAr}`
  const pageTitle = dayRows[0]?.page_title || `صلاة يوم ${weekdayAr}`

  let defaultOpenIndex = dayRows.findIndex((r) => r.is_default_open)
  if (defaultOpenIndex < 0) defaultOpenIndex = dayRows.length ? 0 : -1

  return {
    weekdayKey,
    weekdayAr,
    ctaTitle,
    pageTitle,
    sections: dayRows,
    defaultOpenIndex,
  }
}

export async function fetchDailyPrayerRows(forceRefresh = false): Promise<PrayerRow[]> {
  if (!forceRefresh) {
    const cached = readCsvCache()
    if (cached) return cached
  }

  const res = await fetch(DAILY_PRAYER_CSV_URL, { cache: "no-store" })
  if (!res.ok) throw new Error("Failed to fetch daily prayer CSV")

  const csv = await res.text()

  const parsed = Papa.parse<Record<string, string>>(csv, {
    header: true,
    skipEmptyLines: true,
  })

  const rows: PrayerRow[] = []

  for (const raw of parsed.data || []) {
    const weekdayKey = normalizeWeekdayKey(raw.weekday_key)
    if (!weekdayKey) continue

    const weekdayAr = norm(raw.weekday_ar) || getArabicWeekdayName(weekdayKey)
    const ctaTitle = norm(raw.cta_title) || `صلاة يوم ${weekdayAr}`
    const pageTitle = norm(raw.page_title) || `صلاة يوم ${weekdayAr}`

    const sectionTitle =
      norm(raw.section_title) || `عنوان الصلاة ${toOrder(raw.section_order, rows.length + 1)}`
    const prayerText = norm(raw.prayer_text) || "نص الصلاة غير متوفر حالياً."
    const sectionOrder = toOrder(raw.section_order, rows.length + 1)

    const isDefaultOpen = toBool(raw.is_default_open, false)
    const isActive = toBool(raw.is_active, true)

    rows.push({
      weekday_key: weekdayKey,
      weekday_ar: weekdayAr,
      cta_title: ctaTitle,
      page_title: pageTitle,
      section_order: sectionOrder,
      section_title: sectionTitle,
      prayer_text: prayerText,
      is_default_open: isDefaultOpen,
      is_active: isActive,
    })
  }

  writeCsvCache(rows)

  return rows
}

export async function fetchPrayerForWeekdayNew(
  weekdayKey: WeekdayKey,
  forceRefresh = false
): Promise<PrayerDayData> {
  if (!forceRefresh) {
    const cached = readDayCache(weekdayKey)
    if (cached) return cached
  }

  const allRows = await fetchDailyPrayerRows(forceRefresh)
  const result = buildPrayerDayData(allRows, weekdayKey)

  writeDayCache(weekdayKey, result)

  return result
}