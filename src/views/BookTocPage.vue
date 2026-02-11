<!-- src/views/BookTocPage.vue -->
<template>
    <ion-page dir="rtl">
      <ion-header :translucent="true">
        <ion-toolbar>
          <ion-buttons slot="start">
            <!-- ✅ go back to Books tab -->
            <ion-back-button default-href="/tabs/books" />
          </ion-buttons>
          <ion-title>{{ book?.title || "الكتاب" }}</ion-title>
        </ion-toolbar>
      </ion-header>
  
      <ion-content :fullscreen="true">
        <div v-if="loading" class="pad">جاري التحميل…</div>
        <div v-else-if="error" class="pad">تعذر تحميل الكتاب.</div>
  
        <template v-else>
          <!-- ✅ Hero (big landscape cover) -->
          <div v-if="book" class="heroCard">
            <div class="heroCover">
              <img v-if="book.coverUrl" :src="book.coverUrl" alt="" loading="lazy" />
              <div v-else class="heroPh"></div>
  
              <div class="heroOverlay">
                <div class="heroTitle">{{ book.title }}</div>
                <div class="heroSub" v-if="book.subtitle">{{ book.subtitle }}</div>
  
                <div class="heroActions">
                  <ion-button
                    v-if="progress"
                    size="small"
                    class="continueBtn"
                    @click="goToProgress()"
                  >
                    تابع القراءة
                  </ion-button>
  
                  <div class="chips">
                    <span class="chip">{{ book.chapters.length }} فصل</span>
                    <span class="chip soft" v-if="progress">
                      آخر قراءة: {{ progress.chapterId }} / {{ progress.sectionId }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
  
          <!-- ✅ Chapters -->
          <div class="padTop">
            <div class="secHdr">الفصول</div>
  
            <ion-accordion-group v-model="openChapterId" expand="inset" class="acc">
              <ion-accordion
                v-for="ch in book!.chapters"
                :key="ch.id"
                :value="ch.id"
                class="accItem"
              >
                <ion-item slot="header" button detail class="accHeader">
                  <ion-label class="chTitle">{{ ch.title }}</ion-label>
                </ion-item>
  
                <div slot="content" class="sections">
                  <button
                    v-for="sec in ch.sections"
                    :key="sec.id"
                    type="button"
                    class="secRow"
                    @click="openSection(ch.id, sec.id)"
                  >
                    <div class="secDot"></div>
                    <div class="secText">
                      <div class="secTitle">{{ sec.title }}</div>
                      <div class="secHint">اضغط للقراءة</div>
                    </div>
                    <div class="secArrow">›</div>
                  </button>
                </div>
              </ion-accordion>
            </ion-accordion-group>
          </div>
        </template>
      </ion-content>
    </ion-page>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted } from "vue"
  import { useRoute, useRouter } from "vue-router"
  import {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonAccordionGroup,
    IonAccordion,
    IonItem,
    IonLabel,
    IonButton,
  } from "@ionic/vue"
  import { getBook, type BookDoc } from "@/services/booksContent"
  import { loadBookProgress } from "@/services/bookProgress"
  
  const route = useRoute()
  const router = useRouter()
  
  const bookId = String(route.params.bookId)
  const book = ref<BookDoc | null>(null)
  const loading = ref(true)
  const error = ref(false)
  
  const progress = ref(loadBookProgress(bookId))
  const openChapterId = ref<string | undefined>(undefined)
  
  onMounted(async () => {
    try {
      book.value = await getBook(bookId)
  
      // default: first chapter open
      openChapterId.value = book.value.chapters[0]?.id
  
      // if progress exists, open that chapter
      if (progress.value?.chapterId) openChapterId.value = progress.value.chapterId
    } catch {
      error.value = true
    } finally {
      loading.value = false
    }
  })
  
  function openSection(chapterId: string, sectionId: string) {
    router.push(`/book/${bookId}/${chapterId}/${sectionId}`)
  }
  
  function goToProgress() {
    if (!progress.value) return
    router.push(`/book/${bookId}/${progress.value.chapterId}/${progress.value.sectionId}`)
  }
  </script>
  
  <style scoped>
  .pad {
    padding: 16px;
  }
  .padTop {
    padding: 0 14px 16px;
  }
  
  /* ===== Hero ===== */
  .heroCard {
    padding: 14px;
  }
  .heroCover {
    position: relative;
    border-radius: 22px;
    overflow: hidden;
    aspect-ratio: 16 / 9;
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: rgba(255, 255, 255, 0.06);
  }
  .heroCover img,
  .heroPh {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
  }
  .heroPh {
    background: linear-gradient(135deg, rgba(255,255,255,0.10), rgba(255,255,255,0.04));
  }
  
  .heroOverlay {
    position: absolute;
    inset: 0;
    padding: 14px;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    gap: 6px;
    background: linear-gradient(to top, rgba(0,0,0,0.66), rgba(0,0,0,0.28), rgba(0,0,0,0));
  }
  
  .heroTitle {
    color: #fff;
    font-weight: 950;
    font-size: 20px;
    line-height: 1.15;
    text-shadow: 0 2px 12px rgba(0,0,0,0.25);
  }
  .heroSub {
    color: rgba(255,255,255,0.88);
    font-size: 13px;
    line-height: 1.2;
  }
  
  .heroActions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-top: 6px;
  }
  
  /* nicer button */
  .continueBtn {
    --border-radius: 999px;
    --padding-start: 14px;
    --padding-end: 14px;
    font-weight: 900;
  }
  
  /* chips */
  .chips {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }
  .chip {
    padding: 6px 10px;
    border-radius: 999px;
    background: rgba(255,255,255,0.14);
    border: 1px solid rgba(255,255,255,0.16);
    color: rgba(255,255,255,0.92);
    font-size: 12px;
    font-weight: 900;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }
  .chip.soft {
    background: rgba(0,0,0,0.18);
    border-color: rgba(255,255,255,0.12);
  }
  
  /* ===== Section header ===== */
  .secHdr {
    font-weight: 950;
    font-size: 14px;
    opacity: 0.9;
    margin: 2px 2px 10px;
  }
  
  /* ===== Accordion styling ===== */
  .acc :deep(ion-accordion) {
    border-radius: 18px;
    overflow: hidden;
  }
  .accHeader {
    --background: rgba(255,255,255,0.06);
  }
  .chTitle {
    font-weight: 950;
    font-size: 14px;
  }
  
  /* ===== Sections list ===== */
  .sections {
    padding: 8px 10px 12px;
    background: rgba(255,255,255,0.03);
  }
  
  .secRow {
    width: 100%;
    text-align: start;
    border: 1px solid rgba(255,255,255,0.10);
    background: rgba(255,255,255,0.06);
    border-radius: 16px;
    padding: 10px 12px;
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 10px;
  }
  
  .secDot {
    width: 10px;
    height: 10px;
    border-radius: 999px;
    background: var(--ion-color-primary);
    opacity: 0.9;
    flex: 0 0 10px;
  }
  
  .secText {
    min-width: 0;
    flex: 1;
  }
  
  .secTitle {
    font-weight: 950;
    font-size: 14px;
    line-height: 1.2;
  }
  
  .secHint {
    margin-top: 3px;
    font-size: 12px;
    opacity: 0.72;
  }
  
  .secArrow {
    font-size: 20px;
    opacity: 0.8;
    padding-inline-start: 6px;
  }
  
  /* tap feedback */
  .secRow:active {
    transform: scale(0.99);
  }
  </style>
  