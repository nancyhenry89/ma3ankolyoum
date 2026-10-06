export type ContentLanguage = 'ar' | 'en'

const MAIN_SHEET =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vRzBoz5JKy5BfRIXlo_rOSIYsce_9oXsLG9R07CvC3-MztLmg3vv7EYoNLFdt9YmL21tv8XYevOxedh/pub'

const LEGACY_EN_SHEET =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vRWXF9eFCtpOgzUaGeiNL4_j7_5naGVewHbW4iwU-l4FqQmv0b_25Snb__igfxess03wAjdJ6A9vThP/pub'

export const DAILY_SOURCES: Record<
  number,
  Record<ContentLanguage, string>
> = {
  2026: {
    ar: `${MAIN_SHEET}?gid=0&single=true&output=csv`,
    en: `${LEGACY_EN_SHEET}?gid=0&single=true&output=csv`,
  },

  2027: {
    ar: `${MAIN_SHEET}?gid=2097448620&single=true&output=csv`,
    en: `${MAIN_SHEET}?gid=891156468&single=true&output=csv`,
  },
}

export function getDailySource(
  dateISO: string,
  language: ContentLanguage,
): string | null {
  const year = Number(dateISO.substring(0, 4))

  return DAILY_SOURCES[year]?.[language] ?? null
}