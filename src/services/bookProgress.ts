// src/services/bookProgress.ts
export type BookProgress = {
    bookId: string
    chapterId: string
    sectionId: string
    scrollY?: number
    updatedAt: number
  }
  
  const KEY = (bookId: string) => `book_progress:${bookId}`
  
  export function loadBookProgress(bookId: string): BookProgress | null {
    try {
      const raw = localStorage.getItem(KEY(bookId))
      if (!raw) return null
      return JSON.parse(raw) as BookProgress
    } catch {
      return null
    }
  }
  
  export function saveBookProgress(p: BookProgress) {
    try {
      localStorage.setItem(KEY(p.bookId), JSON.stringify(p))
    } catch {
      // ignore quota / private mode errors
    }
  }
  
  export function clearBookProgress(bookId: string) {
    try {
      localStorage.removeItem(KEY(bookId))
    } catch {}
  }
  