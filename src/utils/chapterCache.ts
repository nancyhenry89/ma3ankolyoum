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
const CH_PREFIX = 'mk_ch_v2:'
const CH_META_PREFIX = 'mk_ch_meta_v2:'
export function chapterCacheId(bookKey: string, chapter: number) {
  return `${String(bookKey).toLowerCase()}:${chapter}`
}

export function readChapterCache(bookKey: string, chapter: number) {
  try {
    const raw = localStorage.getItem(`${CH_PREFIX}${chapterCacheId(bookKey, chapter)}`)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}
export function writeChapterCache(bookKey: string, chapter: number, json: any) {
  try {
    localStorage.setItem(
      `${CH_PREFIX}${chapterCacheId(bookKey, chapter)}`,
      JSON.stringify(json)
    )
  } catch {}
}
export function readChapterHash(bookKey: string, chapter: number) {
  try {
    return localStorage.getItem(`${CH_META_PREFIX}${chapterCacheId(bookKey, chapter)}`) || ''
  } catch {
    return ''
  }
}
export function writeChapterHash(bookKey: string, chapter: number, hash: string) {
  try {
    localStorage.setItem(`${CH_META_PREFIX}${chapterCacheId(bookKey, chapter)}`, hash)
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