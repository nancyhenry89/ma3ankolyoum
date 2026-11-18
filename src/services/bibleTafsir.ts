import Papa from 'papaparse'
import { readTafsirCache, writeTafsirCache } from '@/utils/chapterCache'

const TAFSIR_CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vQUoB2kNCIAvyniIzgd0mm8gmkTJRMTOu_KqELNFCuOexpimx4C12-J4zyenmRmjmXm50T1O1t-fGw2/pub?gid=0&single=true&output=csv'

type TafsirRow = {
  bookKey: string
  chapter: number
  fromVerse: number
  toVerse: number
  tafsir: string
}

let sheetRequest: Promise<TafsirRow[]> | undefined

async function fetchTafsirRows(): Promise<TafsirRow[]> {
  const response = await fetch(TAFSIR_CSV_URL, { cache: 'no-store' })

  if (!response.ok) {
    throw new Error(`Could not load tafsir: HTTP ${response.status}`)
  }

  const { data, meta } = Papa.parse<Record<string, string>>(
    await response.text(),
    {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: header =>
        header.replace(/^\uFEFF/, '').trim().toLowerCase().replace(/\s+/g, '_'),
    },
  )

  const requiredColumns = ['bookkey', 'chapter', 'fromverse', 'toverse', 'tafsir']
  if (!requiredColumns.every(column => meta.fields?.includes(column))) {
    throw new Error('Invalid tafsir sheet headers')
  }

  return data
    .map(row => ({
      bookKey: (row.bookkey ?? '').trim().toLowerCase(),
      chapter: Number(row.chapter),
      fromVerse: Number(row.fromverse),
      toVerse: Number(row.toverse),
      tafsir: (row.tafsir ?? '').trim(),
    }))
    .filter(row =>
      row.bookKey &&
      Number.isInteger(row.chapter) &&
      row.chapter > 0 &&
      Number.isInteger(row.fromVerse) &&
      row.fromVerse > 0 &&
      Number.isInteger(row.toVerse) &&
      row.toVerse >= row.fromVerse,
    )
}

export async function getVerseTafsir(
  bookKey: string,
  chapter: number,
  verse: number,
): Promise<string | null> {
  const normalizedKey = bookKey.trim().toLowerCase()
  const cached = readTafsirCache(bookKey, chapter)
    ?? readTafsirCache(normalizedKey, chapter)

  let rows: TafsirRow[]

  if (Array.isArray(cached) && cached.length > 0) {
    rows = cached
  } else {
    const allRows = await (sheetRequest ??= fetchTafsirRows().catch(error => {
      sheetRequest = undefined
      throw error
    }))

    rows = allRows.filter(row =>
      row.bookKey === normalizedKey && row.chapter === chapter,
    )

    writeTafsirCache(normalizedKey, chapter, rows)
  }

  const match = rows.find(row =>
    verse >= Number(row.fromVerse) && verse <= Number(row.toVerse),
  )

  return match?.tafsir?.trim() || null
}