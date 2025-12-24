<template>

  
  
  <ion-page :class="['home', themeClass]" dir="rtl">

  
      <ion-content :fullscreen="true" class="content">
        <div class="capture home" :class="themeClass" ref="captureRef">
          <!-- خلفية -->
      <div class="bg"></div>
  
      <div class="wrap">
  
    <!-- Header: Data -->
    <div class="header" v-if="!isLoading && !noData">
  
      <ion-menu-button class="burgerBtn" :auto-hide="false" />


  
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
        <div class="brand_name">معًا كل يوم </div><div class="accent">مع</div><div class="abouna"> القمص يوحنا باقي
        </div> </div>
  
      <div class="dates" @click="showDatePicker = true">
        {{ gregorianDate }} – {{ copticDate }}
      </div>
      <div v-if="hasAnnouncement" class="announcement-card">
  {{ announcement }}
</div>

      <div
  class="saint"
  :class="{ clickable: hasSaint, disabledSaint: !hasSaint }"
  @click="hasSaint && openSaint()"
>
  <span v-if="hasSaint">
    {{ saint }}
  </span>
  <span v-else>
    لا يوجد سنكسار لهذا اليوم.
  </span>
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
  <p v-if="hasStory" class="text alignRight">
    {{ story }}
  </p>
  <p v-else class="text alignRight emptyMsg">
    لا توجد قصة لهذا اليوم.
  </p>
</div>

    <div class="card" v-else-if="isLoading">
      <div class="skeleton-line"></div>
      <div class="skeleton-line"></div>
      <div class="skeleton-line short"></div>
    </div>
    <!-- لو noData: مفيش داعي نكرر رسالة تاني لأن الهيدر already بيعرضها -->
  
    <!-- الآية -->
    <div class="verse" v-if="!isLoading && !noData">
  <template v-if="hasVerse">
    <div class="verse-text">"{{ verseText }}"</div>
    <div class="verse-ref">{{ verseRef }}</div>
  </template>
  <div v-else class="verse-empty">
    لا توجد آية محددة لهذا اليوم.
  </div>
</div>

    <div class="card" v-else-if="isLoading">
      <div class="skeleton-line"></div>
      <div class="skeleton-line short"></div>
    </div>
  
    <!-- التأمل -->
    <div class="card" v-if="!isLoading && !noData">
  <p v-if="hasReflection" class="text alignRight">
    {{ reflection }}
  </p>
  <p v-else class="text alignRight emptyMsg">
    لا يوجد تأمل لهذا اليوم.
  </p>
</div>

    <div class="card" v-else-if="isLoading">
      <div class="skeleton-line"></div>
      <div class="skeleton-line"></div>
      <div class="skeleton-line short"></div>
    </div>
  
    <!-- الأجبية + الكتاب المقدس -->
    <div class="row" v-if="!isLoading && !noData">
      <button
  class="mini-card mini-click"
  :class="{ disabledCard: !hasBible }"
  type="button"
  @click="hasBible && openChapter()"
>
  <div class="mini-head mini-head-row">
    <span>الكتاب المقدس</span>
    <ion-button
      class="audioBtn"
      fill="clear"
      size="small"
      aria-label="عرض الإصحاح"
    >
      <ion-icon :icon="bookOutline" />
    </ion-button>
  </div>

  <template v-if="hasBible">
    <div class="mini-sub bible-pill">{{ previewLabel }}</div>
    <div class="mini-title">{{ previewTitle }}</div>
    <ul class="mini-list">
      <li v-for="(item, i) in previewSections" :key="i">{{ item }}</li>
    </ul>
  </template>

  <p v-else class="mini-body alignRight emptyMsg">
    لا توجد قراءات كتاب مقدس مسجَّلة لهذا اليوم.
  </p>
</button>

      <div class="mini-card">
        <div class="mini-head mini-head-row">
    <span>الأجبية</span>
    <ion-button
  class="audioBtn"
  fill="clear"
  size="small"
  @click.stop="openAgbiaAudio()"
  aria-label="صوت الأجبية"
