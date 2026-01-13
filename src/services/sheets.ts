// src/services/sheets.ts
import Papa from 'papaparse'

/* =========================
   Shared helpers
========================= */

export type Lang = 'ar' | 'en'

function normalizeKeys(row: any) {
  const out: Record<string, any> = {}
  Object.keys(row || {}).forEach((k) => {
    const cleanedKey = String(k)
      .replace(/^\uFEFF/, '') // remove BOM if present
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_')

    out[cleanedKey] = row[k]
  })
  return out
}

function toISO10(v: any) {
  return String(v || '').trim().substring(0, 10)
}

function toInt(v: any, fallback = 0) {
  const n = parseInt(String(v ?? '').trim(), 10)
  return Number.isFinite(n) ? n : fallback
}

function pick(row: any, ...keys: string[]) {
  for (const k of keys) {
    const v = row?.[k]
    if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim()
  }
  return ''
}

/** Extract a clean YouTube video id from:
 * - "nNb9T3-XYoc"
 * - https://www.youtube.com/watch?v=nNb9T3-XYoc
 * - https://youtu.be/nNb9T3-XYoc
 * - https://www.youtube.com/shorts/nNb9T3-XYoc
 * - https://www.youtube.com/embed/nNb9T3-XYoc
 */
function extractYouTubeId(input: any): string {
  const s = String(input ?? '').trim()
  if (!s) return ''

  // Already looks like an ID (no url parts)
  if (!s.includes('http') && !s.includes('/') && !s.includes('v=')) {
    return s
  }

  try {
    const url = new URL(s)

    // watch?v=ID
    const v = url.searchParams.get('v')
    if (v) return v.trim()

    // youtu.be/ID
    if (url.hostname.includes('youtu.be')) {
      const id = url.pathname.split('/').filter(Boolean)[0]
      return (id || '').trim()
    }

    // /shorts/ID or /embed/ID
    const parts = url.pathname.split('/').filter(Boolean)

    const shortsIndex = parts.indexOf('shorts')
    if (shortsIndex >= 0 && parts[shortsIndex + 1]) return parts[shortsIndex + 1].trim()

    const embedIndex = parts.indexOf('embed')
    if (embedIndex >= 0 && parts[embedIndex + 1]) return parts[embedIndex + 1].trim()

    // fallback: last path segment
    const last = parts[parts.length - 1]
    return (last || '').trim()
  } catch {
    // Not a valid URL, try regex fallbacks
    const m = s.match(/[?&]v=([^&]+)/)
    if (m?.[1]) return m[1].trim()

    const m2 = s.match(/youtu\.be\/([^?&/]+)/)
    if (m2?.[1]) return m2[1].trim()

    return s
  }
}

/* =========================
   1) Coptic words sheet
========================= */

export type CopticWordRow = {
    date_iso: string
    coptic_word: string
    arabic_word: string
    english_word: string
    coptic_audio: string
  }
  
  const COPTIC_WORDS_CSV =
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vTljfbjiBccVFJpqzxoOfOe4f_zjS0MVztleuJJ0GZtNfL7aqEnDJ3gI-a5PP0x8vhMRtiQYdQYsb3E/pub?gid=0&single=true&output=csv'
  
  let copticCache: CopticWordRow[] | null = null
  
  export async function fetchCopticWords(force = false): Promise<CopticWordRow[]> {
    if (!force && copticCache) return copticCache
  
    const res = await fetch(COPTIC_WORDS_CSV, { cache: 'no-store' })
    const csv = await res.text()
  
    const parsed = Papa.parse<any>(csv, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) =>
        String(h || '')
          .replace(/\uFEFF/g, '')
          .trim()
          .toLowerCase()
          .replace(/\s+/g, '_'),
    })
  
    const rows: CopticWordRow[] = (parsed.data || [])
      .map((raw: any) => normalizeKeys(raw))
      .map((r: any) => {
        const date_iso = toISO10(pick(r, 'date_iso', 'date'))
        const coptic_word = pick(r, 'coptic_word', 'coptic')
        const arabic_word = pick(r, 'arabic_word', 'arabic')
        const english_word = pick(r, 'english_word', 'english')
        const coptic_audio = pick(r, 'coptic_audio', 'audio')
  
        return { date_iso, coptic_word, arabic_word, english_word, coptic_audio }
      })
      .filter((r) => !!r.date_iso)
  
    copticCache = rows
    return rows
  }
  
  export function filterCopticWordsUpToDate(rows: CopticWordRow[], upToISO: string) {
    const iso = toISO10(upToISO)
    return rows.filter((r) => r.date_iso <= iso)
  }
  
  export function mapCopticWordsForLang(rows: CopticWordRow[], lang: Lang) {
    return rows.map((r) => ({
      dateISO: r.date_iso,
      copticWord: r.coptic_word,
      word: lang === 'en' ? r.english_word : r.arabic_word,
      copticAudio: r.coptic_audio,
    }))
  }
  
