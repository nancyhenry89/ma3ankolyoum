<!-- src/views/BookReaderPage.vue -->
<template>
  <ion-page class="bookReaderPage" dir="rtl" lang="ar">
    <ion-header class="ion-no-border" :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
  <button class="readerBackBtn" type="button" @click="goBackToToc">
    →
  </button>
</ion-buttons>
<ion-buttons slot="end">
      <button class="readerCloseBtn" @click="closeBook">
        ✕
      </button>
    </ion-buttons>

        <ion-title>{{ section?.title || "قراءة" }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content
      ref="contentRef"
      class="bookReaderContent"
      :fullscreen="true"
      :scroll-events="true"
      @ionScroll="onScroll"
    >
      <div class="readerWrap" :style="{ '--book-fontScale': String(settings.fontScale) }">
        <div v-if="loading" class="readerState">جاري تحميل المحتوى...</div>
        <div v-else-if="error" class="readerState">تعذر تحميل المحتوى حالياً.</div>

        <template v-else-if="book && chapter && section">
          <!-- compact top bar -->
          <section class="readerTopCard">
            <div class="readerTopRow">
              <div class="readerTopText">
                <div class="readerEyebrow">{{ book.title }}</div>
                <h1 class="readerSectionTitle">{{ section.title }}</h1>
                <div class="readerChapterTitle">{{ chapter.title }}</div>
              </div>

              <div v-if="savedToast" class="savedPill">تم الحفظ</div>
            </div>
          </section>

          <!-- settings -->
          <div class="mkSettingsBox" dir="rtl" lang="ar">
            <div class="mkSettingsHead">
              <div class="mkSettingsTitle">⚙️ إعدادات القراءة</div>
              <button class="mkSettingsReset" type="button" @click="resetFont">
                إعادة ضبط
              </button>
            </div>

            <div class="mkSettingCard">
              <div class="mkRowTop">
                <div class="mkLbl">حجم الخط</div>
                <div class="mkValue">{{ scaleLabel }}</div>
              </div>

              <ion-range
                v-model="settings.fontScale"
                :min="0.85"
                :max="2"
                :step="0.01"
                :snaps="false"
                :pin="true"
                :ticks="false"
                @ionInput="saveSettings"
                @ionChange="saveSettings"
                dir="ltr"
                class="mkRange"
              />
            </div>
          </div>

          <!-- reading card -->
          <section class="readerCard">
            <div class="readerSectionHead">
              <div class="sectionEyebrow">{{ chapter.title }}</div>
              <h2 class="sectionTitle">{{ section.title }}</h2>
            </div>

            <div class="bookContent">
              <BookBlocksRenderer :blocks="section.blocks" />
            </div>

            <div class="readerBottomNav">
              <button
                v-if="prevTarget"
                type="button"
                class="navBtn secondary"
                @click="goToTarget(prevTarget)"
              >
                <span class="navArrow">→</span>
                <span class="navTextWrap">
                  <span class="navSmall">السابق</span>
                  <span class="navMain">{{ prevTarget.sectionTitle }}</span>
                  <span class="navSub">{{ prevTarget.chapterTitle }}</span>
                </span>
              </button>

              <button
                v-if="nextTarget"
                type="button"
                class="navBtn primary"
                @click="goToTarget(nextTarget)"
              >
                <span class="navTextWrap">
                  <span class="navSmall">التالي</span>
                  <span class="navMain">{{ nextTarget.sectionTitle }}</span>
                  <span class="navSub">{{ nextTarget.chapterTitle }}</span>
                </span>
                <span class="navArrow">←</span>
              </button>
            </div>
          </section>
        </template>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonRange,
  onIonViewWillEnter,
} from "@ionic/vue"

import BookBlocksRenderer from "@/components/BookBlocksRenderer.vue"
import {
  getBook,
  type BookDoc,
  type BookChapter,
  type BookSection,
} from "@/services/booksContent"
import { loadBookProgress, saveBookProgress } from "@/services/bookProgress"

type ReaderSettings = {
  fontScale: number
}

type NavTarget = {
  chapterId: string
  sectionId: string
  chapterTitle: string
  sectionTitle: string
}

