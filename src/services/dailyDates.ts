import Papa from 'papaparse'
import {
  getDailySource,
  type ContentLanguage,
} from '@/config/dailySources'

export interface DailyDates {
  dateISO: string
  gregorian: string
  coptic: string
}

type CsvRow = Record<string, string>

const cachedRows = new Map<string, CsvRow[]>()
const pendingRequests = new Map<string, Promise<CsvRow[]>>()

function clean(value: unknown): string {
  return String(value ?? '').trim()
}

function pick(row: CsvRow, ...keys: string[]): string {
  for (const key of keys) {
    const value = clean(row[key])
    if (value) return value
  }

  return ''
}

async function fetchRows(url: string): Promise<CsvRow[]> {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Daily dates loading failed: ${response.status}`)
  }

  const csv = await response.text()

  const parsed = Papa.parse<CsvRow>(csv, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: header =>
      header
        .replace(/^\uFEFF/, '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '_'),
  })

  if (!parsed.meta.fields?.includes('date_iso')) {
    throw new Error('Daily content CSV is missing date_iso')
  }

  if (parsed.errors.length > 0) {
    throw new Error(
      `Daily content CSV could not be parsed: ${parsed.errors[0].message}`,
    )
  }

  return parsed.data.filter(row => clean(row.date_iso))
}

async function loadRows(url: string): Promise<CsvRow[]> {
  const cached = cachedRows.get(url)
  if (cached) return cached

  const pending = pendingRequests.get(url)
  if (pending) return pending

  const request = fetchRows(url)
  pendingRequests.set(url, request)

  try {
    const rows = await request
    cachedRows.set(url, rows)
    return rows
  } finally {
    pendingRequests.delete(url)
  }
}

export async function getDailyDates(
  dateISO: string,
  language: ContentLanguage,
): Promise<DailyDates | null> {
  const url = getDailySource(dateISO, language)
  if (!url) return null

  const rows = await loadRows(url)

  const row = rows.find(
    item => clean(item.date_iso).substring(0, 10) === dateISO,
  )

  if (!row) return null

  return {
    dateISO,
    gregorian: pick(row, 'gregorian', 'gregorian_date'),
    coptic: pick(row, 'coptic', 'coptic_date'),
  }
}