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
  
          <div v-if="loading" class="hint">جاري تحميل البيانات...</div>
          <div v-else-if="!rowFound" class="hint">لا يوجد بيانات لهذا اليوم.</div>
  
          <div v-else class="list">
            <div v-for="p in prayers" :key="p.key" class="item" :class="{ off: !p.src }">
              <div class="title">{{ p.title }}</div>
  
              <div v-if="p.src" class="playerWrap">
                <audio
  controls
  preload="none"
  :src="p.src"
  style="width:100%"
  @play="onAudioPlay"
/>

                <div class="file" v-if="p.fileName">{{ p.fileName }}</div>
              </div>
  
              <div v-else class="unavailable">غير متاح</div>
            </div>
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
  import { computed, onMounted, ref, watch } from 'vue'
  import { useRoute } from 'vue-router'
  import Papa from 'papaparse'
  
  const route = useRoute()
  
  const dateISO = computed(() => String(route.params.date || '').substring(0, 10))
  
  // ✅ نفس الشيت بتاع الهوم
  const SHEET_CSV_URL =
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vRzBoz5JKy5BfRIXlo_rOSIYsce_9oXsLG9R07CvC3-MztLmg3vv7EYoNLFdt9YmL21tv8XYevOxedh/pub?gid=0&single=true&output=csv'
  

  const loading = ref(true)
  const rowFound = ref(false)
  const dayRow = ref<Record<string, any> | null>(null)
    const audioFiles = import.meta.glob('/src/**/*.mp3', {
  eager: true,
  as: 'url'
}) as Record<string, string>

console.log('MP3 found:', Object.keys(audioFiles))

const audioMap: Record<string, string> = {}
for (const [path, url] of Object.entries(audioFiles)) {
  const name = path.split('/').pop() || ''
  if (name) audioMap[name] = url
}

function toAudioUrl(cell: any): string {
  const v = String(cell ?? '').trim()
  if (!v) return ''
  if (/^https?:\/\//i.test(v)) return v
  return audioMap[v] || ''
}
function onAudioPlay(e: Event) {
  const current = e.target as HTMLAudioElement
  const audios = document.querySelectorAll('audio')

  audios.forEach(a => {
    if (a !== current) {
      a.pause()
    }
  })
}


  function normalizeKeys(row: any) {
    const out: Record<string, any> = {}
    Object.keys(row || {}).forEach(k => {
      const nk = String(k).trim().toLowerCase().replace(/\s+/g, '_')
      out[nk] = row[k]
    })
    return out
  }
  

  
  function fileNameFromUrl(u: string) {
    try {
      const url = new URL(u)
      return decodeURIComponent(url.pathname.split('/').pop() || '')
    } catch {
      return ''
    }
  }
  
  const PRAYERS = [
    { key: 'baker', title: 'صلاة باكر' },
    { key: 'third', title: 'صلاة الساعة الثالثة' },
    { key: 'sixth', title: 'صلاة الساعة السادسة' },
    { key: 'ninth', title: 'صلاة الساعة التاسعة' },
    { key: 'sunset', title: 'صلاة الغروب' },
    { key: 'sleep', title: 'صلاة النوم' },
  ] as const
  
  const prayers = computed(() => {
    const row = dayRow.value
    if (!row) return []
    return PRAYERS.map(p => {
      const src = toAudioUrl(row[p.key])
      return {
        ...p,
        src,
        fileName: src ? fileNameFromUrl(src) : ''
      }
    })
  })
  
  async function loadDay() {
    loading.value = true
    rowFound.value = false
    dayRow.value = null
  
    try {
      const res = await fetch(SHEET_CSV_URL, { cache: 'no-store' })
      const csv = await res.text()
  
      const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true })
      const rows = (parsed.data as any[])
        .map(r => normalizeKeys(r))
        .filter(r => r.date_iso)
  
      const target = dateISO.value
      const found = rows.find(r => String(r.date_iso).trim().substring(0, 10) === target) || null
  
      if (found) {
        dayRow.value = found
        rowFound.value = true
      } else {
        rowFound.value = false
      }
    } catch (e) {
      rowFound.value = false
      dayRow.value = null
    } finally {
      loading.value = false
    }
  }
  
  onMounted(loadDay)
  watch(dateISO, loadDay)
  </script>
  
  <style scoped>
    /* ===== Base ===== */
    ion-page {
      font-family: "Noto Naskh Arabic", system-ui, sans-serif;
      background: #f4f7fb;
      color: #0b1f33;
    }
    
    /* Card container */
    .card{
      border-radius: 18px;
      padding: 18px;
      background: #ffffff;
      border: 1px solid rgba(24,42,68,0.10);
      box-shadow: 0 8px 18px rgba(10,20,30,0.07);
    }
    
    /* Date */
    .date{
      font-weight: 900;
      font-size: 18px;
      margin-bottom: 14px;
      text-align: center;
      color: #182a44;
    }
    
    /* Hints */
    .hint{
      margin-top: 12px;
      font-size: 14px;
      text-align: center;
      opacity: 0.8;
    }
    
    /* List */
    .list{
      display: grid;
      gap: 12px;
      margin-top: 12px;
    }
    
    /* Item */
    .item{
      border-radius: 14px;
      padding: 14px;
      background: rgba(32,178,170,0.06); /* قريب من mk-soft */
      border: 1px solid rgba(32,178,170,0.25);
    }
    
    /* Title */
    .title{
      font-weight: 900;
      font-size: 16px;
      margin-bottom: 10px;
      text-align: center;
      color: #182a44;
    }
    
    /* Audio */
    .playerWrap{
      margin-top: 6px;
    }
    
    /* File name */
    .file{
      margin-top: 6px;
      font-size: 12px;
      opacity: 0.7;
      text-align: center;
    }
    
    /* Unavailable */
    .item.off{
      background: rgba(0,0,0,0.03);
      border-color: rgba(0,0,0,0.12);
    }
    .unavailable{
      text-align: center;
      font-size: 13px;
      padding: 10px 0;
    }
    
    /* Audio element */
    audio{
      width: 100%;
    }
    
    /* RTL polish */
    .title,
    .unavailable,
    .file{
      direction: rtl;
    }
    </style>
    