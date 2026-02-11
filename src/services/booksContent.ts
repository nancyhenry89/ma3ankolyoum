// src/services/booksContent.ts
export type BookIndexItem = {
    id: string
    title: string
    subtitle?: string
    coverUrl?: string
    chaptersCount?: number
    updatedAt?: string
  }
  
  export type Block =
    | { type: "p"; text: string }
    | { type: "h2"; text: string }
    | { type: "h3"; text: string }
    | { type: "quote"; text: string }
    | { type: "ul"; items: string[] }
    | { type: "ol"; items: string[] }
    | { type: "callout"; icon?: string; title?: string; text: string }
    | { type: "divider" }
  
  export type BookSection = { id: string; title: string; blocks: Block[] }
  export type BookChapter = { id: string; title: string; sections: BookSection[] }
  export type BookDoc = {
    id: string
    title: string
    subtitle?: string
    coverUrl?: string
    chapters: BookChapter[]
  }
  
  const BASE = "https://books.ma3ankolyoum.org"
    const CACHE_KEY = (k: string) => `books_cache:${k}`
  
  async function fetchJson<T>(url: string): Promise<T> {
    const res = await fetch(url, { cache: "no-store" })
    if (!res.ok) throw new Error(`Failed ${res.status}`)
    return (await res.json()) as T
  }
  
  export async function getBooksIndex(): Promise<BookIndexItem[]> {
    const cacheKey = CACHE_KEY("index")
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      // return cache instantly, then refresh in background
      refreshIndex(cacheKey).catch(() => {})
      return JSON.parse(cached) as BookIndexItem[]
    }
    const data = await fetchJson<BookIndexItem[]>(`${BASE}/index.json`)
    localStorage.setItem(cacheKey, JSON.stringify(data))
    return data
  }
  
  async function refreshIndex(cacheKey: string) {
    const data = await fetchJson<BookIndexItem[]>(`${BASE}/index.json`)
    localStorage.setItem(cacheKey, JSON.stringify(data))
  }
  
  export async function getBook(bookId: string): Promise<BookDoc> {
    const cacheKey = CACHE_KEY(`book:${bookId}`)
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      refreshBook(bookId, cacheKey).catch(() => {})
      return JSON.parse(cached) as BookDoc
    }
    const data = await fetchJson<BookDoc>(`${BASE}/${bookId}.json`)
    localStorage.setItem(cacheKey, JSON.stringify(data))
    return data
  }
  
  async function refreshBook(bookId: string, cacheKey: string) {
    const data = await fetchJson<BookDoc>(`${BASE}/${bookId}.json`)
    localStorage.setItem(cacheKey, JSON.stringify(data))
  }
  