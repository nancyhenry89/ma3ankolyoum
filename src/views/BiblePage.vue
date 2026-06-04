<template>
    <ion-page dir="rtl" class="bible">
      <ion-header :translucent="true">
        <ion-toolbar>
          <ion-buttons slot="start">
            <ion-back-button default-href="/home" />
          </ion-buttons>
          <ion-title>{{ isArabic ? 'الكتاب المقدس' : 'Bible' }}</ion-title>
        </ion-toolbar>
  
        <div class="segWrap">
          <ion-segment v-model="testament" class="seg" @ionChange="onSegChange">
            <ion-segment-button value="nt">
              <ion-label>{{ isArabic ? 'العهد الجديد' : 'New Testament' }}</ion-label>
            </ion-segment-button>
            <ion-segment-button value="ot">
              <ion-label>{{ isArabic ? 'العهد القديم' : 'Old Testament' }}</ion-label>
            </ion-segment-button>
          </ion-segment>
        </div>
      </ion-header>
  
      <ion-content :fullscreen="true">
        <div class="wrap">
            <ion-accordion-group @ionChange="onGroupChange">
  <ion-accordion
    v-for="b in activeBooks"
    :key="b.key"
    :value="b.key"
  >
              <ion-item slot="header" class="bookHeader">
                <ion-label class="bookName">{{ b.nameAr }}</ion-label>
                <div class="bookMeta" v-if="availability[b.key]?.checking">
                  {{ isArabic ? 'جاري التحميل…' : 'Loading…' }}
                </div>
              </ion-item>
  
              <div slot="content" class="bookContent">
                <div class="chapGrid">
                    <button
  v-for="ch in b.maxChapters"
  :key="ch"
  class="chapBtn"
  :class="chapterClass(b, ch)"
  :disabled="chapterDisabled(b, ch)"
  @click="openChapter(b, ch)"
>
  {{ ch }}
