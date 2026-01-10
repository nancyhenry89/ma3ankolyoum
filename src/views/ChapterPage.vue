<template>
  <ion-page dir="rtl" class="chapter">
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/" />
        </ion-buttons>
        <ion-title>{{ headerTitle }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div class="wrap">
        <!-- مقدمة السفر -->
        <div v-if="intro" class="introBox">
          <div class="introTitle">{{ intro.title }}</div>

          <div class="videoWrap">
            <!-- ✅ iPhone/iOS Native: افتحي SafariViewController -->
            <button
              v-if="isIOSNative"
              class="iosVideoBtn"
              type="button"
              @click="openIntroVideo"
            >
              ▶ تشغيل الفيديو
            </button>

            <!-- ✅ Android + Web: iframe زي ما هو -->
            <iframe
              v-else
              :src="`https://www.youtube.com/embed/${intro.youtubeId}`"
              :title="intro.title"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen
            />
          </div>
        </div>

        <div class="videoNote">💡 اضغط على الآية لعرض التفسير</div>

        <div class="chapterTitle">{{ chapterTitle }}</div>

        <!-- Saved open -->
        <button class="savedOpenBtn" type="button" @click="openSavedSheet">
          ❤️ الآيات المحبوبة
          <span class="savedCount">{{ savedAll.length }}</span>
        </button>

        <div class="verses">
          <div
            v-for="v in verses"
            :key="v.n"
            class="verseBlock"
            :id="`v-${v.n}`"
          >
            <!-- Section title -->
            <div v-if="sectionTitleAt(v.n)" class="sectionInline">
              {{ sectionTitleAt(v.n) }}
            </div>

            <!-- Row -->
            <div class="verseRow">
              <button class="verseMain" type="button" @click="toggleVerse(v.n)">
                <div class="num">{{ v.n }}</div>
                <div class="txt">{{ v.t }}</div>

                <div class="chev">
                  <IonIcon
                    :icon="chevronForwardOutline"
                    :class="{ open: isOpen(v.n) }"
                  />
                </div>
              </button>

              <button
                class="saveBtn"
                type="button"
                @click.stop="toggleSaveVerse(v.n, v.t)"
                aria-label="Save verse"
              >
                <IonIcon :icon="savedIcon(v.n)" />
              </button>
            </div>

            <!-- Tafsir -->
            <div v-if="isOpen(v.n)" class="tafsirBox">
              <div v-if="tafsirLoading" class="tafsirHint">جاري تحميل التفسير…</div>

              <div v-else>
                <div v-if="getTafsirForVerse(v.n)" class="tafsirText">
                  {{ getTafsirForVerse(v.n) }}
                </div>
                <div v-else class="tafsirHint">لا يوجد تفسير لهذه الآية حاليًا.</div>
              </div>
            </div>
          </div>
        </div>

        <div class="space"></div>
      </div>

      <!-- Saved Sheet -->

    </ion-content>
    <ion-modal
      dir="rtl"
  :is-open="showSaved"
  @didDismiss="showSaved = false"
  :backdrop-dismiss="false"
  class="savedSheet"
>
<ion-toast
  :is-open="showSavedToast"
  message="✓ تم الحفظ"
  duration="1000"
  position="bottom"
  css-class="savedToast"
  @didDismiss="showSavedToast = false"
/>

<ion-header class="savedHeader">
  <ion-toolbar>
    <ion-title>❤️ الآيات المحبوبة</ion-title>
    <ion-buttons slot="end">
      <ion-button fill="clear" @click="showSaved = false">إغلاق</ion-button>
    </ion-buttons>
  </ion-toolbar>

  <!-- search (برا الـ toolbar) -->
  <div class="savedSearchWrap">
    <input
      class="savedSearch"
      type="search"
      v-model="savedQuery"
      inputmode="search"
      placeholder="🔎 ابحث في الآيات أو اسم السفر…"
      @click.stop
      @mousedown.stop
      @touchstart.stop
    />
    <button
      v-if="savedQuery"
      class="savedClear"
      type="button"
      @click.stop="savedQuery = ''"
      aria-label="Clear search"
    >
      ✕
    </button>
  </div>
</ion-header>

        <ion-content class="savedBody" :scroll-y="true" :scroll-events="true">
          <div v-if="!filteredSaved.length" class="savedEmpty">
            لا توجد آيات محفوظة.
          </div>

          <div v-else class="savedList">
            <div
              v-for="item in filteredSaved"
              :key="`${item.bookKey}-${item.chapter}-${item.verse}`"
              class="savedCard"
            >
              <div class="savedTopRow">
                <!-- clickable ref only -->
                <button class="savedOpen" type="button" @click="openSavedVerse(item)">
                  <div class="savedRef">
                    <span class="savedBook">{{ item.bookName }}</span>
                    <span class="savedLoc">{{ item.chapter }} • {{ item.verse }}</span>
                  </div>
                </button>

                <button
                  class="savedRemove"
                  type="button"
                  @click="removeSaved(item)"
                  aria-label="Remove saved verse"
                >
                  ✕
                </button>
              </div>

              <div class="savedText">{{ item.text }}</div>

              <textarea
  class="savedNote"
  :value="item.note || ''"
  @input="onNoteInput(item, $event)"
  placeholder="✍️ اكتب ملاحظتك أو تأملك على هذه الآية…"
  @click.stop
  @mousedown.stop
  @touchstart.stop
/>

<button
  class="saveNoteBtn"
  type="button"
  @click.stop="saveNoteManual(item)"
>
  💾 حفظ 
</button>

            </div>
          </div>
        </ion-content>
      </ion-modal>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonModal,
  IonButton,
  IonIcon
} from '@ionic/vue'
import { computed, onMounted, ref, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Papa from 'papaparse'
import { chevronForwardOutline, bookmarkOutline, bookmark } from 'ionicons/icons'
import { Capacitor } from '@capacitor/core'
import { Browser } from '@capacitor/browser'
import {
  readChapterCache,
  writeChapterCache,
  readTafsirCache,
  writeTafsirCache
} from '@/utils/chapterCache'
import {
  listSavedVerses,
  toggleVerseSaved,
  isVerseSaved,
  type SavedVerse,
  upsertVerseNote
} from '@/services/verseSaves'
import { IonToast } from '@ionic/vue'

const showSavedToast = ref(false)

const route = useRoute()
const router = useRouter()

const isIOSNative = computed(
  () => Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios'
)

type ChapterJSON = {
  bookKey: string
  bookName: string
  chapter: number
  chapterTitle: string
  intro?: { title: string; youtubeId: string }
  sections: { title: string; fromVerse: number; toVerse: number }[]
  verses: { n: number; t: string }[]
}
function normalizeArabic(s: string) {
  return String(s || '')
    // إزالة التشكيل + العلامات القرآنية الشائعة
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
    // تطبيع الألف/الهمزات
    .replace(/[إأآٱ]/g, 'ا')
    // تطبيع ياء/ألف مقصورة
    .replace(/[ى]/g, 'ي')
    // تطبيع تاء مربوطة (اختياري لكن مفيد للبحث)
    .replace(/ة/g, 'ه')
    // إزالة التطويل
    .replace(/ـ/g, '')
    // مسافات
    .replace(/\s+/g, ' ')
    .trim()
}

function matchesQuery(haystack: string, q: string) {
  const hh = normalizeArabic(haystack).toLowerCase()
  const qq = normalizeArabic(q).toLowerCase()
  if (!qq) return true
  return hh.includes(qq)
}


type TafsirRow = {
  bookKey: string
  chapter: number
  fromVerse: number
  toVerse: number
  tafsir: string
}

// ✅ content base (public/content)
const CONTENT_BASE = Capacitor.isNativePlatform()
  ? 'https://nancyhenry89.github.io/ma3ankolyoum/content'
  : `${import.meta.env.BASE_URL}content`.replace(/\/$/, '')

// ✅ bookKey/ch
const bookKey = computed(() => String(route.params.bookKey || 'Matthew'))
const chapterNum = computed(() => Number(route.params.chapter || 1))

// ✅ data
const data = ref<ChapterJSON | null>(null)
const intro = computed(() => data.value?.intro || null)
const sections = computed(() => data.value?.sections || [])
const verses = computed(() => data.value?.verses || [])
const chapterTitle = computed(() => data.value?.chapterTitle || '')

const headerTitle = computed(() => {
  const name = data.value?.bookName || bookKey.value
  const ch = data.value?.chapter || chapterNum.value
  return `${name} ${ch}`
})

// ⚠️ mapping (keep for now)
const bookSlugMap: Record<string, string> = {
  Matthew: 'matthew',
  Mark: 'mark',
  Luke: 'luke',
  John: 'john'
}
function saveNoteManual(item: SavedVerse) {
  const idx = savedAll.value.findIndex(x =>
    x.bookKey === item.bookKey &&
    x.chapter === item.chapter &&
    x.verse === item.verse
  )
  const note = idx >= 0 ? (savedAll.value[idx].note || '') : (item.note || '')

  upsertVerseNote({
    bookKey: item.bookKey,
    bookName: item.bookName,
    chapter: item.chapter,
    verse: item.verse,
    text: item.text,
    note
  })

  // ✅ feedback
  showSavedToast.value = true
}


// ✅ Tafsir CSV
const TAFSIR_CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vQUoB2kNCIAvyniIzgd0mm8gmkTJRMTOu_KqELNFCuOexpimx4C12-J4zyenmRmjmXm50T1O1t-fGw2/pub?gid=0&single=true&output=csv'

// ===== Saved verses =====
const showSaved = ref(false)
const savedAll = ref<SavedVerse[]>([])
const savedQuery = ref('')

function refreshSavedList() {
  savedAll.value = listSavedVerses()
}

function openSavedSheet() {
  refreshSavedList()
  showSaved.value = true
}

const filteredSaved = computed(() => {
  const q = savedQuery.value.trim()
  if (!q) return savedAll.value

  return savedAll.value.filter(x => {
    const ref = `${x.bookName} ${x.chapter}:${x.verse}`
    return (
      matchesQuery(x.text || '', q) ||
      matchesQuery(x.bookName || '', q) ||
      matchesQuery(ref, q) ||
      matchesQuery(x.note || '', q)
    )
  })
})

function savedIcon(n: number) {
  return isVerseSaved(bookKey.value, chapterNum.value, n) ? bookmark : bookmarkOutline
}

function toggleSaveVerse(n: number, text: string) {
  if (!data.value) return

  toggleVerseSaved({
    bookKey: bookKey.value,
    bookName: data.value.bookName,
    chapter: chapterNum.value,
    verse: n,
    text
  })

  refreshSavedList()
}

function removeSaved(item: SavedVerse) {
  toggleVerseSaved({
    bookKey: item.bookKey,
    bookName: item.bookName,
    chapter: item.chapter,
    verse: item.verse,
    text: item.text
  })
  refreshSavedList()
}

async function openSavedVerse(item: SavedVerse) {
  showSaved.value = false
  await router.push({
    path: `/chapter/${item.bookKey}/${item.chapter}`,
    query: { v: String(item.verse) }
  })
}

// ✅ typing (keep UI synced)
function onNoteInput(item: SavedVerse, ev: any) {
  const v = String(ev?.target?.value ?? '')

  // update list item
  const idx = savedAll.value.findIndex(x =>
    x.bookKey === item.bookKey &&
    x.chapter === item.chapter &&
    x.verse === item.verse
  )
  if (idx >= 0) savedAll.value[idx].note = v

  // update passed item so it shows immediately
  ;(item as any).note = v
}

// ✅ save on blur with the REAL textarea value
function saveNoteDirect(item: SavedVerse, ev: any) {
  const v = String(ev?.target?.value ?? '')

  upsertVerseNote({
    bookKey: item.bookKey,
    bookName: item.bookName,
    chapter: item.chapter,
    verse: item.verse,
    text: item.text,
    note: v
  })

  // ensure in-memory matches
  const idx = savedAll.value.findIndex(x =>
    x.bookKey === item.bookKey &&
    x.chapter === item.chapter &&
    x.verse === item.verse
  )
  if (idx >= 0) savedAll.value[idx].note = v
}

// keep list fresh when opening
watch(showSaved, (v) => {
  if (v) refreshSavedList()
})

// ===== Sections inline title =====
function sectionTitleAt(verseNum: number): string | null {
  const s = sections.value.find(x => Number(x.fromVerse) === verseNum)
  return s ? s.title : null
}

// ===== Tafsir state =====
const tafsirRows = ref<TafsirRow[]>([])
const tafsirLoading = ref(false)
const openVerse = ref<number | null>(null)

function isOpen(n: number) {
  return openVerse.value === n
}

async function loadTafsirOnce() {
  const b = String(bookKey.value).trim()
  const ch = Number(chapterNum.value)

  const cached = readTafsirCache(b, ch)
  if (cached && cached.length) {
    tafsirRows.value = cached
    return
  }

  tafsirLoading.value = true
  try {
    const res = await fetch(TAFSIR_CSV_URL, { cache: 'no-store' })
    const csv = await res.text()

    const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true })

    const all = (parsed.data as any[])
      .filter(r => r.bookKey && r.chapter && r.fromVerse && r.toVerse)
      .map(r => ({
        bookKey: String(r.bookKey).trim(),
        chapter: Number(r.chapter),
        fromVerse: Number(r.fromVerse),
        toVerse: Number(r.toVerse),
        tafsir: String(r.tafsir || '').trim()
      }))

    const filtered = all.filter(r =>
      String(r.bookKey).trim().toLowerCase() === b.toLowerCase() &&
      Number(r.chapter) === ch
    )

    tafsirRows.value = filtered
    writeTafsirCache(b, ch, filtered)
  } catch (e) {
    console.error('Tafsir load failed', e)
  } finally {
    tafsirLoading.value = false
  }
}

