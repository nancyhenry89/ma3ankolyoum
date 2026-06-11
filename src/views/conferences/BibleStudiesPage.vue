<template>
    <ion-page>
      <ion-header>
        <ion-toolbar>
          <ion-buttons slot="start">
            <ion-back-button :default-href="`/conference/${conferenceId}`" />
          </ion-buttons>
          <ion-title>دراسات الكتاب</ion-title>
        </ion-toolbar>
      </ion-header>
  
      <ion-content class="ion-padding bible-page" dir="rtl">
        <p v-if="loading">جاري التحميل...</p>
  
        <p v-else-if="studies.length === 0" class="empty">
          لا توجد دراسات كتاب لهذا المؤتمر.
        </p>
  
        <ion-card v-for="study in studies" :key="study.id">
          <ion-card-header>
            <ion-card-title>{{ study.title }}</ion-card-title>
            <ion-card-subtitle v-if="study.verses">
              {{ study.verses }}
            </ion-card-subtitle>
          </ion-card-header>
  
          <ion-card-content>
            <div
              v-if="study.rich_text"
              class="rich-text"
              v-html="safeHtml(study.rich_text)"
            />
  
            <div class="links">
              <ion-button
                v-if="study.pdf_url"
                expand="block"
                fill="outline"
                :href="study.pdf_url"
                target="_blank"
              >
                فتح ملف PDF
              </ion-button>
  
              <audio
                v-if="study.audio_url"
                class="audio"
                :src="study.audio_url"
                controls
                preload="none"
              />
            </div>
  
            <div class="notes-box">
              <h3>ملاحظاتي الخاصة</h3>
  
              <ion-textarea
                :value="notes[study.id] || ''"
                auto-grow
                placeholder="اكتب ملاحظاتك هنا..."
                @ionInput="notes[study.id] = String($event.detail.value || '')"
              />
  
              <ion-button expand="block" @click="saveNote(study.id)">
                حفظ الملاحظات
              </ion-button>
  
              <p v-if="savedStudyId === study.id" class="saved">
                تم الحفظ ✅
              </p>
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
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonButton,
    IonTextarea,
  } from '@ionic/vue'
  
  import { onMounted, ref } from 'vue'
  import { useRoute } from 'vue-router'
  import DOMPurify from 'dompurify'
  import { marked } from 'marked'
  
  import { fetchConferenceBibleStudies } from '@/services/sheets'
  
  const route = useRoute()
  const conferenceId = String(route.params.id || '')
  
  type BibleStudyItem = {
    conference_id: string
    id: string
    title: string
    verses: string
    rich_text: string
    pdf_url?: string
    audio_url?: string
  }
  
  const loading = ref(true)
  const studies = ref<BibleStudyItem[]>([])
  const notes = ref<Record<string, string>>({})
  const savedStudyId = ref('')
  
  onMounted(async () => {
    await loadStudies()
  })
  
  async function loadStudies() {
    loading.value = true
  
    try {
      const rows = await fetchConferenceBibleStudies(conferenceId, true)
  
      studies.value = rows.map((r: any) => ({
        conference_id: r.conference_id,
        id: r.id,
        title: r.title,
        verses: r.verses,
        rich_text: r.rich_text,
        pdf_url: r.pdf_url || '',
        audio_url: r.audio_url || '',
      }))
  
      studies.value.forEach((study) => {
        notes.value[study.id] = localStorage.getItem(noteKey(study.id)) || ''
      })
    } catch (e) {
      console.error('Failed to load Bible studies', e)
      studies.value = []
    } finally {
      loading.value = false
    }
  }
  
  function noteKey(studyId: string) {
    return `mk_conference_note_${conferenceId}_${studyId}`
  }
  
  function saveNote(studyId: string) {
    localStorage.setItem(noteKey(studyId), notes.value[studyId] || '')
    savedStudyId.value = studyId
  
    setTimeout(() => {
      if (savedStudyId.value === studyId) savedStudyId.value = ''
    }, 1500)
  }
  
  function safeHtml(value: string) {
    const raw = String(value || '')
  
    const html = raw.trim().startsWith('<')
      ? raw
      : String(marked.parse(raw, { breaks: true, gfm: true }))
  
    return DOMPurify.sanitize(html, {
      USE_PROFILES: { html: true },
    })
  }
  </script>
  
  <style scoped>
  .bible-page {
    --background: #f7f1e8;
  }
  
  .empty {
    text-align: center;
    margin-top: 40px;
    opacity: 0.7;
  }
  
  .rich-text {
    font-size: 16px;
    line-height: 1.9;
    color: #2d2418;
  }
  
  .rich-text :deep(h1),
  .rich-text :deep(h2),
  .rich-text :deep(h3) {
    color: #7a2d2d;
    font-weight: 900;
  }
  
  .rich-text :deep(p) {
    margin: 0 0 12px;
  }
  
  .rich-text :deep(strong),
  .rich-text :deep(b) {
    color: #8b2f2f;
  }
  
  .links {
    margin: 16px 0;
  }
  
  .audio {
    width: 100%;
    margin-top: 12px;
  }
  
  .notes-box {
    margin-top: 18px;
    padding: 14px;
    border-radius: 18px;
    background: #fff8ee;
    border: 1px solid rgba(80, 45, 20, 0.12);
  }
  
  .notes-box h3 {
    margin: 0 0 10px;
    color: #7a4b2a;
    font-size: 16px;
  }
  
  .saved {
    text-align: center;
    color: #2e7d32;
    font-weight: 800;
    margin-top: 8px;
  }
  </style>