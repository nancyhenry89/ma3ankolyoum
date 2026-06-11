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
  testement?: string
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
      const testement = String(
        pick(r, 'testement', 'testament')
      ).trim().toLowerCase()
      
      return {
        name,
        type,
        youtubeId,
        order,
        testement
      }
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




/* =========================
   4) Conferences sheets
========================= */

export type ConferenceRow = {
  conference_id: string
  title: string
  subtitle: string
  logo_url: string
  code: string
  password: string
  status: 'upcoming' | 'live' | 'ended' | 'archived' | string
  start_date: string
  end_date: string
  allow_questions: boolean
  allow_replies: boolean
}

export type ConferenceScheduleRow = {
  conference_id: string
  day: string
  start_time: string
  end_time: string
  start_ampm: string
  end_ampm: string
  ampm: string
  title: string
  speaker: string
  location: string
}

export type ConferenceAnnouncementRow = {
  conference_id: string
  id: string
  title: string
  body: string
  pinned: boolean
}

export type ConferenceBibleStudyRow = {
  conference_id: string
  id: string
  title: string
  verses: string
  rich_text: string
}

export type ConferenceQuoteRow = {
  conference_id: string
  id: string
  text: string
  author: string
}

export type ConferenceLinkRow = {
  conference_id: string
  title: string
  type: string
  url: string
}

export type ConferenceRecordingRow = {
  conference_id: string
  title: string
  speaker: string
  audio_url: string
}

function toBool(v: any): boolean {
  const s = String(v ?? '').trim().toLowerCase()
  return s === 'true' || s === '1' || s === 'yes' || s === 'y'
}

async function fetchCsvRows(csvUrl: string, force = false): Promise<any[]> {
  const res = await fetch(csvUrl, {
    cache: force ? 'no-store' : 'default'
  })

  if (!res.ok) {
    throw new Error(`CSV fetch failed: ${res.status}`)
  }

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

  return (parsed.data || []).map((raw: any) => normalizeKeys(raw))
}

/**
 * Replace these gid numbers with your real tab gid values.
 */
const CONFERENCE_BASE =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_LP5XkWyOOYnRgJjVnfKCK0dG7JM3Tf2ql5IqNk9rfKeYHX-DkX43lhp8QW6_M8qOblK2LZUzPn5-/pub'
  export const CONFERENCE_SHEETS = {
    conferences:
      `${CONFERENCE_BASE}?gid=0&single=true&output=csv`,
  
    schedule:
      `${CONFERENCE_BASE}?gid=1569604923&single=true&output=csv`,
  
    announcements:
      `${CONFERENCE_BASE}?gid=125958145&single=true&output=csv`,
  
    bibleStudies:
      `${CONFERENCE_BASE}?gid=1631359971&single=true&output=csv`,
  
    quotes:
      `${CONFERENCE_BASE}?gid=1185059986&single=true&output=csv`,
  
    links:
      `${CONFERENCE_BASE}?gid=1422873337&single=true&output=csv`,
  
    recordings:
      `${CONFERENCE_BASE}?gid=2145785457&single=true&output=csv`,
  }

let conferencesCache: ConferenceRow[] | null = null

export async function fetchConferences(force = false): Promise<ConferenceRow[]> {
  if (!force && conferencesCache) return conferencesCache

  const rows = await fetchCsvRows(CONFERENCE_SHEETS.conferences, force)

  const mapped: ConferenceRow[] = rows
    .map((r: any) => ({
      conference_id: pick(r, 'conference_id', 'id'),
      title: pick(r, 'title'),
      subtitle: pick(r, 'subtitle'),
      logo_url: pick(r, 'logo_url', 'logo'),
      code: pick(r, 'code', 'access_code'),
      password: pick(r, 'password', 'pass'),
      status: pick(r, 'status') || 'live',
      start_date: toISO10(pick(r, 'start_date')),
      end_date: toISO10(pick(r, 'end_date')),
      allow_questions: toBool(pick(r, 'allow_questions')),
      allow_replies: toBool(pick(r, 'allow_replies')),
    }))
    .filter((r) => r.conference_id && r.code && r.password)

  conferencesCache = mapped
  return mapped
}

