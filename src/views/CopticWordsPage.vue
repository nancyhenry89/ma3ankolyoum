<template>
    <ion-page>
      <ion-header>
        <ion-toolbar>
          <ion-buttons slot="start">
            <ion-back-button default-href="/" />
          </ion-buttons>
  
          <ion-title>{{ ui.title }}</ion-title>
  
          <ion-buttons slot="end">
            <ion-button fill="clear" @click="refresh">
              <ion-icon :icon="refreshOutline" />
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
  
      <ion-content class="ion-padding">
        <ion-searchbar v-model="q" :placeholder="ui.search" debounce="250" />
  
        <ion-card v-if="loading">
          <ion-card-content>{{ ui.loading }}</ion-card-content>
        </ion-card>
  
        <ion-card v-else-if="!filteredWords.length">
          <ion-card-content>{{ ui.empty }}</ion-card-content>
        </ion-card>
  
        <ion-list v-else>
          <ion-item
            v-for="(w, i) in filteredWords"
            :key="String(w.date_iso || w.dateISO || i)"
          >
            <ion-label class="ion-text-wrap">
              <div style="font-weight: 900; opacity: 0.85">
                {{ w.date_iso || w.dateISO }}
              </div>
  
              <div style="margin-top: 6px; font-size: 18px; font-weight: 900">
                {{ w.coptic_word || w.coptic }}
              </div>
  
              <div style="margin-top: 4px; font-size: 15px; opacity: 0.9">
                {{ wordForLang(w) }}
              </div>
            </ion-label>
  
            <ion-button
              v-if="w.coptic_audio || w.audio"
              slot="end"
              fill="clear"
              @click="play(w.coptic_audio || w.audio)"
              :aria-label="ui.play"
            >
              <ion-icon :icon="volumeHighOutline" />
            </ion-button>
          </ion-item>
        </ion-list>
  
        <!-- Hidden audio -->
        <audio ref="audioRef" preload="none" playsinline />
      </ion-content>
    </ion-page>
  </template>
  
  <script setup lang="ts">
  import {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonIcon,
    IonList,
    IonItem,
    IonLabel,
    IonBackButton,
    IonSearchbar,
    IonCard,
    IonCardContent,
  } from '@ionic/vue'
  import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
  import { refreshOutline, volumeHighOutline } from 'ionicons/icons'
  import { fetchCopticWords, type CopticWordRow } from '@/services/sheets'
  import { Capacitor } from '@capacitor/core'

const GITHUB_CONTENT_BASE = 'https://nancyhenry89.github.io/ma3ankolyoum/content'

// للويب: استخدمي /content على نفس الدومين (ده الصح غالبًا)
const WEB_CONTENT_BASE = `${window.location.origin}/content`

const CONTENT_BASE = computed(() =>
  Capacitor.isNativePlatform() ? GITHUB_CONTENT_BASE : WEB_CONTENT_BASE
)

const COPTIC_AUDIO_BASE = computed(() => `${CONTENT_BASE.value}/audio/coptic`)

  type Lang = 'ar' | 'en'
  const lang = ref<Lang>((localStorage.getItem('mk_lang') as Lang) || 'ar')
  const isArabic = computed(() => lang.value === 'ar')
  
  const ui = computed(() => {
    return isArabic.value
      ? { title: 'كلمات قبطية حتى اليوم', search: 'ابحث…', loading: 'تحميل…', empty: 'لا توجد بيانات', play: 'تشغيل الصوت' }
      : { title: 'Coptic Words (to date)', search: 'Search…', loading: 'Loading…', empty: 'No data', play: 'Play audio' }
  })
  
  const q = ref('')
  const rows = ref<CopticWordRow[]>([])
  const loading = ref(true)
  const audioRef = ref<HTMLAudioElement | null>(null)
  
  function syncLangFromStorage() {
    const v = (localStorage.getItem('mk_lang') as any) === 'en' ? 'en' : 'ar'
    lang.value = v
  }
  
  // ✅ supports both naming styles (arabic_word / ar, english_word / en)
  function wordForLang(r: any) {
    return isArabic.value
      ? String(r.arabic_word || r.ar || '').trim()
      : String(r.english_word || r.en || '').trim()
  }
  
  const filteredWords = computed(() => {
    const needle = q.value.trim().toLowerCase()
    if (!needle) return rows.value
  
    return rows.value.filter((r: any) => {
      const a = String(r.arabic_word || r.ar || '').toLowerCase()
      const e = String(r.english_word || r.en || '').toLowerCase()
      const c = String(r.coptic_word || r.coptic || '').toLowerCase()
      const d = String(r.date_iso || r.dateISO || '').toLowerCase()
      return a.includes(needle) || e.includes(needle) || c.includes(needle) || d.includes(needle)
    })
  })
  
  async function load(force = false) {
    loading.value = true
    try {
      rows.value = await fetchCopticWords(force)
    } catch (e) {
      console.error('fetchCopticWords error', e)
      rows.value = []
    } finally {
      loading.value = false
    }
  }
  
  async function refresh() {
    await load(true)
  }
  
  function normalizeAudioUrl(raw: string) {
  const v = String(raw || '').trim()
  if (!v) return ''

  // لو الشيت حاطة لينك كامل (https://...)
  if (/^https?:\/\//i.test(v)) return encodeURI(v)

  // لو الشيت حاطة اسم ملف بس (Jan2_biagios.mp3)
  return `${COPTIC_AUDIO_BASE.value}/${encodeURIComponent(v)}`
}

async function play(url: string) {
  try {
    const a = audioRef.value
    if (!a) return

    const clean = normalizeAudioUrl(url)
    if (!clean) return

    a.pause()
    a.currentTime = 0
    a.src = clean
    a.load()
    await a.play()
  } catch (e) {
    console.error('audio play error', e)
  }
}


  
  onMounted(() => {
    const handler = () => syncLangFromStorage()
    window.addEventListener('mk:lang-changed', handler)
  
    syncLangFromStorage()
    load(false).catch(console.error)
  
    onBeforeUnmount(() => {
      window.removeEventListener('mk:lang-changed', handler)
    })
  })
  </script>
  