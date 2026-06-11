<template>
    <ion-page>
      <ion-header>
        <ion-toolbar>
          <ion-buttons slot="start">
            <ion-back-button :default-href="`/conference/${conferenceId}`" />
          </ion-buttons>
  
          <ion-title>اقتباسات</ion-title>
        </ion-toolbar>
      </ion-header>
  
      <ion-content class="ion-padding quotes-page" dir="rtl">
        <p v-if="loading" class="center">جاري التحميل...</p>
  
        <div v-else-if="quotes.length === 0" class="empty">
          <div class="empty-icon">💬</div>
          <h2>لا توجد اقتباسات لهذا المؤتمر.</h2>
        </div>
  
        <ion-card v-for="quote in quotes" :key="quote.id || quote.text">
          <ion-card-content>
            <div class="quote-mark">“</div>
  
            <p class="quote-text">
              {{ quote.text }}
            </p>
  
            <p v-if="quote.author" class="author">
              — {{ quote.author }}
            </p>
  
            <div class="notes-box">
              <h3>ملاحظاتي الخاصة</h3>
  
              <ion-textarea
                :value="notes[quoteKey(quote)] || ''"
                auto-grow
                placeholder="اكتب ملاحظتك هنا..."
                @ionInput="notes[quoteKey(quote)] = String($event.detail.value || '')"
              />
  
              <ion-button expand="block" @click="saveNote(quoteKey(quote))">
                حفظ الملاحظة
              </ion-button>
  
              <p v-if="savedKey === quoteKey(quote)" class="saved">
                تم الحفظ ✅
              </p>
            </div>
          </ion-card-content>
        </ion-card>
      </ion-content>
    </ion-page>
  </template>
  
  <script setup lang="ts">
  import {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonContent,
    IonCard,
    IonCardContent,
    IonTextarea,
    IonButton,
  } from '@ionic/vue'
  
  import { onMounted, ref } from 'vue'
  import { useRoute } from 'vue-router'
  
  import {
    fetchConferenceQuotes,
    type ConferenceQuoteRow,
  } from '@/services/sheets'
  
  const route = useRoute()
  const conferenceId = String(route.params.id || '')
  
  const loading = ref(true)
  const quotes = ref<ConferenceQuoteRow[]>([])
  const notes = ref<Record<string, string>>({})
  const savedKey = ref('')
  
  onMounted(async () => {
    await loadQuotes()
  })
  
  async function loadQuotes() {
    loading.value = true
  
    try {
      quotes.value = await fetchConferenceQuotes(conferenceId, true)
  
      quotes.value.forEach((q) => {
        const key = quoteKey(q)
        notes.value[key] = localStorage.getItem(noteStorageKey(key)) || ''
      })
    } catch (e) {
      console.error('Failed to load quotes', e)
      quotes.value = []
    } finally {
      loading.value = false
    }
  }
  
  function quoteKey(quote: ConferenceQuoteRow) {
    return quote.id || btoa(unescape(encodeURIComponent(quote.text))).slice(0, 20)
  }
  
  function noteStorageKey(key: string) {
    return `mk_conference_quote_note_${conferenceId}_${key}`
  }
  
  function saveNote(key: string) {
    localStorage.setItem(noteStorageKey(key), notes.value[key] || '')
    savedKey.value = key
  
    setTimeout(() => {
      if (savedKey.value === key) savedKey.value = ''
    }, 1500)
  }
  </script>
  
  <style scoped>
  .quotes-page {
    --background: #f7f1e8;
  }
  
  .center {
    text-align: center;
    padding: 40px 0;
  }
  
  .empty {
    text-align: center;
    padding: 40px 0;
  }
  
  .empty-icon {
    font-size: 48px;
  }
  
  .quote-mark {
    font-size: 52px;
    line-height: 1;
    color: #8b2f2f;
    font-weight: 900;
  }
  
  .quote-text {
    font-size: 18px;
    line-height: 1.9;
    color: #2d2418;
    margin: 0 0 12px;
  }
  
  .author {
    color: #7a4b2a;
    font-weight: 800;
    margin-bottom: 18px;
  }
  
  .notes-box {
    margin-top: 16px;
    padding: 14px;
    border-radius: 18px;
    background: #fff8ee;
    border: 1px solid rgba(80, 45, 20, 0.12);
  }
  
  .notes-box h3 {
    margin: 0 0 10px;
    color: #7a4b2a;
    font-size: 16px;
  }
  
  .saved {
    text-align: center;
    color: #2e7d32;
    font-weight: 800;
  }
  </style>