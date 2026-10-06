import { ref, watch, type Ref } from 'vue'
import type { CalendarDay } from '@/config/calendar'
import { getCalendarDay } from '@/services/calendar'

export function useCalendarDay(dateISO: Ref<string>) {
  const calendarDay = ref<CalendarDay | null>(null)
  const calendarLoading = ref(false)
  const calendarError = ref(false)

  watch(
    dateISO,
    async (date, _previousDate, onCleanup) => {
      let cancelled = false

      onCleanup(() => {
        cancelled = true
      })

      calendarDay.value = null
      calendarError.value = false
      calendarLoading.value = false

      // Calendar features start in 2027.
      if (!date || date < '2027-01-01') return

      calendarLoading.value = true

      try {
        const day = await getCalendarDay(date)

        if (!cancelled) {
          calendarDay.value = day
        }
      } catch (error) {
        if (!cancelled) {
          calendarError.value = true
          console.error('Calendar loading failed:', error)
        }
      } finally {
        if (!cancelled) {
          calendarLoading.value = false
        }
      }
    },
    { immediate: true },
  )

  return {
    calendarDay,
    calendarLoading,
    calendarError,
  }
}