const SETTINGS_KEY = "mk_book_reader_settings_v1"

const route = useRoute()
const router = useRouter()

const bookId = computed(() => String(route.params.bookId || ""))
const chapterId = computed(() => String(route.params.chapterId || ""))
const sectionId = computed(() => String(route.params.sectionId || ""))

const contentRef = ref<any>(null)

const book = ref<BookDoc | null>(null)
const chapter = ref<BookChapter | null>(null)
const section = ref<BookSection | null>(null)

const loading = ref(true)
const error = ref(false)
const savedToast = ref(false)

const settings = reactive<ReaderSettings>({
  fontScale: 1,
})

let lastSaved = 0
let toastTimer: ReturnType<typeof setTimeout> | null = null
let initialRestoreDone = false

const scaleLabel = computed(() => `${Math.round((settings.fontScale || 1) * 100)}%`)

const flatSections = computed(() => {
  if (!book.value) return []
  return book.value.chapters.flatMap((ch) =>
    ch.sections.map((sec) => ({
      chapterId: ch.id,
      sectionId: sec.id,
      chapterTitle: ch.title,
      sectionTitle: sec.title,
    }))
  )
})

const currentFlatIndex = computed(() => {
  return flatSections.value.findIndex(
    (item) =>
      item.chapterId === chapterId.value &&
      item.sectionId === sectionId.value
  )
})
async function goBackToToc() {
  const el = await getScrollEl()
  const currentTop = el?.scrollTop || 0

  // احفظي القسم الحالي والموضع الحالي قبل الخروج
  saveBookProgress({
    bookId: bookId.value,
    chapterId: chapterId.value,
    sectionId: sectionId.value,
    scrollY: Math.max(0, Number(currentTop || 0)),
    updatedAt: Date.now(),
  })

  await router.push(`/book/${bookId.value}`)
}
async function closeBook() {
  const el = await getScrollEl()
  const currentTop = el?.scrollTop || 0

  // save current reading position
  saveBookProgress({
    bookId: bookId.value,
    chapterId: chapterId.value,
    sectionId: sectionId.value,
    scrollY: Math.max(0, Number(currentTop || 0)),
    updatedAt: Date.now(),
  })

  // go back to books list
  await router.push("/tabs/books")
}
const prevTarget = computed<NavTarget | null>(() => {
  const idx = currentFlatIndex.value
  if (idx <= 0) return null
  return flatSections.value[idx - 1] || null
})

const nextTarget = computed<NavTarget | null>(() => {
  const idx = currentFlatIndex.value
  if (idx < 0 || idx >= flatSections.value.length - 1) return null
  return flatSections.value[idx + 1] || null
})

function saveSettings() {
  try {
    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({
        fontScale: Number(settings.fontScale || 1),
      })
    )
  } catch {}
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw)
    const fs = Number(parsed?.fontScale)
    settings.fontScale = Number.isFinite(fs) ? fs : 1
  } catch {}
}

function resetFont() {
  settings.fontScale = 1
  saveSettings()
}

function showSavedToast() {
  savedToast.value = true
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    savedToast.value = false
  }, 900)
}

function resolveCurrentRefs() {
  if (!book.value) {
    chapter.value = null
    section.value = null
    return
  }

  chapter.value =
    book.value.chapters.find((c) => c.id === chapterId.value) || null

  section.value =
    chapter.value?.sections.find((s) => s.id === sectionId.value) || null
}

async function getScrollEl(): Promise<HTMLElement | null> {
  const raw = contentRef.value
  const target = raw?.$el ?? raw

  if (!target) return null

  if (typeof target.getScrollElement === "function") {
    try {
      return await target.getScrollElement()
    } catch {}
  }

  const inner =
    target.querySelector?.(".inner-scroll") ||
    target.querySelector?.("[part='scroll']") ||
    target.querySelector?.(".ion-content-scroll-host")

  return (inner as HTMLElement) || null
}

function saveProgress(scrollTop: number) {
  saveBookProgress({
    bookId: bookId.value,
    chapterId: chapterId.value,
    sectionId: sectionId.value,
    scrollY: Math.max(0, Number(scrollTop || 0)),
    updatedAt: Date.now(),
  })
}