>
  <ion-icon :icon="volumeHighOutline" :class="{ dimIcon: !hasAnyAgbiaAudio }" />
</ion-button>

  </div>
  
  <p v-if="hasAgbia" class="mini-body alignRight">
  {{ agbia }}
</p>
<p v-else class="mini-body alignRight emptyMsg">
  لا توجد قراءة من الأجبية لهذا اليوم.
</p>
<div class="mini-author" v-if="agbia_author && hasAgbia">
  {{ agbia_author }}
</div>
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
    <!-- لغتنا القبطية -->
<CopticSection
  v-if="!isLoading && !noData"
  :dateISO="selectedDateISO"
  :contentBase="CONTENT_BASE"
/>
    <!-- التدريب -->
    <div class="training" v-if="!isLoading && !noData">
  <div class="training-pill">التدريب</div>
  <div v-if="hasTraining" class="training-text alignRight">
    {{ training }}
  </div>
  <div v-else class="training-text alignRight emptyMsg">
    لا يوجد تدريب محدد لهذا اليوم.
  </div>
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
              <ion-title>اختر يوم</ion-title>
              <ion-buttons slot="end">
                <ion-button @click="showDatePicker = false">إغلاق</ion-button>
              </ion-buttons>
            </ion-toolbar>
          </ion-header>
  
          <ion-content class="ion-padding">
            <ion-datetime
  presentation="date"
  :value="selectedDateISO"
  :max="allowFuture ? undefined : todayISO()"
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
                <ion-buttons slot="end">
  <ion-button @click="closeSettings()">إغلاق</ion-button>
</ion-buttons>
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
        <!-- About Modal -->
  <ion-modal :is-open="showAbout" @didDismiss="showAbout = false">
    <ion-header>
      <ion-toolbar>
        <ion-title>عن التطبيق</ion-title>
        <ion-buttons slot="end">
          <ion-buttons slot="end">
  <ion-button @click="closeAbout()">إغلاق</ion-button>
</ion-buttons>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
  
    <ion-content class="ion-padding">
      <section class="about-app" dir="rtl" lang="ar">
  <h2>عن التطبيق</h2>

  <p>
    <strong>معًا كل يوم</strong> هو تطبيق روحي كنسي يهدف إلى مساندة الحياة الروحية اليومية
    من خلال قراءات وتأملات وتدريبات منتظمة تساعد على النمو الروحي والالتصاق بكلمة الله.
  </p>

  <h3>المصادر والاعتمادات</h3>
  <ul>
    <li><strong>إعداد المحتوى:</strong> القمص يوحنا باقي</li>
    <li><strong>الكتاب المقدس:</strong> الترجمة العربية فان دايك، بإذن من دار الكتاب المقدس</li>
    <li><strong>السنكسار:</strong> بحسب سنكسار دير السريان</li>
    <li><strong>التفسير:</strong> موسوعة كنيسة مارمرقس بمصر الجديدة</li>
  </ul>

  <h3>الجهة التابعة</h3>
  <p>
    يُقدَّم هذا التطبيق في إطار الخدمة الروحية، وهو تابع لـ <strong>كنيسة مارمرقس بمصر الجديدة</strong>.
  </p>
</section>
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
  IonRange,
  IonMenu,
  IonMenuToggle,
  IonMenuButton,
  IonList,
  IonItem,
  IonLabel
} from '@ionic/vue'
import { menuOutline } from 'ionicons/icons'
import CopticSection from '@/components/CopticSection.vue'
import { App } from '@capacitor/app'
import { useIonRouter } from '@ionic/vue'

import { onMounted, ref, computed } from 'vue'
import { IonActionSheet } from '@ionic/vue'
import html2canvas from 'html2canvas'

import { useRouter } from 'vue-router'
import Papa from 'papaparse'

import { volumeHighOutline,bookOutline } from 'ionicons/icons'

import { shareOutline } from 'ionicons/icons'
import { readDayCache, writeDayCache } from '@/utils/dayCache'

