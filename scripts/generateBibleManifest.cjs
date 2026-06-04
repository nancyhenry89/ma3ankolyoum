const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const publicBibleDir = path.join(__dirname, '..', 'public', 'content', 'bible')
const docsBibleDir = path.join(__dirname, '..', 'docs', 'content', 'bible')

function fileHash(filePath) {
  return crypto
    .createHash('sha1')
    .update(fs.readFileSync(filePath))
    .digest('hex')
}

function walkBible(bibleDir) {
  const chapters = []

  if (!fs.existsSync(bibleDir)) {
    console.warn(`Bible directory not found: ${bibleDir}`)
    return chapters
  }

  const books = fs.readdirSync(bibleDir, { withFileTypes: true })
    .filter(d => d.isDirectory())

  for (const book of books) {
    const bookDir = path.join(bibleDir, book.name)

    const files = fs.readdirSync(bookDir)
      .filter(f => f.endsWith('.json'))
      .sort(
        (a, b) =>
          Number(a.replace('.json', '')) -
          Number(b.replace('.json', ''))
      )

    for (const file of files) {
      const chapter = Number(file.replace('.json', ''))
      if (!Number.isFinite(chapter)) continue

      const fullPath = path.join(bookDir, file)

      chapters.push({
        key: `${book.name}/${chapter}`,
        bookSlug: book.name.toLowerCase(),
        chapter,
        path: `bible/${book.name}/${file}`,
        hash: fileHash(fullPath)
      })
    }
  }

  return chapters
}

// Use public as source of truth
const chapters = walkBible(publicBibleDir)

const manifest = {
  generatedAt: new Date().toISOString(),
  chapters
}

const outputFiles = [
  path.join(publicBibleDir, 'manifest.json'),
  path.join(docsBibleDir, 'manifest.json')
]

for (const outputFile of outputFiles) {
  fs.mkdirSync(path.dirname(outputFile), { recursive: true })

  fs.writeFileSync(
    outputFile,
    JSON.stringify(manifest, null, 2),
    'utf8'
  )

  console.log(`Bible manifest generated: ${outputFile}`)
}

console.log(`Total chapters: ${manifest.chapters.length}`)