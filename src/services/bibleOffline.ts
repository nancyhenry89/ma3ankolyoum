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
  return String(bookKey || '').trim().toLowerCase()
}

function chapterUrl(item: BibleManifestItem) {
  return `${CONTENT_BASE}/${item.path}`
}

function isValidChapter(json: any) {
  return (
    json &&
    Array.isArray(json.verses) &&
    json.verses.length > 0
  )
}

async function fetchManifest(): Promise<BibleManifest | null> {
  try {
    const res = await fetch(
      `${CONTENT_BASE}/bible/manifest.json?t=${Date.now()}`,
      { cache: 'no-store' }
    )

    if (!res.ok) throw new Error(`Manifest HTTP ${res.status}`)

    const json = await res.json()

    if (!json || !Array.isArray(json.chapters)) {
      throw new Error('Invalid manifest')
    }

    manifestMemory = json

    try {
      localStorage.setItem(
        'mk_bible_manifest_v2',
        JSON.stringify(json)
      )
    } catch {}

    return json
  } catch (e) {
    console.warn('Manifest network load failed', e)

    try {
      const cached =
        localStorage.getItem('mk_bible_manifest_v2')

      return cached ? JSON.parse(cached) : null
    } catch {
      return null
    }
  }
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
  const url = `${chapterUrl(item)}?h=${encodeURIComponent(item.hash)}`

  const res = await fetch(url, {
    cache: 'no-store'
  })

  if (!res.ok) {
    throw new Error(`Chapter HTTP ${res.status}`)
  }

  const json = await res.json()

  if (!isValidChapter(json)) {
    throw new Error('Invalid chapter JSON')
  }

  // Only save AFTER we know the JSON is valid
  writeChapterCache(
    item.bookSlug,
    item.chapter,
    json
  )

  writeChapterHash(
    item.bookSlug,
    item.chapter,
    item.hash
  )

  return json
}

/**
 * FAST / OFFLINE FIRST
 *
 * If chapter exists locally, return immediately.
 * Do NOT wait for network.
 */
export async function getBibleChapter(
  bookKey: string,
  chapter: number
) {
  const cached =
    readChapterCache(bookKey, chapter)

  if (cached && isValidChapter(cached)) {
    return cached
  }

  // No local copy -> must try network
  const manifest = await fetchManifest()

  const item =
    findManifestItem(
      manifest,
      bookKey,
      chapter
    )

  if (!item) {
    throw new Error('Chapter not available')
  }

  return await downloadChapter(item)
}

/**
 * BACKGROUND UPDATE
 *
 * Checks server manifest.
 * Downloads only if chapter changed.
 *
 * Returns:
 * - updated JSON if changed
 * - null if nothing changed / offline
 */
export async function updateBibleChapter(
  bookKey: string,
  chapter: number
) {
  try {
    const manifest = await fetchManifest()

    if (!manifest) return null

    const item =
      findManifestItem(
        manifest,
        bookKey,
        chapter
      )

    if (!item) return null

    const cached =
      readChapterCache(bookKey, chapter)

    const localHash =
      readChapterHash(bookKey, chapter)

    if (
      cached &&
      isValidChapter(cached) &&
      localHash === item.hash
    ) {
      return null
    }

    return await downloadChapter(item)
  } catch (e) {
    // Background update failure should NEVER
    // break reading.
    console.warn(
      'Bible background update failed',
      bookKey,
      chapter,
      e
    )

    return null
  }
}

export async function isChapterAvailableOfflineAware(
  bookKey: string,
  chapter: number
) {
  const cached =
    readChapterCache(bookKey, chapter)

  if (cached && isValidChapter(cached)) {
    return true
  }

  try {
    const manifest = await fetchManifest()

    return !!findManifestItem(
      manifest,
      bookKey,
      chapter
    )
  } catch {
    return false
  }
}
export async function syncBibleOffline() {
  try {
    const manifest = await fetchManifest()
    if (!manifest) return

    for (const item of manifest.chapters) {
      const cached = readChapterCache(
        item.bookSlug,
        item.chapter
      )

      const localHash = readChapterHash(
        item.bookSlug,
        item.chapter
      )

      // Already downloaded and current
      if (
        cached &&
        isValidChapter(cached) &&
        localHash === item.hash
      ) {
        continue
      }

      try {
        await downloadChapter(item)
      } catch (e) {
        console.warn(
          'Failed to cache chapter',
          item.key,
          e
        )
      }
    }
  } catch (e) {
    console.warn('Bible offline sync failed', e)
  }
}