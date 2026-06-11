<template>
    <ion-page>
      <ion-header>
        <ion-toolbar>
          <ion-buttons slot="start">
            <ion-back-button :default-href="`/conference/${conferenceId}`" />
          </ion-buttons>
  
          <ion-title>الأسئلة</ion-title>
        </ion-toolbar>
      </ion-header>
  
      <ion-content class="questions-page" dir="rtl">
        <div class="container">
          <!-- Ask Question -->
  
          <ion-card v-if="settings.allowQuestions">
            <ion-card-header>
              <ion-card-title>
                اسأل سؤالاً بدون اسم
              </ion-card-title>
            </ion-card-header>
  
            <ion-card-content>
              <ion-textarea
                v-model="newQuestion"
                auto-grow
                placeholder="اكتب سؤالك هنا..."
              />
  
              <ion-button
                expand="block"
                :disabled="submitting || !newQuestion.trim()"
                @click="submitQuestion"
              >
                إرسال السؤال
              </ion-button>
            </ion-card-content>
          </ion-card>
  
          <ion-card v-else>
            <ion-card-content>
              تم إغلاق استقبال الأسئلة حالياً.
            </ion-card-content>
          </ion-card>
  
          <!-- Questions -->
  
          <div
            v-for="question in questions"
            :key="question.id"
            class="question-box"
          >
            <div class="question-header">
              <div>
                <strong>
                  <span v-if="question.pinned">📌 </span>
                  سؤال بدون اسم
                </strong>
              </div>
  
              <div class="badges">
                <span
                  v-if="question.answered"
                  class="answered"
                >
                  تمت الإجابة
                </span>
              </div>
            </div>
  
            <p class="question-text">
              {{ question.text }}
            </p>
  
            <!-- Replies -->
  
            <div
              v-if="question.replies?.length"
              class="replies"
            >
              <div
                v-for="reply in question.replies"
                :key="reply.id"
                class="reply"
              >
                <strong>رد بدون اسم</strong>
  
                <p>{{ reply.text }}</p>
              </div>
            </div>
  
            <!-- Add Reply -->
  
            <div
              v-if="settings.allowReplies"
              class="reply-form"
            >
              <ion-textarea
                v-model="replyTexts[question.id]"
                auto-grow
                placeholder="اكتب رداً..."
              />
  
              <ion-button
                size="small"
                @click="submitReply(question.id)"
              >
                إرسال الرد
              </ion-button>
            </div>
          </div>
        </div>
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
    IonTextarea,
    IonButton,
  } from '@ionic/vue'
  
  import { ref, onMounted, onBeforeUnmount } from 'vue'
  import { useRoute } from 'vue-router'
  
  import {
    collection,
    addDoc,
    serverTimestamp,
    query,
    where,
    orderBy,
    onSnapshot,
    doc,
  } from 'firebase/firestore'
  
  import {
    db,
    ensureAnonAuth,
  } from '@/lib/firebase'
  
  const route = useRoute()
  
  const conferenceId = String(route.params.id || '')
  
  const newQuestion = ref('')
  const submitting = ref(false)
  
  const questions = ref<any[]>([])
  const replyTexts = ref<Record<string, string>>({})
  
  const settings = ref({
    allowQuestions: true,
    allowReplies: true,
  })
  
  let unsubQuestions: any = null
  let unsubSettings: any = null
  let replyUnsubs: any[] = []
  
  onMounted(async () => {
    await ensureAnonAuth()
  
    listenSettings()
    listenQuestions()
  })
  
  onBeforeUnmount(() => {
    unsubQuestions?.()
    unsubSettings?.()
  
    replyUnsubs.forEach((x) => x())
  })
  
  function listenSettings() {
    unsubSettings = onSnapshot(
      doc(
        db,
        'conferences',
        conferenceId,
        'settings',
        'main'
      ),
      (snap) => {
        if (!snap.exists()) return
  
        const data = snap.data()
  
        settings.value = {
          allowQuestions:
            data.allowQuestions !== false,
  
          allowReplies:
            data.allowReplies !== false,
        }
      }
    )
  }
  
  function listenQuestions() {
    const q = query(
      collection(
        db,
        'conferences',
        conferenceId,
        'questions'
      ),
      where('deleted', '==', false),
      orderBy('pinned', 'desc'),
      orderBy('createdAt', 'desc')
    )
  
    unsubQuestions = onSnapshot(q, (snap) => {
      replyUnsubs.forEach((x) => x())
      replyUnsubs = []
  
      questions.value = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        replies: [],
      }))
  
      questions.value.forEach((q) => {
        listenReplies(q.id)
      })
    })
  }
  
  function listenReplies(questionId: string) {
    const q = query(
      collection(
        db,
        'conferences',
        conferenceId,
        'questions',
        questionId,
        'replies'
      ),
      where('deleted', '==', false),
      orderBy('createdAt', 'asc')
    )
  
    const unsub = onSnapshot(q, (snap) => {
      const target = questions.value.find(
        (x) => x.id === questionId
      )
  
      if (!target) return
  
      target.replies = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }))
    })
  
    replyUnsubs.push(unsub)
  }
  
  async function submitQuestion() {
    if (!newQuestion.value.trim()) return
  
    submitting.value = true
  
    try {
      const user = await ensureAnonAuth()
  
      await addDoc(
        collection(
          db,
          'conferences',
          conferenceId,
          'questions'
        ),
        {
          text: newQuestion.value.trim(),
          authorId: user?.uid || '',
          anonymous: true,
          pinned: false,
          answered: false,
          deleted: false,
          createdAt: serverTimestamp(),
        }
      )
  
      newQuestion.value = ''
    } finally {
      submitting.value = false
    }
  }
  
  async function submitReply(
    questionId: string
  ) {
    const text =
      replyTexts.value[questionId]?.trim()
  
    if (!text) return
  
    const user = await ensureAnonAuth()
  
    await addDoc(
      collection(
        db,
        'conferences',
        conferenceId,
        'questions',
        questionId,
        'replies'
      ),
      {
        text,
        authorId: user?.uid || '',
        anonymous: true,
        deleted: false,
        createdAt: serverTimestamp(),
      }
    )
  
    replyTexts.value[questionId] = ''
  }
  </script>
  
  <style scoped>
  .questions-page {
    --background: #f7f1e8;
  }
  
  .container {
    padding: 12px;
  }
  
  .question-box {
    background: white;
    border-radius: 18px;
    padding: 14px;
    margin-bottom: 14px;
    box-shadow: 0 2px 10px rgba(0,0,0,.06);
  }
  
  .question-header {
    display: flex;
    justify-content: space-between;
  }
  
  .question-text {
    margin-top: 10px;
    line-height: 1.8;
  }
  
  .replies {
    margin-top: 14px;
  }
  
  .reply {
    background: #faf6ef;
    border-radius: 12px;
    padding: 10px;
    margin-bottom: 8px;
  }
  
  .reply-form {
    margin-top: 12px;
  }
  
  .answered {
    background: #dff3df;
    color: #236423;
    padding: 4px 8px;
    border-radius: 999px;
    font-size: 12px;
  }
  </style>