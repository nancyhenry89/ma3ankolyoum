// scripts/build-books-json.mjs
import fs from "node:fs"
import path from "node:path"
import Papa from "papaparse"

/**
 * Robust CSV parsing (supports multiline quoted cells, commas in quotes, etc.)
 */
function parseCsv(text) {
  const parsed = Papa.parse(text, {
    header: true,
    skipEmptyLines: "greedy",
  })

  if (parsed.errors?.length) {
    const e = parsed.errors[0]
    console.warn("⚠️ CSV parse warning:", e)
  }

  return (parsed.data || []).map((r) => {
    const out = {}
    for (const [k, v] of Object.entries(r || {})) {
      out[String(k ?? "").trim()] = String(v ?? "").trim()
    }
    return out
  })
}

function num(v, fallback = 0) {
  const n = Number(String(v ?? "").trim())
  return Number.isFinite(n) ? n : fallback
}

function must(v, msg) {
  if (!v || String(v).trim() === "") throw new Error(msg)
  return String(v).trim()
}

function safeJsonParseArray(s, context) {
  if (!s || !String(s).trim()) return []
  try {
    const parsed = JSON.parse(s)
    if (!Array.isArray(parsed)) throw new Error("itemsJson is not an array")
    return parsed.map((x) => String(x))
  } catch {
    throw new Error(`${context}: invalid itemsJson. Put valid JSON like ["a","b"]. Got: ${s}`)
  }
}

function makeBlock(r) {
  const type = must(r.type, "Missing block type")
  const t = (r.text ?? "").trim()
  const icon = (r.icon ?? "").trim()
  const calloutTitle = (r.calloutTitle ?? "").trim()
  const itemsJson = (r.itemsJson ?? "").trim()

  if (type === "p" || type === "h2" || type === "h3" || type === "quote") {
    if (!t) throw new Error(`Block type ${type} requires text`)
    return { type, text: t }
  }

  if (type === "ul" || type === "ol") {
    const items = safeJsonParseArray(itemsJson, `List block (${type})`)
    if (!items.length) throw new Error(`Block type ${type} requires itemsJson with at least 1 item`)
    return { type, items }
  }

  if (type === "callout") {
    if (!t) throw new Error("Callout block requires text")
    const b = { type, text: t }
    if (icon) b.icon = icon
    if (calloutTitle) b.title = calloutTitle
    return b
  }

  if (type === "divider") {
    return { type: "divider" }
  }

  throw new Error(`Unknown block type: ${type}`)
}

