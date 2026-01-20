// src/services/verseBookmarks.ts
import { db } from '@/lib/firebase'
import {
  doc,
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  runTransaction,
  serverTimestamp
} from 'firebase/firestore'

export type VerseRef = {
  bookKey: string
  bookName: string
  chapter: number
  verse: number
  text: string
}

function getAnonId() {
  const key = 'mk_anon_id'
  let id = localStorage.getItem(key)
  if (!id) {
    id = 'anon_' + Math.random().toString(36).slice(2) + Date.now().toString(36)
    localStorage.setItem(key, id)
  }
  return id
}

function countDocId(bookKey: string, chapter: number, verse: number) {
  return `${bookKey}_${chapter}_${verse}`
}
function bookmarkDocId(anonId: string, bookKey: string, chapter: number, verse: number) {
  return `${anonId}_${bookKey}_${chapter}_${verse}`
}

export function peopleText(n: number) {
  if (n === 1) return '⭐ 1 شخص حفظ هذه الآية'
  if (n === 2) return '⭐ شخصين حفظوا هذه الآية'

  // 3..10
  if (n <= 10) return `⭐ ${n} أشخاص حفظوا هذه الآية`

  // 11+
  return `⭐ ${n} شخص حفظوا هذه الآية`
}
  
// ✅ استماع للأرقام لكل آيات الأصحاح (counts by verse)
export function listenChapterBookmarkCounts(
  bookKey: string,
  chapter: number,
  cb: (payload: { countsByVerse: Record<number, number>; meByVerse: Record<number, boolean> }) => void
) {
  const anonId = getAnonId()

  const q = query(
    collection(db, 'verse_bookmark_counts'),
    where('bookKey', '==', bookKey),
    where('chapter', '==', chapter)
  )

  return onSnapshot(q, snap => {
    const countsByVerse: Record<number, number> = {}
    const meByVerse: Record<number, boolean> = {}

    snap.forEach(d => {
      const data = (d.data() || {}) as any
      const v = Number(data.verse)
      const c = Number(data.count || 0)
      countsByVerse[v] = c

      const voters = data.voters || {}
      meByVerse[v] = !!voters[anonId]
    })

    cb({ countsByVerse, meByVerse })
  })
}

// ✅ Top verses في الأصحاح
export function listenTopBookmarkedVerses(
  bookKey: string,
  chapter: number,
  topN: number,
  cb: (items: { verse: number; count: number }[]) => void
) {
  const q = query(
    collection(db, 'verse_bookmark_counts'),
    where('bookKey', '==', bookKey),
    where('chapter', '==', chapter),
    orderBy('count', 'desc'),
    limit(topN)
  )

  return onSnapshot(q, snap => {
    const items: { verse: number; count: number }[] = []
    snap.forEach(d => {
      const data = (d.data() || {}) as any
      items.push({ verse: Number(data.verse), count: Number(data.count || 0) })
    })
    cb(items)
  })
}

// ✅ Toggle bookmark (MVP: نفس reactions: voters map + count)
export async function toggleVerseBookmark(v: VerseRef) {
  const anonId = getAnonId()

  const cRef = doc(db, 'verse_bookmark_counts', countDocId(v.bookKey, v.chapter, v.verse))
  const bRef = doc(db, 'verse_bookmarks', bookmarkDocId(anonId, v.bookKey, v.chapter, v.verse))

  await runTransaction(db, async tx => {
    const cSnap = await tx.get(cRef)
    const cData = (cSnap.exists() ? cSnap.data() : {}) as any

    const voters = { ...(cData.voters || {}) }
    const count = Number(cData.count || 0)

    const already = !!voters[anonId]

    if (already) {
      // remove
      voters[anonId] = false
      tx.set(
        cRef,
        {
          bookKey: v.bookKey,
          chapter: v.chapter,
          verse: v.verse,
          count: Math.max(0, count - 1),
          voters,
          updatedAt: serverTimestamp()
        },
        { merge: true }
      )
      tx.delete(bRef)
    } else {
      // add
      voters[anonId] = true
      tx.set(
        cRef,
        {
          bookKey: v.bookKey,
          chapter: v.chapter,
          verse: v.verse,
          count: count + 1,
          voters,
          updatedAt: serverTimestamp()
        },
        { merge: true }
      )
      tx.set(
        bRef,
        {
          anonId,
          bookKey: v.bookKey,
          bookName: v.bookName,
          chapter: v.chapter,
          verse: v.verse,
          text: v.text,
          createdAt: serverTimestamp()
        },
        { merge: true }
      )
    }
  })
}
