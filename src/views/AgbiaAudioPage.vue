<template>
    <ion-page dir="rtl">
      <ion-header :translucent="true">
        <ion-toolbar>
          <ion-buttons slot="start">
            <ion-back-button default-href="/"></ion-back-button>
          </ion-buttons>
          <ion-title>صوت الأجبية</ion-title>
        </ion-toolbar>
      </ion-header>
  
      <ion-content class="ion-padding">
        <div class="card">
          <div class="date">{{ dateISO }}</div>
  
          <div v-if="src" class="playerWrap">
            <audio controls preload="none" :src="src" style="width:100%"></audio>
            <div class="hint">{{ fileName }}</div>
          </div>
  
          <div v-else class="hint">
            لا يوجد ملف صوتي لهذا اليوم.
          </div>
        </div>
      </ion-content>
    </ion-page>
  </template>
  
  <script setup lang="ts">
  import {
    IonPage, IonHeader, IonToolbar, IonTitle,
    IonButtons, IonBackButton, IonContent
  } from '@ionic/vue'
  import { computed } from 'vue'
  import { useRoute } from 'vue-router'
  
  const route = useRoute()
  
  const dateISO = computed(() => String(route.params.date || '').substring(0, 10))
  const src = computed(() => String(route.query.src || '').trim())
  
  const fileName = computed(() => {
    if (!src.value) return ''
    try {
      const u = new URL(src.value)
      return decodeURIComponent(u.pathname.split('/').pop() || '')
    } catch {
      return src.value
    }
  })
  </script>
  
  <style scoped>
  .card{
    border-radius: 18px;
    padding: 18px;
    border: 1px solid rgba(0,0,0,0.08);
    background: rgba(255,255,255,0.9);
  }
  .date{
    font-weight: 900;
    font-size: 18px;
    margin-bottom: 12px;
    text-align: center;
  }
  .hint{
    margin-top: 10px;
    opacity: 0.75;
    text-align: center;
    font-size: 14px;
  }
  </style>
  