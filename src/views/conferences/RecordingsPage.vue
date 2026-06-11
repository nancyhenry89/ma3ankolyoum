<template>
    <ion-page>
      <ion-header>
        <ion-toolbar>
          <ion-buttons slot="start">
            <ion-back-button :default-href="`/conference/${conferenceId}`" />
          </ion-buttons>
  
          <ion-title>التسجيلات</ion-title>
        </ion-toolbar>
      </ion-header>
  
      <ion-content class="ion-padding recordings-page" dir="rtl">
        <p v-if="loading" class="center">جاري التحميل...</p>
  
        <div v-else-if="recordings.length === 0" class="empty">
          <div class="empty-icon">🎧</div>
          <h2>لا توجد تسجيلات لهذا المؤتمر.</h2>
        </div>
  
        <ion-card v-for="(item, index) in recordings" :key="index">
          <ion-card-content>
            <div class="rec-head">
              <div class="rec-icon">🎧</div>
  
              <div>
                <h3>{{ item.title }}</h3>
                <p v-if="item.speaker">{{ item.speaker }}</p>
              </div>
            </div>
  
            <audio
              v-if="item.audio_url"
              class="audio"
              :src="item.audio_url"
              controls
              preload="none"
              controlsList="nodownload"
            />
  
            <ion-button
              v-if="item.audio_url"
              expand="block"
              fill="outline"
              :href="item.audio_url"
              target="_blank"
            >
              فتح التسجيل
            </ion-button>
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
    IonButton,
  } from '@ionic/vue'
  
  import { onMounted, ref } from 'vue'
  import { useRoute } from 'vue-router'
  
  import {
    fetchConferenceRecordings,
    type ConferenceRecordingRow,
  } from '@/services/sheets'
  
  const route = useRoute()
  const conferenceId = String(route.params.id || '')
  
  const loading = ref(true)
  const recordings = ref<ConferenceRecordingRow[]>([])
  
  onMounted(async () => {
    try {
      recordings.value = await fetchConferenceRecordings(conferenceId, true)
    } catch (e) {
      console.error('Failed to load recordings', e)
      recordings.value = []
    } finally {
      loading.value = false
    }
  })
  </script>
  
  <style scoped>
  .recordings-page {
    --background: #f7f1e8;
  }
  
  .center,
  .empty {
    text-align: center;
    padding: 40px 0;
  }
  
  .empty-icon {
    font-size: 48px;
  }
  
  .rec-head {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 14px;
  }
  
  .rec-icon {
    font-size: 34px;
  }
  
  h3 {
    margin: 0 0 4px;
    color: #5b3822;
    font-size: 18px;
    font-weight: 900;
  }
  
  p {
    margin: 0;
    color: #7a4b2a;
    opacity: 0.8;
  }
  
  .audio {
    width: 100%;
    margin: 12px 0;
  }
  </style>