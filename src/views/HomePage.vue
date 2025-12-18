<template>
  <ion-page :class="['home', themeClass]" dir="rtl">
    <ion-content :fullscreen="true" class="content">
      <div class="capture home" :class="themeClass" ref="captureRef">
        <!-- خلفية -->
    <div class="bg"></div>

    <div class="wrap">

  <!-- Header: Data -->
  <div class="header" v-if="!isLoading && !noData">
    <ion-button class="settingsBtn" fill="clear" size="small" @click="showSettings = true">
      <ion-icon :icon="settingsOutline" />
    </ion-button>
    <ion-button class="shareBtn" fill="clear" size="small" @click="showShareSheet = true">
  <ion-icon :icon="shareOutline" />
</ion-button>

<ion-action-sheet
  :is-open="showShareSheet"
  header="مشاركة"
  :cssClass="['share-sheet']"
  :buttons="shareButtons"
  @didDismiss="showShareSheet = false"
/>

    <div class="brand">
      معًا كل يوم <span class="accent">مع</span> القمص يوحنا باقي
    </div>

    <div class="dates" @click="showDatePicker = true">
      {{ gregorianDate }} – {{ copticDate }}
    </div>

    <div class="saint" @click="openSaint()">
      {{ saint }}
    </div>

    <div class="title">
      {{ title }}
    </div>
  </div>

  <!-- Header: Loading -->
  <div class="header" v-else-if="isLoading">
    <div class="brand skeleton"></div>
    <div class="dates skeleton"></div>
    <div class="saint skeleton"></div>
    <div class="title skeleton titleSk"></div>
  </div>

  <!-- Header: No data -->
  <div class="header" v-else>
    <div class="brand">معًا كل يوم</div>
    <div class="card" style="margin-top:12px">
      <p class="text alignRight">{{ noDataMsg || 'لا توجد بيانات متاحة لهذا اليوم.' }}</p>
    </div>
  </div>

  <!-- القصة -->
  <div class="card" v-if="!isLoading && !noData">
    <p class="text alignRight">{{ story }}</p>
  </div>
  <div class="card" v-else-if="isLoading">
    <div class="skeleton-line"></div>
    <div class="skeleton-line"></div>
    <div class="skeleton-line short"></div>
  </div>
  <!-- لو noData: مفيش داعي نكرر رسالة تاني لأن الهيدر already بيعرضها -->

  <!-- الآية -->
  <div class="verse" v-if="!isLoading && !noData">
    <div class="verse-text">"{{ verseText }}"</div>
    <div class="verse-ref">{{ verseRef }}</div>
  </div>
  <div class="card" v-else-if="isLoading">
    <div class="skeleton-line"></div>
    <div class="skeleton-line short"></div>
  </div>

  <!-- التأمل -->
  <div class="card" v-if="!isLoading && !noData">
    <p class="text alignRight">{{ reflection }}</p>
  </div>
  <div class="card" v-else-if="isLoading">
    <div class="skeleton-line"></div>
    <div class="skeleton-line"></div>
    <div class="skeleton-line short"></div>
  </div>

  <!-- الأجبية + الكتاب المقدس -->
  <div class="row" v-if="!isLoading && !noData">
    <button class="mini-card mini-click" type="button" @click="openChapter()">
      <div class="mini-head">الكتاب المقدس</div>
      <div class="mini-sub bible-pill">{{ previewLabel }}</div>
      <div class="mini-title">{{ previewTitle }}</div>
      <ul class="mini-list">
        <li v-for="(item, i) in previewSections" :key="i">{{ item }}</li>
      </ul>
    </button>

    <div class="mini-card">
      <div class="mini-head mini-head-row">
  <span>الأجبية</span>

  <ion-button
    class="audioBtn"
    fill="clear"
    size="small"
    :disabled="!agbia_audio"
    @click="openAgbiaAudio()"
    aria-label="تشغيل صوت الأجبية"
  >
    <ion-icon :icon="volumeHighOutline" />
  </ion-button>
