import Papa from 'papaparse'

const LITURGY_CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vTiv2RxfjicJcQ-djT21y0an6TiCpRnwTztf__tNTuHXsrNenIO3CPi1p29MAs27pRVMRjp2MiAw7pM/pub?output=csv'

export type LiturgySheetRow = {
  date_iso: string
  mazmour: string
  bible: string
}

export async function loadLiturgySheet(): Promise<LiturgySheetRow[]> {
  const response = await fetch(LITURGY_CSV_URL)

  if (!response.ok) {
    throw new Error(`Could not load liturgy sheet: HTTP ${response.status}`)
  }

  const csv = await response.text()
  const { data, errors, meta } = Papa.parse<LiturgySheetRow>(csv, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: header =>
      header.replace(/^\uFEFF/, '').trim().toLowerCase(),
  })

  const requiredColumns = ['date_iso', 'mazmour', 'bible']
  const missingColumns = requiredColumns.filter(
    column => !meta.fields?.includes(column),
  )

  if (missingColumns.length) {
    throw new Error(`Missing liturgy sheet columns: ${missingColumns.join(', ')}`)
  }

  if (errors.length) {
    throw new Error(`Could not parse liturgy sheet: ${errors[0].message}`)
  }

  return data
    .map(row => ({
      date_iso: (row.date_iso ?? '').trim(),
      mazmour: (row.mazmour ?? '').trim(),
      bible: (row.bible ?? '').trim(),
    }))
    .filter(row => /^\d{4}-\d{2}-\d{2}$/.test(row.date_iso))
}