async function fetchText(source) {
    // If it's a URL
    if (source.startsWith("http://") || source.startsWith("https://")) {
      const res = await fetch(source)
      if (!res.ok) throw new Error(`Failed to fetch ${source} (${res.status})`)
      return await res.text()
    }
  
    // Otherwise treat as local file path
    const fullPath = path.resolve(source)
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Local file not found: ${fullPath}`)
    }
    return fs.readFileSync(fullPath, "utf8")
  }
  
// ===== MAIN =====
const indexUrl = process.env.BOOKS_INDEX_CSV || "./books_out/books_index.csv"
const blocksUrl = process.env.BOOK_BLOCKS_CSV || "./books_out/book_blocks.csv"


if (!indexUrl || !blocksUrl) {
  console.log("❌ Missing env vars.")
  console.log("Run like:")
  console.log('BOOKS_INDEX_CSV="...output=csv" BOOK_BLOCKS_CSV="...output=csv" node scripts/build-books-json.mjs')
  process.exit(1)
}

const outDir = path.resolve("books_out")
fs.mkdirSync(outDir, { recursive: true })

console.log("Fetching index...")
const indexCsv = await fetchText(indexUrl)
const indexRows = parseCsv(indexCsv)

console.log("Fetching blocks...")
const blocksCsv = await fetchText(blocksUrl)
const blockRows = parseCsv(blocksCsv)

// ----- Build index.json -----
const index = indexRows
  .map((r) => {
    const id = must(r.id, "books_index: missing id")
    const title = must(r.title, `books_index(${id}): missing title`)
    const subtitle = (r.subtitle ?? "").trim() || undefined
    const coverUrl = (r.coverUrl ?? "").trim() || undefined
    const chaptersCount = r.chaptersCount ? num(r.chaptersCount, 0) : undefined
    const updatedAt = (r.updatedAt ?? "").trim() || undefined
    const order = num(r.order, 9999)
    return { id, title, subtitle, coverUrl, chaptersCount, updatedAt, order }
  })
  .sort((a, b) => a.order - b.order)
  .map(({ order, ...rest }) => rest)

fs.writeFileSync(path.join(outDir, "index.json"), JSON.stringify(index, null, 2), "utf8")
console.log(`✅ Wrote ${outDir}/index.json`)

// ----- Group blocks into books -> chapters -> sections -----
const byBook = new Map()

// ✅ Carry-forward titles for repeated rows (so you can leave cells blank)
const lastTitles = new Map() // key = `${bookId}|${chapterId}|${sectionId}` -> { chapterTitle, sectionTitle }

for (const r of blockRows) {
  // ✅ skip totally empty rows
  const hasAny =
    (r.bookId ?? "").trim() ||
    (r.chapterId ?? "").trim() ||
    (r.sectionId ?? "").trim() ||
    (r.type ?? "").trim() ||
    (r.text ?? "").trim() ||
    (r.itemsJson ?? "").trim()

  if (!hasAny) continue

  // ✅ skip malformed partial rows
  if ((r.sectionId ?? "").trim() && !(r.chapterId ?? "").trim()) continue
  if ((r.chapterTitle ?? "").trim() && !(r.chapterId ?? "").trim()) continue
  if ((r.chapterOrder ?? "").trim() && !(r.chapterId ?? "").trim()) continue

  // ✅ skip broken row (has book+chapter but no section)
  if ((r.bookId ?? "").trim() && (r.chapterId ?? "").trim() && !(r.sectionId ?? "").trim()) continue

  const bookId = must(r.bookId, "book_blocks: missing bookId")
  const chapterId = must(r.chapterId, `book_blocks(${bookId}): missing chapterId`)
  const sectionId = must(r.sectionId, `book_blocks(${bookId}/${chapterId}): missing sectionId`)

  // ✅ carry forward chapterTitle / sectionTitle
  const key = `${bookId}|${chapterId}|${sectionId}`
  const prev = lastTitles.get(key) || {}

  const chapterTitleRaw = (r.chapterTitle ?? "").trim()
  const sectionTitleRaw = (r.sectionTitle ?? "").trim()

  const chapterTitle = chapterTitleRaw || prev.chapterTitle
  const sectionTitle = sectionTitleRaw || prev.sectionTitle

  if (!chapterTitle) throw new Error(`book_blocks(${bookId}/${chapterId}): missing chapterTitle`)
  if (!sectionTitle) throw new Error(`book_blocks(${bookId}/${chapterId}/${sectionId}): missing sectionTitle`)

  // store for next rows
  lastTitles.set(key, { chapterTitle, sectionTitle })

  const chapterOrder = num(r.chapterOrder, 9999)
  const sectionOrder = num(r.sectionOrder, 9999)
  const blockOrder = num(r.blockOrder, 9999)

  const block = makeBlock(r)

  if (!byBook.has(bookId)) byBook.set(bookId, new Map())
  const chMap = byBook.get(bookId)

  if (!chMap.has(chapterId)) {
    chMap.set(chapterId, { id: chapterId, title: chapterTitle, order: chapterOrder, sections: new Map() })
  }
  const ch = chMap.get(chapterId)

  if (!ch.sections.has(sectionId)) {
    ch.sections.set(sectionId, { id: sectionId, title: sectionTitle, order: sectionOrder, blocks: [] })
  }
  const sec = ch.sections.get(sectionId)

  sec.blocks.push({ order: blockOrder, block })
}

// ----- Build per-book JSON using index metadata -----
const indexMap = new Map(index.map((b) => [b.id, b]))

for (const [bookId, chMap] of byBook.entries()) {
  const meta = indexMap.get(bookId)
  if (!meta) {
    console.warn(`⚠️ book_blocks contains bookId="${bookId}" not found in books_index. It will still be built.`)
  }

  const chapters = [...chMap.values()]
    .sort((a, b) => a.order - b.order)
    .map((ch) => ({
      id: ch.id,
      title: ch.title,
      sections: [...ch.sections.values()]
        .sort((a, b) => a.order - b.order)
        .map((sec) => ({
          id: sec.id,
          title: sec.title,
          blocks: sec.blocks
            .sort((a, b) => a.order - b.order)
            .map((x) => x.block),
        })),
    }))

  const bookDoc = {
    id: bookId,
    title: meta?.title ?? bookId,
    subtitle: meta?.subtitle,
    coverUrl: meta?.coverUrl,
    chapters,
  }

  const file = path.join(outDir, `${bookId}.json`)
  fs.writeFileSync(file, JSON.stringify(bookDoc, null, 2), "utf8")
  console.log(`✅ Wrote ${file}`)
}

console.log("Done ✅")