</div>

      <p class="mini-body alignRight">{{ agbia }}</p>
      <div class="mini-author" v-if="agbia_author">{{ agbia_author }}</div>
    </div>
  </div>
  <div class="row" v-else-if="isLoading">
    <div class="mini-card">
      <div class="mini-head skeleton" style="height:44px;width:100%"></div>
      <div class="skeleton-line"></div>
      <div class="skeleton-line short"></div>
    </div>
    <div class="mini-card">
      <div class="mini-head skeleton" style="height:44px;width:100%"></div>
      <div class="skeleton-line"></div>
      <div class="skeleton-line short"></div>
    </div>
  </div>

  <!-- التدريب -->
  <div class="training" v-if="!isLoading && !noData">
    <div class="training-pill">التدريب</div>
    <div class="training-text alignRight">{{ training }}</div>
  </div>
  <div class="card" v-else-if="isLoading">
    <div class="skeleton-line"></div>
    <div class="skeleton-line short"></div>
  </div>

  <div class="space"></div>
    </div> <!-- end .wrap -->
  </div>   <!-- end .capture -->


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
import { IonActionSheet } from '@ionic/vue'
import html2canvas from 'html2canvas'

import { useRouter } from 'vue-router'
import Papa from 'papaparse'
import { settingsOutline } from 'ionicons/icons'
import { volumeHighOutline } from 'ionicons/icons'

import { shareOutline } from 'ionicons/icons'
import { readDayCache, writeDayCache } from '@/utils/dayCache'

const showShareSheet = ref(false)
const captureRef = ref<HTMLElement | null>(null)


const shareButtons = computed(() => ([
  {
    text: 'مشاركة كنص',
    handler: () => shareAsText()
  },
  {
    text: 'مشاركة كصورة',
    handler: () => shareAsImage()
  },
  {
    text: 'إلغاء',
    role: 'cancel'
  }
]))

type ChapterPreview = {
  bookName: string
  chapter: number
  chapterTitle: string
  sections: { title: string }[]
}
const CONTENT_BASE =
  'https://nancyhenry89.github.io/ma3ankolyoum/src/content'

  const AGBIA_AUDIO_BASE = `${CONTENT_BASE}/audio/agbia`

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
async function shareAsText() {
  if (noData.value || isLoading.value) return

  const lines: string[] = []

  // عنوان واحد بس
  lines.push(`${gregorianDate.value} – ${copticDate.value}`)

  if (saint.value) lines.push(`\nالسنكسار: ${saint.value}`)
  if (title.value) lines.push(`العنوان: ${title.value}`)

  if (story.value) {
    lines.push('\nالقصة:')
    lines.push(story.value)
  }

  if (verseText.value) {
    lines.push('\nالآية:')
    lines.push(`"${verseText.value}" ${verseRef.value || ''}`.trim())
  }

  if (reflection.value) {
    lines.push('\nالتأمل:')
    lines.push(reflection.value)
  }

  // ✅ الإنجيل/الكتاب المقدس (بيستخدم الـ preview computed)
  const bibleHead = previewLabel.value || bibleLabel.value
  const bibleTitleLine = previewTitle.value
  const sections = previewSections.value || []

  if (bibleHead || bibleTitleLine || sections.length) {
    lines.push('\nالكتاب المقدس:')
    if (bibleHead) lines.push(bibleHead)
    if (bibleTitleLine) lines.push(bibleTitleLine)
    if (sections.length) {
      lines.push(sections.map(s => `• ${s}`).join('\n'))
    }
  }

  // ✅ الأجبية
  if (agbia.value) {
    lines.push('\nالأجبية:')
    lines.push(agbia.value)
    if (agbia_author.value) lines.push(`(${agbia_author.value})`)
  }

  if (training.value) {
    lines.push('\nالتدريب:')
    lines.push(training.value)
  }

  const text = lines.join('\n')

  if (navigator.share) {
    await navigator.share({ title: 'معًا كل يوم', text })
  } else {
    await navigator.clipboard?.writeText(text)
    alert('تم نسخ النص للمشاركة ✅')
  }
}

