<!-- src/pages/DailyAudioPage.vue -->
<template>
    <ion-page :class="['home', themeClass]" dir="rtl" lang="ar">
      <ion-header>
        <ion-toolbar>
          <ion-title>{{ title }}</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="goBack">إغلاق</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
  
      <ion-content class="ion-padding">
        <div class="playerCard">
          <div class="playerTitle">🎧 {{ title }}</div>
  
          <div class="audioWrap">
            <audio
              ref="audioRef"
              :src="url"
              controls
              preload="auto"
              playsinline
            />
  
            <!-- Autoplay fallback overlay (if blocked) -->
            <button
              v-if="needsTap && url"
              class="tapToPlay"
              type="button"
              @click="forcePlay"
            >
              ▶️ اضغط للتشغيل
            </button>
          </div>
  
          <div class="speedRow" v-if="url">
            <button class="speedChip" :class="{ active: rate === 0.75 }" @click="setRate(0.75)">
              0.75x
            </button>
            <button class="speedChip" :class="{ active: rate === 1 }" @click="setRate(1)">
              1x
            </button>
            <button class="speedChip" :class="{ active: rate === 1.25 }" @click="setRate(1.25)">
              1.25x
            </button>
            <button class="speedChip" :class="{ active: rate === 1.5 }" @click="setRate(1.5)">
              1.5x
            </button>
          </div>
  
          <div class="hint" v-if="!url">
            لا يوجد ملف صوتي لهذا اليوم.
          </div>
        </div>
      </ion-content>
    </ion-page>
  </template>
  
  <script setup lang="ts">
  import { IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent } from '@ionic/vue'
  import { ref, computed, onMounted, nextTick } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  
  const route = useRoute()
  const router = useRouter()
  
  // If you already have themeClass in global/store, keep it.
  // Otherwise, this local fallback will still work.
  const themeClass = computed(() => (localStorage.getItem('mk_theme') === 'dark' ? 'theme-dark' : 'theme-light'))
  
  const audioRef = ref<HTMLAudioElement | null>(null)
  const needsTap = ref(false)
  
  const title = computed(() => String(route.query.title || 'رسالة اليوم'))
  
  // You are passing the FULL url in query.url; keep decode for encoded chars.
  const url = computed(() => decodeURIComponent(String(route.query.url || '')).trim())
  
  function goBack() {
    router.back()
  }
  
  // ===== Speed controls
  const rate = ref<number>(1)
  
  function setRate(r: number) {
    rate.value = r
    if (!audioRef.value) return
    audioRef.value.playbackRate = r
  
    // If user changes speed, we try to keep it playing
    if (audioRef.value.paused) {
      void audioRef.value.play().catch(() => {
        // if blocked, show tap overlay
        needsTap.value = true
      })
    }
  }
  
  async function forcePlay() {
    if (!audioRef.value) return
    try {
      await audioRef.value.play()
      needsTap.value = false
    } catch {
      needsTap.value = true
    }
  }
  
  // ===== Autoplay (works when page opened from a user gesture like your pill click)
  onMounted(async () => {
    await nextTick()
  
    if (!audioRef.value || !url.value) return
  
    // apply last selected speed quickly
    audioRef.value.playbackRate = rate.value
  
    try {
      audioRef.value.currentTime = 0
      await audioRef.value.play()
      needsTap.value = false
    } catch {
      // iOS might block if it doesn't consider it in the gesture chain
      needsTap.value = true
    }
  })
  </script>
  
  <style scoped>
  /* Card */
  .playerCard {
    border-radius: 18px;
    padding: 16px;
    border: 1px solid rgba(0, 0, 0, 0.08);
    background: rgba(255, 255, 255, 0.75);
    box-shadow: 0 12px 26px rgba(0, 0, 0, 0.08);
  }
  
  .home.theme-dark .playerCard {
    border-color: rgba(255, 255, 255, 0.12);
    background: rgba(255, 255, 255, 0.06);
    box-shadow: 0 14px 32px rgba(0, 0, 0, 0.50);
  }
  
  .playerTitle {
    font-weight: 1000;
    margin-bottom: 12px;
    font-size: 18px;
  }
  
  /* Audio */
  .audioWrap {
    position: relative;
  }
  
  audio {
    width: 100%;
    margin: 10px 0 8px;
  }
  
  /* Tap overlay (fallback) */
  .tapToPlay {
    position: absolute;
    inset: 10px 0 8px;
    border-radius: 14px;
    border: 1px solid rgba(255, 255, 255, 0.18);
    background: rgba(0, 0, 0, 0.55);
    color: #fff;
    font-weight: 1000;
    font-size: 18px;
    cursor: pointer;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }
  
  .tapToPlay:active {
    transform: scale(0.98);
  }
  
  /* Speed chips */
  .speedRow {
    display: flex;
    justify-content: center;
    gap: 10px;
    margin-top: 10px;
    flex-wrap: wrap;
  }
  
  .speedChip {
    border: 1px solid rgba(0, 0, 0, 0.10);
    background: rgba(255, 255, 255, 0.55);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    padding: 8px 12px;
    border-radius: 999px;
    font-weight: 1000;
    cursor: pointer;
    color: var(--mk-text, #0b1f33);
    transition: transform 0.15s ease, box-shadow 0.25s ease, border-color 0.25s ease;
  }
  
  .home.theme-dark .speedChip {
    border-color: rgba(255, 255, 255, 0.14);
    background: rgba(0, 0, 0, 0.18);
    color: var(--mk-text, #f5f7fa);
  }
  
  .speedChip.active {
    border-color: rgba(40, 214, 204, 0.45);
    box-shadow: 0 0 0 2px rgba(40, 214, 204, 0.12), 0 10px 22px rgba(40, 214, 204, 0.22);
  }
  
  .home.theme-dark .speedChip.active {
    box-shadow: 0 0 0 2px rgba(40, 214, 204, 0.18), 0 12px 26px rgba(40, 214, 204, 0.28);
  }
  
  .speedChip:active {
    transform: scale(0.97);
  }
  
  /* Hint */
  .hint {
    margin-top: 10px;
    opacity: 0.8;
    text-align: center;
    font-weight: 800;
  }
  </style>
  