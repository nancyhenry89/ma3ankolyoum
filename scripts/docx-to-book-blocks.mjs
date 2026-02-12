// scripts/docx-to-book-blocks.mjs
import fs from "node:fs"
import path from "node:path"
import mammoth from "mammoth"
import Papa from "papaparse"

const INPUT_DOCX = process.argv[2]
const BOOK_ID = process.argv[3] || "book_1"

if (!INPUT_DOCX) {
  console.log('Usage:')
  console.log('node scripts/docx-to-book-blocks.mjs "./book.docx" victory_over_weakness')
  process.exit(1)
}

const outDir = path.resolve("books_out")
fs.mkdirSync(outDir, { recursive: true })

function clean(s) {
  return String(s ?? "")
    .replace(/\u00A0/g, " ")
    .replace(/[ \t]+/g, " ")
    .trim()
}

async function main() {
  const { value: html } = await mammoth.convertToHtml({
    path: INPUT_DOCX,
  })

  // Convert HTML to structured blocks
  const lines = html
    .replace(/<\/p>/g, "\n")
    .replace(/<\/h1>/g, "\n")
    .replace(/<\/h2>/g, "\n")
    .replace(/<\/h3>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .split("\n")
    .map(clean)
    .filter(Boolean)

  let chapterId = "ch1"
  let chapterTitle = "الفصل الأول"
  let chapterOrder = 1

  let sectionId = "s1"
  let sectionTitle = "محتوى"
  let sectionOrder = 1

  let blockOrder = 0

  const rows = []

  function push(type, text = "", itemsJson = "") {
    blockOrder++
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
      icon: "",
      calloutTitle: "",
    })
  }

  function startChapter(title) {
    chapterOrder++
    chapterId = `ch${chapterOrder}`
    chapterTitle = title
    sectionOrder = 1
    sectionId = "s1"
    sectionTitle = "محتوى"
    blockOrder = 0
  }

  function startSection(title) {
    sectionOrder++
    sectionId = `s${sectionOrder}`
    sectionTitle = title
  }

  for (const line of lines) {
    // Detect chapter
    if (line.startsWith("الفصل")) {
      startChapter(line)
      push("h2", line)
      continue
    }

    // Detect section (short lines)
    if (line.length < 60 && !line.includes(" ")) {
      startSection(line)
      push("h3", line)
      continue
    }

    push("p", line)
  }

  // ---- Write CSV ----
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
  console.log("✅ Wrote book_blocks.csv")

  console.log("Done ✅")
}

main().catch(console.error)
