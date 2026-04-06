<!-- src/views/BookTocPage.vue -->
<template>
  <ion-page class="bookTocPage" dir="rtl" lang="ar">
    <ion-header class="ion-no-border" :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <button class="tocBackBtn" type="button" @click="goToBooksList">
            →
          </button>
        </ion-buttons>
        <ion-title>{{ book?.title || "الكتاب" }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="bookTocContent" :fullscreen="true">
      <div class="tocWrap">
        <div v-if="loading" class="tocState">جاري تحميل الكتاب...</div>
        <div v-else-if="error" class="tocState">تعذر تحميل الكتاب حالياً.</div>

        <template v-else-if="book">
          <section class="tocHero">
            <div class="tocHeroMedia">
              <img v-if="book.coverUrl" :src="book.coverUrl" alt="" loading="lazy" />
              <div v-else class="tocHeroPlaceholder"></div>
            </div>

            <div class="tocHeroBody">
              <div class="tocBookKicker">كتاب</div>
              <h1 class="tocBookTitle">{{ book.title }}</h1>

              <div v-if="book.subtitle" class="tocBookSubtitle">
                {{ book.subtitle }}
              </div>

              <button
                v-if="canContinue"
                type="button"
                class="continueCard"
                @click="goToProgress"
              >
                <div class="continueText">
                  <div class="continueEyebrow">تابع القراءة</div>
                  <div class="continueMain">{{ continueSectionTitle }}</div>
                  <div class="continueSub">{{ continueChapterTitle }}</div>
                </div>
                <div class="continueArrow">‹</div>
              </button>
            </div>
          </section>

          <section class="tocSection">
            <div class="tocSectionHead">
              <div class="tocSectionTitle">الفهرس</div>
            </div>

            <ion-accordion-group
              v-model="openChapterId"
              expand="inset"
              class="tocAcc"
            >
              <ion-accordion
                v-for="ch in book.chapters"
                :key="ch.id"
                :value="ch.id"
                class="tocAccItem"
              >
                <div slot="header" class="tocAccHeader">
                  <div class="tocAccHeaderText">
                    <div class="tocAccTitle">{{ ch.title }}</div>
                    <div class="tocAccCount">{{ ch.sections.length }} أقسام</div>
                  </div>
                  <div class="tocAccChevron">⌄</div>
                </div>

                <div slot="content" class="tocSections">
                  <button
                    v-for="sec in ch.sections"
                    :key="sec.id"
                    type="button"
                    class="tocSectionRow"
                    @click="openSection(ch.id, sec.id)"
                  >
                    <div class="tocSectionDot"></div>

                    <div class="tocSectionText">
                      <div class="tocSectionRowTitle">{{ sec.title }}</div>
                      <div class="tocSectionRowHint">اضغط للقراءة</div>
                    </div>

                    <div
                      v-if="isProgressSection(ch.id, sec.id)"
                      class="tocCurrentBadge"
                    >
                      آخر موضع
                    </div>

                    <div class="tocRowArrow">‹</div>
                  </button>
                </div>
              </ion-accordion>
            </ion-accordion-group>
          </section>
        </template>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, ref } from "vue"
import { useRoute, useRouter } from "vue-router"
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonAccordionGroup,
  IonAccordion,
  onIonViewWillEnter,
} from "@ionic/vue"
import { getBook, type BookDoc } from "@/services/booksContent"
import { loadBookProgress } from "@/services/bookProgress"

const route = useRoute()
const router = useRouter()

const bookId = String(route.params.bookId)

const book = ref<BookDoc | null>(null)
const loading = ref(true)
const error = ref(false)
const progress = ref<any | null>(null)
const openChapterId = ref<string | undefined>(undefined)

const totalSections = computed(() => {
  if (!book.value) return 0
  return book.value.chapters.reduce((sum, ch) => sum + ch.sections.length, 0)
})

const continueChapterTitle = computed(() => {
  if (!book.value || !progress.value) return ""
  const ch = book.value.chapters.find((x) => x.id === progress.value.chapterId)
  return ch?.title || ""
})

const continueSectionTitle = computed(() => {
  if (!book.value || !progress.value) return ""
  const ch = book.value.chapters.find((x) => x.id === progress.value.chapterId)
  const sec = ch?.sections.find((x) => x.id === progress.value.sectionId)
  return sec?.title || ""
})

const canContinue = computed(() => {
  if (!book.value || !progress.value) return false
  const ch = book.value.chapters.find((x) => x.id === progress.value.chapterId)
  const sec = ch?.sections.find((x) => x.id === progress.value.sectionId)
  return !!(ch && sec)
})