</button>

                </div>
  
                <div class="hint">
                  {{ isArabic ? 'الأصحاح الرمادي غير متاح حاليًا.' : 'Grey chapters are not available yet.' }}
                </div>
              </div>
            </ion-accordion>
          </ion-accordion-group>
        </div>
      </ion-content>
    </ion-page>
  </template>
  
  <script setup lang="ts">
  import {
    IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
    IonContent, IonSegment, IonSegmentButton, IonLabel,
    IonAccordionGroup, IonAccordion, IonItem,
  } from '@ionic/vue'
  import { Capacitor } from '@capacitor/core'
  import { computed, onMounted, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import {
  syncBibleOffline,
  isChapterAvailableOfflineAware
} from '@/services/bibleOffline'
  type Lang = 'ar' | 'en'

  

  
  const router = useRouter()
  
  // ===== lang (listens to your global event) =====
  const lang = ref<Lang>(((localStorage.getItem('mk_lang') as Lang) || 'ar') === 'en' ? 'en' : 'ar')
  const isArabic = computed(() => lang.value === 'ar')
  function syncLang() {
    const v = (localStorage.getItem('mk_lang') as Lang) || 'ar'
    lang.value = v === 'en' ? 'en' : 'ar'
  }
  
  // ===== content base (same as ChapterPage) =====
  const CONTENT_BASE = Capacitor.isNativePlatform()
    ? 'https://nancyhenry89.github.io/ma3ankolyoum/content'
    : `${import.meta.env.BASE_URL}content`.replace(/\/$/, '')
  
  // ===== UI state =====
  const testament = ref<Testament>('nt') // ✅ default New Testament
  
  function onSegChange() {
    // optional: you can persist selection
    localStorage.setItem('mk_bible_testament', testament.value)
  }
  
  // ===== Books (canonical order) =====
  // ⚠️ حطي هنا كل الأسفار اللي عايزاها.
  // أنا حاطط NT كامل + OT قانوني كامل. عدّلي الأسماء/الفولدرات/عدد الأصحاحات لو محتاجة.
  // لو أنتِ لسه مش عاملة كل folders/chapters، chapters هتظهر رمادي تلقائيًا بعد الفحص.
  
  import { BOOKS, type BookDef, type Testament } from '@/data/bibleBooks'
  
  const activeBooks = computed(() => BOOKS.filter(b => b.testament === testament.value))
  
  // ===== availability cache =====
  type AvState = { checked: Record<number, boolean>, checking: boolean, ts: number }
  const availability = ref<Record<string, AvState>>({})
  
  function cacheKeyForBook(bookKey: string) {
    return `mk_bible_avail_${bookKey}`
  }
  function chapterState(b: BookDef, ch: number): boolean | null {
  const st = ensureAvState(b.key)
  return (st.checked[ch] ?? null) as any
}

function chapterClass(b: BookDef, ch: number) {
  const v = chapterState(b, ch)
  return {
    neutral: v === null,     // لسه ما اتفحصش
    available: v === true,
    disabled: v === false,
  }
}

function chapterDisabled(b: BookDef, ch: number) {
  const v = chapterState(b, ch)
  // ✅ unknown (null) => disabled لحد ما السفر يتفحص عند فتحه
  return v !== true
}

  function loadCachedAvailability(bookKey: string) {
    try {
      const raw = localStorage.getItem(cacheKeyForBook(bookKey))
      if (!raw) return null
      const obj = JSON.parse(raw)
      if (!obj || typeof obj !== 'object') return null
      return obj as AvState
    } catch {
      return null
    }
  }
  
  function saveCachedAvailability(bookKey: string, st: AvState) {
    try {
      localStorage.setItem(cacheKeyForBook(bookKey), JSON.stringify(st))
    } catch {}
  }
  
  function ensureAvState(bookKey: string) {
    if (!availability.value[bookKey]) {
      const cached = loadCachedAvailability(bookKey)
      availability.value[bookKey] = cached || { checked: {}, checking: false, ts: 0 }
    }
    return availability.value[bookKey]
  }
  
  function chapterUrl(b: BookDef, ch: number) {
    return `${CONTENT_BASE}/bible/${b.slug}/${ch}.json`
  }
  
  async function checkChapterExists(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'GET', cache: 'no-store' })
    if (!res.ok) return false

    const ct = (res.headers.get('content-type') || '').toLowerCase()

    // GitHub Pages fallback بيرجع text/html حتى لو المسار غلط
    if (ct.includes('text/html')) return false

    // الأفضل: نتأكد إنه JSON فعلاً
    if (!ct.includes('application/json')) {
      // أحيانًا بيكون octet-stream، فنجرب parse
      try {
        const j = await res.clone().json()
        return !!j && typeof j === 'object' && Array.isArray(j.verses)
      } catch {
        return false
      }
    }

    const j = await res.json()
    return !!j && typeof j === 'object' && Array.isArray((j as any).verses)
  } catch {
    return false
  }
}

  
  // ===== UI helpers =====
  function isChapterAvailable(b: BookDef, ch: number) {
    const st = ensureAvState(b.key)
    return st.checked[ch] === true
  }
  function isChapterDisabled(b: BookDef, ch: number) {
    const st = ensureAvState(b.key)
    // لو اتفحص واتطلع false => disabled
    if (st.checked[ch] === false) return true
    // لو لسه مااتفحصش، هنخليه enabled؟ لا: علشان شرطك "لو مش متاح يبقى رمادي"
    // بس إحنا لسه مش عارفين.. فهنا الأفضل:
    // - قبل الفحص: نخليه رمادي (disabled)؟ ده هيمنع التجربة
    // - الأفضل: نخليه enabled لكن شكله neutral
    // أنا هخليه enabled قبل الفحص (علشان UX) لكن بمجرد الفحص يتظبط.
    return false
  }
  
  // ===== open chapter =====
  async function openChapter(b: BookDef, ch: number) {
  const st = ensureAvState(b.key)
  if (st.checked[ch] !== true) return
  router.push(`/chapter/${b.key}/${ch}`)
}

  
  // ===== when accordion opens: lazy check chapters =====
  async function ensureBookChecked(b: BookDef) {
  const st = ensureAvState(b.key)
  if (st.checking) return

  // ✅ بدل ما نعمل return لو fresh، هنسمح بإعادة فحص الـ false بعد 10 دقائق
  const ttl = 7 * 24 * 60 * 60 * 1000
  const recheckFalseAfter = 10 * 60 * 1000

  const isFresh = st.ts && (Date.now() - st.ts) < ttl
  const canRecheckFalse = !st.ts || (Date.now() - st.ts) > recheckFalseAfter

  st.checking = true
  availability.value = { ...availability.value, [b.key]: { ...st } }

  const max = b.maxChapters
  const concurrency = 6
  let i = 1

  async function worker() {
    while (i <= max) {
      const ch = i++

      // ✅ لو known true -> skip
      if (st.checked[ch] === true) continue

      // ✅ لو known false -> recheck فقط لو canRecheckFalse
      if (st.checked[ch] === false && !canRecheckFalse) continue

      // ✅ لو null/undefined -> check عادي
      
      const ok = await isChapterAvailableOfflineAware(b.slug, ch)
      st.checked[ch] = ok

      // تحديث UI أسرع (مش كل 8)
      if (ch % 3 === 0) {
        availability.value = { ...availability.value, [b.key]: { ...st } }
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()))

  st.checking = false
  st.ts = Date.now()
  availability.value = { ...availability.value, [b.key]: { ...st } }
  saveCachedAvailability(b.key, st)
}

  function findBookByKey(key: string) {
  return BOOKS.find(x => x.key === key) || null
}

function onGroupChange(ev: any) {
  const openedKey = ev?.detail?.value
  if (!openedKey) return
  const b = findBookByKey(String(openedKey))
  if (!b) return
  ensureBookChecked(b).catch(console.error)
}

  function onAccordionChange(ev: any, b: BookDef) {
    // لما الـ accordion يتفتح، Ionic بيبعت value
    // لو اتفتح فعلاً => افحص
    // (لو قفل، مش مهم)
    const val = ev?.detail?.value
    if (val === b.key) {
      ensureBookChecked(b).catch(console.error)
    }
  }
  
  onMounted(() => {
    syncBibleOffline().catch(console.error)
    syncLang()
    window.addEventListener('mk:lang-changed', syncLang)
  
    const saved = localStorage.getItem('mk_bible_testament') as Testament | null
    if (saved === 'ot' || saved === 'nt') testament.value = saved
  })
  function stChecked(bookKey: string, ch: number) {
  const st = ensureAvState(bookKey)
  return st.checked[ch]
}

  </script>
  
  <style scoped>
 /* =========================
  Bible Page – Clean Light/Dark
  - No white strips on mobile
  - Segment readable
  - Accordion cards consistent
  - Chapter buttons: solid grey (not transparent)
========================= */

.bible{
  /* ------- LIGHT TOKENS ------- */
  --mk-bg1: #eef4f8;
  --mk-bg2: #ffffff;

  --mk-text: #0b2b40;
  --mk-text-dim: rgba(11,43,64,0.68);

  --mk-surface: #ffffff;                 /* cards */
  --mk-surface-2: rgba(255,255,255,0.92);/* toolbar/segment bg */
  --mk-border: rgba(11,43,64,0.10);

  --mk-accent: #1fb6aa;
  --mk-accent-weak: rgba(31,182,170,0.14);
  --mk-accent-mid: rgba(31,182,170,0.22);

  /* greys for chapters */
  --mk-grey: rgba(11,43,64,0.08);
  --mk-grey-2: rgba(11,43,64,0.12);
  --mk-grey-text: rgba(11,43,64,0.58);

  font-family:"Noto Naskh Arabic","Noto Kufi Arabic",system-ui,sans-serif;
  color: var(--mk-text);

  /* background */
  background: linear-gradient(to bottom, var(--mk-bg1), var(--mk-bg2));
  --mk-disabled-bg: rgba(11,43,64,0.10);
  --mk-disabled-border: rgba(11,43,64,0.14);
  --mk-disabled-text: rgba(11,43,64,0.72);
}
/* ===== Better disabled contrast (DARK) ===== */
:global(html.ion-palette-dark) .bible,
:global(html.dark) .bible,
:global(body.dark) .bible,
:global(ion-app.ion-palette-dark) .bible,
:global(ion-app.dark) .bible{
  /* ✅ new tokens للـ disabled في الدارك */
  --mk-disabled-bg: rgba(255,255,255,0.10);
  --mk-disabled-border: rgba(255,255,255,0.16);
  --mk-disabled-text: rgba(255,255,255,0.62);
}
/* ------- DARK TOKENS ------- */
:global(html.ion-palette-dark) .bible,
:global(html.dark) .bible,
:global(body.dark) .bible,
:global(ion-app.ion-palette-dark) .bible,
:global(ion-app.dark) .bible{
  --mk-bg1: #0b1620;
  --mk-bg2: #0a0f14;

  --mk-text: rgba(255,255,255,0.95);
  --mk-text-dim: rgba(255,255,255,0.70);

  --mk-surface: rgba(255,255,255,0.08);
  --mk-surface-2: rgba(12,18,26,0.88);
  --mk-border: rgba(255,255,255,0.14);

  --mk-accent: #28d6cc;
  --mk-accent-weak: rgba(40,214,204,0.16);
  --mk-accent-mid: rgba(40,214,204,0.24);

  --mk-grey: rgba(255,255,255,0.08);
  --mk-grey-2: rgba(255,255,255,0.12);
  --mk-grey-text: rgba(255,255,255,0.58);

  background: linear-gradient(to bottom, var(--mk-bg1), var(--mk-bg2));
}

/* =========================
   IONIC GLOBAL FIXES (mobile)
========================= */

/* ion-content bg transparent is OK since bible has background */
:global(ion-content){
  --background: transparent !important;
}

/* header should not inject white */
:global(ion-header){
  background: transparent !important;
}

/* Toolbar: force solid background + correct text */
:global(ion-toolbar){
  --background: var(--mk-surface-2) !important;
  --color: var(--mk-text) !important;
  --border-color: var(--mk-border) !important;
}

/* Title/back button */
:global(ion-title){ color: var(--mk-text) !important; }
:global(ion-back-button){ color: var(--mk-text) !important; }

/* =========================
   Layout
========================= */
.wrap{
  padding: 16px;
  padding-top: calc(env(safe-area-inset-top) + 10px);
  max-width: 860px;
  margin: 0 auto;
}

/* =========================
   Segment
========================= */
.segWrap{
  padding: 8px 12px 12px;
  background:#fff
}

.seg{
  border-radius: 14px;
  overflow: hidden;

  background: var(--mk-surface);
  border: 1px solid var(--mk-border);
  padding: 4px;
}

/* Segment buttons */
.seg :deep(ion-segment-button){
  --color: var(--mk-text-dim);
  --color-checked: var(--mk-text);
  --indicator-color: var(--mk-accent-weak);
  --indicator-height: 100%;
  --border-radius: 12px;

  font-weight: 1000;
}
.accordion-animated,.accordion-collapsed{background: #fff;}
/* Checked button feel */
.seg :deep(.segment-button-checked){
  background: var(--mk-accent-weak);
}

/* =========================
   Accordion / Books
========================= */
.bookHeader{
  --background: var(--mk-surface) !important;
  --color: var(--mk-text) !important;

  border: 1px solid var(--mk-border);
  border-radius: 16px;
  margin-bottom: 10px;
}

/* make sure ion-item inside doesn't flash white */
.bookHeader :deep(.item-native){
  background: transparent !important;
}

.bookName{
  font-weight: 1000;
}

.bookMeta{
  font-size: 12px;
  font-weight: 900;
  opacity: 0.7;
}

.bookContent{
  margin: -4px 0 12px;
  padding: 12px;
  background: var(--mk-surface);
  border: 1px solid var(--mk-border);
  border-radius: 16px;
}

/* =========================
   Chapters Grid
========================= */
.chapGrid{
  display: grid;
  grid-template-columns: repeat(8, minmax(0, 1fr));
  gap: 8px;
}

@media (max-width: 520px){
  .chapGrid{ grid-template-columns: repeat(6, minmax(0, 1fr)); }
}

/* Base button */
.chapBtn{
  height: 38px;
  border-radius: 12px;
  border: 1px solid var(--mk-border);

  background: var(--mk-grey);     /* ✅ solid grey base */
  color: var(--mk-text);
  font-weight: 1000;

  cursor: pointer;
  transition: background-color 140ms ease, border-color 140ms ease, transform 120ms ease;
}

/* Available: clear accent */
.chapBtn.available{
  background: var(--mk-accent-weak);
  border-color: color-mix(in srgb, var(--mk-accent) 45%, var(--mk-border));
}

/* Neutral: "not checked yet" — grey dashed but still solid */
.chapBtn.neutral{
  background: var(--mk-grey);
  border-color: var(--mk-grey-2);
  border-style: dashed;
  color: var(--mk-grey-text);
  opacity: 0.95;
}

/* ✅ Disabled: numbers always visible */
.chapBtn.disabled,
.chapBtn:disabled{
  background: var(--mk-disabled-bg);
  border-color: var(--mk-disabled-border);
  color: var(--mk-disabled-text);
  cursor: not-allowed;

  /* مهم: ما نقللش opacity علشان الأرقام ما تختفيش */
  opacity: 1;
  filter: saturate(0.9);
}


/* Press (only for enabled available/neutral) */
.chapBtn:not(:disabled):active{
  transform: scale(0.98);
}

/* Hint */
.hint{
  margin-top: 10px;
  font-size: 13px;
  font-weight: 800;
  opacity: 0.75;
  text-align: center;
}

  </style>
  
  