async function toggleVerse(n: number) {
  if (openVerse.value === n) {
    openVerse.value = null
    return
  }

  openVerse.value = n

  if (!tafsirRows.value.length) {
    await loadTafsirOnce()
  }
}

function getTafsirForVerse(n: number): string | null {
  const b = String(bookKey.value || '').trim().toLowerCase()
  const ch = Number(chapterNum.value || 1)

  const row = tafsirRows.value.find(r => {
    return (
      String(r.bookKey || '').trim().toLowerCase() === b &&
      Number(r.chapter) === ch &&
      n >= Number(r.fromVerse) &&
      n <= Number(r.toVerse)
    )
  })

  return row?.tafsir || null
}

// ===== Chapter load =====
async function openIntroVideo() {
  const id = intro.value?.youtubeId
  if (!id) return
  await Browser.open({ url: `https://www.youtube.com/watch?v=${id}` })
}

async function loadChapter() {
  const b = bookKey.value
  const ch = chapterNum.value

  // cache first
  const cached = readChapterCache(b, ch)
  if (cached) {
    data.value = cached
    refreshChapterFromNetwork(b, ch).catch(console.error)
    return
  }

  await refreshChapterFromNetwork(b, ch)
}

async function refreshChapterFromNetwork(bk: string, ch: number) {
  const slug = bookSlugMap[bk] || bk.toLowerCase()
  const url = `${CONTENT_BASE}/bible/${slug}/${ch}.json`

  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) return

  const json = await res.json()
  data.value = json
  writeChapterCache(bk, ch, json)
}