import { Share } from '@capacitor/share'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { Capacitor } from '@capacitor/core'

function downloadDataUrl(dataUrl: string, fileName: string) {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
}

async function shareAsImage() {
  if (noData.value || isLoading.value) return

  // اقفلي ActionSheet
  showShareSheet.value = false
  await new Promise(r => setTimeout(r, 80))

  const el = captureRef.value
  if (!el) return

  // الغي scale مؤقتًا
  const wrap = el.querySelector('.wrap') as HTMLElement | null
  const prevTransform = wrap?.style.transform
  if (wrap) wrap.style.transform = 'none'

  await new Promise(requestAnimationFrame)

  const canvas = await html2canvas(el, {
    backgroundColor: null,
    useCORS: true,
    scale: Math.max(2, window.devicePixelRatio || 1)
  })

  if (wrap) wrap.style.transform = prevTransform || ''

  const fileName = `ma3an-kol-youm-${Date.now()}.png`
  const dataUrl = canvas.toDataURL('image/png')

  // 🌍 Web → download مباشر
  if (!Capacitor.isNativePlatform()) {
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    a.remove()
    return
  }

  // 📱 Android / iOS
  const base64 = dataUrl.split(',')[1]
  const saved = await Filesystem.writeFile({
    path: fileName,
    data: base64,
    directory: Directory.Cache
  })

  await Share.share({
    title: 'معًا كل يوم',
    url: saved.uri
  })
}



// ====== Settings modal ======
const showSettings = ref(false)

// ====== Data state ======
const gregorianDate = ref('')
const copticDate = ref('')
const saint = ref('')
const saintStory = ref('')

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
const agbia_audio = ref('')  // اسم ملف mp3 أو URL

const training = ref('')
const chapterPreview = ref<ChapterPreview | null>(null)
  const isLoading = ref(false)
const noData = ref(false)
const noDataMsg = ref('')
function applyCachedDay(c: any) {
  gregorianDate.value = c.gregorianDate || ''
  copticDate.value = c.copticDate || ''
  saint.value = c.saint || ''
  saintStory.value = c.saintStory || ''

  title.value = c.title || ''
  story.value = c.story || ''
  verseText.value = c.verseText || ''
  verseRef.value = c.verseRef || ''
  reflection.value = c.reflection || ''

  agbia.value = c.agbia || ''
  agbia_author.value = c.agbia_author || ''
  agbia_audio.value = c.agbia_audio || ''

  training.value = c.training || ''

  bibleBookKey.value = c.bibleBookKey || 'Matthew'
  bibleChapter.value = Number(c.bibleChapter || 1)
  bibleTitle.value = c.bibleTitle || ''
  bibleItems.value = Array.isArray(c.bibleItems) ? c.bibleItems : []

  // preview (لو موجود)
  loadChapterPreview(bibleBookKey.value, bibleChapter.value)
}
// ✅ hydrate from cache before first render
const initialISO = String(selectedDateISO.value).substring(0, 10)
const cachedInit = readDayCache(initialISO)

if (cachedInit) {
  applyCachedDay(cachedInit)
  noData.value = false
  noDataMsg.value = ''
  isLoading.value = false
} else {
  // مفيش كاش: ساعتها بس نظهر loading
  isLoading.value = true
}

function clearData() {
  gregorianDate.value = ''
  copticDate.value = ''
  saint.value = ''
  saintStory.value = ''
  title.value = ''
  story.value = ''
  verseText.value = ''
  verseRef.value = ''
  reflection.value = ''
  agbia.value = ''
  agbia_author.value = ''
  agbia_audio.value = ''

  training.value = ''
  bibleBookKey.value = 'Matthew'
  bibleChapter.value = 1
  bibleTitle.value = ''
  bibleItems.value = []
  chapterPreview.value = null
}

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
  saintStory.value = pick(row, 'saint_story', 'saintstory', 'synaxarium', 'synaxarion')

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
  agbia_audio.value = pick(row, 'agbia_audio')

  training.value = pick(row, 'training')

