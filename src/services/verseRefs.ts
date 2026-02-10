// src/services/verseRefs.ts
import Papa from "papaparse"

/** ===== Sheet Row shape (your CSV) =====
from_book, from_ch, from_v, to_book, to_ch, to_v, from_key, to_key
mark, 8, 1, matthew, 15, 32, mark|8|1, matthew|15|32
*/

export type RefLink = {
  toBookUsfm: string
  toBookRoute: string
  toChapter: number
  toVerse: number
  labelAr: string
}

type RefsIndex = Record<string, RefLink[]>

let _loaded = false
let _loading: Promise<void> | null = null
let _index: RefsIndex = {}

// ===== Canon (66 books) =====
// USFM 3-letter codes (common)
export const BOOK_USFM: Record<string, string> = {
  genesis: "GEN",
  exodus: "EXO",
  leviticus: "LEV",
  numbers: "NUM",
  deuteronomy: "DEU",
  joshua: "JOS",
  judges: "JDG",
  ruth: "RUT",
  "1samuel": "1SA",
  "2samuel": "2SA",
  "1kings": "1KI",
  "2kings": "2KI",
  "1chronicles": "1CH",
  "2chronicles": "2CH",
  ezra: "EZR",
  nehemiah: "NEH",
  esther: "EST",
  job: "JOB",
  psalms: "PSA",
  proverbs: "PRO",
  ecclesiastes: "ECC",
  "song_of_solomon": "SNG",
  song: "SNG",
  isaiah: "ISA",
  jeremiah: "JER",
  lamentations: "LAM",
  ezekiel: "EZK",
  daniel: "DAN",
  hosea: "HOS",
  joel: "JOL",
  amos: "AMO",
  obadiah: "OBA",
  jonah: "JON",
  micah: "MIC",
  nahum: "NAM",
  habakkuk: "HAB",
  zephaniah: "ZEP",
  haggai: "HAG",
  zechariah: "ZEC",
  malachi: "MAL",

  matthew: "MAT",
  mark: "MRK",
  luke: "LUK",
  john: "JHN",
  acts: "ACT",
  romans: "ROM",
  "1corinthians": "1CO",
  "2corinthians": "2CO",
  galatians: "GAL",
  ephesians: "EPH",
  philippians: "PHP",
  colossians: "COL",
  "1thessalonians": "1TH",
  "2thessalonians": "2TH",
  "1timothy": "1TI",
  "2timothy": "2TI",
  titus: "TIT",
  philemon: "PHM",
  hebrews: "HEB",
  james: "JAS",
  "1peter": "1PE",
  "2peter": "2PE",
  "1john": "1JN",
  "2john": "2JN",
  "3john": "3JN",
  jude: "JUD",
  revelation: "REV",
}

// ===== Route book keys (what your router uses). You can keep English full names. =====
export const USFM_TO_ROUTE: Record<string, string> = {
  GEN: "Genesis",
  EXO: "Exodus",
  LEV: "Leviticus",
  NUM: "Numbers",
  DEU: "Deuteronomy",
  JOS: "Joshua",
  JDG: "Judges",
  RUT: "Ruth",
  "1SA": "1Samuel",
  "2SA": "2Samuel",
  "1KI": "1Kings",
  "2KI": "2Kings",
  "1CH": "1Chronicles",
  "2CH": "2Chronicles",
  EZR: "Ezra",
  NEH: "Nehemiah",
  EST: "Esther",
  JOB: "Job",
  PSA: "Psalms",
  PRO: "Proverbs",
  ECC: "Ecclesiastes",
  SNG: "SongOfSolomon",
  ISA: "Isaiah",
  JER: "Jeremiah",
  LAM: "Lamentations",
  EZK: "Ezekiel",
  DAN: "Daniel",
  HOS: "Hosea",
  JOL: "Joel",
  AMO: "Amos",
  OBA: "Obadiah",
  JON: "Jonah",
  MIC: "Micah",
  NAM: "Nahum",
  HAB: "Habakkuk",
  ZEP: "Zephaniah",
  HAG: "Haggai",
  ZEC: "Zechariah",
  MAL: "Malachi",

  MAT: "Matthew",
  MRK: "Mark",
  LUK: "Luke",
  JHN: "John",
  ACT: "Acts",
  ROM: "Romans",
  "1CO": "1Corinthians",
  "2CO": "2Corinthians",
  GAL: "Galatians",
  EPH: "Ephesians",
  PHP: "Philippians",
  COL: "Colossians",
  "1TH": "1Thessalonians",
  "2TH": "2Thessalonians",
  "1TI": "1Timothy",
  "2TI": "2Timothy",
  TIT: "Titus",
  PHM: "Philemon",
  HEB: "Hebrews",
  JAS: "James",
  "1PE": "1Peter",
  "2PE": "2Peter",
  "1JN": "1John",
  "2JN": "2John",
  "3JN": "3John",
  JUD: "Jude",
  REV: "Revelation",
}

