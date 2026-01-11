<template>
    <ion-page dir="rtl" lang="ar">
      <ion-header>
        <ion-toolbar>
          <ion-buttons slot="start">
            <ion-back-button default-href="/" />
          </ion-buttons>
  
          <ion-title>مقدمات أسفار الكتاب المقدس</ion-title>
  
          <ion-buttons slot="end">
            <ion-button fill="clear" @click="refresh">
              <ion-icon :icon="refreshOutline" />
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
  
      <ion-content class="ion-padding">
        <ion-card v-if="loading">
          <ion-card-content>تحميل…</ion-card-content>
        </ion-card>
  
        <ion-card v-else-if="!items.length">
          <ion-card-content>لا توجد بيانات</ion-card-content>
        </ion-card>
  
        <div v-else class="video-list">
          <div class="video-card" v-for="it in items" :key="it.youtubeId">
            <div class="title">{{ it.name }}</div>
  
            <div class="frame">
              <iframe
                :src="youtubeEmbed(it.youtubeId)"
                width="100%"
                height="220"
                frameborder="0"
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowfullscreen
              />
            </div>
          </div>
        </div>
      </ion-content>
    </ion-page>
  </template>
  
  <script setup lang="ts">
  import {
    IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
    IonButtons, IonButton, IonIcon, IonBackButton,
    IonCard, IonCardContent
  } from '@ionic/vue'
  import { ref, onMounted } from 'vue'
  import { refreshOutline } from 'ionicons/icons'
  import { fetchBibleVideos, type BibleVideoRow } from '@/services/sheets'
  
  const loading = ref(true)
  const items = ref<BibleVideoRow[]>([])
  
  function youtubeEmbed(id: string) {
    const clean = String(id || '').trim()
    // nocookie + playsinline أفضل لـ WebView
    return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(clean)}?rel=0&modestbranding=1&playsinline=1`
  }
  
  async function load(force = false) {
    loading.value = true
    try {
      const all = await fetchBibleVideos(force)
      items.value = all.filter(v => String(v.type).toLowerCase() === 'story')
    } catch (e) {
      console.error(e)
      items.value = []
    } finally {
      loading.value = false
    }
  }
  
  async function refresh() {
    await load(true)
  }
  
  onMounted(() => {
    load(false).catch(console.error)
  })
  </script>
  
  <style scoped>
  .video-list{
    display: grid;
    gap: 14px;
  }
  
  .video-card{
    border-radius: 16px;
    padding: 12px;
    background: var(--ion-card-background, rgba(255,255,255,0.06));
    border: 1px solid rgba(255,255,255,0.08);
  }
  
  .title{
    font-weight: 1000;
    margin-bottom: 10px;
    line-height: 1.4;
  }
  
  .frame{
    border-radius: 16px;
    overflow: hidden;
  }
  </style>
  