async function scrollToSavedOrTop() {
  await nextTick()

  setTimeout(async () => {
    const el = await getScrollEl()
    if (!el) {
      initialRestoreDone = true
      return
    }

    const progress = loadBookProgress(bookId.value)
    const shouldRestore =
      progress &&
      progress.chapterId === chapterId.value &&
      progress.sectionId === sectionId.value &&
      Number.isFinite(progress.scrollY)

    const targetY = shouldRestore ? Math.max(0, Number(progress.scrollY || 0)) : 0
    el.scrollTo({ top: targetY, behavior: "auto" })

    // ثبت الموضع النهائي للقسم الحالي
    saveBookProgress({
      bookId: bookId.value,
      chapterId: chapterId.value,
      sectionId: sectionId.value,
      scrollY: targetY,
      updatedAt: Date.now(),
    })

    initialRestoreDone = true
  }, 140)
}

async function loadPage() {
  loading.value = true
  error.value = false
  initialRestoreDone = false

  try {
    book.value = await getBook(bookId.value)
    resolveCurrentRefs()

    if (!chapter.value || !section.value) {
      throw new Error("Section not found")
    }

    // مهم جداً:
    // بمجرد فتح هذا القسم اعتبريه آخر موضع قراءة
    saveBookProgress({
      bookId: bookId.value,
      chapterId: chapterId.value,
      sectionId: sectionId.value,
      scrollY: 0,
      updatedAt: Date.now(),
    })

    await scrollToSavedOrTop()
  } catch (e) {
    console.error("Book reader load failed:", e)
    error.value = true
  } finally {
    loading.value = false
  }
}
async function onScroll(ev: CustomEvent) {
  if (!initialRestoreDone) return

  const scrollTop = (ev.detail as any)?.scrollTop ?? 0
  const now = Date.now()

  if (now - lastSaved < 1000) return
  lastSaved = now

  saveProgress(scrollTop)
  showSavedToast()
}

async function goToTarget(target: NavTarget) {
  const el = await getScrollEl()
  const currentTop = el?.scrollTop || 0

  // احفظي موضع القسم الحالي أولاً
  saveBookProgress({
    bookId: bookId.value,
    chapterId: chapterId.value,
    sectionId: sectionId.value,
    scrollY: Math.max(0, Number(currentTop || 0)),
    updatedAt: Date.now(),
  })

  // بعد كده اعتبري القسم الهدف هو آخر موضع قراءة
  saveBookProgress({
    bookId: bookId.value,
    chapterId: target.chapterId,
    sectionId: target.sectionId,
    scrollY: 0,
    updatedAt: Date.now() + 1,
  })

  await router.push(`/book/${bookId.value}/${target.chapterId}/${target.sectionId}`)
}

loadSettings()

onIonViewWillEnter(() => {
  loadPage()
})

watch([bookId, chapterId, sectionId], () => {
  loadPage()
})
</script>

<style scoped>
.bookReaderContent{
  --background: var(--ion-background-color, #f6f7fb);
}

.readerWrap{
  padding: 14px 14px 28px;
}

.readerState{
  text-align:center;
  padding: 26px 16px;
  color:#587083;
  font-weight:800;
}

:global(html[data-mk-theme="dark"]) .readerState{
  color:#d9e4ec;
}

.readerTopCard{
  padding: 16px;
  border-radius: 24px;
  margin-bottom: 12px;
  border: 1px solid rgba(0,0,0,0.08);
  background:
    radial-gradient(700px 260px at 20% 0%, rgba(31,182,170,0.16), transparent 60%),
    linear-gradient(135deg, rgba(255,255,255,0.94), rgba(255,255,255,0.74));
  box-shadow: 0 10px 24px rgba(0,0,0,0.08);
display:none
}

:global(html[data-mk-theme="dark"]) .readerTopCard{
  background:
    radial-gradient(700px 260px at 20% 0%, rgba(31,182,170,0.14), transparent 62%),
    linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04));
  border-color: rgba(255,255,255,0.12);
}

.readerTopRow{
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap:12px;
}