/* =========================
   2) Bible intros + stories
   Sheet columns:
   name | type(intro/story) | youtube_id | order
========================= */

export type BibleVideoType = 'intro' | 'story'

export type BibleVideoRow = {
  name: string
  type: BibleVideoType
  youtubeId: string
  order: number
}

export const BIBLE_VIDEOS_CSV =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vRvrvqbmZ01M9A8NOXv2prRY_mq228jujjrOkt_aki15ulOCRSTEIQCXcUk7nw4S1GX0Xzo6obuCBfn/pub?gid=0&single=true&output=csv'

let bibleVideosCache: BibleVideoRow[] | null = null

/**
 * ✅ Make force the first argument so you can call:
 *    fetchBibleVideos()         -> uses cache
 *    fetchBibleVideos(true)     -> force refresh
 *    fetchBibleVideos(true, url)-> force refresh from custom url
 */
export async function fetchBibleVideos(force = false, csvUrl: string = BIBLE_VIDEOS_CSV) {
  if (!force && bibleVideosCache) return bibleVideosCache

  const res = await fetch(csvUrl, { cache: 'no-store' })
  const csv = await res.text()

  const parsed = Papa.parse<any>(csv, { header: true, skipEmptyLines: true })

  const rows: BibleVideoRow[] = (parsed.data || [])
    .map((raw: any) => normalizeKeys(raw))
    .map((r: any) => {
      const typeRaw = String(pick(r, 'type') || '').trim().toLowerCase()
      const type: BibleVideoType = typeRaw === 'intro' ? 'intro' : 'story'

      const youtubeRaw = pick(r, 'youtube_id', 'youtubeid', 'youtube', 'video_id', 'videoid')
      const youtubeId = extractYouTubeId(youtubeRaw)

      const name = pick(r, 'name', 'title')
      const order = toInt(pick(r, 'order'), 0)

      return { name, type, youtubeId, order }
    })
    .filter((r) => r.name && r.youtubeId)

  rows.sort((a, b) => (a.order - b.order) || a.name.localeCompare(b.name))

  bibleVideosCache = rows
  return rows
}

export function splitBibleVideos(rows: BibleVideoRow[]) {
  const intros = rows.filter((r) => r.type === 'intro')
  const stories = rows.filter((r) => r.type === 'story')
  return { intros, stories }
}


export type NourEpisodeRow = {
  series: string
  series_order: number
  name: string
  episode_number: number
  youtube_id: string
}

// ✅ نور العالم CSV
const NOUR_ALALAM_CSV =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vQm5pbyhWQWnZTe-EviP4duw241zgPqNhpG1uJ6oV3mbD37QDKlJxHvaykfpazDEfO4FBLqBU-3e58-/pub?gid=0&single=true&output=csv'

const NOUR_CACHE_KEY = 'mk_nour_alalam_v1'
const NOUR_CACHE_TTL_MS = 1000 * 60 * 60 * 6 // 6 ساعات (عدّليها براحتك)

function toNum(v: any) {
  const n = Number(String(v ?? '').trim())
  return Number.isFinite(n) ? n : 0
}

function cleanStr(v: any) {
  return String(v ?? '').trim()
}

export async function fetchNourAlAlam(force = false): Promise<NourEpisodeRow[]> {
  // ✅ cache (اختياري بس مفيد زي باقي الشيتات)
  if (!force) {
    try {
      const raw = localStorage.getItem(NOUR_CACHE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed?.ts && Array.isArray(parsed?.data)) {
          if (Date.now() - parsed.ts < NOUR_CACHE_TTL_MS) {
            return parsed.data as NourEpisodeRow[]
          }
        }
      }
    } catch {}
  }

  const res = await fetch(NOUR_ALALAM_CSV, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Nour CSV fetch failed: ${res.status}`)
  const csv = await res.text()

  const parsed = Papa.parse(csv, {
    header: true,
    skipEmptyLines: true
  })

  const rows = (parsed.data as any[])
    .map((r) => {
      const series = cleanStr(r.series)
      const name = cleanStr(r.name)
      const youtube_id = cleanStr(r.youtube_id)

      return {
        series,
        series_order: toNum(r.series_order),
        name,
        episode_number: toNum(r.episode_number),
        youtube_id
      } as NourEpisodeRow
    })
    .filter((r) => r.series && r.name && r.youtube_id)

  // ✅ حفظ cache
  try {
    localStorage.setItem(NOUR_CACHE_KEY, JSON.stringify({ ts: Date.now(), data: rows }))
  } catch {}

  return rows
}
