<!-- src/views/BookReaderPage.vue -->
<template>
    <ion-page dir="rtl">
      <ion-header :translucent="true">
        <ion-toolbar>
          <ion-buttons slot="start">
            <ion-back-button :default-href="`/book/${bookId}`" />
          </ion-buttons>
          <ion-title>{{ section?.title || "قراءة" }}</ion-title>
        </ion-toolbar>
      </ion-header>
  
      <ion-content
        ref="contentRef"
        :fullscreen="true"
        :scroll-events="true"
        @ionScroll="onScroll"
      >
        <div v-if="loading" class="pad">جاري التحميل…</div>
        <div v-else-if="error" class="pad">تعذر تحميل المحتوى.</div>
  
        <template v-else>
          <!-- ✅ Beautiful in-content header -->
          <div class="readerTop">
            <div class="chRow">
              <div class="ch">{{ chapter?.title }}</div>
  
              <div class="rightPills">
                <span class="pill">{{ percentText }}</span>
                <span v-if="savedToast" class="pill soft">تم الحفظ</span>
              </div>
            </div>
  
            <div class="sec">{{ section?.title }}</div>
          </div>
  
          <div class="readerBody">
            <BookBlocksRenderer v-if="section" :blocks="section.blocks" />
          </div>
        </template>
      </ion-content>
    </ion-page>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted, nextTick } from "vue"
  import { useRoute } from "vue-router"
  import {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
  } from "@ionic/vue"
  
  import BookBlocksRenderer from "@/components/BookBlocksRenderer.vue"
  import { getBook, type BookDoc, type BookChapter, type BookSection } from "@/services/booksContent"
  import { loadBookProgress, saveBookProgress } from "@/services/bookProgress"
  
  const route = useRoute()
  const bookId = String(route.params.bookId)
  const chapterId = String(route.params.chapterId)
  const sectionId = String(route.params.sectionId)
  
  const contentRef = ref<HTMLIonContentElement | null>(null)
  
  const book = ref<BookDoc | null>(null)
  const chapter = ref<BookChapter | null>(null)
  const section = ref<BookSection | null>(null)
  
  const loading = ref(true)
  const error = ref(false)
  
  let lastSaved = 0
  let restoreScrollY: number | undefined
  
  const savedToast = ref(false)
  let toastTimer: any = null
  
  const percentText = ref("0%")
  
  function showSavedToast() {
    savedToast.value = true
    clearTimeout(toastTimer)
    toastTimer = setTimeout(() => (savedToast.value = false), 900)
  }
  
  async function updatePercent(scrollTop: number) {
    const el = await contentRef.value?.getScrollElement()
    if (!el) return
    const max = Math.max(1, el.scrollHeight - el.clientHeight)
    const p = Math.max(0, Math.min(100, Math.round((scrollTop / max) * 100)))
    percentText.value = `${p}%`
  }
  
  onMounted(async () => {
    try {
      book.value = await getBook(bookId)
      chapter.value = book.value.chapters.find(c => c.id === chapterId) || null
      section.value = chapter.value?.sections.find(s => s.id === sectionId) || null
  
      // Restore scroll if this is the same section
      const p = loadBookProgress(bookId)
      restoreScrollY = (p && p.chapterId === chapterId && p.sectionId === sectionId) ? p.scrollY : undefined
  
      // Save "opened" position immediately
      saveBookProgress({
        bookId,
        chapterId,
        sectionId,
        scrollY: 0,
        updatedAt: Date.now(),
      })
  
      // Wait for DOM + renderer
      await nextTick()
      setTimeout(async () => {
        const el = await contentRef.value?.getScrollElement()
        if (!el) return
  
        // restore
        if (restoreScrollY) {
          el.scrollTo({ top: restoreScrollY, behavior: "auto" })
          await updatePercent(restoreScrollY)
        } else {
          await updatePercent(0)
        }
      }, 180)
    } catch {
      error.value = true
    } finally {
      loading.value = false
    }
  })
  
  async function onScroll(ev: CustomEvent) {
    const scrollTop = (ev.detail as any)?.scrollTop ?? 0
  
    // update percent (lightweight)
    await updatePercent(scrollTop)
  
    // throttle saving (1x per second)
    const now = Date.now()
    if (now - lastSaved < 1000) return
    lastSaved = now
  
    saveBookProgress({
      bookId,
      chapterId,
      sectionId,
      scrollY: scrollTop,
      updatedAt: now,
    })
  
    showSavedToast()
  }
  </script>
  
  <style scoped>
  .pad {
    padding: 16px;
  }
  
  /* ===== in-content header ===== */
  .readerTop {
    padding: 14px 14px 10px;
    position: sticky;
    top: 0;
    z-index: 5;
  
    /* subtle glass */
    background: color-mix(in srgb, var(--ion-background-color) 72%, transparent);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }
  
  .chRow {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }
  
  .ch {
    opacity: 0.85;
    font-weight: 900;
    font-size: 13px;
    line-height: 1.2;
    max-width: 68%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .sec {
    margin-top: 6px;
    font-size: 20px;
    font-weight: 950;
    line-height: 1.2;
  }
  
  /* pills */
  .rightPills {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }
  
  .pill {
    padding: 6px 10px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.10);
    border: 1px solid rgba(255, 255, 255, 0.12);
    font-size: 12px;
    font-weight: 950;
    opacity: 0.95;
  }
  
  .pill.soft {
    background: rgba(0, 0, 0, 0.12);
    opacity: 0.9;
  }
  
  /* body container to give consistent spacing */
  .readerBody {
    padding-bottom: 40px;
  }
  </style>
  