// (Optional reverse if needed)
export const ROUTE_TO_USFM: Record<string, string> = Object.fromEntries(
  Object.entries(USFM_TO_ROUTE).map(([u, r]) => [r, u])
)

// ===== Arabic short labels =====
export const USFM_TO_AR: Record<string, string> = {
  GEN: "تك",
  EXO: "خر",
  LEV: "لا",
  NUM: "عد",
  DEU: "تث",
  JOS: "يش",
  JDG: "قض",
  RUT: "را",
  "1SA": "1صم",
  "2SA": "2صم",
  "1KI": "1مل",
  "2KI": "2مل",
  "1CH": "1أخ",
  "2CH": "2أخ",
  EZR: "عز",
  NEH: "نح",
  EST: "أس",
  JOB: "أي",
  PSA: "مز",
  PRO: "أم",
  ECC: "جا",
  SNG: "نش",
  ISA: "إش",
  JER: "إر",
  LAM: "مرا",
  EZK: "حز",
  DAN: "دا",
  HOS: "هو",
  JOL: "يؤ",
  AMO: "عا",
  OBA: "عو",
  JON: "يون",
  MIC: "مي",
  NAM: "نا",
  HAB: "حب",
  ZEP: "صف",
  HAG: "حج",
  ZEC: "زك",
  MAL: "ملا",

  MAT: "مت",
  MRK: "مر",
  LUK: "لو",
  JHN: "يو",
  ACT: "أع",
  ROM: "رو",
  "1CO": "1كو",
  "2CO": "2كو",
  GAL: "غل",
  EPH: "أف",
  PHP: "في",
  COL: "كو",
  "1TH": "1تس",
  "2TH": "2تس",
  "1TI": "1تي",
  "2TI": "2تي",
  TIT: "تي",
  PHM: "فم",
  HEB: "عب",
  JAS: "يع",
  "1PE": "1بط",
  "2PE": "2بط",
  "1JN": "1يو",
  "2JN": "2يو",
  "3JN": "3يو",
  JUD: "يه",
  REV: "رؤ",
}

function normBookName(x: any) {
  return String(x || "")
    .trim()
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/\s+/g, " ")
}

function toUsfm(book: any) {
  const s = normBookName(book)
  // accept already-usfm codes too
  const maybeUsfm = s.toUpperCase()
  if (USFM_TO_ROUTE[maybeUsfm]) return maybeUsfm
  return BOOK_USFM[s] || ""
}

function makeKey(usfm: string, ch: number, v: number) {
  return `${usfm}|${Number(ch)}|${Number(v)}`
}

function formatArabicRef(usfm: string, ch: number, v: number) {
  const ar = USFM_TO_AR[usfm] || usfm
  return `${ar} ${Number(v)}:${Number(ch)}`
}

