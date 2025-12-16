<template>
  <ion-page :class="['home', themeClass]" dir="rtl">
    <ion-content :fullscreen="true" class="content">
      <!-- خلفية -->
      <div class="bg"></div>

      <div class="wrap">
        <!-- Header -->
        <div class="header">
          <!-- زر الإعدادات -->
          <ion-button class="settingsBtn" fill="clear" size="small" @click="showSettings = true">
            <ion-icon :icon="settingsOutline" />
          </ion-button>


          <div class="brand">
            معًا كل يوم <span class="accent">مع</span> القمص يوحنا باقي
          </div>

          <!-- التاريخ (ضغط = Date picker) -->
          <div class="dates" @click="showDatePicker = true">
            {{ gregorianDate }} – {{ copticDate }}
          </div>

           <!-- السنكسار -->
          <div class="saint">
            {{ saint }}
          </div>

          <div class="title">
            {{ title }}
          </div>

        </div>



        <!-- القصة -->
        <div class="card">
          <p class="text alignRight">{{ story }}</p>
        </div>

        <!-- الآية -->
        <div class="verse">
          <div class="verse-text">"{{ verseText }}"</div>
          <div class="verse-ref">{{ verseRef }}</div>
        </div>

        <!-- التأمل -->
        <div class="card">
          <p class="text alignRight">{{ reflection }}</p>
        </div>

        <!-- الأجبية + الكتاب المقدس -->
        <div class="row">
          <!-- الكتاب المقدس (ضغط يفتح الإصحاح) -->
          <button class="mini-card mini-click" type="button" @click="openChapter()">
            <div class="mini-head">الكتاب المقدس</div>
            <div class="mini-sub">{{ previewLabel }}</div>
<div class="mini-title">{{ previewTitle }}</div>
<ul class="mini-list">
  <li v-for="(item, i) in previewSections" :key="i">
    {{ item }}
  </li>
</ul>

          </button>

          <!-- الأجبية -->
          <div class="mini-card">
            <div class="mini-head">الأجبية</div>
            <p class="mini-body alignRight">{{ agbia }}</p>
            <div class="mini-author" v-if="agbia_author">{{ agbia_author }}</div>
          </div>
        </div>

        <!-- التدريب -->
        <div class="training">
          <div class="training-pill">التدريب</div>
          <div class="training-text alignRight">{{ training }}</div>
        </div>

        <div class="space"></div>
      </div>

      <!-- Date Picker Modal -->
      <ion-modal :is-open="showDatePicker" @didDismiss="showDatePicker = false">
        <ion-header>
          <ion-toolbar>
            <ion-title>اختاري يوم</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="showDatePicker = false">إغلاق</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>

        <ion-content class="ion-padding">
          <ion-datetime
            presentation="date"
            :value="selectedDateISO"
            :max="todayISO()"
            @ionChange="onDateChange"
          />
          <div class="hint">
            لا يمكن اختيار أيام بعد تاريخ اليوم.
          </div>
        </ion-content>
      </ion-modal>

      <!-- Settings Modal -->
      <ion-modal :is-open="showSettings" @didDismiss="showSettings = false">
        <ion-header>
          <ion-toolbar>
            <ion-title>الإعدادات</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="showSettings = false">إغلاق</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>

        <ion-content class="ion-padding">
          <div class="settingsRow">
            <div class="settingsLabel">الوضع الليلي</div>
            <ion-toggle :checked="theme === 'dark'" @ionChange="toggleTheme" />
          </div>

          <div class="settingsRow">
            <div class="settingsLabel">حجم الخط</div>
            <div class="rangeWrap">
              <ion-range
                :min="0.85"
                :max="1.2"
                :step="0.05"
                :value="fontScale"
                @ionChange="onFontScale"
              />
              <div class="rangeValue">{{ fontScale.toFixed(2) }}x</div>
            </div>
          </div>

          <div class="hint">
            الإعدادات بتتخزن تلقائيًا على الجهاز.
          </div>
        </ion-content>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonContent,
  IonPage,
  IonModal,
  IonDatetime,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonToggle,
  IonRange
} from '@ionic/vue'
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import Papa from 'papaparse'
import { settingsOutline } from 'ionicons/icons'

