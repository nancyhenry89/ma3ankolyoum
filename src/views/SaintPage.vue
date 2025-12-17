<template>
    <ion-page :class="['saintPage', themeClass]" dir="rtl">
      <ion-header :translucent="true">
        <ion-toolbar>
          <ion-buttons slot="start">
            <ion-back-button default-href="/"></ion-back-button>
          </ion-buttons>
          <ion-title>{{ saintName || 'السنكسار' }}</ion-title>
        </ion-toolbar>
      </ion-header>
  
      <ion-content :fullscreen="true" class="content">
        <div class="bg"></div>
  
        <div class="wrap">
          <div class="pageTitle">{{ saintName }}</div>
  
          <div class="card bigCard" v-if="saintStory">
            <p class="text alignRight">{{ saintStory }}</p>
          </div>
  
          <div class="hint" v-else>
            لا توجد قصة متاحة لهذا اليوم.
          </div>
  
          <div class="space"></div>
        </div>
      </ion-content>
    </ion-page>
  </template>
  
  <script setup lang="ts">
  import {
    IonContent,
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton
  } from '@ionic/vue'
  import { onMounted, ref, computed } from 'vue'
  import { useRoute } from 'vue-router'
  import Papa from 'papaparse'
  
  const route = useRoute()
  
  const SHEET_CSV_URL =
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vRzBoz5JKy5BfRIXlo_rOSIYsce_9oXsLG9R07CvC3-MztLmg3vv7EYoNLFdt9YmL21tv8XYevOxedh/pub?gid=0&single=true&output=csv'
  
  // ====== Theme + Font scale (persist) ======
  type ThemeMode = 'light' | 'dark'
  const theme = ref<ThemeMode>((localStorage.getItem('mk_theme') as ThemeMode) || 'light')
  const fontScale = ref<number>(Number(localStorage.getItem('mk_fontScale') || '1'))
  const themeClass = computed(() => (theme.value === 'dark' ? 'theme-dark' : 'theme-light'))
  
  function applyPrefs() {
    document.documentElement.style.setProperty('--mk-fontScale', String(fontScale.value))
    document.documentElement.setAttribute('data-mk-theme', theme.value)
  }
  
  // ====== helpers (same as Home) ======
  function normalizeKeys(row: any) {
    const out: Record<string, any> = {}
    Object.keys(row || {}).forEach(k => {
      const nk = String(k).trim().toLowerCase().replace(/\s+/g, '_')
      out[nk] = row[k]
    })
    return out
  }
  function pick(row: any, ...keys: string[]) {
    for (const k of keys) {
      const kk = k.trim().toLowerCase().replace(/\s+/g, '_')
      if (row[kk] !== undefined && row[kk] !== null && String(row[kk]).trim() !== '') {
        return row[kk]
      }
    }
    return ''
  }
  
  // ====== state ======
  const saintName = ref('')
  const saintStory = ref('')
  
  async function fetchRows() {
    const res = await fetch(SHEET_CSV_URL, { cache: 'no-store' })
    const csv = await res.text()
    const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true })
    return (parsed.data as any[]).map(r => normalizeKeys(r)).filter(r => r.date_iso)
  }
  
  async function loadSaintByDate(dateISO: string) {
    const rows = await fetchRows()
    const found = rows.find(r => String(r.date_iso).trim() === dateISO)
  
    if (!found) return
  
    saintName.value = pick(found, 'saint')
    saintStory.value = pick(found, 'saint_story', 'saintstory', 'synaxarium', 'synaxarion')
  }
  
  onMounted(() => {
    applyPrefs()
    const dateISO = String(route.params.dateISO || '')
    if (dateISO) loadSaintByDate(dateISO).catch(console.error)
  })
  </script>
  
  <style scoped>
  /* نفس variables بتاعة Home */
  .saintPage.theme-light{
    --mk-bg1:#f4f7fb; --mk-bg2:#ffffff;
    --mk-text:#0b1f33; --mk-card:#ffffff;
    --mk-accent:#20b2aa; --mk-dark:#182a44; --mk-danger:#d64545;
    --mk-border:rgba(24,42,68,0.10);
    --mk-shadow:0 8px 18px rgba(10,20,30,0.07);
    --mk-shadow-strong:0 14px 28px rgba(10,20,30,0.10);
    --mk-soft:rgba(32,178,170,0.12);
    --mk-soft-border:rgba(32,178,170,0.28);
  }
  .saintPage.theme-dark{
    --mk-bg1:#060b12; --mk-bg2:#0b1220;
    --mk-text:#f5f7fa; --mk-card:rgba(255,255,255,0.08);
    --mk-accent:#28d6cc; --mk-dark:#0f1b2f; --mk-danger:#ff7a7a;
    --mk-border:rgba(255,255,255,0.14);
    --mk-shadow:0 14px 28px rgba(0,0,0,0.45);
    --mk-shadow-strong:0 18px 34px rgba(0,0,0,0.60);
    --mk-soft:rgba(40,214,204,0.20);
    --mk-soft-border:rgba(40,214,204,0.35);
  }
  
  .content { color: var(--mk-text); }
  
  .bg{
    position: fixed; inset:0;
    background:
      radial-gradient(1200px 600px at 20% -10%, rgba(32,178,170,0.22), transparent 60%),
      radial-gradient(900px 500px at 90% 0%, rgba(24,42,68,0.18), transparent 55%),
      linear-gradient(to bottom, var(--mk-bg1), var(--mk-bg2));
    z-index:0;
  }
  
  .wrap{
    position: relative; z-index:1;
    padding: calc(env(safe-area-inset-top) + 22px) 16px 0;
    max-width: 720px; margin: 0 auto;
    transform: scale(var(--mk-fontScale, 1));
    transform-origin: top center;
  }
  
  .pageTitle{
    text-align:center;
    font-family:"Noto Kufi Arabic", system-ui, sans-serif;
    font-size: 30px;
    font-weight: 900;
    margin: 10px 0 14px;
    color: var(--mk-text);
  }
  
  .card{
    background: var(--mk-card);
    border-radius: 18px;
    border: 1px solid var(--mk-border);
    box-shadow: var(--mk-shadow);
    padding: 20px 18px;
  }
  
  .saintPage.theme-dark .card{ background: rgba(255,255,255,0.06); }
  
  .bigCard{ margin: 12px 0; }
  
  .text{
    font-family:"Noto Naskh Arabic", system-ui, sans-serif;
    font-size: 21px;
    line-height: 2;
    color: var(--mk-text);
  }
  .alignRight{ text-align:right; }
  
  .hint{
    margin-top: 12px;
    font-size: 14px;
    opacity: 0.8;
    text-align: center;
  }
  .space{ height: 24px; }
  </style>
  