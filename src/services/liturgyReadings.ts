import { BOOKS, type BookDef } from '@/data/bibleBooks'
import { getBibleChapter } from '@/services/bibleOffline'
import { loadLiturgySheet } from '@/services/liturgySheet'

type ReadingKind = 'mazmour' | 'bible'

type Passage = {
  book: BookDef
  startChapter: number
  startVerse: number
  endChapter: number
  endVerse: number
}

export type LiturgyVerse = {
  bookKey: string
  chapter: number
  number: number
  text: string
}

export type LiturgyPassage = {
  reference: string
  verses: LiturgyVerse[]
  incomplete: boolean
}

const psalms = BOOKS.filter(book => book.slug === 'psalms')
const gospels = BOOKS.filter(book =>
  ['matthew', 'mark', 'luke', 'john'].includes(book.slug),
)

function normalizeDigits(value: string): string {
  return value.replace(/[٠-٩۰-۹]/g, digit => {
    const zero = digit >= '۰' ? '۰' : '٠'
    return String(digit.charCodeAt(0) - zero.charCodeAt(0))
  })
}

function parsePassages(value: string, kind: ReadingKind): Passage[] {
  const allowedBooks = kind === 'mazmour' ? psalms : gospels
  let book: BookDef | undefined = kind === 'mazmour' ? psalms[0] : undefined
  let chapter: number | undefined

  const segments = normalizeDigits(value)
    .split(/[,،;؛\n]/)
    .map(segment => segment.trim())
    .filter(Boolean)

  return segments.map(segment => {
    const match = /^(?:(.*?)\s+)?(?:(\d+)\s*:\s*)?(\d+)(?:\s*[-–—]\s*(?:(\d+)\s*:\s*)?(\d+))?$/.exec(segment)

    if (!match) throw new Error(`Invalid reading reference: ${segment}`)

    const [, name, firstChapter, firstVerse, lastChapter, lastVerse] = match

    if (name) {
      book = allowedBooks.find(item =>
        item.slug === name.toLowerCase() ||
        item.nameAr === name ||
        (kind === 'mazmour' && ['مزمور', 'مز'].includes(name)),
      )
    }

    if (firstChapter) chapter = Number(firstChapter)

    const startVerse = Number(firstVerse)
    const endChapter = lastChapter ? Number(lastChapter) : chapter
    const endVerse = lastVerse ? Number(lastVerse) : startVerse

    if (
      !book ||
      !chapter ||
      !endChapter ||
      !startVerse ||
      !endVerse ||
      chapter > endChapter ||
      endChapter > book.maxChapters ||
      (chapter === endChapter && startVerse > endVerse) ||
      (name && !firstChapter)
    ) {
      throw new Error(`Invalid reading reference: ${segment}`)
    }

    return { book, startChapter: chapter, startVerse, endChapter, endVerse }
  })
}

function formatReference(passage: Passage): string {
  const { book, startChapter, startVerse, endChapter, endVerse } = passage
  const name = book.slug === 'psalms' ? 'مزمور' : book.nameAr
  const start = `${name} ${startChapter}:${startVerse}`

  if (startChapter !== endChapter) return `${start}–${endChapter}:${endVerse}`
  if (startVerse !== endVerse) return `${start}–${endVerse}`
  return start
}

let sheetRequest: ReturnType<typeof loadLiturgySheet> | undefined

export async function getLiturgyReading(dateIso: string) {
  const rows = await (sheetRequest ??= loadLiturgySheet().catch(error => {
    sheetRequest = undefined
    throw error
  }))

  const row = rows.find(item => item.date_iso === dateIso)
  if (!row || (!row.mazmour && !row.bible)) return null

  const mazmour = parsePassages(row.mazmour, 'mazmour')
  const bible = parsePassages(row.bible, 'bible')

  return {
    mazmour,
    bible,
    gospelReference: bible.map(formatReference).join('، '),
  }
}

type ChapterVerse = { n: number; t: string }

export async function loadLiturgyPassages(
  passages: Passage[],
): Promise<LiturgyPassage[]> {
  const chapters = new Map<string, Promise<{ verses: ChapterVerse[] }>>()

  const results = await Promise.all(passages.map(async passage => {
    const { book, startChapter, startVerse, endChapter, endVerse } = passage
    const verses: LiturgyVerse[] = []
    let incomplete = false

    for (let chapter = startChapter; chapter <= endChapter; chapter++) {
      const key = `${book.key}/${chapter}`

      try {
        let pending = chapters.get(key)
        if (!pending) {
          pending = getBibleChapter(book.key, chapter)
          chapters.set(key, pending)
        }

        const data = await pending
        const from = chapter === startChapter ? startVerse : 1
        const to = chapter === endChapter ? endVerse : Infinity
        const chapterVerses = data.verses.filter(verse =>
          Number(verse.n) >= from && Number(verse.n) <= to,
        )

        if (
          !chapterVerses.length ||
          (chapter === startChapter &&
            !chapterVerses.some(verse => Number(verse.n) === startVerse)) ||
          (chapter === endChapter &&
            !chapterVerses.some(verse => Number(verse.n) === endVerse))
        ) {
          incomplete = true
        }

        verses.push(...chapterVerses.map(verse => ({
          bookKey: book.key,
          chapter,
          number: Number(verse.n),
          text: verse.t,
        })))
      } catch {
        incomplete = true
      }
    }

    return { reference: formatReference(passage), verses, incomplete }
  }))

  const groups: LiturgyPassage[] = []

  results.forEach((result, index) => {
    const current = passages[index]
    const previous = passages[index - 1]
    const lastGroup = groups[groups.length - 1]

    const samePsalm =
      current.book.slug === 'psalms' &&
      previous?.startChapter === current.startChapter &&
      previous.endChapter === current.startChapter &&
      current.endChapter === current.startChapter

    if (samePsalm && lastGroup) {
      lastGroup.reference += `، ${result.reference}`
      lastGroup.verses.push(...result.verses)
      lastGroup.incomplete ||= result.incomplete
    } else {
      groups.push(result)
    }
  })

  return groups
}