export async function findConferenceByAccess(
  code: string,
  password: string
): Promise<ConferenceRow | null> {
  const rows = await fetchConferences(true)

  return (
    rows.find(
      (c) =>
        c.code.trim().toLowerCase() === code.trim().toLowerCase() &&
        c.password.trim() === password.trim()
    ) || null
  )
}

export async function fetchConferenceSchedule(
  conferenceId: string,
  force = false
): Promise<ConferenceScheduleRow[]> {
  const rows = await fetchCsvRows(CONFERENCE_SHEETS.schedule, force)

  return rows
  .map((r: any) => ({
    conference_id: pick(r, 'conference_id'),
    day: pick(r, 'day', 'date'),
    start_time: pick(r, 'start_time', 'start'),
    end_time: pick(r, 'end_time', 'end'),
    start_ampm: pick(r, 'start_ampm', 'start_period'),
    end_ampm: pick(r, 'end_ampm', 'end_period'),
    ampm: pick(r, 'ampm', 'ap', 'period'),
    title: pick(r, 'title'),
    speaker: pick(r, 'speaker'),
    location: pick(r, 'location'),
  }))
    .filter((r) => r.conference_id === conferenceId)
}

export async function fetchConferenceAnnouncements(
  conferenceId: string,
  force = false
): Promise<ConferenceAnnouncementRow[]> {
  const rows = await fetchCsvRows(CONFERENCE_SHEETS.announcements, force)

  return rows
    .map((r: any) => ({
      conference_id: pick(r, 'conference_id'),
      id: pick(r, 'id'),
      title: pick(r, 'title'),
      body: pick(r, 'body', 'text'),
      pinned: toBool(pick(r, 'pinned')),
    }))
    .filter((r) => r.conference_id === conferenceId)
}

export async function fetchConferenceBibleStudies(
  conferenceId: string,
  force = false
): Promise<ConferenceBibleStudyRow[]> {
  const rows = await fetchCsvRows(CONFERENCE_SHEETS.bibleStudies, force)

  return rows
    .map((r: any) => ({
      conference_id: pick(r, 'conference_id'),
      id: pick(r, 'id'),
      title: pick(r, 'title'),
      verses: pick(r, 'verses'),
      rich_text: pick(r, 'rich_text', 'content'),
    }))
    .filter((r) => r.conference_id === conferenceId)
}

export async function fetchConferenceQuotes(
  conferenceId: string,
  force = false
): Promise<ConferenceQuoteRow[]> {
  const rows = await fetchCsvRows(CONFERENCE_SHEETS.quotes, force)

  return rows
    .map((r: any) => ({
      conference_id: pick(r, 'conference_id'),
      id: pick(r, 'id'),
      text: pick(r, 'text', 'quote'),
      author: pick(r, 'author'),
    }))
    .filter((r) => r.conference_id === conferenceId)
}

export async function fetchConferenceLinks(
  conferenceId: string,
  force = false
): Promise<ConferenceLinkRow[]> {
  const rows = await fetchCsvRows(CONFERENCE_SHEETS.links, force)

  return rows
    .map((r: any) => ({
      conference_id: pick(r, 'conference_id'),
      title: pick(r, 'title'),
      type: pick(r, 'type'),
      url: pick(r, 'url', 'link'),
    }))
    .filter((r) => r.conference_id === conferenceId)
}

export async function fetchConferenceRecordings(
  conferenceId: string,
  force = false
): Promise<ConferenceRecordingRow[]> {
  const rows = await fetchCsvRows(CONFERENCE_SHEETS.recordings, force)

  return rows
    .map((r: any) => ({
      conference_id: pick(r, 'conference_id'),
      title: pick(r, 'title'),
      speaker: pick(r, 'speaker'),
      audio_url: pick(r, 'audio_url', 'url'),
    }))
    .filter((r) => r.conference_id === conferenceId)
}