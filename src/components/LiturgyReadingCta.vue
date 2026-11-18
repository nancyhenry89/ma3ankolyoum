<template>
  <button
    type="button"
    class="liturgy-cta"
    v-bind="$attrs"
    :dir="english ? 'rtl' : 'rtl'"
    @click="openReadings"
  >
    <span class="liturgy-cta-icon" aria-hidden="true">
      <ion-icon :icon="bookOutline" />
    </span>
    <span class="liturgy-cta-copy">
      <strong>{{ english ? 'Liturgy Gospel' : 'إنجيل القداس' }}</strong>
      <span v-if="gospelReference" class="liturgy-cta-reference" dir="rtl">
        <bdi
          v-for="(part, index) in referenceParts(gospelReference)"
          :key="index"
          :dir="part.dir"
          class="reference-part"
        >{{ part.text }}</bdi>
      </span>
    </span>
    <span class="liturgy-cta-arrow" aria-hidden="true">{{ english ? '→' : '←' }}</span>
  </button>

    <ion-modal :is-open="open" @didDismiss="closeReadings()" class="liturgy-modal">
      <ion-header dir="rtl">
        <ion-toolbar>
          <ion-title>قراءات اليوم</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="open = false">إغلاق</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>

      <ion-content dir="rtl">
        <div class="readings ion-padding">
          <div class="date-navigation" dir="rtl">
            <button
              class="day-arrow"
              type="button"
              aria-label="اليوم السابق"
              :disabled="selectedDate <= minDate"
              @click="shiftDay(-1)"
            >
              <ion-icon :icon="chevronForwardOutline" :flip-rtl="false" dir="rtl" aria-hidden="true" />
            </button>

            <button
              type="button"
              class="liturgy-date"
              aria-label="اختيار تاريخ القراءة"
              @click="datePickerOpen = true"
            >
              <ion-icon :icon="calendarOutline" aria-hidden="true" />
              <span class="liturgy-date-copy">
                <time :datetime="selectedDate">{{ gregorianDate }}</time>
                <span v-if="copticDate">{{ copticDate }}</span>
                <span v-else-if="copticLoading">جاري تحميل التاريخ القبطي…</span>
                <span v-else>غير متاح</span>
              </span>
            </button>

            <button
              class="day-arrow"
              type="button"
              aria-label="اليوم التالي"
              :disabled="selectedDate >= maxDate"
              @click="shiftDay(1)"
            >
              <ion-icon :icon="chevronBackOutline" :flip-rtl="false" dir="rtl" aria-hidden="true" />
            </button>
          </div>

          <div v-if="selectedDate !== today" class="today-row">
            <button class="today-button" type="button" @click="goToToday">اليوم</button>
          </div>

          <p v-if="loading" role="status">جاري تحميل القراءات…</p>

          <template v-else-if="loadError">
            <p role="status">تعذّر تحميل القراءات.</p>
            <ion-button fill="outline" @click="retryCount++">
              أعد المحاولة
            </ion-button>
          </template>

          <p v-else-if="!readings" role="status">
            قراءات هذا التاريخ غير متاحة حاليًا.
          </p>

          <template v-else>
            <section
              v-for="section in sections"
              :key="section.key"
              class="reading-section"
            >
              <h2>{{ section.title }}</h2>

              <p v-if="!readings[section.key].length">
                لا توجد قراءة مسجّلة لهذا التاريخ.
              </p>

              <article
                v-for="(passage, passageIndex) in readings[section.key]"
                :key="passageIndex"
                class="passage"
              >
                <h3><bdi
          v-for="(part, index) in referenceParts(passage.reference)"
          :key="index"
          :dir="part.dir"
          class="reference-part"
        >{{ part.text }}</bdi></h3>

                <p v-if="passage.incomplete" role="status">
                  {{ passage.verses.length
                    ? 'بعض آيات القراءة غير متاحة حاليًا.'
                    : 'نص القراءة غير متاح حاليًا.' }}
                </p>

                <div
                  v-for="(verse, verseIndex) in passage.verses"
                  :key="verseIndex"
                  class="verse"
                >
                  <button
                    type="button"
                    class="verse-button"
                    :aria-expanded="activeVerse === verse"
                    @click="toggleVerse(verse)"
                  >
                    <span class="verse-number">{{ verse.number }}</span>
                    <span class="verse-text">{{ verse.text }}</span>
                    <ion-icon
                      :icon="activeVerse === verse
                        ? chevronUpOutline
                        : chevronDownOutline"
                      aria-hidden="true"
                    />
                  </button>

                  <div
                    v-if="activeVerse === verse"
                    class="tafsir"
                    aria-live="polite"
                  >
                    {{ tafsirText }}
                  </div>
                </div>
              </article>
            </section>
          </template>
        </div>
      </ion-content>
    </ion-modal>
  <ion-modal
    class="liturgy-calendar-modal"
    :is-open="datePickerOpen"
    @didPresent="fixCalendarChevrons"
    @didDismiss="closeCalendar"
  >
    <ion-header dir="rtl">
      <ion-toolbar>
        <ion-title>اختاري تاريخ القراءة</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="datePickerOpen = false">إغلاق</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding" dir="rtl">
      <ion-datetime
        ref="calendar"
        presentation="date"
        locale="en-US"
        dir="rtl"
        :value="selectedDate"
        :min="minDate"
        :max="maxDate"
        @ionChange="changeDate"
      />
    </ion-content>
  </ion-modal>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, shallowRef, watch } from 'vue'