.readerTopText{
  min-width:0;
  flex:1;
}

.readerEyebrow{
  font-family: "Noto Kufi Arabic", system-ui, sans-serif;
  font-size: 12px;
  font-weight: 900;
  color: #587083;
}

.readerSectionTitle{
  margin: 6px 0 0;
  font-family: "Noto Kufi Arabic", system-ui, sans-serif;
  font-size: 21px;
  font-weight: 1000;
  line-height: 1.8;
  color: #0b1f33;
}

.readerChapterTitle{
  margin-top: 4px;
  font-family: "Noto Kufi Arabic", system-ui, sans-serif;
  font-size: 13px;
  font-weight: 900;
  color: #476074;
}

.savedPill{
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 900;
  background: rgba(0,0,0,0.05);
  border: 1px solid rgba(0,0,0,0.08);
  color: #0b1f33;
  white-space: nowrap;
}

:global(html[data-mk-theme="dark"]) .readerEyebrow,
:global(html[data-mk-theme="dark"]) .readerChapterTitle{
  color:#d3dee7;
}

:global(html[data-mk-theme="dark"]) .readerSectionTitle,
:global(html[data-mk-theme="dark"]) .savedPill{
  color:#f5f7fa;
}

:global(html[data-mk-theme="dark"]) .savedPill{
  background: rgba(255,255,255,0.08);
  border-color: rgba(255,255,255,0.11);
}

.mkSettingsBox{
  margin: 10px 0 12px;
  padding: 14px;
  border-radius: 20px;
  border: 1px solid var(--mk-border, rgba(0,0,0,0.10));
  background:
    radial-gradient(700px 260px at 20% 0%, rgba(31,182,170,0.16), transparent 60%),
    linear-gradient(135deg, rgba(255,255,255,0.88), rgba(255,255,255,0.60));
  box-shadow: var(--mk-shadow, 0 8px 18px rgba(0,0,0,0.08));
  backdrop-filter: blur(8px);
}

:global(html[data-mk-theme="dark"]) .mkSettingsBox{
  --mk-text-local: #f5f7fa;
  --mk-border-local: rgba(255,255,255,0.14);
  background:
    radial-gradient(700px 260px at 20% 0%, rgba(31,182,170,0.14), transparent 62%),
    linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04));
  border-color: var(--mk-border, var(--mk-border-local));
}

.mkSettingsHead{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:10px;
  margin-bottom: 12px;
}

.mkSettingsTitle{
  font-weight: 1000;
  color: var(--mk-text, #0b1f33);
  font-family: "Noto Kufi Arabic", system-ui, sans-serif;
  font-size: 16px;
}

:global(html[data-mk-theme="dark"]) .mkSettingsTitle{
  color: var(--mk-text, var(--mk-text-local));
}

.mkSettingsReset{
  border: 1px solid var(--mk-border, rgba(0,0,0,0.10));
  background: rgba(0,0,0,0.04);
  color: var(--mk-text, #0b1f33);
  font-weight: 900;
  padding: 7px 11px;
  border-radius: 999px;
  cursor: pointer;
}

:global(html[data-mk-theme="dark"]) .mkSettingsReset{
  background: rgba(255,255,255,0.08);
  border-color: var(--mk-border, var(--mk-border-local));
  color: var(--mk-text, var(--mk-text-local));
}

.mkSettingCard{
  margin-top: 10px;
  padding: 12px 12px 10px;
  border-radius: 16px;
  border: 1px solid var(--mk-border, rgba(0,0,0,0.10));
  background: rgba(0,0,0,0.02);
}

:global(html[data-mk-theme="dark"]) .mkSettingCard{
  background: rgba(255,255,255,0.06);
  border-color: var(--mk-border, var(--mk-border-local));
}

.mkRowTop{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:10px;
  margin-bottom: 8px;
}

.mkLbl{
  font-weight: 1000;
  color: var(--mk-text, #0b1f33);
  font-family: "Noto Kufi Arabic", system-ui, sans-serif;
}

:global(html[data-mk-theme="dark"]) .mkLbl{
  color: var(--mk-text, var(--mk-text-local));
}

.mkValue{
  font-weight: 1000;
  color: var(--mk-text, #0b1f33);
  opacity: 0.95;
  font-variant-numeric: tabular-nums;
  padding: 3px 10px;
  border-radius: 999px;
  border: 1px solid var(--mk-border, rgba(0,0,0,0.10));
  background: rgba(31,182,170,0.10);
}

:global(html[data-mk-theme="dark"]) .mkValue{
  color: var(--mk-text, var(--mk-text-local));
  background: rgba(31,182,170,0.12);
  border-color: var(--mk-border, var(--mk-border-local));
}

.mkRange{
  direction: ltr;
  unicode-bidi: isolate;
  padding:0;
}

ion-range{
  --bar-height: 8px;
  --knob-size: 24px;
  --pin-background: rgba(0,0,0,0.85);
  --pin-color: #fff;
  --knob-box-shadow: 0 10px 20px rgba(0,0,0,0.18);
  --bar-background: rgba(31,182,170,0.18);
  --bar-background-active: rgb(37 63 79);
  padding-inline: 2px;
}

.readerCard{
  border-radius: 24px;
  overflow: hidden;
  border: 1px solid rgba(0,0,0,0.08);
  background:
    linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,255,255,0.90));
  box-shadow: 0 10px 26px rgba(0,0,0,0.06);
}

:global(html[data-mk-theme="dark"]) .readerCard{
  background:
    linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.04));
  border-color: rgba(255,255,255,0.10);
}