type ChapterPreview = {
  bookName: string
  chapter: number
  chapterTitle: string
  sections: { title: string }[]
}
const CONTENT_BASE =
  'https://nancyhenry89.github.io/ma3ankolyoum/src/content'

const router = useRouter()

const SHEET_CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vRzBoz5JKy5BfRIXlo_rOSIYsce_9oXsLG9R07CvC3-MztLmg3vv7EYoNLFdt9YmL21tv8XYevOxedh/pub?gid=0&single=true&output=csv'

// ====== تاريخ اليوم بتوقيت مصر ======
function todayISO(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo' }).format(new Date())
}

// ====== Theme + Font scale (persist) ======
type ThemeMode = 'light' | 'dark'
const theme = ref<ThemeMode>((localStorage.getItem('mk_theme') as ThemeMode) || 'light')
const fontScale = ref<number>(Number(localStorage.getItem('mk_fontScale') || '1'))

const themeClass = computed(() => (theme.value === 'dark' ? 'theme-dark' : 'theme-light'))

function applyPrefs() {
  document.documentElement.style.setProperty('--mk-fontScale', String(fontScale.value))
  document.documentElement.setAttribute('data-mk-theme', theme.value)
}
function toggleTheme(ev: any) {
  theme.value = ev.detail.checked ? 'dark' : 'light'
  localStorage.setItem('mk_theme', theme.value)
  applyPrefs()
}
function onFontScale(ev: any) {
  fontScale.value = Number(ev.detail.value || 1)
  localStorage.setItem('mk_fontScale', String(fontScale.value))
  applyPrefs()
}

// ====== Date picker ======
const showDatePicker = ref(false)
const selectedDateISO = ref(todayISO())

function onDateChange(ev: any) {
  const iso = String(ev.detail.value || '').substring(0, 10)
  if (!iso) return
  if (iso > todayISO()) return // منع المستقبل
  selectedDateISO.value = iso
  showDatePicker.value = false
  loadByDate(iso)
}

// ====== Settings modal ======
const showSettings = ref(false)

// ====== Data state ======
const gregorianDate = ref('')
const copticDate = ref('')
const saint = ref('')
const title = ref('')
const story = ref('')
const verseText = ref('')
const verseRef = ref('')
const reflection = ref('')

const bibleBookKey = ref('') // Matthew
const bibleChapter = ref<number>(1)
const bibleTitle = ref('')
const bibleItems = ref<string[]>([])

const agbia = ref('')
const agbia_author = ref('')
const training = ref('')
const chapterPreview = ref<ChapterPreview | null>(null)

// عرض "متى ١"
const bookNameMap: Record<string, string> = {
  Matthew: 'متى'
}
const bibleLabel = computed(() => {
  const name = bookNameMap[bibleBookKey.value] || bibleBookKey.value || ''
  const ch = bibleChapter.value || ''
  return name && ch ? `${name} ${ch}` : ''
})
const previewLabel = computed(() => {
  if (!chapterPreview.value) return bibleLabel.value
  return `${chapterPreview.value.bookName} ${chapterPreview.value.chapter}`
})

const previewTitle = computed(() => chapterPreview.value?.chapterTitle || bibleTitle.value)

const previewSections = computed(() => {
  const list = chapterPreview.value?.sections?.map(s => s.title).filter(Boolean) || []
  return list.length ? list : bibleItems.value
})

// ====== Helpers: normalize row keys (حل مشكلة المسافات/الحروف) ======
function normalizeKeys(row: any) {
  const out: Record<string, any> = {}
  Object.keys(row || {}).forEach(k => {
    const nk = String(k).trim().toLowerCase().replace(/\s+/g, '_')
    out[nk] = row[k]
  })
  return out
}
function pick(row: any, ...keys: string[]) {
  for (const k of keys) {
    const kk = k.trim().toLowerCase().replace(/\s+/g, '_')
    if (row[kk] !== undefined && row[kk] !== null && String(row[kk]).trim() !== '') {
      return row[kk]
    }
  }
  return ''
}

