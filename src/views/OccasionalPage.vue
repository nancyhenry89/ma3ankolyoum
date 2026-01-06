<template>
    <ion-page>
      <ion-header>
        <ion-toolbar>
          <ion-buttons slot="start">
            <ion-back-button default-href="/" />
          </ion-buttons>
          <ion-title>{{ pageTitle }}</ion-title>

        </ion-toolbar>
      </ion-header>
  
      <ion-content class="ion-padding">
        <div class="card">
  <audio
    ref="audioRef"
    :src="audioUrl"
    controls
    playsinline
    preload="metadata"
    style="width: 100%;"
  />

  <p v-if="errorMsg" style="margin-top:12px; opacity:.8;">
    {{ errorMsg }}
  </p>

  <div v-if="dataHtml" class="md" style="margin-top:20px;text-align:center;font-weight: bold;font-family: Noto Kufi Arabic,system-ui,sans-serif;" v-html="dataHtml"></div>
</div>

      </ion-content>
    </ion-page>
  </template>
  
  <script setup lang="ts">
  import {
    IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton
  } from '@ionic/vue'
  import { computed, ref, onMounted } from 'vue'
  import { useRoute } from 'vue-router'
  import { Capacitor } from '@capacitor/core'
  import { marked } from 'marked'
  import DOMPurify from 'dompurify'
  
  const route = useRoute()
  const audioRef = ref<HTMLAudioElement | null>(null)
  const errorMsg = ref('')
  
  const APP_BASE_URL = new URL(import.meta.env.BASE_URL, window.location.origin).toString()
  const CONTENT_BASE = Capacitor.isNativePlatform()
    ? 'https://nancyhenry89.github.io/ma3ankolyoum/content'
    : new URL('content', APP_BASE_URL).toString().replace(/\/$/, '')
  
  const fileRaw = computed(() => decodeURIComponent(String(route.params.file || '')).trim())
  const dataRaw = computed(() => String(route.query.data || '').trim())

const dataHtml = computed(() => {
  if (!dataRaw.value) return ''
  const html = marked.parse(dataRaw.value, { breaks: true, gfm: true })
  return DOMPurify.sanitize(String(html), { USE_PROFILES: { html: true } })
})
  function ensureExt(name: string) {
    // لو الشيت بيدي اسم بدون امتداد هنفترض mp3
    if (/\.(mp3|m4a|wav|ogg)$/i.test(name)) return name
    return `${name}.mp3`
  }
  
  const audioUrl = computed(() => {
    const file = ensureExt(fileRaw.value)
    // غير المسار هنا لو أنت مخزنهم في فولدر تاني
    return `${CONTENT_BASE}/occasional/${encodeURIComponent(file)}`
  })
  const pageTitle = computed(() => {
  const t = String(route.query.title || '').trim()
  return t || 'Occasional'
})

  // optional: show text passed via query (?t=...)
  const textRaw = computed(() => String(route.query.t || '').trim())
  const textHtml = computed(() => {
    if (!textRaw.value) return ''
    const html = marked.parse(textRaw.value, { breaks: true, gfm: true })
    return DOMPurify.sanitize(String(html), { USE_PROFILES: { html: true } })
  })
  
  onMounted(async () => {
    // حاول تشغيله تلقائيًا (قد يُمنع على iOS بدون تفاعل)
    try { await audioRef.value?.play() } catch {}
  })
  </script>
  