import {
  IonButton,
  IonButtons,
  IonContent,
  IonDatetime,
  IonHeader,
  IonIcon,
  IonModal,
  IonTitle,
  IonToolbar,
} from '@ionic/vue'
import {
  bookOutline,
  calendarOutline,
  chevronForwardOutline,
  chevronBackOutline,
  chevronDownOutline,
  chevronUpOutline,
} from 'ionicons/icons'
import { getDailyDates } from '@/services/dailyDates'
import {
  getLiturgyReading,
  loadLiturgyPassages,
  type LiturgyPassage,
  type LiturgyVerse,
} from '@/services/liturgyReadings'
import { getVerseTafsir } from '@/services/bibleTafsir'

defineOptions({ inheritAttrs: false })

const props = defineProps<{
  dateIso?: string
  homeCopticDate?: string
  english?: boolean
}>()

const sections = [
  { key: 'mazmour', title: 'مزمور القداس' },
  { key: 'bible', title: 'إنجيل القداس' },
] as const

type Readings = Record<(typeof sections)[number]['key'], LiturgyPassage[]>

function todayIso(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `${now.getFullYear()}-${month}-${day}`
}

const minDate = '1900-01-01'
const maxDate = '2100-12-31'
const today = ref(todayIso())
const entryDate = computed(() => props.dateIso || today.value)
const selectedDate = ref(entryDate.value)
const open = ref(false)
const gospelReference = ref('')

const readings = shallowRef<Readings | null>(null)
const loading = ref(false)
const loadError = ref(false)
const retryCount = ref(0)

const activeVerse = shallowRef<LiturgyVerse | null>(null)
const tafsirText = ref('')
let tafsirRequest = 0

const dateForDisplay = computed(
  () => new Date(`${selectedDate.value}T12:00:00Z`),
)