// ====== cache rows ======
const rowsCache = ref<any[] | null>(null)

async function fetchRows() {
  if (rowsCache.value) return rowsCache.value

  const res = await fetch(SHEET_CSV_URL, { cache: 'no-store' })
  const csv = await res.text()

  const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true })
  const rows = (parsed.data as any[])
    .map(r => normalizeKeys(r))
    .filter(r => r.date_iso)

  rowsCache.value = rows
  return rows
}

async function loadChapterPreview(bookKey: string, chapter: number) {
  try {
    const slug = String(bookKey || 'Matthew').toLowerCase()
    const url = `${CONTENT_BASE}/bible/${slug}/${chapter}.json`

    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) {
      console.warn('Preview JSON not found:', url)
      chapterPreview.value = null
      return
    }

    const json = await res.json()
    chapterPreview.value = {
      bookName: String(json.bookName || ''),
      chapter: Number(json.chapter || chapter),
      chapterTitle: String(json.chapterTitle || ''),
      sections: (json.sections || []).map((s: any) => ({ title: String(s.title || '') }))
    }
  } catch (e) {
    console.error('Failed to load chapter preview', e)
    chapterPreview.value = null
  }
}


function applyRow(rowRaw: any) {
  const row = normalizeKeys(rowRaw)

  gregorianDate.value = pick(row, 'gregorian', 'gregorian_date')
  copticDate.value = pick(row, 'coptic', 'coptic_date')
  saint.value = pick(row, 'saint')
  title.value = pick(row, 'title')
  story.value = pick(row, 'story')
  verseText.value = pick(row, 'verse_text', 'verse')
  const vr = pick(row, 'verse_ref', 'verse_reference')
  verseRef.value = vr ? `(${vr})` : ''
  reflection.value = pick(row, 'reflection')

  bibleBookKey.value = pick(row, 'bible_book', 'book_key') || 'Matthew'
  bibleChapter.value = Number(pick(row, 'bible_chapter', 'chapter') || 1)
  bibleTitle.value = pick(row, 'bible_title', 'chapter_title')

  const items = pick(row, 'bible_items', 'items')
  bibleItems.value = String(items || '')
    .split('|')
    .map((s: string) => s.trim())
    .filter(Boolean)

  agbia.value = pick(row, 'agbia')
  agbia_author.value = pick(row, 'agbia_author', 'agbiaauthor', 'agbia_author_name', 'agbia_author_ar')
  training.value = pick(row, 'training')

loadChapterPreview(bibleBookKey.value || 'Matthew', bibleChapter.value || 1)

}

async function loadByDate(dateISO: string) {
  const rows = await fetchRows()
  const maxISO = todayISO()
  const allowed = rows.filter(r => String(r.date_iso).trim() <= maxISO)

  const found =
    allowed.find(r => String(r.date_iso).trim() === dateISO) ||
    allowed[allowed.length - 1] ||
    null

  if (!found) return
  applyRow(found)
}

function openChapter() {
  const bookKey = bibleBookKey.value || 'Matthew'
  const ch = bibleChapter.value || 1
  router.push(`/chapter/${bookKey}/${ch}`)
}

onMounted(() => {
  applyPrefs()
  loadByDate(selectedDateISO.value).catch(console.error)
})
</script>

<style scoped>
/* ================== Theme variables ================== */
.home.theme-light {
  --mk-bg1: #f4f7fb;
  --mk-bg2: #ffffff;

  --mk-text: #0b1f33;
  --mk-card: #ffffff;

  --mk-accent: #20b2aa;   /* teal */
  --mk-dark: #182a44;     /* indigo/navy */
  --mk-danger: #d64545;

  --mk-border: rgba(24,42,68,0.10);
  --mk-shadow: 0 8px 18px rgba(10,20,30,0.07);
  --mk-shadow-strong: 0 14px 28px rgba(10,20,30,0.10);

  --mk-soft: rgba(32,178,170,0.12);
  --mk-soft-border: rgba(32,178,170,0.28);
}

