<template>
  <ion-page :class="['home', themeClass]" dir="rtl">
    <ion-content :fullscreen="true" class="ion-padding-top">

      <div class="bg"></div>

      <!-- Settings icon -->
      <div class="settings-btn" @click="showSettings = true">⚙️</div>

      <div class="wrap">
        <!-- Header -->
        <div class="header">
          <div class="brand">
            معًا كل يوم <span class="accent">مع</span> القمص يوحنا باقي
          </div>

          <!-- Click dates to open date picker -->
          <div class="dates" @click="showPicker = true">
            {{ gregorianDate }} – {{ copticDate }}
          </div>

          <div class="title">{{ title }}</div>
        </div>

        <!-- Story -->
        <div class="card">
          <p class="text">{{ story }}</p>
        </div>

        <!-- Verse -->
        <div class="verse">
          <div class="verse-text">"{{ verseText }}"</div>
          <div class="verse-ref">{{ verseRef }}</div>
        </div>

        <!-- Reflection -->
        <div class="card">
          <p class="text">{{ reflection }}</p>
        </div>

        <!-- Bible + Agbia -->
        <div class="row">
          <div class="mini-card">
            <div class="mini-head">الكتاب المقدس</div>
            <div class="mini-sub">{{ bibleBook }}</div>
            <div class="mini-title">{{ bibleTitle }}</div>
            <ul class="mini-list">
              <li v-for="(item, i) in bibleItems" :key="i">{{ item }}</li>
            </ul>
          </div>

          <div class="mini-card">
            <div class="mini-head">الأجبية</div>
            <p class="mini-body">{{ agbia }}</p>
          </div>
        </div>

        <!-- Training -->
        <div class="training">
          <div class="training-pill">التدريب</div>
          <div class="training-text">{{ training }}</div>
        </div>

        <div class="space"></div>
      </div>

      <!-- Date Picker Modal -->
      <ion-modal :is-open="showPicker" @didDismiss="showPicker = false">
        <ion-content class="ion-padding">
          <div class="modal-title">اختاري يوم</div>

          <ion-datetime
            presentation="date"
            :value="selectedDateISO"
            :max="todayISO()"
            @ionChange="onDateChange"
          />

          <div class="modal-actions">
            <ion-button expand="block" @click="showPicker = false">إغلاق</ion-button>
          </div>
        </ion-content>
      </ion-modal>

      <!-- Settings Modal (Theme + Font) -->
      <ion-modal :is-open="showSettings" @didDismiss="showSettings = false">
        <ion-content class="ion-padding">
          <div class="modal-title">الإعدادات</div>

          <div class="settings-group">
            <div class="settings-label">الوضع</div>
            <ion-segment v-model="theme">
              <ion-segment-button value="light">
                <ion-label>فاتح</ion-label>
              </ion-segment-button>
              <ion-segment-button value="dark">
                <ion-label>غامق</ion-label>
              </ion-segment-button>
            </ion-segment>
          </div>

          <div class="settings-group">
            <div class="settings-label">حجم الخط</div>
            <ion-range
              :min="14"
              :max="28"
              :step="1"
              v-model="fontSize"
              pin="true"
            />
            <div class="settings-hint">الحجم الحالي: {{ fontSize }}px</div>
          </div>

          <div class="modal-actions">
            <ion-button expand="block" @click="showSettings = false">تم</ion-button>
          </div>
        </ion-content>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import Papa from 'papaparse'
import {
  IonButton,
  IonContent,
  IonDatetime,
  IonLabel,
  IonModal,
  IonPage,
  IonRange,
  IonSegment,
  IonSegmentButton
} from '@ionic/vue'

const SHEET_CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vRzBoz5JKy5BfRIXlo_rOSIYsce_9oXsLG9R07CvC3-MztLmg3vv7EYoNLFdt9YmL21tv8XYevOxedh/pub?gid=0&single=true&output=csv'

// ====== Date helper (Egypt timezone) ======
function todayISO(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo' }).format(new Date())
}

// ====== UI State ======
const showPicker = ref(false)
const showSettings = ref(false)

// Theme + Font size (persisted)
const theme = ref<'light' | 'dark'>((localStorage.getItem('mky_theme') as any) || 'light')
const fontSize = ref<number>(Number(localStorage.getItem('mky_font')) || 22)

watch(theme, v => localStorage.setItem('mky_theme', v))
watch(fontSize, v => localStorage.setItem('mky_font', String(v)))

const themeClass = computed(() => (theme.value === 'dark' ? 'theme-dark' : 'theme-light'))

// ====== Data State ======
const selectedDateISO = ref(todayISO())

const gregorianDate = ref('')
const copticDate = ref('')
const title = ref('')
const story = ref('')
const verseText = ref('')
const verseRef = ref('')
const reflection = ref('')
const bibleBook = ref('')
const bibleTitle = ref('')
const bibleItems = ref<string[]>([])
const agbia = ref('')
const training = ref('')

// Cache rows in memory to avoid re-fetch on each date change
const rowsCache = ref<any[] | null>(null)

async function fetchRowsOnce() {
  if (rowsCache.value) return rowsCache.value

  const res = await fetch(SHEET_CSV_URL, { cache: 'no-store' })
  const csv = await res.text()

  const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true })
  const rows = (parsed.data as any[]).filter(r => r?.date_iso)

  rowsCache.value = rows
  return rows
}

function applyRow(row: any) {
  gregorianDate.value = row.gregorian || ''
  copticDate.value = row.coptic || ''
  title.value = row.title || ''
  story.value = row.story || ''
  verseText.value = row.verse_text || ''
  verseRef.value = row.verse_ref ? `(${row.verse_ref})` : ''
  reflection.value = row.reflection || ''

  bibleBook.value = row.bible_book || ''
  bibleTitle.value = row.bible_title || ''
  bibleItems.value = (row.bible_items || '')
    .split('|')
    .map((s: string) => s.trim())
    .filter(Boolean)

  agbia.value = row.agbia || ''
  training.value = row.training || ''
}

