export type SavedVerse = {
    bookKey: string
    bookName: string
    chapter: number
    verse: number
    text: string
    note?: string        // ✅ ملاحظة المستخدم
    savedAt: number
  }
  
  
  const LS_KEY = 'mk_saved_verses_v1'
  
  function readAll(): SavedVerse[] {
    try {
      const raw = localStorage.getItem(LS_KEY)
      const arr = raw ? JSON.parse(raw) : []
      return Array.isArray(arr) ? arr : []
    } catch {
      return []
    }
  }
  
  function writeAll(list: SavedVerse[]) {
    localStorage.setItem(LS_KEY, JSON.stringify(list))
  }
  
  export function listSavedVerses(): SavedVerse[] {
    // newest first
    return readAll().sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0))
  }
  
  export function isVerseSaved(bookKey: string, chapter: number, verse: number): boolean {
    const b = (bookKey || '').toLowerCase()
    return readAll().some(v =>
      (v.bookKey || '').toLowerCase() === b &&
      Number(v.chapter) === Number(chapter) &&
      Number(v.verse) === Number(verse)
    )
  }
  
  export function toggleVerseSaved(entry: Omit<SavedVerse, 'savedAt'>): boolean {
    const list = readAll()
    const b = (entry.bookKey || '').toLowerCase()
  
    const idx = list.findIndex(v =>
      (v.bookKey || '').toLowerCase() === b &&
      Number(v.chapter) === Number(entry.chapter) &&
      Number(v.verse) === Number(entry.verse)
    )
  
    if (idx >= 0) {
      list.splice(idx, 1)
      writeAll(list)
      return false // now removed
    } else {
      list.unshift({ ...entry, savedAt: Date.now() })
      writeAll(list)
      return true // now saved
    }
  }
  export function upsertVerseNote(
  entry: Omit<SavedVerse, 'savedAt'>
) {
  const list = readAll()
  const b = entry.bookKey.toLowerCase()

  const idx = list.findIndex(v =>
    v.bookKey.toLowerCase() === b &&
    v.chapter === entry.chapter &&
    v.verse === entry.verse
  )

  if (idx >= 0) {
    // update note / text
    list[idx] = {
      ...list[idx],
      note: entry.note,
      text: entry.text
    }
  } else {
    list.unshift({
      ...entry,
      savedAt: Date.now()
    })
  }

  writeAll(list)
}