.home.theme-dark {
  --mk-bg1: #060b12;
  --mk-bg2: #0b1220;

  --mk-text: #f5f7fa;            /* ✅ نص فاتح */
  --mk-card: rgba(255,255,255,0.08);

  --mk-accent: #28d6cc;
  --mk-dark: #0f1b2f;
  --mk-danger: #ff7a7a;

  --mk-border: rgba(255,255,255,0.14);
  --mk-shadow: 0 14px 28px rgba(0,0,0,0.45);
  --mk-shadow-strong: 0 18px 34px rgba(0,0,0,0.60);

  --mk-soft: rgba(40,214,204,0.20);
  --mk-soft-border: rgba(40,214,204,0.35);
}

/* ================== Base ================== */
.home {
  font-family: "Noto Naskh Arabic", system-ui, sans-serif;
  letter-spacing: 0;
}

.content {
  color: var(--mk-text);
}

/* اجبار لون النص في الدارك على العناصر المهمة */
.home.theme-dark,
.home.theme-dark .content,
.home.theme-dark .text,
.home.theme-dark .mini-body,
.home.theme-dark .mini-list,
.home.theme-dark .mini-sub,
.home.theme-dark .brand,
.home.theme-dark .title {
  color: var(--mk-text);
}

/* خلفية */
.bg {
  position: fixed;
  inset: 0;
  background:
    radial-gradient(1200px 600px at 20% -10%, rgba(32,178,170,0.22), transparent 60%),
    radial-gradient(900px 500px at 90% 0%, rgba(24,42,68,0.18), transparent 55%),
    linear-gradient(to bottom, var(--mk-bg1), var(--mk-bg2));
  z-index: 0;
}

.wrap {
  position: relative;
  z-index: 1;
  padding: calc(env(safe-area-inset-top) + 22px) 16px 0;
  max-width: 720px;
  margin: 0 auto;
  transform: scale(var(--mk-fontScale, 1));
  transform-origin: top center;
}

/* ================== Header ================== */
.header {
  text-align: center;
  margin-bottom: 14px;
  position: relative;
}

.settingsBtn {
  position: absolute;
  top: -4px;
  left: 0;
  color: var(--mk-text);
  background: rgba(255,255,255,0.60);
  border-radius: 12px;
  backdrop-filter: blur(8px);
}

.home.theme-dark .settingsBtn {
  background: rgba(0,0,0,0.30);
}

.brand,
.title,
.mini-head {
  font-family: "Noto Kufi Arabic", system-ui, sans-serif; /* ✅ بدون Cairo */
}

.brand {
  font-size: 20px;
  font-weight: 900;
  color: var(--mk-text);
}

.brand .accent {
  color: var(--mk-accent);
}

.dates {
  margin-top: 6px;
  font-size: 16px;
  font-weight: 800;
  cursor: pointer;
  text-decoration: underline;
  opacity: 0.9;
  color: var(--mk-text);
}

.saint {
  margin: 10px 0;
  padding: 10px 12px;
  border-radius: 16px;
  font-size: 18px;
  font-weight: 900;
  background: var(--mk-soft);
  border: 1px solid var(--mk-soft-border);
  color: var(--mk-text);
}

.home.theme-dark .saint {
  background: rgba(40,214,204,0.22);
  color: #eafefe;
  border: 1px solid rgba(40,214,204,0.35);
}

.title {
  margin-top: 10px;
  font-size: 38px;
  line-height: 1.2;
  font-weight: 900;
  color: var(--mk-text);
}

/* ================== Cards ================== */
.card,
.mini-card {
  background: var(--mk-card);
  border-radius: 18px;
  border: 1px solid var(--mk-border);
  box-shadow: var(--mk-shadow);
}

.home.theme-dark .card,
.home.theme-dark .mini-card {
  background: rgba(255,255,255,0.06);
}

.card {
  padding: 20px 18px;
  margin: 12px 0;
}

.text {
  font-size: 21px;
  line-height: 2;
  color: var(--mk-text);
}