.readerSectionHead{
  padding: 16px 16px 10px;
  border-bottom: 1px solid rgba(0,0,0,0.06);
}

:global(html[data-mk-theme="dark"]) .readerSectionHead{
  border-bottom-color: rgba(255,255,255,0.08);
}

.sectionEyebrow{
  font-family: "Noto Kufi Arabic", system-ui, sans-serif;
  font-size: 19px;
  font-weight: 900;
  color: #587083;
  margin-bottom: 6px;
}

.sectionTitle{
  margin: 0;
  font-family: "Noto Kufi Arabic", system-ui, sans-serif;
  font-size: 20px;
  font-weight: 1000;
  color: #0b1f33;
  line-height: 1.8;
}

:global(html[data-mk-theme="dark"]) .sectionEyebrow{
  color:#d3dee7;
}

:global(html[data-mk-theme="dark"]) .sectionTitle{
  color:#f5f7fa;
}

.bookContent{
  padding: 18px 16px 10px;
  color: #203446;
  font-family: "Scheherazade New", serif;
}

:global(html[data-mk-theme="dark"]) .bookContent{
  color:#ecf3f8;
}

.bookContent :deep(p),
.bookContent :deep(li),
.bookContent :deep(blockquote),
.bookContent :deep(.book-p),
.bookContent :deep(.book-quote){
  font-family: "Scheherazade New", serif !important;
  font-size: calc(20px * var(--book-fontScale, 1)) !important;
  line-height: 2.2 !important;
  font-weight: 700;
}

.bookContent :deep(h2),
.bookContent :deep(h3),
.bookContent :deep(.book-h2),
.bookContent :deep(.book-h3){
  font-family: "Noto Kufi Arabic", system-ui, sans-serif !important;
  line-height: 1.9 !important;
  color: #0b1f33;
}

.bookContent :deep(h2),
.bookContent :deep(.book-h2){
  font-size: calc(18px * var(--book-fontScale, 1)) !important;
  font-weight: 1000 !important;
}

.bookContent :deep(h3),
.bookContent :deep(.book-h3){
  font-size: calc(16px * var(--book-fontScale, 1)) !important;
  font-weight: 900 !important;
}

.bookContent :deep(ul),
.bookContent :deep(ol){
  padding-inline-start: 22px;
  margin: 0 0 14px;
}

.bookContent :deep(li){
  margin-bottom: 8px;
}

.bookContent :deep(blockquote){
  margin: 0 0 14px;
  padding: 10px 14px;
  border-radius: 16px;
  background: rgba(31,182,170,0.08);
  border: 1px solid rgba(31,182,170,0.14);
}

.bookContent :deep(hr){
  border: 0;
  height: 1px;
  margin: 16px 0;
  background: rgba(0,0,0,0.08);
}

