import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { onIonViewWillEnter } from '@ionic/vue'
import { useCalendarDay } from '@/composables/useCalendarDay'
import { useDayTheme } from '@/composables/useDayTheme'
import {
  getDailyDates,
  type DailyDates,
} from '@/services/dailyDates'

function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false

  const date = new Date(`${value}T00:00:00Z`)

  return (
    Number.isFinite(date.getTime()) &&
    date.toISOString().substring(0, 10) === value
  )
}

export function useFastingPage() {
  const route = useRoute()
  const router = useRouter()

  const language = ref<'ar' | 'en'>(
    localStorage.getItem('mk_lang') === 'en' ? 'en' : 'ar',
  )

  onIonViewWillEnter(() => {
    language.value =
      localStorage.getItem('mk_lang') === 'en' ? 'en' : 'ar'
  
    sessionStorage.setItem('mk_home_return_today', '1')
  })

  const arabic = computed(() => language.value === 'ar')

  const dateISO = computed(() => {
    const value = String(route.params.dateISO ?? '')

    return validDate(value) && value >= '2027-01-01'
      ? value
      : ''
  })

  const {
    calendarDay,
    calendarLoading,
    calendarError,
  } = useCalendarDay(dateISO)

  const { dayTheme } = useDayTheme(dateISO, calendarDay)

  const dates = ref<DailyDates | null>(null)
  const datesLoading = ref(false)
  const datesError = ref(false)

  watch(
    [dateISO, language],
    async ([date, lang], _previous, onCleanup) => {
      let cancelled = false
      onCleanup(() => {
        cancelled = true
      })

      dates.value = null
      datesError.value = false
      datesLoading.value = false

      if (!date) return

      datesLoading.value = true

      try {
        const result = await getDailyDates(date, lang)

        if (!cancelled) dates.value = result
      } catch (error) {
        if (!cancelled) {
          datesError.value = true
          console.error('Daily dates loading failed:', error)
        }
      } finally {
        if (!cancelled) datesLoading.value = false
      }
    },
    { immediate: true },
  )

  const gregorianDate = computed(() => {
    if (dates.value?.gregorian) return dates.value.gregorian
    if (!dateISO.value) return ''

    // Gregorian date can still be shown when the sheet row is absent.
    return new Intl.DateTimeFormat(
      arabic.value ? 'ar-EG' : 'en-GB',
      {
        dateStyle: 'full',
        timeZone: 'UTC',
      },
    ).format(new Date(`${dateISO.value}T00:00:00Z`))
  })

  const copticDate = computed(() => dates.value?.coptic ?? '')

  const canGoPrevious = computed(
    () => !!dateISO.value && dateISO.value > '2027-01-01',
  )

  function moveDay(offset: number) {
    if (!dateISO.value) return

    const date = new Date(`${dateISO.value}T00:00:00Z`)
    date.setUTCDate(date.getUTCDate() + offset)

    const nextISO = date.toISOString().substring(0, 10)
    if (nextISO < '2027-01-01') return

    // Replace keeps browsing days from filling the back stack.
    return router.replace({
      name: 'Fasting',
      params: { dateISO: nextISO },
    })
  }

  function goHome() {
    return router.replace('/tabs/home')
  }

  return {
    language,
    arabic,
    dateISO,
    dayTheme,
    calendarDay,
    calendarLoading,
    calendarError,
    datesLoading,
    datesError,
    gregorianDate,
    copticDate,
    canGoPrevious,
    moveDay,
    goHome,
  }
}