.alignRight {
  text-align: right;
}

/* ================== Verse (Amiri only here) ================== */
.verse {
  background:
    radial-gradient(600px 200px at 20% 0%, rgba(32,178,170,0.35), transparent 60%),
    linear-gradient(135deg, var(--mk-dark), rgba(16,27,47,0.90));
  border-radius: 16px;
  padding: 14px;
  text-align: center;
  margin: 12px 0;
  position: relative;
  overflow: hidden;
  box-shadow: var(--mk-shadow-strong);
}

.verse::before {
  content: "“";
  position: absolute;
  top: -18px;
  right: 14px;
  font-size: 90px;
  opacity: 0.14;
  color: #fff;
  font-family: "Amiri", serif;
}

.verse-text {
  font-family: "Amiri", "Noto Naskh Arabic", serif;
  font-size: 20px;
  font-weight: 400;
  line-height: 2;
  color: #ffffff; /* ✅ forced white for contrast */
}

.verse-ref {
  margin-top: 6px;
  font-family: "Amiri", "Noto Naskh Arabic", serif;
  font-size: 16px;
  color: var(--mk-accent);
  font-weight: 700;
}

/* ================== Row cards ================== */
.row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 12px;
}

.mini-card {
  padding: 14px;
  text-align: center;
}

.mini-click {
  width: 100%;
  cursor: pointer;
}

.mini-card.mini-click {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.mini-head {
  background: var(--mk-dark);
  color: #ffffff;
  border-radius: 12px;
  padding: 10px;
  font-size: 20px;
  font-weight: 900;
  width: 100%;
}

.mini-sub {
  margin-top: 10px;
  font-size: 16px;
  font-weight: 900;
  text-decoration: underline;
  opacity: 0.95;
  color: var(--mk-text);
}

.mini-title {
  font-size: 18px;
  font-weight: 900;
  color: var(--mk-danger);
  margin-top: 6px;
}

.mini-list {
  list-style: disc;
  list-style-position: inside;
  padding: 0 10px;
  margin: 10px 0 0;
  text-align: right;
  font-size: 15px;
  line-height: 1.9;
  color: var(--mk-text);
  opacity: 0.95;
}

.mini-list li {
  margin: 4px 0;
  display: list-item;
}

.mini-body {
  font-size: 19px;
  line-height: 2;
  margin-top: 10px;
  color: var(--mk-text);
}

.mini-author {
  margin-top: 8px;
  font-weight: 900;
  color: var(--mk-danger);
}

/* ================== Training ================== */
.training {
  background:
    radial-gradient(700px 240px at 15% 0%, rgba(32,178,170,0.30), transparent 65%),
    linear-gradient(135deg, var(--mk-dark), rgba(16,27,47,0.92));
  border-radius: 16px;
  padding: 14px;
  margin-top: 14px;
  text-align: center;
  box-shadow: var(--mk-shadow-strong);
}

.training-pill {
  background: var(--mk-accent);
  color: #081a25;
  font-weight: 900;
  border-radius: 12px;
  padding: 8px 14px;
  font-size: 20px;
  display: inline-block;
  margin-bottom: 8px;
}

.training-text {
  font-size: 19px;
  line-height: 2;
  font-weight: 800;
  color: #ffffff;
}

.space {
  height: 24px;
}

.hint {
  margin-top: 12px;
  font-size: 14px;
  opacity: 0.8;
  text-align: center;
}

/* ================== Settings modal ================== */
.settingsRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 12px 0;
  border-bottom: 1px solid rgba(0,0,0,0.08);
}
.home.theme-dark .settingsRow {
  border-bottom-color: rgba(255,255,255,0.12);
}
.settingsLabel {
  font-weight: 800;
}

.rangeWrap {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 220px;
}
.rangeValue {
  font-weight: 800;
  min-width: 48px;
  text-align: left;
}

/* ================== Mobile ================== */
@media (max-width: 420px) {
  .title { font-size: 34px; }
  .row { grid-template-columns: 1fr; }
}

</style>
