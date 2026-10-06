export const CALENDAR_CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vRzBoz5JKy5BfRIXlo_rOSIYsce_9oXsLG9R07CvC3-MztLmg3vv7EYoNLFdt9YmL21tv8XYevOxedh/pub?gid=1379650933&single=true&output=csv'

export const DAY_THEMES = [
  'normal',
  'fasting',
  'joyful',
  'kiahk',
  'holy_week',
] as const

export type DayTheme = (typeof DAY_THEMES)[number]

export type FastingStatus = 'fasting' | 'non-fasting'

export interface CalendarDay {
  dateISO: string
  fastingStatus: FastingStatus | null
  fastingName: { ar: string; en: string }
  abstinence: boolean | null
  fishAllowed: boolean | null
  prayerTune: { ar: string; en: string }
  reflection: { ar: string; en: string }
  theme: DayTheme
}