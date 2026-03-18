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

export function getArabicWeekdayName(key: WeekdayKey): string {
  return AR_DAY_MAP[key]
}

export function getDefaultCtaTitle(key: WeekdayKey) {
  return `صلاة يوم ${getArabicWeekdayName(key)}`
}

export function getDefaultPageTitle(key: WeekdayKey) {
  return `صلاة يوم ${getArabicWeekdayName(key)}`
}

export async function fetchDailyPrayerRows(): Promise<PrayerRow[]> {
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

  return rows
}

export async function fetchPrayerForWeekday(weekdayKey: WeekdayKey) {
  const allRows = await fetchDailyPrayerRows()

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