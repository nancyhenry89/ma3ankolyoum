<template>
    <ion-page>
      <ion-header>
        <ion-toolbar>
          <ion-buttons slot="start">
            <ion-back-button :default-href="`/conference/${conferenceId}`" />
          </ion-buttons>
  
          <ion-title>المصادر والروابط</ion-title>
        </ion-toolbar>
      </ion-header>
  
      <ion-content class="ion-padding links-page" dir="rtl">
        <p v-if="loading" class="center">
          جاري التحميل...
        </p>
  
        <div v-else-if="links.length === 0" class="empty">
          <div class="empty-icon">🔗</div>
          <h2>لا توجد روابط</h2>
        </div>
  
        <ion-card
          v-for="(item, index) in links"
          :key="index"
        >
          <ion-card-content class="link-card">
            <div class="icon-wrap">
              <span class="icon">
                {{ getIcon(item.type) }}
              </span>
            </div>
  
            <div class="content">
              <h3>{{ item.title }}</h3>
  
              <p class="type">
                {{ getTypeLabel(item.type) }}
              </p>
  
              <p class="url">
                {{ item.url }}
              </p>
  
              <ion-button
                expand="block"
                @click="openLink(item.url)"
              >
                فتح الرابط
              </ion-button>
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
    IonButton,
  } from '@ionic/vue'
  
  import { ref, onMounted } from 'vue'
  import { useRoute } from 'vue-router'
  
  import {
    fetchConferenceLinks,
    type ConferenceLinkRow,
  } from '@/services/sheets'
  
  const route = useRoute()
  
  const conferenceId = String(route.params.id || '')
  
  const loading = ref(true)
  
  const links = ref<ConferenceLinkRow[]>([])
  
  onMounted(async () => {
    try {
      links.value = await fetchConferenceLinks(
        conferenceId,
        true
      )
    } catch (e) {
      console.error(e)
    } finally {
      loading.value = false
    }
  })
  
  function openLink(url: string) {
    if (!url) return
  
    window.open(url, '_blank')
  }
  
  function getIcon(type: string) {
    const t = String(type || '').toLowerCase()
  
    if (t.includes('pdf')) return '📄'
    if (t.includes('audio')) return '🎧'
    if (t.includes('video')) return '🎬'
    if (t.includes('youtube')) return '▶️'
    if (t.includes('sheet')) return '📊'
    if (t.includes('doc')) return '📝'
    if (t.includes('form')) return '📋'
  
    return '🔗'
  }
  
  function getTypeLabel(type: string) {
    const t = String(type || '').toLowerCase()
  
    if (t.includes('pdf')) return 'PDF'
    if (t.includes('audio')) return 'تسجيل صوتي'
    if (t.includes('video')) return 'فيديو'
    if (t.includes('youtube')) return 'يوتيوب'
    if (t.includes('sheet')) return 'Google Sheet'
    if (t.includes('doc')) return 'Google Doc'
    if (t.includes('form')) return 'Google Form'
  
    return 'رابط'
  }
  </script>
  
  <style scoped>
  .links-page {
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
    font-size: 50px;
  }
  
  .link-card {
    display: flex;
    gap: 14px;
    align-items: flex-start;
  }
  
  .icon-wrap {
    flex-shrink: 0;
  }
  
  .icon {
    font-size: 36px;
  }
  
  .content {
    flex: 1;
  }
  
  .content h3 {
    margin: 0 0 6px;
    color: #5b3822;
    font-size: 17px;
    font-weight: 900;
  }
  
  .type {
    margin: 0 0 6px;
    color: #8b2f2f;
    font-weight: 700;
  }
  
  .url {
    font-size: 12px;
    color: #666;
    word-break: break-word;
    margin-bottom: 12px;
  }
  </style>