loadChapterPreview(bibleBookKey.value || 'Matthew', bibleChapter.value || 1)

}
async function refreshHomeFromNetwork(targetISO: string) {
  const rows = await fetchRows()

  const d = new Date()
  const todayLocalISO = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const toTime = (iso: string) => new Date(`${iso}T00:00:00`).getTime()
  const maxTime = toTime(todayLocalISO)

  const allowed = rows.filter(r => {
    const iso = String(r.date_iso || '').trim().substring(0, 10)
    return iso && toTime(iso) <= maxTime
  })

  const found =
    allowed.find(r => String(r.date_iso).trim().substring(0, 10) === targetISO) ||
    allowed[allowed.length - 1] ||
    null

  if (!found) {
    clearData()
    noData.value = true
    noDataMsg.value = 'لا توجد بيانات متاحة لهذا اليوم.'
    return
  }

  applyRow(found)

  // ✅ خزني في الكاش (زي ما انتي عاملة)
  writeDayCache(targetISO, {
    dateISO: targetISO,
    gregorianDate: gregorianDate.value,
    copticDate: copticDate.value,
    saint: saint.value,
    saintStory: saintStory.value,
    title: title.value,
    story: story.value,
    verseText: verseText.value,
    verseRef: verseRef.value,
    reflection: reflection.value,
    agbia: agbia.value,
    agbia_author: agbia_author.value,
    agbia_audio: agbia_audio.value,

    training: training.value,
    bibleBookKey: bibleBookKey.value,
    bibleChapter: bibleChapter.value,
    bibleTitle: bibleTitle.value,
    bibleItems: bibleItems.value
  })
}

async function loadByDate(dateISO: string) {
  const targetISO = String(dateISO).trim().substring(0, 10)

  // ✅ 1) cache-first (يعرض فوراً)
  const cached = readDayCache(targetISO)
  if (cached) {
    isLoading.value = false
    noData.value = false
    noDataMsg.value = ''
    applyCachedDay(cached)

    // ✅ 2) refresh من النت في الخلفية (من غير ما يوقف UI)
    refreshHomeFromNetwork(targetISO).catch(console.error)
    return
  }

  // ✅ لو مفيش كاش: حمّلي عادي
  isLoading.value = true
  noData.value = false
  noDataMsg.value = ''

  try {
    await refreshHomeFromNetwork(targetISO)
  } catch (e) {
    console.error(e)
    clearData()
    noData.value = true
    noDataMsg.value = 'حصلت مشكلة في تحميل البيانات. تأكدي من الإنترنت.'
  } finally {
    isLoading.value = false
  }
}

