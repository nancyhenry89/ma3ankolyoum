// src/utils/chapterCache.ts
const CACHE_VERSION = 'v1'
const TTL = 1000 * 60 * 60 * 24 * 14 // 14 يوم

function chapterKey(bookKey: string, chapter: number) {
  return `mk_chapter_${CACHE_VERSION}_${bookKey}_${chapter}`
}

function tafsirKey() {
  return `mk_tafsir_${CACHE_VERSION}`
}
const TAFSIR_PREFIX = 'mk_tafsir_v1:'
const CH_PREFIX = 'mk_ch_v1:'

export function readChapterCache(bookKey: string, chapter: number) {
  try {
    const k = `${CH_PREFIX}${bookKey}:${chapter}`
    const raw = localStorage.getItem(k)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function writeChapterCache(bookKey: string, chapter: number, json: any) {
  try {
    const k = `${CH_PREFIX}${bookKey}:${chapter}`
    localStorage.setItem(k, JSON.stringify(json))
  } catch {}
}

export function readTafsirCache(bookKey: string, chapter: number) {
  try {
    const k = `${TAFSIR_PREFIX}${bookKey}:${chapter}`
    const raw = localStorage.getItem(k)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function writeTafsirCache(bookKey: string, chapter: number, rows: any[]) {
  try {
    const k = `${TAFSIR_PREFIX}${bookKey}:${chapter}`
    localStorage.setItem(k, JSON.stringify(rows))
  } catch {}
}