const showShareSheet = ref(false)
const captureRef = ref<HTMLElement | null>(null)

  import { useRoute } from 'vue-router'
import { watch } from 'vue'

const ionRouter = useIonRouter()

onMounted(() => {
  App.addListener('backButton', ({ canGoBack }) => {
    if (!ionRouter.canGoBack()) {
      App.exitApp()
    }
  })
})


const route = useRoute()
const allowFuture = computed(() => route.query.debugFuture === '1')

watch(
  () => route.query.modal,
  (v) => {
    if (v === 'settings') showSettings.value = true
    if (v === 'about') showAbout.value = true
  },
  { immediate: true }
)

function closeSettings() {
  showSettings.value = false
  router.replace({ query: {} })
}
function closeAbout() {
  showAbout.value = false
  router.replace({ query: {} })
}

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


const CONTENT_BASE = Capacitor.isNativePlatform()
  ? 'https://nancyhenry89.github.io/ma3ankolyoum/src/content'
  : 'https://ma3ankolyoum.org/content'
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
const bibleFromSheet = ref(false)
const bibleIsEmptyFromSheet = ref(false)
function onDateChange(ev: any) {
  const iso = String(ev.detail.value || '').substring(0, 10)
  if (!iso) return

  // ⛔ block future ONLY if debugFuture is not enabled
  if (!allowFuture.value && iso > todayISO()) return

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
const showAbout = ref(false)
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
const agbia_baker = ref('')
const agbia_third = ref('')
const agbia_sixth = ref('')
const agbia_ninth = ref('')
const agbia_sunset = ref('')
const agbia_sleep = ref('')
const announcement = ref('')
const hasAnnouncement = computed(() => !!String(announcement.value).trim())

const hasAnyAgbiaAudio = computed(() => {
  return !!(
    String(agbia_baker.value).trim() ||
    String(agbia_third.value).trim() ||
    String(agbia_sixth.value).trim() ||
    String(agbia_ninth.value).trim() ||
    String(agbia_sunset.value).trim() ||
    String(agbia_sleep.value).trim()
  )
})
const hasStory = computed(() => !!String(story.value).trim())
const hasSaint = computed(() => !!String(saint.value).trim())

const hasVerse = computed(() => !!String(verseText.value).trim())
const hasReflection = computed(() => !!String(reflection.value).trim())
const hasAgbia = computed(() => !!String(agbia.value).trim())
const hasTraining = computed(() => !!String(training.value).trim())
const hasBible = computed(() => bibleFromSheet.value)

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
  announcement.value = c.announcement || ''

  title.value = c.title || ''
  story.value = c.story || ''
  verseText.value = c.verseText || ''
  verseRef.value = c.verseRef || ''
  reflection.value = c.reflection || ''
  bibleFromSheet.value = !!c.bibleFromSheet
bibleIsEmptyFromSheet.value = !bibleFromSheet.value

  agbia.value = c.agbia || ''
  agbia_author.value = c.agbia_author || ''
  agbia_baker.value = c.agbia_baker || ''
agbia_third.value = c.agbia_third || ''
agbia_sixth.value = c.agbia_sixth || ''
agbia_ninth.value = c.agbia_ninth || ''
agbia_sunset.value = c.agbia_sunset || ''
agbia_sleep.value = c.agbia_sleep || ''


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
  announcement.value = pick(row, 'announcement', 'إعلان', 'announcements')

  const items = pick(row, 'bible_items', 'items')
  const sheetBook = String(pick(row, 'bible_book', 'book_key') || '').trim()
const sheetChapterRaw = String(pick(row, 'bible_chapter', 'chapter') || '').trim()
const sheetTitle = String(pick(row, 'bible_title', 'chapter_title') || '').trim()
const sheetItemsRaw = String(pick(row, 'bible_items', 'items') || '').trim()

const sheetHasBible =
  !!sheetBook ||
  !!sheetChapterRaw ||
  !!sheetTitle ||
  !!sheetItemsRaw

bibleFromSheet.value = sheetHasBible
bibleIsEmptyFromSheet.value = !sheetHasBible
  bibleItems.value = String(items || '')
    .split('|')
    .map((s: string) => s.trim())
    .filter(Boolean)

  agbia.value = pick(row, 'agbia')
  agbia_author.value = pick(row, 'agbia_author', 'agbiaauthor', 'agbia_author_name', 'agbia_author_ar')
  agbia_baker.value  = pick(row, 'baker', 'agbia_baker')
agbia_third.value  = pick(row, 'third', 'agbia_third')
agbia_sixth.value  = pick(row, 'sixth', 'agbia_sixth')
agbia_ninth.value  = pick(row, 'ninth', 'agbia_ninth')
agbia_sunset.value = pick(row, 'sunset', 'agbia_sunset', 'ghoroub')
agbia_sleep.value  = pick(row, 'sleep', 'agbia_sleep', 'noum')

  training.value = pick(row, 'training')
  
loadChapterPreview(bibleBookKey.value || 'Matthew', bibleChapter.value || 1)

}
async function refreshHomeFromNetwork(targetISO: string) {
  const rows = await fetchRows()

  const toISO = (r: any) => String(r.date_iso || '').trim().substring(0, 10)

  // 1) دور على اليوم المطلوب مباشرة (بدون فلترة "مستقبل")
  let found = rows.find(r => toISO(r) === targetISO) || null

  // 2) لو مش موجود، هات آخر يوم متاح (أحدث date_iso)
  if (!found) {
    const sorted = [...rows]
      .filter(r => toISO(r))
      .sort((a, b) => toISO(a).localeCompare(toISO(b)))
    found = sorted[sorted.length - 1] || null
  }

  if (!found) {
    clearData()
    noData.value = true
    noDataMsg.value = 'لا توجد بيانات متاحة لهذا اليوم.'
    return
  }

  applyRow(found)

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
    training: training.value,
    bibleBookKey: bibleBookKey.value,
    bibleChapter: bibleChapter.value,
    bibleTitle: bibleTitle.value,
    bibleItems: bibleItems.value,
    bibleFromSheet: bibleFromSheet.value,
    announcement: announcement.value,

    // ✅ لو بدأتي تخزني أعمدة الأجبية الجديدة
    baker: pick(normalizeKeys(found), 'baker') || '',
    third: pick(normalizeKeys(found), 'third') || '',
    sixth: pick(normalizeKeys(found), 'sixth') || '',
    ninth: pick(normalizeKeys(found), 'ninth') || '',
    sunset: pick(normalizeKeys(found), 'sunset') || '',
    sleep: pick(normalizeKeys(found), 'sleep') || '',
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
function resolveAgbiaAudioUrl(v: string) {
  if (!v) return ''
  if (/^https?:\/\//i.test(v)) return v
  return `${CONTENT_BASE}/audio/${encodeURIComponent(v)}`
}


function openAgbiaAudio() {
  const iso = String(selectedDateISO.value).substring(0, 10)
  router.push({ path: `/agbia-audio/${iso}` })
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

  const queryDate = typeof route.query.date === 'string'
    ? route.query.date.substring(0, 10)
    : null

  if (queryDate) {
    // ⛔ prevent future unless debugFuture=1
    if (!allowFuture.value && queryDate > todayISO()) return

    selectedDateISO.value = queryDate
    loadByDate(queryDate)
    return
  }

  const iso = String(selectedDateISO.value).substring(0, 10)
  const cached = readDayCache(iso)

  if (cached) {
    refreshHomeFromNetwork(iso).catch(console.error)
  } else {
    loadByDate(iso).catch(console.error)
  }
})

</script>
<style scoped>
  /* =========================================================
     Theme variables (keep as-is)
  ========================================================= */
  .home.theme-light {
    --mk-bg1: #f4f7fb;
    --mk-bg2: #ffffff;
  
    --mk-text: #0b1f33;
    --mk-card: #ffffff;
  
    --mk-accent: #20b2aa;   /* teal */
    --mk-dark: #182a44;     /* indigo/navy */
    --mk-danger: #ff2a00;
  
    --mk-border: rgba(24,42,68,0.10);
    --mk-shadow: 0 8px 18px rgba(10,20,30,0.07);
    --mk-shadow-strong: 0 14px 28px rgba(10,20,30,0.10);
  
    --mk-soft: rgba(32,178,170,0.12);
    --mk-soft-border: rgba(32,178,170,0.28);
  }
  
  .home.theme-dark {
    --mk-bg1: #060b12;
    --mk-bg2: #0b1220;
  
    --mk-text: #f5f7fa;
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
  
  /* =========================================================
     Global / Layout
  ========================================================= */
  .home {
    font-family: "Noto Naskh Arabic", system-ui, sans-serif;
    letter-spacing: 0;
  }
  .content { color: var(--mk-text); }
  
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
  
  /* Background */
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
  
  .capture {  margin: 0 auto; }
  
  /* =========================================================
     Unified gradients (what you asked for)
  ========================================================= */
  /* Clickable (Saint + Bible title + Agbia title) */
  .home {
    --mk-clickable-grad:
      radial-gradient(600px 200px at 20% 0%, rgba(32,178,170,0.35), transparent 60%),
      linear-gradient(135deg, var(--mk-dark), rgba(16,27,47,0.90));
  }
  
  /* Verse + Training gradient: 28d6cc -> white */
  .home {
    --mk-soft-grad:
    radial-gradient(700px 240px at 15% 0%, rgba(40, 214, 204, 0.38), rgba(255, 255, 255, 0) 62%), linear-gradient(135deg, #28d6cc30, #f0f0f0)  }
  
  /* =========================================================
     Header
  ========================================================= */
  .header {
    text-align: center;
    margin-bottom: 14px;
    position: relative;
  }
  
  .brand,
  .title,
  .mini-head {
    font-family: "Noto Kufi Arabic", system-ui, sans-serif;
  }
  
  .brand {
    font-size: 20px;
    font-weight: 900;
    color: var(--mk-text);
  }
  .brand_name { font-size: 16px; }
  .brand .accent { font-size: 14px; color: var(--mk-accent); }
  .abouna { font-size: 15px; }
  
  .dates {
    margin-top: 6px;
    font-size: 16px;
    font-weight: 800;
    cursor: pointer;
    text-decoration: underline;
    opacity: 0.9;
    color: var(--mk-text);
  }
  
  /* =========================================================
     Clickable elements (Saint + Bible & Agbia titles)
  ========================================================= */
  .saint {
    margin: 10px 0;
    padding: 10px 12px;
    border-radius: 16px;
    font-size: 18px;
    font-weight: 900;
    cursor: pointer;
  
    background: var(--mk-clickable-grad);
    color: #ffffff;
    border: 1px solid rgba(255,255,255,0.16);
    box-shadow: var(--mk-shadow-strong);
  }
  
  /* Titles (Bible + Agbia) */
  .mini-head {
    width: 100%;
    border-radius: 14px;
    padding: 12px 12px;
    font-size: 20px;
    font-weight: 900;
    line-height: 1.2;
  
    background: var(--mk-clickable-grad);
    color: #ffffff;
    border: 1px solid rgba(255,255,255,0.16);
    box-shadow: var(--mk-shadow-strong);
  }
  
  /* header row (title + icon btn) */
  .mini-head-row{
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:10px;
  }
  
  /* audio icon in the mini-head */
  .audioBtn{
    margin:0;
    padding:0;
    min-width:auto;
    height:auto;
    color:#fff;
    opacity: 0.95;
  }
  .audioBtn[disabled]{ opacity:0.35; }
  .mini-head .audioBtn,
  .mini-head ion-icon { color:#fff !important; }
  
  /* =========================================================
     Title
  ========================================================= */
  .title {
    margin-top: 17px;
    font-size: 38px;
    line-height: 1.2;
    font-weight: 900;
    color: var(--mk-text);
  }
  .announcement-card {
  margin: 10px 0 6px;
  padding: 14px 16px;
  border-radius: 16px;
  font-size: 18px;
  font-weight: 800;
  text-align: center;

  background: linear-gradient(135deg, #ffd166, #fff1c1);
  color: #3a2c00;
  box-shadow: var(--mk-shadow);
}
.home.theme-dark .announcement-card {
  background: linear-gradient(135deg, #ffd166, #bfa14a);
  color: #1a1400;
}

  /* =========================================================
     Cards
  ========================================================= */
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

  white-space: pre-line;

  }
  
  .alignRight { text-align: right; }
  
  /* =========================================================
     Verse (gradient 28d6cc -> white)
  ========================================================= */
  .verse {
    border-radius: 18px;
    padding: 16px 44px;
    text-align: center;
    margin: 12px 0;
    position: relative;
    overflow: hidden;
  
    background: var(--mk-soft-grad);
    box-shadow: var(--mk-shadow-strong);
  }
  
  /* decorative quote but subtle */
  .verse::before {
    content: "“";
    position: absolute;
    top: -18px;
    right: 14px;
    font-size: 90px;
    opacity: 0.10;
    color: rgba(24,42,68,0.85);
    font-family: "Amiri", serif;
  }
  
  .verse-text {
    font-family: "Amiri", "Noto Naskh Arabic", serif;
    font-size: 24px;
    font-weight: 700;
    line-height: 2;
    color: #0b1f33; /* readable on white */
  }
  
  .verse-ref {
    margin-top: 6px;
    font-family: "Amiri", "Noto Naskh Arabic", serif;
    font-size: 16px;
    font-weight: 800;
    color: #061018;
  }
  
  /* Dark mode: keep it readable (same grad but text switches) */

  .home.theme-dark .verse-text { color: #061018; }
  .home.theme-dark .verse-ref { color: #061018; }
  .home.theme-dark .verse::before { color: rgba(6,16,24,0.8); }
  
  /* =========================================================
     Row cards (Bible + Agbia)
  ========================================================= */
  .row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-top: 12px;
  }
  
  .mini-card {
    padding: 14px 14px 16px;
    text-align: center;
  }
  
  .mini-click {
    width: 100%;
    cursor: pointer;
  }
  .emptyMsg {
  opacity: 0.7;
  font-size: 18px;
}

.verse-empty {
  font-size: 18px;
  font-weight: 700;
  color: #061018;
}
.home.theme-dark .verse-empty {
  color: #061018;
}

  .mini-card.mini-click{
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 10px;
  }
  .mini-card.mini-click:active { transform: translateY(1px); }
  
  /* “متى 2” */
  .mini-sub {
    margin-top: 2px;
    font-size: 16px;
    font-weight: 800;
    opacity: 0.9;
    color: var(--mk-text);
  }
  
  /* optional pill styling */
  .bible-pill{
    background:
      radial-gradient(360px 120px at 20% 0%, rgba(32,178,170,0.38), transparent 65%),
      linear-gradient(135deg, #20b2aa, #0f2238);
    color:#fff;
    font-weight: 900;
    border-radius: 14px;
    padding: 10px 18px;
    font-size: 20px;
    display: inline-block;
    margin-bottom: 12px;
    width: 50%;
    margin-inline: auto;
  }
  
  /* chapter title line */
  .mini-title{
    color: var(--mk-accent);
    font-size: 18px;
    font-weight: 900;
    line-height: 1.35;
    margin-top: 2px;
  }
  .disabledCard {
  opacity: 0.7;
  cursor: default;
}

  /* list */
  .mini-list{
    margin-top: 8px;
    padding: 0;
    list-style: none;
    text-align: right;
    font-size: 15px;
    line-height: 1.85;
    color: var(--mk-text);
    opacity: 0.95;
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
    color: var(--mk-accent);
    opacity: 0.9;
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
  
  /* =========================================================
     Training (gradient 28d6cc -> white)
  ========================================================= */
  .training {
    margin-top: 16px;
    padding: 18px 16px 22px;
    border-radius: 18px;
    text-align: center;
    position: relative;
    overflow: hidden;
  
    background: var(--mk-soft-grad);
    box-shadow: var(--mk-shadow-strong);
  }
  
  /* subtle decoration */
  .training::before{
    content: "✦";
    position: absolute;
    top: -10px;
    left: 14px;
    font-size: 48px;
    opacity: 0.10;
    color: rgba(24,42,68,0.85);
  }
  .disabledSaint {
  cursor: default;
  opacity: 0.65;
  filter: grayscale(0.1);
}

.saint.clickable {
  cursor: pointer;
}

.saint:not(.clickable) {
  pointer-events: none; /* extra safety */
}

  .training-pill{
    color: #20b2aa;
    font-weight: 900;
    border-radius: 14px;
    padding: 8px 18px;
    font-size: 20px;
    display: inline-block;
    margin-bottom: 12px;

  }
  
  .training-text{
    font-size: 20px;
    line-height: 2;
    font-weight: 900;
    color: #0b1f33;
    text-align:center;
    font-family: "Amiri", serif;
  }
  
  /* Dark mode for training */

  .home.theme-dark .training-text { color: #061018; }
  .home.theme-dark .training-pill {
    color: #061018;

  }
  .home.theme-dark .training::before { color: rgba(6,16,24,0.8); }
  
  /* =========================================================
     Misc
  ========================================================= */
  .space { height: 24px; }
  
  .hint {
    margin-top: 12px;
    font-size: 14px;
    opacity: 0.8;
    text-align: center;
  }
  
  /* Settings rows */
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
  .settingsLabel { font-weight: 800; }
  
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
  
  /* Burger */
  .burgerBtn{
    position: absolute;
    top: -4px;
    left: 0;
    color: #fff;
    background:#0f1b2f;
    border-radius: 12px;
    backdrop-filter: blur(8px);
    padding: 6px;
  }
  .home.theme-dark .burgerBtn{
    background: rgba(0,0,0,0.30);
  }
  
  /* Share btn (you had opacity:0 — keeping your behavior) */
  .shareBtn{
    opacity: 0;
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
  
  /* ActionSheet center */
  :deep(ion-action-sheet.share-sheet .action-sheet-wrapper),
  :deep(.share-sheet .action-sheet-wrapper),
  :deep(.share-sheet .action-sheet-container),
  :deep(.share-sheet .action-sheet-group),
  :deep(.share-sheet .action-sheet-button) {
    text-align: center !important;
  }
  :deep(.share-sheet .action-sheet-button) { justify-content: center !important; }
  :deep(.share-sheet .action-sheet-button .action-sheet-button-inner),
  :deep(.share-sheet .action-sheet-button-inner) {
    justify-content: center !important;
  }
  :deep(.share-sheet .action-sheet-title),
  :deep(.share-sheet .action-sheet-header) {
    text-align: center !important;
  }
  
  /* Skeleton alignment (RTL friendly) */
  .skeleton{
    margin: 10px 0;
    width: 100%;
  }
  .skeleton-line{
    margin-right: 0;
    margin-left: auto;
  }
  .skeleton-line.short{
    width: 60%;
    margin-right: 0;
    margin-left: auto;
  }
  
  .home.theme-light .skeleton,
  .home.theme-light .skeleton-line{
    background: linear-gradient(90deg, rgba(0,0,0,0.06), rgba(0,0,0,0.10), rgba(0,0,0,0.06));
  }
  
  @keyframes sk{
    0%{ filter: brightness(1); }
    50%{ filter: brightness(1.25); }
    100%{ filter: brightness(1); }
  }
  .titleSk{ height: 44px; width: 100%; border-radius: 18px; }
  
  .capture-clone {
    position: fixed;
    top: 0;
    left: 0;
    z-index: -1;
    pointer-events: none;
  }

  /* =========================================================
     Mobile
  ========================================================= */
  @media (max-width: 420px) {
    .title { font-size: 34px; }
    .row { grid-template-columns: 1fr; }
  }
  </style>
  