async function loadPage() {
  loading.value = true
  error.value = false

  try {
    book.value = await getBook(bookId)
    progress.value = loadBookProgress(bookId)
    openChapterId.value = progress.value?.chapterId || book.value.chapters[0]?.id
  } catch (e) {
    console.error("Book TOC load failed:", e)
    error.value = true
  } finally {
    loading.value = false
  }
}

function goToBooksList() {
  router.push("/tabs/books")
}

function openSection(chapterId: string, sectionId: string) {
  router.push(`/book/${bookId}/${chapterId}/${sectionId}`)
}

function goToProgress() {
  if (!canContinue.value || !progress.value) return
  router.push(`/book/${bookId}/${progress.value.chapterId}/${progress.value.sectionId}`)
}

function isProgressSection(chapterId: string, sectionId: string) {
  return (
    progress.value?.chapterId === chapterId &&
    progress.value?.sectionId === sectionId
  )
}

onIonViewWillEnter(() => {
  loadPage()
})
</script>

<style scoped>
.bookTocContent{
  --background: var(--ion-background-color, #f6f7fb);
}

.tocWrap{
  padding: 14px 14px 28px;
}

.tocState{
  text-align:center;
  padding: 26px 16px;
  color:#587083;
  font-weight:800;
}

:global(html[data-mk-theme="dark"]) .tocState{
  color:#d9e4ec;
}

.tocBackBtn{
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

.tocBackBtn:active{
  transform: scale(0.96);
}

:global(html[data-mk-theme="dark"]) .tocBackBtn{
  color: #f5f7fa;
}

.tocHero{
  overflow:hidden;
  border-radius: 26px;
  border: 1px solid rgba(0,0,0,0.08);
  background:
    radial-gradient(700px 260px at 20% 0%, rgba(31,182,170,0.16), transparent 60%),
    linear-gradient(135deg, rgba(255,255,255,0.94), rgba(255,255,255,0.76));
  box-shadow: 0 12px 28px rgba(0,0,0,0.08);
  margin-bottom: 14px;
}

:global(html[data-mk-theme="dark"]) .tocHero{
  background:
    radial-gradient(700px 260px at 20% 0%, rgba(31,182,170,0.14), transparent 62%),
    linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04));
  border-color: rgba(255,255,255,0.12);
}

.tocHeroMedia{
  aspect-ratio: 16 / 8.4;
  overflow:hidden;
  background: rgba(255,255,255,0.06);
}

.tocHeroMedia img,
.tocHeroPlaceholder{
  width:100%;
  height:100%;
  display:block;
  object-fit:cover;
}

.tocHeroPlaceholder{
  background: linear-gradient(135deg, rgba(255,255,255,0.10), rgba(255,255,255,0.04));
}

.tocHeroBody{
  padding: 16px;
}

.tocBookKicker{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(31,182,170,0.10);
  border: 1px solid rgba(31,182,170,0.16);
  color: #476074;
  font-family: "Noto Kufi Arabic", system-ui, sans-serif;
  font-size: 12px;
  font-weight: 900;
}

.tocBookTitle{
  margin: 10px 0 0;
  font-family: "Noto Kufi Arabic", system-ui, sans-serif;
  font-size: 22px;
  font-weight: 1000;
  line-height: 1.8;
  color: #0b1f33;
}

:global(html[data-mk-theme="dark"]) .tocBookTitle{
  color:#f5f7fa;
}

.tocBookSubtitle{
  margin-top: 6px;
  color: #476074;
  line-height: 1.9;
  font-size: 13px;
  font-weight: 800;
}

:global(html[data-mk-theme="dark"]) .tocBookSubtitle{
  color:#d3dee7;
}

.continueCard{
  margin-top: 14px;
  width:100%;
  border:none;
  border-radius: 22px;
  padding: 14px 15px;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:12px;
  text-align:right;
  cursor:pointer;
  background: linear-gradient(135deg, rgba(31,182,170,0.18), rgba(31,182,170,0.08));
  border: 1px solid rgba(31,182,170,0.20);
  box-shadow: 0 8px 18px rgba(0,0,0,0.05);
}

.continueCard:active{
  transform: scale(0.99);
}

.continueText{
  display:flex;
  flex-direction:column;
  align-items:flex-start;
  gap:2px;
  min-width:0;
  flex:1;
}

.continueEyebrow{
  font-family: "Noto Kufi Arabic", system-ui, sans-serif;
  font-size: 11px;
  font-weight: 900;
  color: #587083;
}

.continueMain{
  font-family: "Noto Kufi Arabic", system-ui, sans-serif;
  font-size: 15px;
  font-weight: 1000;
  line-height: 1.8;
  color: #0b1f33;
}