const gregorianFormatter = new Intl.DateTimeFormat('ar-EG-u-ca-gregory', {
  timeZone: 'UTC',
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

const gregorianDate = computed(
  () => gregorianFormatter.format(dateForDisplay.value),
)

const datePickerOpen = ref(false)
const calendar = ref<{ $el: HTMLIonDatetimeElement } | null>(null)
let calendarObserver: MutationObserver | undefined

async function fixCalendarChevrons() {
  calendarObserver?.disconnect()
  const picker = calendar.value?.$el
  await picker?.componentOnReady?.()
  const root = picker?.shadowRoot
  if (!datePickerOpen.value || !root) return

  function applyDirection() {
    // The app's RTL ancestor can mirror the month icons inside Ionic's shadow DOM.
    root?.querySelectorAll<HTMLIonIconElement>('.calendar-next-prev ion-icon')
      .forEach(icon => { icon.flipRtl = false })
  }

  applyDirection()
  calendarObserver = new MutationObserver(applyDirection)
  calendarObserver.observe(root, { childList: true, subtree: true })
}

function closeCalendar() {
  calendarObserver?.disconnect()
  calendarObserver = undefined
  datePickerOpen.value = false
}

onBeforeUnmount(() => calendarObserver?.disconnect())
const sheetCopticDate = ref('')
const copticLoading = ref(false)

const copticDate = computed(() => {
  if (selectedDate.value === props.dateIso && props.homeCopticDate) {
    return props.homeCopticDate
  }

  return sheetCopticDate.value
})

watch([open, selectedDate], async ([visible, dateIso], _, onCleanup) => {
  sheetCopticDate.value = ''
  copticLoading.value = false
  if (!visible) return
  if (dateIso === props.dateIso && props.homeCopticDate) return

  let current = true
  onCleanup(() => { current = false })
  copticLoading.value = true

  try {
    const dates = await getDailyDates(dateIso, 'ar')
    if (current) sheetCopticDate.value = dates?.coptic ?? ''
  } catch (error) {
    console.warn('Could not load the Coptic date from the Home sheet', error)
  } finally {
    if (current) copticLoading.value = false
  }
})

function referenceParts(reference: string) {
  return reference
    .split(/(\d+\s*:\s*\d+(?:\s*[–—-]\s*(?:\d+\s*:\s*)?\d+)?)/g)
    .filter(Boolean)
    .map(text => {
      if (!/^\d+\s*:/.test(text)) return { text, dir: 'rtl' as const }

      return {
        text: text.replace(/\s*:\s*/g, ' : ').replace(/\s*[–—-]\s*/g, ' – '),
        dir: 'rtl' as const,
      }
    })
}

function shiftDay(offset: number) {
  const day = new Date(`${selectedDate.value}T12:00:00Z`)
  day.setUTCDate(day.getUTCDate() + offset)
  const next = day.toISOString().slice(0, 10)
  if (next >= minDate && next <= maxDate) selectedDate.value = next
}

function goToToday() {
  today.value = todayIso()
  selectedDate.value = today.value
}

watch(entryDate, async (dateIso, _, onCleanup) => {
  let current = true
  onCleanup(() => { current = false })
  gospelReference.value = ''

  try {
    const day = await getLiturgyReading(dateIso)
    if (current) gospelReference.value = day?.gospelReference ?? ''
  } catch {
    // The button stays available so the reader can retry or pick a date.
  }
}, { immediate: true })

function openReadings() {
  today.value = todayIso()
  selectedDate.value = entryDate.value
  open.value = true
}

function closeReadings() {
  closeCalendar()
  open.value = false
}

function changeDate(event: CustomEvent<{ value?: string | string[] | null }>) {
  const { value } = event.detail
  if (typeof value !== 'string') return

  const dateIso = value.slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateIso)) return

  selectedDate.value = dateIso
  datePickerOpen.value = false
}

watch([open, selectedDate, retryCount], async ([visible, dateIso], _, onCleanup) => {
  activeVerse.value = null
  tafsirRequest++

  if (!visible) return

  let current = true
  onCleanup(() => { current = false })

  loading.value = true
  loadError.value = false
  readings.value = null

  try {
    const day = await getLiturgyReading(dateIso)
    if (!current) return

    if (dateIso === entryDate.value) {
      gospelReference.value = day?.gospelReference ?? ''
    }
    if (!day) return

    const [mazmour, bible] = await Promise.all([
      loadLiturgyPassages(day.mazmour),
      loadLiturgyPassages(day.bible),
    ])

    if (current) readings.value = { mazmour, bible }
  } catch {
    if (current) loadError.value = true
  } finally {
    if (current) loading.value = false
  }
})