async function loadByDate(dateISO: string) {
  const rows = await fetchRowsOnce()

  // Prevent future dates: if user somehow picks future, clamp to today
  const target = dateISO > todayISO() ? todayISO() : dateISO

  const row =
    rows.find(r => String(r.date_iso).trim() === target) ||
    rows[rows.length - 1]

  if (row) applyRow(row)
}

function onDateChange(ev: any) {
  const iso = ev.detail.value?.substring(0, 10)
  if (!iso) return
  selectedDateISO.value = iso
  showPicker.value = false
  loadByDate(iso)
}

// Apply font size globally via CSS variable
watch(fontSize, v => {
  document.documentElement.style.setProperty('--mky-font', `${v}px`)
})

// initial load
onMounted(async () => {
  document.documentElement.style.setProperty('--mky-font', `${fontSize.value}px`)
  await loadByDate(selectedDateISO.value)
})
</script>

<style scoped>
/* base */
.home {
  font-family: "Noto Naskh Arabic", "Noto Kufi Arabic", system-ui, sans-serif;
}

/* font size variable */
:global(html) {
  --mky-font: 22px;
}

/* themes */
.theme-light {
  --bg1: #eef4f8;
  --bg2: #ffffff;
  --text: #0b2b40;
  --card: rgba(255, 255, 255, 0.95);
  --shadow: rgba(0, 0, 0, 0.06);
  --accent: #1fb6aa;
  --dark: #0b2b40;
}

.theme-dark {
  --bg1: #071a26;
  --bg2: #0b2233;
  --text: #e9f2f7;
  --card: rgba(18, 42, 60, 0.92);
  --shadow: rgba(0, 0, 0, 0.35);
  --accent: #35d2c4;
  --dark: #04121b;
}

.bg {
  position: fixed;
  inset: 0;
  background: linear-gradient(to bottom, var(--bg1), var(--bg2));
  z-index: 0;
}

.wrap {
  position: relative;
  z-index: 1;
  padding: 32px 16px 0; /* كان 18px */
  max-width: 720px;
  margin: 0 auto;
}

/* settings button */
.settings-btn {
  position: fixed;
  top: 14px;
  left: 14px;
  z-index: 2;
  background: var(--card);
  border-radius: 12px;
  padding: 8px 10px;
  box-shadow: 0 6px 16px var(--shadow);
  cursor: pointer;
  user-select: none;
}

/* header */
.header {
  text-align: center;
  margin-bottom: 14px;
  color: var(--text);
}

.brand {
  font-size: 22px;
  font-weight: 800;
}
.brand .accent {
  color: var(--accent);
}

.dates {
  margin-top: 6px;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  opacity: 0.95;
}

.title {
  margin-top: 10px;
  font-size: 40px;
  font-weight: 900;
}

/* cards */
.card {
  background: var(--card);
  border-radius: 18px;
  padding: 18px 16px;
  margin: 12px 0;
  box-shadow: 0 8px 20px var(--shadow);
}

.text {
  font-size:  calc(var(--mky-font) - 4px);
  line-height: 1.9;
  text-align: right;
  color: var(--text);
}
/* verse */
.verse {
  background: var(--dark);
  border-radius: 16px;
  padding: 14px;
  text-align: center;
  color: #ffffff;
  margin: 12px 0;
}

.verse-text {
  font-size: calc(var(--mky-font) - 4px);
  font-weight: 700;
  line-height: 1.8;
}

.verse-ref {
  margin-top: 6px;
  font-size: calc(var(--mky-font) - 4px);
  color: var(--accent);
  font-weight: 800;
}

/* row */
.row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 12px;
}

.mini-card {
  background: var(--card);
  border-radius: 18px;
  padding: 14px;
  box-shadow: 0 8px 20px var(--shadow);
  text-align: center;
  color: var(--text);
}

.mini-head {
  background: var(--dark);
  color: #ffffff;
  border-radius: 12px;
  padding: 10px;
  font-size: 22px;
  font-weight: 900;
}

.mini-sub {
  margin-top: 10px;
  font-size: 18px;
  font-weight: 900;
}

.mini-title {
  font-size: 20px;
  font-weight: 900;
  color: #e23b3b;
}

.mini-list {
  margin: 8px 0 0;
  padding: 0 16px;
  text-align: right;
  font-size: 16px;
  line-height: 1.8;
}

.mini-body {
  font-size: calc(var(--mky-font) - 2px);
  line-height: 1.9;
  margin-top: 10px;
}

/* training */
.training {
  background: var(--dark);
  border-radius: 16px;
  padding: 14px;
  margin-top: 14px;
  text-align: center;
  color: #ffffff;
}

.training-pill {
  background: var(--accent);
  color: #0b2b40;
  font-weight: 900;
  border-radius: 12px;
  padding: 8px 14px;
  font-size: 22px;
  display: inline-block;
  margin-bottom: 8px;
}

.training-text {
  font-size: calc(var(--mky-font) - 2px);
  line-height: 1.9;
  font-weight: 800;
}

.space {
  height: 24px;
}

/* modal */
.modal-title {
  font-size: 22px;
  font-weight: 900;
  margin-bottom: 12px;
  text-align: center;
}

.modal-actions {
  margin-top: 14px;
}

/* mobile */
@media (max-width: 420px) {
  .title { font-size: 34px; }
  .row { grid-template-columns: 1fr; }
}
</style>
