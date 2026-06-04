const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const bibleDir = path.join(__dirname, '..', 'public', 'content', 'bible')
const outputFile = path.join(bibleDir, 'manifest.json')

function fileHash(filePath) {
  return crypto.createHash('sha1').update(fs.readFileSync(filePath)).digest('hex')
}

function walkBible() {
  const chapters = []

  const books = fs.readdirSync(bibleDir, { withFileTypes: true })
    .filter(d => d.isDirectory())

  for (const book of books) {
    const bookDir = path.join(bibleDir, book.name)

    const files = fs.readdirSync(bookDir)
      .filter(f => f.endsWith('.json'))
      .sort((a, b) => Number(a.replace('.json', '')) - Number(b.replace('.json', '')))

    for (const file of files) {
      const chapter = Number(file.replace('.json', ''))
      if (!Number.isFinite(chapter)) continue

      const fullPath = path.join(bookDir, file)

      chapters.push({
        key: `${book.name}/${chapter}`,
        bookSlug: book.name,
        chapter,
        path: `bible/${book.name}/${file}`,
        hash: fileHash(fullPath)
      })
    }
  }

  return chapters
}

const manifest = {
  generatedAt: new Date().toISOString(),
  chapters: walkBible()
}

fs.writeFileSync(outputFile, JSON.stringify(manifest, null, 2), 'utf8')

console.log(`Bible manifest generated: ${manifest.chapters.length} chapters`)