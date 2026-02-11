<!-- src/views/BooksTab.vue -->
<template>
    <ion-page :dir="isArabic ? 'rtl' : 'ltr'">
      <ion-header :translucent="true">
        <ion-toolbar>
          <!-- ✅ Back button (with default) -->
          <ion-buttons slot="start">
            <ion-back-button :default-href="defaultBackHref" />
          </ion-buttons>
  
          <ion-title>{{ isArabic ? "الكتب" : "Books" }}</ion-title>
        </ion-toolbar>
      </ion-header>
  
      <ion-content :fullscreen="true">
        <div v-if="loading" class="pad">جاري التحميل…</div>
        <div v-else-if="error" class="pad">تعذر تحميل الكتب.</div>
  
        <template v-else>
          <div class="wrap">
            <button
              v-for="b in books"
              :key="b.id"
              class="bkCard"
              type="button"
              @click="openBook(b.id)"
            >
              <!-- ✅ Landscape cover -->
              <div class="bkCover">
                <img v-if="b.coverUrl" :src="b.coverUrl" alt="" loading="lazy" />
                <div v-else class="bkCoverPh"></div>
  
                <!-- overlay -->
                <div class="bkOverlay">
                  <div class="bkTitle">{{ b.title }}</div>
                  <div v-if="b.subtitle" class="bkSub">{{ b.subtitle }}</div>
  
                  <div class="bkMeta">
                    <span v-if="b.chaptersCount" class="pill">
                      {{ isArabic ? "الفصول" : "Chapters" }}: {{ b.chaptersCount }}
                    </span>
                    <span v-if="b.updatedAt" class="pill soft">
                      {{ isArabic ? "آخر تحديث" : "Updated" }}: {{ b.updatedAt }}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          </div>
        </template>
      </ion-content>
    </ion-page>
  </template>
  
  <script setup lang="ts">
  import { computed, onMounted, onBeforeUnmount, ref } from "vue"
  import { useRouter } from "vue-router"
  import {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
  } from "@ionic/vue"
  import { getBooksIndex, type BookIndexItem } from "@/services/booksContent"
  
  type Lang = "ar" | "en"
  const lang = ref<Lang>(((localStorage.getItem("mk_lang") as Lang) || "ar") === "en" ? "en" : "ar")
  const isArabic = computed(() => lang.value === "ar")
  
  function syncLangFromStorage() {
    const v = (localStorage.getItem("mk_lang") as Lang) || "ar"
    lang.value = v === "en" ? "en" : "ar"
  }
  
  const defaultBackHref = "/tabs/home"
  
  const router = useRouter()
  const books = ref<BookIndexItem[]>([])
  const loading = ref(true)
  const error = ref(false)
  
  function onLangChanged() {
    syncLangFromStorage()
  }
  
  onMounted(async () => {
    syncLangFromStorage()
    window.addEventListener("mk:lang-changed", onLangChanged)
  
    try {
      books.value = await getBooksIndex()
    } catch {
      error.value = true
    } finally {
      loading.value = false
    }
  })
  
  onBeforeUnmount(() => {
    window.removeEventListener("mk:lang-changed", onLangChanged)
  })
  
  function openBook(bookId: string) {
    router.push(`/book/${bookId}`)
  }
  </script>
  
  <style scoped>
  .pad {
    padding: 16px;
  }
  
  /* Layout */
  .wrap {
    padding: 14px;
    display: grid;
    grid-template-columns: 1fr;
    gap: 14px;
  }
  
  @media (min-width: 560px) {
    .wrap {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (min-width: 980px) {
    .wrap {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }
  
  /* Card */
  .bkCard {
    width: 100%;
    text-align: start;
    background: transparent;
    border: none;
    padding: 0;
  }
  
  /* Landscape cover block */
  .bkCover {
    position: relative;
    border-radius: 22px;
    overflow: hidden;
  
    /* ✅ landscape ratio */
    aspect-ratio: 16 / 9;
  
    /* subtle border + glass feel */
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: rgba(255, 255, 255, 0.06);
  }
  
  /* image fills */
  .bkCover img,
  .bkCoverPh {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
  }
  
  .bkCoverPh {
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03));
  }
  
  /* overlay */
  .bkOverlay {
    position: absolute;
    inset: 0;
    padding: 14px;
  
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    gap: 6px;
  
    /* gradient for readability */
    background: linear-gradient(
      to top,
      rgba(0, 0, 0, 0.62),
      rgba(0, 0, 0, 0.22),
      rgba(0, 0, 0, 0)
    );
  }
  
  .bkTitle {
    font-weight: 900;
    font-size: 18px;
    line-height: 1.2;
    color: #fff;
    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.25);
  }
  
  .bkSub {
    color: rgba(255, 255, 255, 0.88);
    font-size: 13px;
    line-height: 1.2;
  }
  
  .bkMeta {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-top: 4px;
  }
  
  .pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  
    padding: 6px 10px;
    border-radius: 999px;
  
    background: rgba(255, 255, 255, 0.14);
    border: 1px solid rgba(255, 255, 255, 0.16);
  
    color: rgba(255, 255, 255, 0.92);
    font-size: 12px;
    font-weight: 800;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }
  
  .pill.soft {
    background: rgba(0, 0, 0, 0.18);
    border-color: rgba(255, 255, 255, 0.12);
  }
  
  /* tap feedback without ionic ripple */
  .bkCard:active .bkCover {
    transform: scale(0.99);
  }
  .bkCover {
    transition: transform 140ms ease, border-color 140ms ease;
  }
  .bkCard:hover .bkCover {
    border-color: rgba(255, 255, 255, 0.22);
  }
  </style>
  