.continueSub{
  font-family: "Noto Kufi Arabic", system-ui, sans-serif;
  font-size: 11px;
  font-weight: 800;
  color: #587083;
}

.continueArrow{
  font-size: 26px;
  line-height: 1;
  color: #244052;
  flex-shrink:0;
}

:global(html[data-mk-theme="dark"]) .continueEyebrow,
:global(html[data-mk-theme="dark"]) .continueSub{
  color:#d3dee7;
}

:global(html[data-mk-theme="dark"]) .continueMain,
:global(html[data-mk-theme="dark"]) .continueArrow{
  color:#f5f7fa;
}

.tocSection{
  border-radius: 24px;
  border: 1px solid rgba(0,0,0,0.08);
  background: linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,255,255,0.90));
  box-shadow: 0 10px 26px rgba(0,0,0,0.06);
  padding: 14px;
}

:global(html[data-mk-theme="dark"]) .tocSection{
  background: linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.04));
  border-color: rgba(255,255,255,0.10);
}

.tocSectionHead{
  margin-bottom: 10px;
}

.tocSectionTitle{
  font-family: "Noto Kufi Arabic", system-ui, sans-serif;
  font-size: 18px;
  font-weight: 1000;
  color: #0b1f33;
}

:global(html[data-mk-theme="dark"]) .tocSectionTitle{
  color:#f5f7fa;
}

.tocAcc{
  display:flex;
  flex-direction:column;
  gap:10px;
}

.tocAccItem{
  border-radius: 20px;
  overflow:hidden;
  border: 1px solid rgba(0,0,0,0.08);
  background: rgba(255,255,255,0.72);
}

:global(html[data-mk-theme="dark"]) .tocAccItem{
  background: rgba(255,255,255,0.05);
  border-color: rgba(255,255,255,0.11);
}

.tocAccHeader{
  width:100%;
  padding: 15px 16px;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:12px;
  cursor:pointer;
}

.tocAccHeaderText{
  min-width:0;
}

.tocAccTitle{
  font-family: "Noto Kufi Arabic", system-ui, sans-serif;
  font-size: 18px;
  font-weight: 1000;
  line-height: 1.9;
  color:#0b1f33;
}

.tocAccCount{
  margin-top: 2px;
  font-size: 12px;
  font-weight: 800;
  color:#587083;
}

.tocAccChevron{
  font-size: 20px;
  line-height: 1;
  color:#50697c;
}

:global(html[data-mk-theme="dark"]) .tocAccTitle{
  color:#f5f7fa;
}

:global(html[data-mk-theme="dark"]) .tocAccCount,
:global(html[data-mk-theme="dark"]) .tocAccChevron{
  color:#d6e0e8;
}

.tocSections{
  padding: 0 12px 12px;
}

.tocSectionRow{
  width:100%;
  margin-top: 10px;
  border: 1px solid rgba(0,0,0,0.08);
  background: rgba(0,0,0,0.02);
  border-radius: 18px;
  padding: 12px 12px;
  display:flex;
  align-items:center;
  gap:10px;
  text-align:right;
  cursor:pointer;
}

.tocSectionRow:active{
  transform: scale(0.99);
}

:global(html[data-mk-theme="dark"]) .tocSectionRow{
  background: rgba(255,255,255,0.05);
  border-color: rgba(255,255,255,0.10);
}

.tocSectionDot{
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: var(--ion-color-primary);
  opacity: .9;
  flex: 0 0 10px;
}

.tocSectionText{
  min-width:0;
  flex:1;
}

.tocSectionRowTitle{
  font-family: "Noto Kufi Arabic", system-ui, sans-serif;
  font-size: 16px;
  font-weight: 1000;
  line-height: 1.8;
  color:#0b1f33;
}

.tocSectionRowHint{
  margin-top: 3px;
  font-size: 12px;
  font-weight: 800;
  color:#587083;
}

:global(html[data-mk-theme="dark"]) .tocSectionRowTitle{
  color:#f5f7fa;
}

:global(html[data-mk-theme="dark"]) .tocSectionRowHint{
  color:#d3dee7;
}

.tocCurrentBadge{
  padding: 5px 9px;
  border-radius: 999px;
  background: rgba(31,182,170,0.12);
  border: 1px solid rgba(31,182,170,0.16);
  color: #244052;
  font-size: 11px;
  font-weight: 900;
  white-space: nowrap;
}

.tocRowArrow{
  font-size: 22px;
  line-height: 1;
  color:#4b6579;
  padding-inline-start: 2px;
}
</style>