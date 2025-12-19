<template>
    <ion-page dir="rtl" class="chapter">
      <ion-header :translucent="true">
        <ion-toolbar>
          <ion-buttons slot="start">
            <ion-back-button default-href="/"></ion-back-button>
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
  ></iframe>
</div>



</div>
<div class="videoNote">
  💡 اضغط على الآية لعرض التفسير
</div>

          <div class="chapterTitle">{{ chapterTitle }}</div>
  
          <div class="verses">
            <div v-for="v in verses" :key="v.n" class="verseBlock">
              <!-- ✅ Section title يظهر عند fromVerse -->
              <div v-if="sectionTitleAt(v.n)" class="sectionInline">
                {{ sectionTitleAt(v.n) }}
              </div>
  
              <button class="verseRow" type="button" @click="toggleVerse(v.n)">
                <div class="num">{{ v.n }}</div>
                <div class="txt">{{ v.t }}</div>
                <div class="chev">
  <ion-icon
    :icon="chevronForwardOutline"
    :class="{ open: isOpen(v.n) }"
  />
</div>

              </button>
  
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
      </ion-content>
    </ion-page>
  </template>
  
  <script setup lang="ts">
  import {
    IonPage, IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton
  } from '@ionic/vue'
  import { computed, onMounted, ref } from 'vue'
  import { useRoute } from 'vue-router'
  import Papa from 'papaparse'
  import {
  chevronDownOutline,
  chevronForwardOutline,
  chevronDown,
  chevronForward,
  bulbOutline
} from 'ionicons/icons'
import { Capacitor } from '@capacitor/core'
import { Browser } from '@capacitor/browser'

const isIOSNative = computed(() => Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios')

async function openIntroVideo() {
  const id = intro.value?.youtubeId
  if (!id) return
  await Browser.open({ url: `https://www.youtube.com/watch?v=${id}` })
}

  type ChapterJSON = {
  bookKey: string
  bookName: string
  chapter: number
  chapterTitle: string
  intro?: {
    title: string
    youtubeId: string
  }
  sections: { title: string; fromVerse: number; toVerse: number }[]
  verses: { n: number; t: string }[]
}

  
  type TafsirRow = {
    bookKey: string
    chapter: number
    fromVerse: number
    toVerse: number
    tafsir: string
  }
  const CONTENT_BASE =
  'https://nancyhenry89.github.io/ma3ankolyoum/src/content'

  const route = useRoute()
  
  const bookKey = computed(() => String(route.params.bookKey || 'Matthew'))
  const chapterNum = computed(() => Number(route.params.chapter || 1))
  const intro = computed(() => data.value?.intro || null)

  
  // لازم يكون عندك: src/content/bible/matthew/1.json
  const bookSlugMap: Record<string, string> = { Matthew: 'matthew' }
  
  const data = ref<ChapterJSON | null>(null)
  
  // ✅ لينك شيت التفسير CSV (اللي بعتيه)
  const TAFSIR_CSV_URL =
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vQUoB2kNCIAvyniIzgd0mm8gmkTJRMTOu_KqELNFCuOexpimx4C12-J4zyenmRmjmXm50T1O1t-fGw2/pub?gid=0&single=true&output=csv'
  
  const headerTitle = computed(() => {
    const name = data.value?.bookName || bookKey.value
    const ch = data.value?.chapter || chapterNum.value
    return `${name} ${ch}`
  })
  
  const chapterTitle = computed(() => data.value?.chapterTitle || '')
  const verses = computed(() => data.value?.verses || [])
  const sections = computed(() => data.value?.sections || [])
  

  import { readChapterCache, writeChapterCache, readTafsirCache, writeTafsirCache } from '@/utils/chapterCache'

async function loadChapter() {
  const b = bookKey.value
  const ch = chapterNum.value

  // ✅ 1) cache first
  const cached = readChapterCache(b, ch)
  if (cached) {
    data.value = cached
    // تحديث من النت في الخلفية
    refreshChapterFromNetwork(b, ch).catch(console.error)
    return
  }

  // ✅ 2) مفيش كاش
  await refreshChapterFromNetwork(b, ch)
}

async function refreshChapterFromNetwork(bookKey: string, chapter: number) {
  const slug = bookSlugMap[bookKey] || bookKey.toLowerCase()
  const url = `${CONTENT_BASE}/bible/${slug}/${chapter}.json`

  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) return

  const json = await res.json()
  data.value = json

  // خزني
  writeChapterCache(bookKey, chapter, json)
}

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

  // ✅ كاش per chapter
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

    // ✅ خدي بس اللي يخص الصفحة الحالية
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

  // تفسير للآية حتى لو التفسير عامل Range (2-3)
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

  onMounted(() => {
  loadChapter().catch(console.error)
})

  </script>
  
  <style scoped>
  /* ================== Theme variables for Chapter (same as Home B) ================== */
