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
    <iframe
      :src="`https://www.youtube.com/embed/${intro.youtubeId}`"
      :title="intro.title"
      frameborder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowfullscreen
    ></iframe>
  </div>
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
                <div class="chev">{{ isOpen(v.n) ? '▾' : '▸' }}</div>
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
  

  async function loadChapter() {
  try {
    const slug = bookSlugMap[bookKey.value] || bookKey.value.toLowerCase()
    const url = `${CONTENT_BASE}/bible/${slug}/${chapterNum.value}.json`

    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) {
      console.error('Chapter JSON not found:', url)
      return
    }

    data.value = await res.json()
  } catch (e) {
    console.error('Failed to load chapter', e)
  }
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
    if (tafsirRows.value.length) return
  
    tafsirLoading.value = true
    try {
      const res = await fetch(TAFSIR_CSV_URL, { cache: 'no-store' })
      const csv = await res.text()
  
      const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true })
      const rows = (parsed.data as any[])
        .filter(r => r.bookKey && r.chapter && r.fromVerse && r.toVerse)
        .map(r => ({
          bookKey: String(r.bookKey).trim(),
          chapter: Number(r.chapter),
          fromVerse: Number(r.fromVerse),
          toVerse: Number(r.toVerse),
          tafsir: String(r.tafsir || '').trim()
        }))
  
      tafsirRows.value = rows
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
    await loadTafsirOnce()
  }
  
  // تفسير للآية حتى لو التفسير عامل Range (2-3)
  function getTafsirForVerse(n: number): string | null {
    const b = bookKey.value
    const ch = chapterNum.value
  
    const row = tafsirRows.value.find(r => {
      return r.bookKey === b && r.chapter === ch && n >= r.fromVerse && n <= r.toVerse
    })
    return row?.tafsir || null
  }
  
  onMounted(async () => {
    await loadChapter()
  })
  </script>
  
  <style scoped>
  .chapter{
    font-family:"Noto Naskh Arabic","Noto Kufi Arabic",system-ui,sans-serif;
  }
  .wrap{
    padding:16px;
    padding-top: calc(env(safe-area-inset-top) + 10px);
    max-width:760px;
    margin:0 auto;
  }
  .chapterTitle{
    font-size:22px;
    font-weight:900;
    color:#0b2b40;
    text-align:center;
    margin-bottom:10px;
  }
  
  .verses{
    background:#fff;
    border-radius:18px;
    padding:10px;
    box-shadow:0 8px 20px rgba(0,0,0,0.06);
  }
  
  .verseBlock{ border-bottom:1px solid rgba(0,0,0,0.06); }
  .verseBlock:last-child{ border-bottom:0; }
  
  .sectionInline{
    margin: 10px 8px 0;
    padding: 8px 12px;
    background: #0b2b40;
    color: #fff;
    border-radius: 12px;
    font-weight: 900;
    text-align: center;
  }
  
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
  
  .num{
    background:#eef4f8;
    color:#0b2b40;
    border-radius:10px;
    text-align:center;
    font-weight:900;
    padding:6px 0;
    height:fit-content;
  }
  .txt{
    font-size:18px;
    line-height:1.9;
    color:#0b2b40;
    white-space:pre-wrap;
    font-weight:bold
  }
  .chev{
    color:#0b2b40;
    font-weight:900;
    padding-top:6px;
  }
  
  .tafsirBox{
    margin:0 8px 12px;
    padding:12px;
    border-radius:14px;
    background:#eef4f8;
  }
  .tafsirText{
    font-size:16px;
    line-height:1.9;
    color:#0b2b40;
    text-align:right;
    white-space:pre-wrap;
  }
  .tafsirHint{
    font-size:14px;
    color: rgba(11,43,64,0.7);
    text-align:center;
  }
  .space{ height: 20px; }

  .introBox{
  margin-bottom:16px;
  background:#ffffff;
  border-radius:18px;
  padding:12px;
  box-shadow:0 8px 20px rgba(0,0,0,0.06);
}

.introTitle{
  font-size:18px;
  font-weight:900;
  color:#0b2b40;
  text-align:center;
  margin-bottom:10px;
}

.videoWrap{
  position:relative;
  width:100%;
  padding-top:56.25%; /* 16:9 */
  border-radius:14px;
  overflow:hidden;
}

.videoWrap iframe{
  position:absolute;
  top:0;
  left:0;
  width:100%;
  height:100%;
  border:0;
}

  </style>
  