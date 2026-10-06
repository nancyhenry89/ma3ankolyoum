import { computed, type Ref } from 'vue'
import type { CalendarDay, DayTheme } from '@/config/calendar'

export function useDayTheme(
  selectedDateISO: Ref<string>,
  calendarDay: Ref<CalendarDay | null>,
) {
  const dayTheme = computed<DayTheme>(() => {
    // Preserve the existing appearance for dates before 2027.
    if (selectedDateISO.value < '2027-01-01') {
      return 'normal'
    }

    // Avoid showing another day's theme while loading a new date.
    if (
      calendarDay.value?.dateISO !== selectedDateISO.value
    ) {
      return 'normal'
    }

    return calendarDay.value.theme
  })

  return { dayTheme }
}