:global(html[data-mk-theme="dark"]) .bookContent :deep(h2),
:global(html[data-mk-theme="dark"]) .bookContent :deep(h3),
:global(html[data-mk-theme="dark"]) .bookContent :deep(.book-h2),
:global(html[data-mk-theme="dark"]) .bookContent :deep(.book-h3){
  color: #f5f7fa;
}

:global(html[data-mk-theme="dark"]) .bookContent :deep(blockquote){
  background: rgba(255,255,255,0.06);
  border-color: rgba(255,255,255,0.10);
}

:global(html[data-mk-theme="dark"]) .bookContent :deep(hr){
  background: rgba(255,255,255,0.10);
}

.readerBottomNav{
  display:grid;
  grid-template-columns: 1fr;
  gap:10px;
  padding: 10px 16px 18px;
}

.navBtn{
  width:100%;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:12px;
  text-align:right;
  border:none;
  border-radius: 18px;
  cursor:pointer;
  padding: 14px 14px;
  transition: transform .15s ease;
}

.navBtn:active{
  transform: scale(0.99);
}

.navBtn.primary{
  background: linear-gradient(135deg, rgba(31,182,170,0.16), rgba(31,182,170,0.09));
  border: 1px solid rgba(31,182,170,0.22);
}

.navBtn.secondary{
  background: rgba(0,0,0,0.03);
  border: 1px solid rgba(0,0,0,0.08);
}

:global(html[data-mk-theme="dark"]) .navBtn.secondary{
  background: rgba(255,255,255,0.05);
  border-color: rgba(255,255,255,0.10);
}

:global(html[data-mk-theme="dark"]) .navBtn.primary{
  background: linear-gradient(135deg, rgba(31,182,170,0.15), rgba(31,182,170,0.08));
  border-color: rgba(31,182,170,0.20);
}

.navTextWrap{
  display:flex;
  flex-direction:column;
  align-items:flex-start;
  gap:2px;
  flex:1;
  min-width: 0;
}

.navSmall{
  font-family: "Noto Kufi Arabic", system-ui, sans-serif;
  font-size: 11px;
  font-weight: 900;
  color: #587083;
}

.navMain{
  font-family: "Noto Kufi Arabic", system-ui, sans-serif;
  font-size: 14px;
  font-weight: 1000;
  color: #0b1f33;
  line-height: 1.8;
}

.navSub{
  font-family: "Noto Kufi Arabic", system-ui, sans-serif;
  font-size: 11px;
  font-weight: 800;
  color: #587083;
}

.navArrow{
  font-size: 22px;
  line-height: 1;
  color: #244052;
  flex-shrink: 0;
}
.readerHeader {
  --background: rgba(255,255,255,0.85);
  backdrop-filter: blur(12px);
}

:global(html[data-mk-theme="dark"]) .readerHeader{
  --background: rgba(0,0,0,0.6);
}

.readerCloseBtn{
  border: none;
  background: rgba(0,0,0,0.06);
  width: 36px;
  height: 36px;
  border-radius: 999px;
  font-size: 18px;
  font-weight: 900;
  cursor: pointer;
}

.readerCloseBtn:active{
  transform: scale(0.94);
}

:global(html[data-mk-theme="dark"]) .readerCloseBtn{
  background: rgba(255,255,255,0.12);
  color: white;
}
:global(html[data-mk-theme="dark"]) .navSmall,
:global(html[data-mk-theme="dark"]) .navSub{
  color:#d3dee7;
}

:global(html[data-mk-theme="dark"]) .navMain,
:global(html[data-mk-theme="dark"]) .navArrow{
  color:#f5f7fa;
}
.readerBackBtn{
  border: none;
  background: transparent;
  color: var(--ion-text-color, #0b1f33);
  font-size: 28px;
  font-weight: 900;
  line-height: 1;
  padding: 6px 8px;
  border-radius: 12px;
  cursor: pointer;
}

.readerBackBtn:active{
  transform: scale(0.96);
}

:global(html[data-mk-theme="dark"]) .readerBackBtn{
  color: #f5f7fa;
}
</style>