function dedupLinks(list: RefLink[]) {
  const seen = new Set<string>()
  const out: RefLink[] = []
  for (const x of list) {
    const k = `${x.toBookUsfm}|${x.toChapter}|${x.toVerse}`
    if (seen.has(k)) continue
    seen.add(k)
    out.push(x)
  }
  return out
}

export async function loadRefsIndex(csvUrl: string) {
  if (_loaded) return
  if (_loading) return _loading

  _loading = (async () => {
    const res = await fetch(csvUrl, { cache: "no-store" })
    const csv = await res.text()
    const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true })

    const idx: RefsIndex = {}

    for (const row of (parsed.data as any[])) {
      // prefer explicit columns; fallback to from_key/to_key
      const fromBook = row.from_book ?? ""
      const fromCh = row.from_ch ?? ""
      const fromV = row.from_v ?? ""
      const toBook = row.to_book ?? ""
      const toCh = row.to_ch ?? ""
      const toV = row.to_v ?? ""

      let fUsfm = toUsfm(fromBook)
      let tUsfm = toUsfm(toBook)

      let fCh = Number(fromCh)
      let fV = Number(fromV)
      let tCh = Number(toCh)
      let tV = Number(toV)

      // fallback: parse from_key/to_key if needed
      if (!fUsfm || !Number.isFinite(fCh) || !Number.isFinite(fV)) {
        const fk = String(row.from_key || "").trim()
        const parts = fk.split("|")
        if (parts.length === 3) {
          fUsfm = toUsfm(parts[0]) || toUsfm(parts[0].toUpperCase())
          fCh = Number(parts[1])
          fV = Number(parts[2])
        }
      }
      if (!tUsfm || !Number.isFinite(tCh) || !Number.isFinite(tV)) {
        const tk = String(row.to_key || "").trim()
        const parts = tk.split("|")
        if (parts.length === 3) {
          tUsfm = toUsfm(parts[0]) || toUsfm(parts[0].toUpperCase())
          tCh = Number(parts[1])
          tV = Number(parts[2])
        }
      }

      if (!fUsfm || !tUsfm) continue
      if (!Number.isFinite(fCh) || !Number.isFinite(fV)) continue
      if (!Number.isFinite(tCh) || !Number.isFinite(tV)) continue

      const fromKey = makeKey(fUsfm, fCh, fV)

      const link: RefLink = {
        toBookUsfm: tUsfm,
        toBookRoute: USFM_TO_ROUTE[tUsfm] || tUsfm,
        toChapter: tCh,
        toVerse: tV,
        labelAr: formatArabicRef(tUsfm, tCh, tV),
      }

      if (!idx[fromKey]) idx[fromKey] = []
      idx[fromKey].push(link)
    }

    // dedup each list
    for (const k of Object.keys(idx)) idx[k] = dedupLinks(idx[k])

    _index = idx
    _loaded = true
  })()

  return _loading
}

export function getRefsFor(usfmBookOrRoute: string, ch: number, v: number): RefLink[] {
  // accept route bookKey or usfm
  const usfm = ROUTE_TO_USFM[usfmBookOrRoute] || toUsfm(usfmBookOrRoute) || String(usfmBookOrRoute).toUpperCase()
  const k = makeKey(usfm, ch, v)
  return _index[k] || []
}

export function toRouteBookKey(usfmOrName: string) {
  const usfm = toUsfm(usfmOrName) || ROUTE_TO_USFM[usfmOrName] || String(usfmOrName).toUpperCase()
  return USFM_TO_ROUTE[usfm] || usfm
}

export function toUsfmBookKey(usfmOrName: string) {
  return toUsfm(usfmOrName) || ROUTE_TO_USFM[usfmOrName] || String(usfmOrName).toUpperCase()
}

export function formatRefAr(usfmOrName: string, ch: number, v: number) {
  const usfm = toUsfmBookKey(usfmOrName)
  return formatArabicRef(usfm, ch, v)
}
