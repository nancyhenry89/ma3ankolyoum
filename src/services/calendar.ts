import Papa from 'papaparse'
import {
  CALENDAR_CSV_URL,
  DAY_THEMES,
  type CalendarDay,
  type DayTheme,
  type FastingStatus,
} from '@/config/calendar'

type CsvRow = Record<string, string>

let cachedDays: Map<string, CalendarDay> | null = null
let pendingRequest: Promise<Map<string, CalendarDay>> | null = null

function text(value: unknown): string {
  return String(value ?? '').trim()
}

function parseYesNo(value: unknown): boolean | null {
  const normalized = text(value).toLowerCase()

  if (normalized === 'yes') return true
  if (normalized === 'no') return false

  return null
}

function parseStatus(value: unknown): FastingStatus | null {
  const normalized = text(value).toLowerCase()

  if (normalized === 'fasting' || normalized === 'non-fasting') {
    return normalized
  }

  return null
}

function parseTheme(value: unknown): DayTheme {
  const normalized = text(value).toLowerCase()

  return DAY_THEMES.includes(normalized as DayTheme)
    ? (normalized as DayTheme)
    : 'normal'
}

async function fetchCalendar(): Promise<Map<string, CalendarDay>> {
  const response = await fetch(CALENDAR_CSV_URL)

  if (!response.ok) {
    throw new Error(`Calendar loading failed: ${response.status}`)
  }

  const csv = await response.text()

  const result = Papa.parse<CsvRow>(csv, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: header => header.replace(/^\uFEFF/, '').trim(),
  })

  const requiredHeaders = [
    'date_iso',
    'fasting_status',
    'theme',
  ]

  if (
    !requiredHeaders.every(header =>
      result.meta.fields?.includes(header),
    )
  ) {
    throw new Error('Calendar CSV is missing required columns')
  }

  if (result.errors.length > 0) {
    throw new Error(
      `Calendar CSV could not be parsed: ${result.errors[0].message}`,
    )
  }

  const days = new Map<string, CalendarDay>()

  for (const row of result.data) {
    const dateISO = text(row.date_iso)

    // Ignore blank rows, but reject incorrectly formatted dates.
    if (!dateISO) continue

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateISO)) {
      throw new Error(`Invalid calendar date format: ${dateISO}`)
    }

    if (days.has(dateISO)) {
      throw new Error(`Duplicate calendar date: ${dateISO}`)
    }

    days.set(dateISO, {
      dateISO,
      fastingStatus: parseStatus(row.fasting_status),
      fastingName: {
        ar: text(row.fasting_name_ar),
        en: text(row.fasting_name_en),
      },
      abstinence: parseYesNo(row.abstinence),
      fishAllowed: parseYesNo(row.fish_allowed),
      prayerTune: {
        ar: text(row.prayer_tune_ar),
        en: text(row.prayer_tune_en),
      },
      reflection: {
        ar: text(row.reflection_ar),
        en: text(row.reflection_en),
      },
      theme: parseTheme(row.theme),
    })
  }

  return days
}

export async function loadCalendar(
  forceRefresh = false,
): Promise<Map<string, CalendarDay>> {
  if (pendingRequest) return pendingRequest
  if (cachedDays && !forceRefresh) return cachedDays

  pendingRequest = fetchCalendar()

  try {
    cachedDays = await pendingRequest
    return cachedDays
  } finally {
    pendingRequest = null
  }
}

export async function getCalendarDay(
  dateISO: string,
): Promise<CalendarDay | null> {
  const days = await loadCalendar()
  return days.get(dateISO) ?? null
}