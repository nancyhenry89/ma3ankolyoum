import { computed, type Ref } from 'vue'
import { useCalendarDay } from '@/composables/useCalendarDay'
import { useDayTheme } from '@/composables/useDayTheme'

export function useHomeCalendar(dateISO: Ref<string>) {
  const is2027Home = computed(
    () => dateISO.value >= '2027-01-01',
  )

  const {
    calendarDay,
    calendarLoading,
    calendarError,
  } = useCalendarDay(dateISO)

  const { dayTheme } = useDayTheme(dateISO, calendarDay)

  const homeDayStyles = computed(() => {
    if (!is2027Home.value) return {}

    return {
      '--mk-bg1': 'var(--day-background)',
      '--mk-bg2': 'var(--day-surface)',
      '--mk-text': 'var(--day-text)',
      '--mk-card': 'var(--day-surface)',
      '--mk-accent': 'var(--day-primary)',
      '--mk-dark': 'var(--day-text)',
      '--mk-border': 'var(--day-border)',
      '--mk-soft': 'var(--day-background)',
      '--mk-soft-border': 'var(--day-border)',
    }
  })

  return {
    is2027Home,
    calendarDay,
    calendarLoading,
    calendarError,
    dayTheme,
    homeDayStyles,
  }
}