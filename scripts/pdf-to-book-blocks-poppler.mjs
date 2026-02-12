import fs from "node:fs"
import path from "node:path"
import { execSync } from "node:child_process"
import Papa from "papaparse"

// ===== CLI =====
const INPUT_PDF = process.argv[2]
const BOOK_ID = process.argv[3] || "book_1"

if (!INPUT_PDF) {
  console.log('Usage: node scripts/pdf-to-book-blocks-poppler.mjs "./mybook.pdf" victory_over_weakness')
  process.exit(1)
}

const outDir = path.resolve("books_out")
fs.mkdirSync(outDir, { recursive: true })

function cleanLine(s) {
  return String(s ?? "")
    .replace(/\u00A0/g, " ")
    .replace(/[ \t]+/g, " ")
    .trim()
}

function isBullet(line) {
  return /^([-•*]|(\d+[\.\)]))\s+/.test(line)
}
function stripBullet(line) {
  return line.replace(/^([-•*]|(\d+[\.\)]))\s+/, "").trim()
}
function looksLikeChapter(line) {
  return /^الفصل\b/.test(line) || /^الباب\b/.test(line)
}
function looksLikeSection(line) {
  const L = line.length
  if (L >= 3 && L <= 60) return true
  if (line.endsWith(":") || line.endsWith("：")) return true
  return false
}

function extractTextWithPoppler(pdfPath) {
  // -layout keeps visual reading order better
  const tmpTxt = path.join(outDir, "__tmp_pdftotext.txt")
  execSync(`pdftotext -layout -enc UTF-8 "${pdfPath}" "${tmpTxt}"`, { stdio: "inherit" })
  return fs.readFileSync(tmpTxt, "utf8")
}

async function main() {
  const rawText = extractTextWithPoppler(INPUT_PDF)

  const lines = rawText
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map(cleanLine)
    .filter((l) => l.length > 0)

  // Defaults
  let chapterId = "ch1"
  let chapterTitle = "الفصل الأول"
  let chapterOrder = 1

  let sectionId = "s1"
  let sectionTitle = "محتوى"
  let sectionOrder = 1

  let blockOrder = 0

  const rows = []
  const pushRow = (type, { text = "", itemsJson = "", icon = "", calloutTitle = "" } = {}) => {
    blockOrder += 1
    rows.push({
      bookId: BOOK_ID,
      chapterId,
      chapterTitle,
      chapterOrder,
      sectionId,
      sectionTitle,
      sectionOrder,
      blockOrder,
      type,
      text,
      itemsJson,
      icon,
      calloutTitle,
    })
  }

  const startChapter = (title) => {
    if (!(chapterOrder === 1 && chapterId === "ch1" && blockOrder === 0)) chapterOrder += 1
    chapterId = `ch${chapterOrder}`
    chapterTitle = title

    sectionOrder = 1
    sectionId = "s1"
    sectionTitle = "محتوى"
    blockOrder = 0
  }

  const startSection = (title) => {
    if (!(sectionOrder === 1 && sectionId === "s1" && blockOrder === 0)) sectionOrder += 1
    sectionId = `s${sectionOrder}`
    sectionTitle = title
  }

  let pendingBullets = []
  const flushBullets = () => {
    if (pendingBullets.length) {
      pushRow("ul", { itemsJson: JSON.stringify(pendingBullets) })
      pendingBullets = []
    }
  }

  for (const line of lines) {
    if (/^\d+$/.test(line)) continue

    if (looksLikeChapter(line)) {
      flushBullets()
      startChapter(line)
      pushRow("h2", { text: line })
      continue
    }

    if (!isBullet(line) && looksLikeSection(line) && !/^(ص|صفحة|الفهرس)$/i.test(line)) {
      flushBullets()
      startSection(line)
      pushRow("h3", { text: line })
      continue
    }

    if (isBullet(line)) {
      pendingBullets.push(stripBullet(line))
      continue
    }

    flushBullets()
    pushRow("p", { text: line })
  }

  flushBullets()

  // CSV
  const csv = Papa.unparse(rows, {
    columns: [
      "bookId",
      "chapterId",
      "chapterTitle",
      "chapterOrder",
      "sectionId",
      "sectionTitle",
      "sectionOrder",
      "blockOrder",
      "type",
      "text",
      "itemsJson",
      "icon",
      "calloutTitle",
    ],
  })
  fs.writeFileSync(path.join(outDir, "book_blocks.csv"), csv, "utf8")
  console.log(`✅ Wrote ${outDir}/book_blocks.csv`)

  // JSON (direct)
  const byChapter = new Map()
  for (const r of rows) {
    if (!byChapter.has(r.chapterId)) {
      byChapter.set(r.chapterId, { id: r.chapterId, title: r.chapterTitle, order: Number(r.chapterOrder), sections: new Map() })
    }
    const ch = byChapter.get(r.chapterId)
    if (!ch.sections.has(r.sectionId)) {
      ch.sections.set(r.sectionId, { id: r.sectionId, title: r.sectionTitle, order: Number(r.sectionOrder), blocks: [] })
    }
    const sec = ch.sections.get(r.sectionId)

    let block
    if (r.type === "ul" || r.type === "ol") block = { type: r.type, items: r.itemsJson ? JSON.parse(r.itemsJson) : [] }
    else if (r.type === "divider") block = { type: "divider" }
    else if (r.type === "callout") {
      block = { type: "callout", text: r.text || "" }
      if (r.icon) block.icon = r.icon
      if (r.calloutTitle) block.title = r.calloutTitle
    } else block = { type: r.type, text: r.text || "" }

    sec.blocks.push({ order: Number(r.blockOrder), block })
  }

  const chapters = [...byChapter.values()]
    .sort((a, b) => a.order - b.order)
    .map((ch) => ({
      id: ch.id,
      title: ch.title,
      sections: [...ch.sections.values()]
        .sort((a, b) => a.order - b.order)
        .map((sec) => ({
          id: sec.id,
          title: sec.title,
          blocks: sec.blocks.sort((a, b) => a.order - b.order).map((x) => x.block),
        })),
    }))

  const bookDoc = { id: BOOK_ID, title: BOOK_ID, chapters }
  fs.writeFileSync(path.join(outDir, `${BOOK_ID}.json`), JSON.stringify(bookDoc, null, 2), "utf8")
  console.log(`✅ Wrote ${outDir}/${BOOK_ID}.json`)
}

main().catch((e) => {
  console.error("❌ Failed:", e)
  process.exit(1)
})
