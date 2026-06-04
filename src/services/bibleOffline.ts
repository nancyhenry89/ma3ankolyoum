import { Capacitor } from '@capacitor/core'
import {
  readChapterCache,
  writeChapterCache,
  readChapterHash,
  writeChapterHash
} from '@/utils/chapterCache'

const CONTENT_BASE =
  import.meta.env.DEV
    ? `${import.meta.env.BASE_URL}content`.replace(/\/$/, '')
    : 'https://nancyhenry89.github.io/ma3ankolyoum/content'
    console.log('CONTENT_BASE:', CONTENT_BASE)
    console.log('MANIFEST:', `${CONTENT_BASE}/bible/manifest.json`)
type BibleManifestItem = {
  key: string
  bookSlug: string
  chapter: number
  path: string
  hash: string
}

type BibleManifest = {
  generatedAt: string
  chapters: BibleManifestItem[]
}

let manifestMemory: BibleManifest | null = null

function normalizeBookKey(bookKey: string) {
  return String(bookKey || '').toLowerCase()
}

function chapterUrl(item: BibleManifestItem) {
  return `${CONTENT_BASE}/${item.path}`
}

async function fetchManifest(): Promise<BibleManifest | null> {
  try {
    const res = await fetch(`${CONTENT_BASE}/bible/manifest.json`, {
      cache: 'no-store'
    })

    if (!res.ok) return null

    const json = await res.json()
    if (!json || !Array.isArray(json.chapters)) return null

    manifestMemory = json
    localStorage.setItem('mk_bible_manifest_v1', JSON.stringify(json))

    return json
  } catch {
    try {
      const cached = localStorage.getItem('mk_bible_manifest_v1')
      return cached ? JSON.parse(cached) : null
    } catch {
      return null
    }
  }
}

async function getManifest() {
  if (manifestMemory) return manifestMemory
  return await fetchManifest()
}

function findManifestItem(
  manifest: BibleManifest | null,
  bookKey: string,
  chapter: number
) {
  if (!manifest) return null

  const slug = normalizeBookKey(bookKey)

  return (
    manifest.chapters.find(
      item =>
        normalizeBookKey(item.bookSlug) === slug &&
        Number(item.chapter) === Number(chapter)
    ) || null
  )
}

async function downloadChapter(item: BibleManifestItem) {
  const res = await fetch(chapterUrl(item), { cache: 'no-store' })
  if (!res.ok) throw new Error('Chapter not found')

  const json = await res.json()

  if (!json || !Array.isArray(json.verses)) {
    throw new Error('Invalid chapter JSON')
  }

  writeChapterCache(item.bookSlug, item.chapter, json)
  writeChapterHash(item.bookSlug, item.chapter, item.hash)

  return json
}

export async function getBibleChapter(bookKey: string, chapter: number) {
  const cached = readChapterCache(bookKey, chapter)

  const manifest = await fetchManifest()
  const item = findManifestItem(manifest, bookKey, chapter)

  // offline or manifest missing
  if (!item) {
    if (cached) return cached
    throw new Error('Chapter not available')
  }

  const localHash = readChapterHash(bookKey, chapter)

  // show cached if same version
  if (cached && localHash === item.hash) {
    return cached
  }

  // missing or outdated
  try {
    return await downloadChapter(item)
  } catch (e) {
    if (cached) return cached
    throw e
  }
}

export async function syncBibleOffline() {
  const manifest = await fetchManifest()
  if (!manifest) return

  for (const item of manifest.chapters) {
    const cached = readChapterCache(item.bookSlug, item.chapter)
    const localHash = readChapterHash(item.bookSlug, item.chapter)

    if (cached && localHash === item.hash) continue

    try {
      await downloadChapter(item)
    } catch (e) {
      console.warn('Failed to cache chapter', item.key, e)
    }
  }
}

export async function isChapterAvailableOfflineAware(bookKey: string, chapter: number) {
  const cached = readChapterCache(bookKey, chapter)
  if (cached) return true

  const manifest = await getManifest()
  return !!findManifestItem(manifest, bookKey, chapter)
}