.chapter{
  --mk-bg1: #eef4f8;
  --mk-bg2: #ffffff;
  --mk-text: #0b2b40;
  --mk-card: #ffffff;
  --mk-accent: #1fb6aa;
  --mk-dark: #0b2b40;
  --mk-danger: #e23b3b;

  --mk-border: rgba(11,43,64,0.08);
  --mk-shadow: 0 8px 20px rgba(0,0,0,0.06);
  --mk-shadow-strong: 0 16px 34px rgba(0,0,0,0.10);

  font-family:"Noto Naskh Arabic","Noto Kufi Arabic",system-ui,sans-serif;
  color: var(--mk-text);
}

/* Dark mode based on your applyPrefs(): data-mk-theme="dark" */
:global(html[data-mk-theme="dark"]) .chapter{
  --mk-bg1: #0b1620;
  --mk-bg2: #0a0f14;
  --mk-text: #ffffff;
  --mk-card: rgba(255, 255, 255, 0.07);
  --mk-accent: #1fb6aa;
  --mk-dark: #0b2b40;
  --mk-danger: #ff6b6b;

  --mk-border: rgba(255,255,255,0.12);
  --mk-shadow: 0 16px 30px rgba(0,0,0,0.35);
  --mk-shadow-strong: 0 22px 40px rgba(0,0,0,0.55);
}

/* ================== Page background like Home ================== */
:global(ion-content){
  --background: transparent;
}

.wrap{
  padding:16px;
  padding-top: calc(env(safe-area-inset-top) + 10px);
  max-width:760px;
  margin:0 auto;
}

/* خلفية نفس إحساس Home */
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

/* ================== Intro box ================== */
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
  color: var(--mk-text);
  text-align:center;
  margin-bottom:10px;
}

.videoWrap{
  position:relative;
  width:100%;
  padding-top:56.25%; /* 16:9 */
  border-radius:14px;
  overflow:hidden;
  border: 1px solid var(--mk-border);
}

.videoWrap iframe{
  position:absolute;
  top:0;
  left:0;
  width:100%;
  height:100%;
  border:0;
}

/* ================== Chapter title ================== */
.chapterTitle{
  font-size:22px;
  font-weight:900;
  color: var(--mk-text);
  text-align:center;
  margin: 6px 0 10px;
}

/* ================== Verses container ================== */
.verses{
  background: var(--mk-card);
  border-radius:18px;
  padding:10px;
  border: 1px solid var(--mk-border);
  box-shadow: var(--mk-shadow);
}

.verseBlock{ border-bottom:1px solid var(--mk-border); }
.verseBlock:last-child{ border-bottom:0; }

/* Section pill نفس روح Home */
.sectionInline{
  margin: 10px 8px 0;
  padding: 9px 12px;
  background: var(--mk-dark);
  color: #fff;
  border-radius: 14px;
  font-weight: 900;
  text-align: center;
  box-shadow: 0 10px 18px rgba(0,0,0,0.08);
}

/* Verse row */
.verseRow{
  width:100%;
  display:grid;
  grid-template-columns:42px 1fr 18px;
  gap:10px;
  padding:12px 8px;
  background:transparent;
  border:0;
  text-align:right;
  cursor:pointer;
}

/* رقم الآية */
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

/* نص الآية */
.txt{
  font-size:18px;
  line-height:1.95;
  color: var(--mk-text);
  white-space:pre-wrap;
  font-weight:800;
}

.chev{
  color: var(--mk-text);
  font-weight:900;
  padding-top:6px;
  opacity: 0.9;
}

/* ================== Tafsir ================== */
.tafsirBox{
  margin:0 8px 12px;
  padding:12px;
  border-radius:14px;
  background: rgba(31,182,170,0.10);
  border: 1px solid rgba(31,182,170,0.18);
}

.tafsirText{
  font-size:16px;
  line-height:1.95;
  color: var(--mk-text);
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
.chev ion-icon {
  font-size: 18px;
  transition: transform 0.2s ease;
}

.chev ion-icon.open {
  transform: rotate(90deg);
}
.videoNote{
  margin-top:10px;
  padding:10px 12px;
  border-radius:14px;
  background: rgb(182 31 31 / 12%);
  border: 1px dashed rgb(174 19 19);
  font-size:14px;
  font-weight:800;
  color: var(--mk-text);
  text-align:center;
}
.iosVideoBtn{
  position:absolute;
  inset:0;
  width:100%;
  height:100%;
  border:0;
  background: rgba(0,0,0,0.10);
  color: var(--mk-text);
  font-size:18px;
  font-weight:900;
  cursor:pointer;
}

  </style>
  