function openChapter() {
  const bookKey = bibleBookKey.value || 'Matthew'
  const ch = bibleChapter.value || 1
  router.push(`/chapter/${bookKey}/${ch}`)
}
function openSaint() {
  // نستخدم التاريخ الحالي المختار في الهوم علشان الصفحة الجديدة تقرأ نفس الصف من الشيت
  router.push(`/saint/${selectedDateISO.value}`)
}
function resolveAgbiaAudioUrl(fileOrUrl: string) {
  const v = String(fileOrUrl || '').trim()
  if (!v) return ''
  // لو لينك كامل
  if (/^https?:\/\//i.test(v)) return v
  // لو اسم ملف فقط
  return `${AGBIA_AUDIO_BASE}/${encodeURIComponent(v)}`
}

function openAgbiaAudio() {
  const iso = String(selectedDateISO.value).substring(0, 10)
  const url = resolveAgbiaAudioUrl(agbia_audio.value)
  if (!url) return
  router.push({
    path: `/agbia-audio/${iso}`,
    query: { src: url }
  })
}

function isoToTime(iso: string) {
  // يضمن parsing ثابت
  return new Date(`${iso}T00:00:00`).getTime()
}

function safeTodayISO() {
  // خليها local (على Android ده أوثق من timeZone ICU)
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

onMounted(() => {
  applyPrefs()

  const iso = String(selectedDateISO.value).substring(0, 10)
  const cached = readDayCache(iso)

  if (cached) {
    // ✅ عندك كاش: اعملي تحديث من النت في الخلفية
    refreshHomeFromNetwork(iso).catch(console.error)
  } else {
    // ✅ مفيش كاش: ساعتها حمّلي طبيعي
    loadByDate(iso).catch(console.error)
  }
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
.capture {
  width: fit-content;
  margin: 0 auto;
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
.mini-head-row{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:10px;
}

.audioBtn{
  margin:0;
  padding:0;
  min-width:auto;
  height:auto;
  color:#fff;
  opacity: 0.95;
}

.audioBtn[disabled]{
  opacity:0.35;
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
  font-size: 24px;
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



.training-text {
  font-size: 19px;
  line-height: 2;
  font-weight: 800;
  color: #ffffff;
  font-family: "Amiri", serif;
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
/* ===== Bible card: make it cleaner & same level as Agbia ===== */

/* خلي الكارت أقل "ضخم" + متوازن */
.mini-card{
  padding: 14px 14px 16px;
}

/* الهيدر: أصغر + أنعم + shadow أخف */
.mini-head{
  border-radius: 14px;
  padding: 12px 12px;
  font-size: 20px;
  line-height: 1.2;
  box-shadow: 0 10px 18px rgba(0,0,0,0.08);
}

/* البوكس اللي بيتضغط: خلي داخله top/bottom spacing واضح */
.mini-card.mini-click{
  gap: 10px;
}

/* “متى 2” */
.mini-sub{
  margin-top: 2px;
  font-size: 16px;
  font-weight: 800;
  text-decoration: none;          /* كانت بتدي شكل “لينك” زيادة */
  opacity: 0.9;
}

/* عنوان الإصحاح الأحمر: أصغر شوية + line-height أحسن */
.mini-title{
  margin-top: 2px;
  font-size: 18px;
  line-height: 1.35;
  font-weight: 900;
}

/* البُلِتس: خليها أشيك + محاذاة RTL صح */
.mini-list{
  margin-top: 8px;
  padding: 0;
  list-style: none;               /* هنرسم bullet ourselves */
  text-align: right;
  font-size: 15px;
  line-height: 1.85;
}

.mini-list li{
  position: relative;
  padding-right: 18px;
  margin: 6px 0;
  opacity: 0.95;
}

.mini-list li::before{
  content: "•";
  position: absolute;
  right: 0;
  top: 0;
  font-weight: 900;
  opacity: 0.85;
}
/* ===== Training – Same Gradient as Verse ===== */

.training{
  margin-top: 16px;
  padding: 18px 16px 22px;
  border-radius: 20px;
  text-align: center;
  position: relative;
  overflow: hidden;

  /* نفس روح الآية */
  background: linear-gradient(
    135deg,
    var(--mk-dark),
    rgba(11,43,64,0.88)
  );

  box-shadow: 0 18px 34px rgba(0,0,0,0.35);
}

/* subtle decorative quote like verse */
.training::before{
  content: "✦";
  position: absolute;
  top: -10px;
  left: 14px;
  font-size: 48px;
  opacity: 0.12;
  color: #ffffff;
}

/* pill */
.training-pill{
  color:  var(--mk-accent);
  font-weight: 900;
  border-radius: 14px;
  padding: 8px 18px;
  font-size: 20px;
  display: inline-block;
  margin-bottom: 12px;
}
.bible-pill{
  background: linear-gradient(
    135deg,
    #20b2aa,
    #0f2238
  );
  color:#fff;
  font-weight: 900;
  border-radius: 14px;
  padding: 10px 18px;
  font-size: 20px;
  display: inline-block;
  margin-bottom: 12px;
  width:50%;
  margin:auto;
}
/* النص */
.training-text{
  font-size: 20px;
  line-height: 2;
  font-weight: 800;
  color: #ffffff;
  text-align:center
}

/* Dark mode: أعمق شوية */
.home.theme-dark .training{
  background: linear-gradient(
    135deg,
    #0a1624,
    #0f2238
  );
  box-shadow: 0 22px 40px rgba(0,0,0,0.6);
}

/* ===== Bible card – final polish ===== */

/* عنوان الإصحاح: نفس لون accent */
.mini-title{
  color: var(--mk-accent);
  font-size: 18px;
  font-weight: 900;
  line-height: 1.35;
  margin-top: 2px;
}

/* Dark mode: accent أوضح */
.home.theme-dark .mini-title{
  color: var(--mk-accent);
}

/* نخلي الهيدر والباقي متناسق */
.mini-head{
  background: var(--mk-dark);
}

/* bullets هادية */
.mini-list li::before{
  color: var(--mk-accent);
  opacity: 0.9;
}
.skeleton{
  background: linear-gradient(90deg, rgba(255,255,255,0.08), rgba(255,255,255,0.22), rgba(255,255,255,0.08));
  border-radius: 14px;
  height: 18px;
  margin: 10px auto;
  width: 70%;
  animation: sk 1.2s infinite;
}
.home.theme-light .skeleton{
  background: linear-gradient(90deg, rgba(0,0,0,0.06), rgba(0,0,0,0.10), rgba(0,0,0,0.06));
}

.titleSk{ height: 44px; width: 90%; border-radius: 18px; }

.skeleton-line{
  height: 14px;
  border-radius: 10px;
  margin: 10px 0;
  animation: sk 1.2s infinite;
  background: linear-gradient(90deg, rgba(255,255,255,0.08), rgba(255,255,255,0.22), rgba(255,255,255,0.08));
}
.home.theme-light .skeleton-line{
  background: linear-gradient(90deg, rgba(0,0,0,0.06), rgba(0,0,0,0.10), rgba(0,0,0,0.06));
}
.skeleton-line.short{ width: 60%; }

@keyframes sk{
  0%{ filter: brightness(1); }
  50%{ filter: brightness(1.25); }
  100%{ filter: brightness(1); }
}
.shareBtn{
  opacity:0;
  position: absolute;
  top: -4px;
  right: 0;
  color: var(--mk-text);
  background: rgba(255,255,255,0.60);
  border-radius: 12px;
  backdrop-filter: blur(8px);
}
.home.theme-dark .shareBtn{
  background: rgba(0,0,0,0.30);
}
/* ===== Force center ActionSheet (works across Ionic versions) ===== */

/* خلي كل محتوى الشيت centered */
:deep(ion-action-sheet.share-sheet .action-sheet-wrapper),
:deep(.share-sheet .action-sheet-wrapper),
:deep(.share-sheet .action-sheet-container),
:deep(.share-sheet .action-sheet-group),
:deep(.share-sheet .action-sheet-button) {
  text-align: center !important;
}

/* توسيط محتوى الزر نفسه */
:deep(.share-sheet .action-sheet-button) {
  justify-content: center !important;
}

:deep(.share-sheet .action-sheet-button .action-sheet-button-inner),
:deep(.share-sheet .action-sheet-button-inner) {
  justify-content: center !important;
}

/* توسيط العنوان */
:deep(.share-sheet .action-sheet-title),
:deep(.share-sheet .action-sheet-header) {
  text-align: center !important;
}
.capture-clone {
  position: fixed;
  top: 0;
  left: 0;
  z-index: -1;
  pointer-events: none;
}

/* ================== Mobile ================== */
@media (max-width: 420px) {
  .title { font-size: 34px; }
  .row { grid-template-columns: 1fr; }
}


</style>