// jump to verse from query ?v=
async function jumpToVerseFromQuery() {
  const qv = typeof route.query.v === 'string' ? Number(route.query.v) : NaN
  if (!Number.isFinite(qv)) return

  openVerse.value = qv
  if (!tafsirRows.value.length) await loadTafsirOnce()

  await nextTick()
  const el = document.getElementById(`v-${qv}`)
  el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

onMounted(() => {
  loadChapter().catch(console.error)
  refreshSavedList()
  jumpToVerseFromQuery().catch(console.error)
})
</script>

<style scoped>
.chapter{
  --mk-bg1: #eef4f8;
  --mk-bg2: #ffffff;
  --mk-text: #0b2b40;
  --mk-card: #ffffff;
  --mk-accent: #1fb6aa;
  --mk-danger: #e23b3b;

  --mk-border: rgba(11,43,64,0.08);
  --mk-shadow: 0 8px 20px rgba(0,0,0,0.06);
  --mk-shadow-strong: 0 16px 34px rgba(0,0,0,0.10);

  font-family:"Noto Naskh Arabic","Noto Kufi Arabic",system-ui,sans-serif;
  color: var(--mk-text);
}

:global(html[data-mk-theme="dark"]) .chapter{
  --mk-bg1: #0b1620;
  --mk-bg2: #0a0f14;
  --mk-text: #ffffff;
  --mk-card: rgba(255, 255, 255, 0.07);
  --mk-accent: #1fb6aa;
  --mk-danger: #ff6b6b;

  --mk-border: rgba(255,255,255,0.12);
  --mk-shadow: 0 16px 30px rgba(0,0,0,0.35);
  --mk-shadow-strong: 0 22px 40px rgba(0,0,0,0.55);
}

:global(ion-content){
  --background: transparent;
}

.wrap{
  padding:16px;
  padding-top: calc(env(safe-area-inset-top) + 10px);
  max-width:760px;
  margin:0 auto;
}

:global(body) .chapter{
  background: transparent;
}
.chapter::before{
  content:"";
  position: fixed;
  inset: 0;
  z-index: -1;
  background: linear-gradient(to bottom, var(--mk-bg1), var(--mk-bg2));
}

/* Intro */
.introBox{
  margin-bottom:16px;
  background: var(--mk-card);
  border-radius:18px;
  padding:12px;
  border: 1px solid var(--mk-border);
  box-shadow: var(--mk-shadow);
}
.introTitle{
  font-size:18px;
  font-weight:900;
  text-align:center;
  margin-bottom:10px;
}
.videoWrap{
  position:relative;
  width:100%;
  padding-top:56.25%;
  border-radius:14px;
  overflow:hidden;
  border: 1px solid var(--mk-border);
}
.videoWrap iframe{
  position:absolute; inset:0;
  width:100%; height:100%;
  border:0;
}
.iosVideoBtn{
  position:absolute; inset:0;
  width:100%; height:100%;
  border:0;
  background: rgba(0,0,0,0.10);
  color: var(--mk-text);
  font-size:18px;
  font-weight:900;
  cursor:pointer;
}

.videoNote{
  margin-top:10px;
  padding:10px 12px;
  border-radius:14px;
  background: rgb(182 31 31 / 12%);
  border: 1px dashed rgb(174 19 19);
  font-size:14px;
  font-weight:800;
  text-align:center;
}

/* Title */
.chapterTitle{
  font-size:22px;
  font-weight:900;
  text-align:center;
  margin: 6px 0 10px;
  font-family:"Noto Kufi Arabic", system-ui, sans-serif;
}

/* Saved open btn */
.savedOpenBtn{
  width: 100%;
  margin: 10px 0 12px;
  padding: 12px 14px;
  border-radius: 18px;
  border: 1px solid var(--mk-border);
  background: var(--mk-card);
  box-shadow: var(--mk-shadow);
  font-weight: 1000;
  cursor:pointer;
  font-family: "Noto Kufi Arabic", system-ui, sans-serif;
}

/* خلي محتوى المودال ياخد ارتفاع الشاشة ويكون فيه سكرول */
.savedSheet::part(content){
  height: 90vh;
  max-height: 90vh;
  border-radius: 22px 22px 0 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* خلي ion-content جوه المودال يتمدد وياخد السكرول */
.savedSheet :deep(ion-content){
  flex: 1;
  --overflow: auto;
}

/* لو عندك padding في ion-content */
.savedBody{
  --padding-top: 10px;
  --padding-bottom: 18px;
}

.savedCount{
  display:inline-block;
  margin-inline-start: 8px;
  padding: 2px 10px;
  border-radius: 999px;
  border: 1px solid var(--mk-border);
  background: rgba(31,182,170,0.10);
}

/* Verses */
.verses{
  background: var(--mk-card);
  border-radius:18px;
  padding:10px;
  border: 1px solid var(--mk-border);
  box-shadow: var(--mk-shadow);
}
.verseBlock{ border-bottom:1px solid var(--mk-border); }
.verseBlock:last-child{ border-bottom:0; }
.savedSearchWrap{
  padding: 10px 12px 12px;
  display:flex;
  gap:10px;
  align-items:center;
}

.savedSearch{
  flex:1;
  height: 42px;
  border-radius: 14px;
  border: 1px solid var(--mk-border);
  padding: 0 12px;
  font-weight: 800;
  background: rgba(0,0,0,0.03);
  color: var(--mk-text);
  outline: none;
}

:global(html[data-mk-theme="dark"]) .savedSearch{
  background: rgba(255,255,255,0.06);
  border-color: rgba(255,255,255,0.14);
}

.savedClear{
  width: 42px;
  height: 42px;
  border-radius: 14px;
  border: 1px solid var(--mk-border);
  background: rgba(0,0,0,0.06);
  color: var(--mk-text);
  font-weight: 1000;
  cursor:pointer;
}

:global(html[data-mk-theme="dark"]) .savedClear{
  background: rgba(255,255,255,0.08);
}

.sectionInline{
  margin: 10px 8px 0;
  padding: 9px 12px;
  background: radial-gradient(700px 240px at 15% 0%, rgb(204 209 208 / 38%), rgba(255, 255, 255, 0) 62%),
              linear-gradient(135deg, #28d6cc30, #f0f0f0);
  color: #0b2b40;
  border-radius: 14px;
  font-weight: 900;
  text-align: center;
  box-shadow: 0 10px 18px rgba(0, 0, 0, 0.08);
}

.verseRow{
  display:grid;
  grid-template-columns: 1fr 44px;
  gap: 10px;
  align-items: start;
  padding:12px 8px;
}

.verseMain{
  width:100%;
  display:grid;
  grid-template-columns:42px 1fr 18px;
  gap:10px;
  background:transparent;
  border:0;
  text-align:right;
  cursor:pointer;
  padding:0;
}

.num{
  background: rgba(31,182,170,0.12);
  color: var(--mk-text);
  border: 1px solid rgba(31,182,170,0.20);
  border-radius:12px;
  text-align:center;
  font-weight:900;
  padding:6px 0;
  height:fit-content;
}
.savedSheet ion-content{
  -webkit-overflow-scrolling: touch;
}

.txt{
  font-size:18px;
  line-height:1.95;
  white-space:pre-wrap;
  font-weight:800;
  font-family:"Noto Kufi Arabic", system-ui, sans-serif;
}

.chev{
  color: var(--mk-text);
  font-weight:900;
  padding-top:6px;
  opacity: 0.9;
}
.chev :deep(svg),
.chev :deep(ion-icon){
  transition: transform 0.2s ease;
}
.chev :deep(.open){
  transform: rotate(90deg);
}

.saveBtn{
  height: 44px;
  width: 44px;
  border-radius: 14px;
  border: 1px solid var(--mk-border);
  background: rgba(31,182,170,0.10);
  display:flex;
  align-items:center;
  justify-content:center;
  cursor:pointer;
}

/* Tafsir */
.tafsirBox{
  margin:0 8px 12px;
  padding:12px;
  border-radius:14px;
  background: rgba(31,182,170,0.10);
  border: 1px solid rgba(31,182,170,0.18);
  font-family:"Noto Kufi Arabic", system-ui, sans-serif;
}
.tafsirText{
  font-size:16px;
  line-height:1.95;
  text-align:right;
  white-space:pre-wrap;
  opacity: 0.95;
}
.tafsirHint{
  font-size:14px;
  color: rgba(11,43,64,0.70);
  text-align:center;
}
:global(html[data-mk-theme="dark"]) .tafsirHint{
  color: rgba(255,255,255,0.75);
}

.space{ height: 20px; }

/* Saved sheet */
.savedSheet::part(content){
  border-radius: 22px 22px 0 0;
  overflow: hidden;
}
.savedHeader{
  --background: transparent;
}
.savedBody{
  --padding-top: 10px;
  --padding-bottom: 18px;
}
.savedEmpty{
  padding: 18px;
  text-align:center;
  font-weight: 900;
  opacity: 0.75;
}
.savedList{
  padding: 0 12px 18px;
  display:flex;
  flex-direction:column;
  gap: 10px;
}
.savedCard{
  text-align:right;
  border: 1px solid var(--mk-border);
  border-radius: 18px;
  padding: 12px 12px 14px;
  background: var(--mk-card);
  box-shadow: var(--mk-shadow);
  cursor: default; /* مهم عشان الكتابة تحسها طبيعية */
}
/* خليه ياخد ارتفاع واضح */
.savedSheet::part(content){
  height: 100%;
  max-height: 95vh;
  border-radius: 22px 22px 0 0;
  overflow: hidden;
}

/* امنعي أي overflow غلط من اللي فوق */
.savedBody{
  height: 100%;
}

/* خلي الليست يتمرّر جوه */
.savedList{
  padding: 0 12px 18px;
  display:flex;
  flex-direction:column;
  gap: 10px;
  /* اختياري: لو حسيتي ion-content مش بيمسك */
  /* overflow: auto; */
}
:global(.savedToast){
  --background: rgba(0,0,0,0.75);
  --color: #fff;
  font-weight: 900;
  text-align: center;
}

.saveNoteBtn{
  margin-top: 8px;
  width: 100%;
  padding: 10px 12px;
  font-family: "Noto Kufi Arabic", system-ui, sans-serif;

  border-radius: 14px;
  border: 1px solid var(--mk-border);
  background: rgba(31,182,170,0.14);

  font-size: 14px;
  font-weight: 900;
  color: var(--mk-text);

  cursor: pointer;
}

.saveNoteBtn:active{
  transform: translateY(1px);
}

:global(html[data-mk-theme="dark"]) .saveNoteBtn{
  background: rgba(40,214,204,0.18);
}

.savedTopRow{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:10px;
  margin-bottom: 8px;
}
.savedOpen{
  border: 0;
  background: transparent;
  padding: 0;
  margin: 0;
  cursor: pointer;
  text-align: right;
}
.savedRef{
  display:flex;
  align-items:center;
  gap:10px;
  font-weight: 1000;
  opacity: 0.95;
}
.savedBook{
  font-size: 15px;
  opacity: 0.9;
}
.savedLoc{
  font-size: 13px;
  padding: 2px 10px;
  border-radius: 999px;
  background: rgba(31,182,170,0.14);
  border: 1px solid rgba(31,182,170,0.28);
  font-weight: 900;
}
:global(html[data-mk-theme="dark"]) .savedLoc{
  background: rgba(40,214,204,0.16);
  border-color: rgba(40,214,204,0.28);
}

.savedRemove{
  border: 0;
  background: rgba(0,0,0,0.06);
  width: 32px;
  height: 32px;
  border-radius: 12px;
  cursor:pointer;
  font-weight: 1000;
  color: var(--mk-text);
}
:global(html[data-mk-theme="dark"]) .savedRemove{
  background: rgba(255,255,255,0.08);
}

.savedText{
  white-space: pre-wrap;
  line-height: 1.95;
  font-weight: 800;
  opacity: 0.95;
  font-family: "Noto Kufi Arabic", system-ui, sans-serif;

}

.savedNote{
  margin-top: 10px;
  width: 100%;
  min-height: 64px;
  resize: vertical;

  border-radius: 14px;
  border: 1px dashed var(--mk-border);
  padding: 10px 12px;
font-family: "Amiri", "Noto Naskh Arabic", serif;
  font-size: 14px;
  line-height: 1.8;
  font-weight: 700;

  background: rgba(31,182,170,0.06);
  color: var(--mk-text);
  outline: none;
}
.savedNote::placeholder{ opacity: 0.6; }
:global(html[data-mk-theme="dark"]) .savedNote{
  background: rgba(255,255,255,0.06);
  border-color: rgba(255,255,255,0.18);
}
</style>
