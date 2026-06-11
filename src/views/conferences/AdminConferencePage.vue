<template>
    <ion-page>
      <ion-header>
        <ion-toolbar>
          <ion-title>إدارة المؤتمر</ion-title>
          <ion-buttons slot="start">
            <ion-back-button default-href="/conferences" />
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
  
      <ion-content class="ion-padding admin-page" dir="rtl">
        <ion-card>
          <ion-card-header>
            <ion-card-title>إعدادات الأسئلة</ion-card-title>
          </ion-card-header>
  
          <ion-card-content>
            <ion-item>
              <ion-label>السماح بالأسئلة</ion-label>
              <ion-toggle
                :checked="settings.allowQuestions"
                @ionChange="setSetting('allowQuestions', $event.detail.checked)"
              />
            </ion-item>
  
            <ion-item>
              <ion-label>السماح بالردود</ion-label>
              <ion-toggle
                :checked="settings.allowReplies"
                @ionChange="setSetting('allowReplies', $event.detail.checked)"
              />
            </ion-item>
          </ion-card-content>
        </ion-card>
  
        <ion-card>
          <ion-card-header>
            <ion-card-title>الأسئلة</ion-card-title>
          </ion-card-header>
  
          <ion-card-content>
            <p v-if="loading">جاري التحميل...</p>
            <p v-else-if="questions.length === 0">لا توجد أسئلة بعد.</p>
  
            <div v-for="q in questions" :key="q.id" class="question-box">
              <div class="q-top">
                <strong>
                  <span v-if="q.pinned">📌</span>
                  سؤال بدون اسم
                </strong>
  
                <small>{{ formatDate(q.createdAt) }}</small>
              </div>
  
              <p class="q-text">{{ q.text }}</p>
  
              <div class="actions">
                <ion-button size="small" fill="outline" @click="togglePin(q)">
                  {{ q.pinned ? 'إلغاء التثبيت' : 'تثبيت' }}
                </ion-button>
  
                <ion-button size="small" fill="outline" @click="toggleAnswered(q)">
                  {{ q.answered ? 'إلغاء الإجابة' : 'تمت الإجابة' }}
                </ion-button>
  
                <ion-button size="small" color="danger" fill="outline" @click="deleteQuestion(q.id)">
                  حذف
                </ion-button>
              </div>
  
              <div class="replies">
                <h4>الردود</h4>
  
                <p v-if="!q.replies?.length" class="muted">لا توجد ردود.</p>
  
                <div v-for="r in q.replies" :key="r.id" class="reply-box">
                  <div>
                    <strong>رد بدون اسم</strong>
                    <p>{{ r.text }}</p>
                    <small>{{ formatDate(r.createdAt) }}</small>
                  </div>
  
                  <ion-button
                    size="small"
                    color="danger"
                    fill="clear"
                    @click="deleteReply(q.id, r.id)"
                  >
                    حذف
                  </ion-button>
                </div>
              </div>
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
    IonCardContent,
    IonItem,
    IonLabel,
    IonToggle,
    IonButton,
  } from '@ionic/vue'
  
  import { onMounted, onBeforeUnmount, ref } from 'vue'
  import { useRoute } from 'vue-router'
  import {
    collection,
    doc,
    onSnapshot,
    orderBy,
    query,
    setDoc,
    updateDoc,
    where,
  } from 'firebase/firestore'
  
  import { db, ensureAnonAuth } from '@/lib/firebase'
  
  const route = useRoute()
  const conferenceId = String(route.params.id || '')
  
  const loading = ref(true)
  
  const settings = ref({
    allowQuestions: true,
    allowReplies: true,
  })
  
  type ReplyItem = {
    id: string
    text: string
    createdAt?: any
    deleted?: boolean
  }
  
  type QuestionItem = {
    id: string
    text: string
    pinned: boolean
    answered: boolean
    createdAt?: any
    deleted?: boolean
    replies?: ReplyItem[]
  }
  
  const questions = ref<QuestionItem[]>([])
  
  let unsubSettings: null | (() => void) = null
  let unsubQuestions: null | (() => void) = null
  let replyUnsubs: Array<() => void> = []
  
  onMounted(async () => {
    await ensureAnonAuth()
    listenSettings()
    listenQuestions()
  })
  
  onBeforeUnmount(() => {
    unsubSettings?.()
    unsubQuestions?.()
    replyUnsubs.forEach((fn) => fn())
  })
  
  function listenSettings() {
    const refDoc = doc(db, 'conferences', conferenceId, 'settings', 'main')
  
    unsubSettings = onSnapshot(refDoc, (snap) => {
      if (!snap.exists()) return
  
      const data = snap.data()
  
      settings.value = {
        allowQuestions: data.allowQuestions !== false,
        allowReplies: data.allowReplies !== false,
      }
    })
  }
  
  async function setSetting(key: 'allowQuestions' | 'allowReplies', value: boolean) {
    settings.value[key] = value
  
    await setDoc(
      doc(db, 'conferences', conferenceId, 'settings', 'main'),
      {
        [key]: value,
      },
      { merge: true }
    )
  }
  
  function listenQuestions() {
    const q = query(
      collection(db, 'conferences', conferenceId, 'questions'),
      where('deleted', '==', false),
      orderBy('pinned', 'desc'),
      orderBy('createdAt', 'desc')
    )
  
    unsubQuestions = onSnapshot(q, (snap) => {
      loading.value = false
  
      replyUnsubs.forEach((fn) => fn())
      replyUnsubs = []
  
      questions.value = snap.docs.map((d) => ({
        id: d.id,
        text: String(d.data().text || ''),
        pinned: !!d.data().pinned,
        answered: !!d.data().answered,
        createdAt: d.data().createdAt,
        replies: [],
      }))
  
      questions.value.forEach((question) => {
        listenReplies(question.id)
      })
    })
  }
  
  function listenReplies(questionId: string) {
    const q = query(
      collection(db, 'conferences', conferenceId, 'questions', questionId, 'replies'),
      where('deleted', '==', false),
      orderBy('createdAt', 'asc')
    )
  
    const unsub = onSnapshot(q, (snap) => {
      const item = questions.value.find((x) => x.id === questionId)
      if (!item) return
  
      item.replies = snap.docs.map((d) => ({
        id: d.id,
        text: String(d.data().text || ''),
        createdAt: d.data().createdAt,
        deleted: !!d.data().deleted,
      }))
    })
  
    replyUnsubs.push(unsub)
  }
  
  async function togglePin(q: QuestionItem) {
    await updateDoc(doc(db, 'conferences', conferenceId, 'questions', q.id), {
      pinned: !q.pinned,
    })
  }
  
  async function toggleAnswered(q: QuestionItem) {
    await updateDoc(doc(db, 'conferences', conferenceId, 'questions', q.id), {
      answered: !q.answered,
    })
  }
  
  async function deleteQuestion(questionId: string) {
    if (!confirm('هل تريد حذف هذا السؤال؟')) return
  
    await updateDoc(doc(db, 'conferences', conferenceId, 'questions', questionId), {
      deleted: true,
    })
  }
  
  async function deleteReply(questionId: string, replyId: string) {
    if (!confirm('هل تريد حذف هذا الرد؟')) return
  
    await updateDoc(
      doc(db, 'conferences', conferenceId, 'questions', questionId, 'replies', replyId),
      {
        deleted: true,
      }
    )
  }
  
  function formatDate(value: any) {
    try {
      const d = value?.toDate ? value.toDate() : null
      if (!d) return ''
      return d.toLocaleString('ar-EG')
    } catch {
      return ''
    }
  }
  </script>
  
  <style scoped>
  .admin-page {
    --background: #f7f1e8;
  }
  
  .question-box {
    background: #fff;
    border: 1px solid rgba(80, 45, 20, 0.12);
    border-radius: 18px;
    padding: 14px;
    margin-bottom: 16px;
  }
  
  .q-top {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    color: #5b3822;
  }
  
  .q-text {
    font-size: 16px;
    line-height: 1.8;
    margin: 12px 0;
  }
  
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 14px;
  }
  
  .replies {
    border-top: 1px dashed rgba(80, 45, 20, 0.2);
    padding-top: 12px;
  }
  
  .replies h4 {
    margin: 0 0 10px;
    font-size: 15px;
    color: #7a4b2a;
  }
  
  .reply-box {
    background: #faf6ef;
    border-radius: 14px;
    padding: 10px;
    margin-bottom: 8px;
    display: flex;
    justify-content: space-between;
    gap: 8px;
  }
  
  .reply-box p {
    margin: 6px 0;
  }
  
  .muted {
    opacity: 0.65;
  }
  </style>