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
        <ion-searchbar v-model="q" :placeholder="ui.search" :debounce="250" />


  
        <ion-card v-if="loading">
          <ion-card-content>{{ ui.loading }}</ion-card-content>
        </ion-card>
  
        <ion-card v-else-if="!filteredWords.length">
          <ion-card-content>{{ ui.empty }}</ion-card-content>
        </ion-card>
  
        <ion-list v-else>
          <ion-item
            v-for="(w, i) in filteredWords"
            :key="`${w.date_iso}-${i}`"
          >
            <ion-label class="ion-text-wrap">
   
  
              <div style="margin-top: 6px; font-size: 18px; font-weight: 900">
                {{ w.coptic_word }}

              </div>
  
              <div style="margin-top: 4px; font-size: 15px; opacity: 0.9">
                {{ wordForLang(w) }}
              </div>
            </ion-label>
  
            <ion-button
             v-if="w.coptic_audio"
              slot="end"
              fill="clear"
              @click="play(w.coptic_audio)"
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
      ? { title: 'كلمات قبطية', search: 'ابحث…', loading: 'تحميل…', empty: 'لا توجد بيانات', play: 'تشغيل الصوت' }
      : { title: 'Coptic Words', search: 'Search…', loading: 'Loading…', empty: 'No data', play: 'Play audio' }
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
        const a = String(r.arabic_word || '').toLowerCase()
        const e = String(r.english_word || '').toLowerCase()
      const c = String(r.coptic_word || '').toLowerCase()
      const d = String(r.date_iso || '').toLowerCase()
      return a.includes(needle) || e.includes(needle) || c.includes(needle) || d.includes(needle)
    })
  })
  function todayISO10() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function rowDateISO10(r: any) {
  return String(r.date_iso || r.dateISO || '').trim().substring(0, 10)
}

async function load(force = false) {
  loading.value = true
  try {
    const all = await fetchCopticWords(force)

    const today = todayISO10()

    // ✅ show only rows with date <= today
    rows.value = all
      .filter((r: any) => {
        const iso = rowDateISO10(r)
        return !!iso && iso <= today
      })
      // optional: newest first
      .sort((a: any, b: any) => rowDateISO10(b).localeCompare(rowDateISO10(a)))

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
  

  <style scoped>
/* Use your theme vars (mk-*) */
:global(ion-content){
  --padding-top: 12px;
  --padding-bottom: 18px;
  color: var(--mk-text);
}

/* Searchbar styled with mk colors */
:global(ion-searchbar){
  --border-radius: 16px;
  --background: var(--mk-card);
  --box-shadow: var(--mk-shadow);
  --placeholder-color: color-mix(in srgb, var(--mk-text) 55%, transparent);
  --color: var(--mk-text);
  margin-bottom: 12px;
  border: 1px solid var(--mk-border);
}

/* List container */
:global(ion-list){
  background: transparent;
  padding: 0;
}

/* Each item becomes a "card" using your system */
:global(ion-item){
  --background: var(--mk-card);
  --padding-start: 12px;
  --inner-padding-end: 10px;
  --min-height: 82px;

  margin: 10px 0;
  border-radius: 18px;
  border: 1px solid var(--mk-border);
  box-shadow: var(--mk-shadow);
  overflow: hidden;

  transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
}

:global(ion-item::part(native)){
  border-radius: 18px;
}

/* Soft accent glow strip */
:global(ion-item::before){
  content: "";
  position: absolute;
  inset: 0 auto 0 0;
  width: 5px;
  background: linear-gradient(to bottom, transparent, var(--mk-accent), transparent);
  opacity: 0.55;
}

/* Hover lift (desktop) */
@media (hover:hover){
  :global(ion-item:hover){
    transform: translateY(-1px);
    box-shadow: var(--mk-shadow-strong);
    border-color: var(--mk-soft-border);
  }
}

/* Label spacing */
:global(ion-label){
  margin: 12px 0;
}

/* Coptic word line (your requested font) */
:global(ion-item ion-label > div:nth-child(1)){
  /* after removing date, this becomes the coptic word line */
  margin-top: 0 !important;
  font-size: 20px !important;
  font-weight: 1000 !important;
  letter-spacing: 0.2px;
  color: var(--mk-text);
  font-family: 'CopticForAll', 'Antinoou', serif !important;
}

/* Translation line (Arabic/English meaning) */
:global(ion-item ion-label > div:nth-child(2)){
  margin-top: 8px !important;
  font-size: 15px !important;
  line-height: 1.55;
  opacity: 0.92 !important;
  color: var(--mk-text);
  font-family: "Noto Kufi Arabic", system-ui, sans-serif;
}

/* If you are in EN mode, you probably want Inter */
:global(.lang-en ion-item ion-label > div:nth-child(2)){
  font-family: "Inter", system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif !important;
  font-weight: 700;
}

/* Audio button -> pill circle using mk-soft */
:global(ion-item ion-button){
  --padding-start: 10px;
  --padding-end: 10px;
  --border-radius: 999px;
}

/* Give the button a background bubble */
:global(ion-item ion-button::part(native)){
  background: var(--mk-soft);
  border: 1px solid var(--mk-soft-border);
  border-radius: 999px;
  box-shadow: 0 10px 22px rgba(0,0,0,0.10);
  transition: transform 160ms ease, box-shadow 220ms ease, border-color 220ms ease;
}

:global(ion-item ion-button:active::part(native)){
  transform: scale(0.96);
}

:global(ion-item ion-button ion-icon){
  font-size: 22px;
  color: var(--mk-accent);
  opacity: 0.95;
}

/* Optional: make the item more compact on small screens */
@media (max-width: 360px){
  :global(ion-item){
    border-radius: 16px;
  }
  :global(ion-item::part(native)){
    border-radius: 16px;
  }
}

/* Dark mode: still uses your vars (mk-card already dark), just tweak shadow */
:global(body.theme-dark) :global(ion-item){
  box-shadow: var(--mk-shadow);
}

    </style>
    