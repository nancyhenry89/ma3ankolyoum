// src/utils/dayCache.ts
const CACHE_VERSION = 'v1'
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7 // 7 أيام

function cacheKey(dateISO: string) {
  return `mk_day_${CACHE_VERSION}_${String(dateISO).substring(0, 10)}`
}

export function readDayCache(dateISO: string) {
  try {
    const raw = localStorage.getItem(cacheKey(dateISO))
    if (!raw) return null
    const obj = JSON.parse(raw)
    if (!obj?.ts || !obj?.data) return null
    if (Date.now() - obj.ts > CACHE_TTL_MS) return null
    return obj.data
  } catch {
    return null
  }
}

export function writeDayCache(dateISO: string, data: any) {
  try {
    localStorage.setItem(
      cacheKey(dateISO),
      JSON.stringify({ ts: Date.now(), data })
    )
  } catch {}
}