async function toggleVerse(verse: LiturgyVerse) {
  const request = ++tafsirRequest

  if (activeVerse.value === verse) {
    activeVerse.value = null
    return
  }

  activeVerse.value = verse
  tafsirText.value = 'جاري تحميل التفسير…'

  try {
    const text = await getVerseTafsir(verse.bookKey, verse.chapter, verse.number)

    if (request === tafsirRequest) {
      tafsirText.value = text || 'لا يوجد تفسير لهذه الآية حاليًا.'
    }
  } catch {
    if (request === tafsirRequest) {
      tafsirText.value = 'تعذّر تحميل التفسير. اقفل التفسير وافتحه للمحاولة مرة أخرى.'
    }
  }
}
</script>

<style scoped>
.liturgy-cta {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  height: 100%;
  min-height: 98px;
  padding: 18px;
  border: 1px solid var(--day-border, #dadef0);
  border-radius: 22px;
  background: linear-gradient(120deg, var(--day-surface, #fff), var(--day-background, #f3f4fa));
  background: linear-gradient(
    120deg,
    var(--day-surface, #fff),
    color-mix(in srgb, var(--day-background, #f3f4fa) 82%, #fff0a6)
  );
  box-shadow: 0 6px 20px rgb(24 42 68 / 6%);
  color: var(--day-text, #343d70);
  font: inherit;
  text-align: start;
  cursor: pointer;
}

.liturgy-cta-icon,
.liturgy-cta-arrow {
  display: grid;
  place-items: center;
  background: var(--day-surface, #fff);
  color: var(--day-primary, #4d5793);
}

.liturgy-cta-icon {
  flex: 0 0 60px;
  height: 60px;
  border: 1px solid var(--day-border, #dadef0);
  border-radius: 20px;
  font-size: 30px;
}

.liturgy-cta-arrow {
  flex: 0 0 34px;
  height: 34px;
  border-radius: 50%;
  font-size: 18px;
}

.liturgy-cta-copy,
.liturgy-date-copy {
  display: grid;
  flex: 1;
  gap: 4px;
  min-width: 0;
}

.liturgy-cta-copy strong {
  color: var(--day-primary, #4d5793);
  font-size: 1.25em;
  font-weight: 800;
}

.liturgy-cta-reference {
  color: var(--day-muted, #596f7a);
  font-size: 0.95em;
  line-height: 1.55;
}

.liturgy-cta:active {
  transform: scale(0.98);
}

.reference-part[dir="rtl"] {
  unicode-bidi: isolate;
  white-space: nowrap;
}

.liturgy-modal {
  --reading-accent: #535d99;
  --reading-surface: var(--ion-item-background, var(--ion-background-color, #fff));
  --reading-border: color-mix(in srgb, var(--reading-surface) 78%, var(--reading-accent));
}

.liturgy-modal ion-toolbar {
  --background: var(--reading-surface);
  --border-color: var(--reading-border);
}

.liturgy-modal ion-content {
  --background: var(--ion-background-color, #f4f5fb);
  --background:
    radial-gradient(ellipse at top right, #fff1a62e, transparent 52%),
    color-mix(in srgb, var(--ion-background-color, #fff) 92%, var(--reading-accent));
}

.readings {
  max-width: 48rem;
  margin-inline: auto;
}

.date-navigation {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) 44px;
  align-items: center;
  gap: 0.35rem;
  margin-block-end: 1.1rem;
  padding: 0.3rem;
  border: 1px solid var(--ion-color-light-shade, #dadef0);
  border-radius: 1.15rem;
  background: color-mix(in srgb, var(--reading-surface) 88%, #fff0a6);
}

.liturgy-date, .day-arrow, .today-button {
  border-radius: 0.85rem;
  background: var(--ion-background-color, #fff);
  color: var(--ion-text-color, #343d70);
  font: inherit;
}

.liturgy-date {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  min-width: 0;
  padding: 0.65rem;
  text-align: start;
}

.liturgy-date > ion-icon, .day-arrow, .today-button {
  color: var(--ion-color-primary, #4d5793);
}

.liturgy-date time {
  font-weight: 700;
}

.liturgy-date-copy > span {
  color: var(--ion-color-medium, #596f7a);
  font-size: 0.85em;
}

.day-arrow {
  display: grid;
  place-items: center;
  min-height: 44px;
  font-size: 1.15rem;
}

.day-arrow:disabled {
  opacity: 0.45;
}

.today-row {
  margin-block: -0.45rem 1.2rem;
  text-align: center;
}

.today-button {
  min-height: 40px;
  padding-inline: 1.1rem;
  border: 1px solid var(--ion-color-light-shade, #dadef0);
  font-weight: 700;
}

.liturgy-calendar-modal ion-content {
  --background: var(--ion-background-color, #fff);
  --background: color-mix(in srgb, var(--ion-background-color, #fff) 92%, #fff0a6);
}

.liturgy-calendar-modal ion-datetime {
  --background: var(--ion-item-background, var(--ion-background-color, #fff));
  margin-inline: auto;
  border: 1px solid var(--ion-color-light-shade, #dadef0);
  border-radius: 1.25rem;
}

.liturgy-calendar-modal ion-datetime::part(calendar-day active) {
  background: var(--ion-color-primary, #4d5793);
  color: var(--ion-color-primary-contrast, #fff);
}

.liturgy-calendar-modal ion-datetime::part(calendar-day today) {
  font-weight: 700;
}

.reading-section + .reading-section {
  margin-block-start: 1.65rem;
}

.reading-section > h2 {
  margin-block: 0 0.7rem;
  padding-inline-start: 0.6rem;
  border-inline-start: 3px solid var(--reading-accent);
  font-size: 1.12rem;
}

.passage {
  padding: 0.85rem 1rem;
  border: 1px solid var(--ion-color-light-shade, #dadef0);
  border-radius: 1rem;
  background: var(--reading-surface);
  border-color: var(--reading-border);
  box-shadow: 0 6px 18px rgb(45 48 84 / 6%);
}

.passage + .passage {
  margin-block-start: 0.75rem;
}

.passage h3 {
  margin-block: 0.15rem 0.45rem;
  color: var(--ion-color-primary, #4d5793);
  font-size: 1rem;
  line-height: 1.65;
}

.verse + .verse {
  border-block-start: 1px solid var(--ion-color-light-shade, #dadef0);
}

.verse-button {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: start;
  gap: 0.65rem;
  width: 100%;
  padding: 0.75rem 0;
  background: transparent;
  color: inherit;
  text-align: start;
  font: inherit;
  font-size: 1.1rem;
  line-height: 1.8;
}

.verse-number {
  min-width: 2rem;
  margin-block-start: 0.3rem;
  padding: 0.25rem 0.4rem;
  border: 1px solid rgb(31 182 170 / 24%);
  border-radius: 12px;
  background: rgb(31 182 170 / 12%);
  color: var(--mk-text, var(--ion-text-color, #0b2b40));
  font: 800 0.9rem/1.25 system-ui, sans-serif;
  text-align: center;
}

.verse-text {
  font-family: "Scheherazade New", "Noto Naskh Arabic", serif;
  color: var(--mk-text, var(--ion-text-color, #0b2b40));
  font-size: 1.375rem;
  font-weight: 800;
  line-height: 1.95;
  white-space: pre-wrap;
}

.verse-button > ion-icon {
  margin-block-start: 0.55rem;
}

.tafsir {
  font-family: "Noto Kufi Arabic", system-ui, sans-serif;
  font-size: 1.375rem;
  margin-block-end: 0.5rem;
  padding: 0.75rem;
  border-inline-start: 3px solid var(--reading-accent);
  border-radius: 0.65rem;
  background: color-mix(in srgb, var(--reading-surface) 91%, var(--reading-accent));
  white-space: pre-line;
  line-height: 1.7;
}

button:focus-visible {
  outline: 2px solid var(--ion-color-primary, #4d5793);
  outline-offset: 3px;
}

@media (max-width: 650px) {
  .liturgy-cta {
    gap: 0.4rem;
    min-height: 82px;
    padding: 0.6rem;
  }

  .liturgy-cta-icon {
    flex-basis: 32px;
    height: 32px;
    border-radius: 10px;
    font-size: 18px;
  }

  .liturgy-cta-arrow {
    flex-basis: 20px;
    height: 20px;
    font-size: 14px;
  }

  .liturgy-cta-copy strong, .liturgy-cta-reference {
    font-size: 0.8em;
  }
}
</style>
