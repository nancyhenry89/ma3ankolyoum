<template>
    <ion-page>
      <ion-header>
        <ion-toolbar>
          <ion-buttons slot="start">
            <ion-back-button default-href="/tabs/home" />
          </ion-buttons>
  
          <ion-title>الانضمام لمؤتمر</ion-title>
        </ion-toolbar>
      </ion-header>
  
      <ion-content class="ion-padding join-page" dir="rtl">
        <div class="join-card">
          <div class="icon">🎟️</div>
  
          <h1>ادخل بيانات المؤتمر</h1>
  
          <p>
            اكتب كود المؤتمر وكلمة المرور التي حصلت عليها من المسؤول.
          </p>
  
          <ion-item>
            <ion-label position="stacked">كود المؤتمر</ion-label>
            <ion-input
              v-model="code"
              placeholder="مثال: YOUTH2026"
              autocapitalize="characters"
            />
          </ion-item>
  
          <ion-item>
            <ion-label position="stacked">كلمة المرور</ion-label>
            <ion-input
              v-model="password"
              type="password"
              placeholder="كلمة المرور"
            />
          </ion-item>
  
          <ion-button
            expand="block"
            class="join-btn"
            :disabled="loading || !code.trim() || !password.trim()"
            @click="join"
          >
            {{ loading ? 'جاري التحقق...' : 'دخول المؤتمر' }}
          </ion-button>
  
          <p v-if="errorMsg" class="error">
            {{ errorMsg }}
          </p>
  
          <p v-if="successMsg" class="success">
            {{ successMsg }}
          </p>
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
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
  } from '@ionic/vue'
  
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
  
  import { db, ensureAnonAuth } from '@/lib/firebase'
  import { findConferenceByAccess } from '@/services/sheets'
  import { saveLocalJoinedConference } from '@/services/conferenceLocal'
  
  const router = useRouter()
  
  const code = ref('')
  const password = ref('')
  const loading = ref(false)
  const errorMsg = ref('')
  const successMsg = ref('')
  
  async function join() {
    errorMsg.value = ''
    successMsg.value = ''
    loading.value = true
  
    try {
      const user = await ensureAnonAuth()
  
      if (!user) {
        throw new Error('تعذر تسجيل الدخول مؤقتًا. جربي مرة أخرى.')
      }
  
      const conference = await findConferenceByAccess(code.value, password.value)
  
      if (!conference) {
        throw new Error('كود المؤتمر أو كلمة المرور غير صحيحة.')
      }
  
      saveLocalJoinedConference(conference.conference_id)
  
      await setDoc(
        doc(db, 'users', user.uid, 'joinedConferences', conference.conference_id),
        {
          conferenceId: conference.conference_id,
          title: conference.title,
          joinedAt: serverTimestamp(),
          lastOpenedAt: serverTimestamp(),
        },
        { merge: true }
      )
  
      successMsg.value = 'تم الانضمام للمؤتمر ✅'
  
      setTimeout(() => {
        router.replace(`/conference/${conference.conference_id}`)
      }, 500)
    } catch (e: any) {
      console.error(e)
      errorMsg.value = e?.message || 'حدث خطأ أثناء الانضمام للمؤتمر.'
    } finally {
      loading.value = false
    }
  }
  </script>
  
  <style scoped>
  .join-page {
    --background: #f7f1e8;
  }
  
  .join-card {
    max-width: 520px;
    margin: 40px auto 0;
    background: white;
    border-radius: 24px;
    padding: 24px 18px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
    text-align: center;
  }
  
  .icon {
    font-size: 46px;
    margin-bottom: 8px;
  }
  
  h1 {
    margin: 0 0 8px;
    color: #5b3822;
    font-size: 22px;
    font-weight: 900;
  }
  
  p {
    color: #6f5a46;
    line-height: 1.8;
  }
  
  ion-item {
    --background: #fff8ee;
    --border-radius: 16px;
    --padding-start: 12px;
    --inner-padding-end: 12px;
    margin-top: 14px;
    border-radius: 16px;
  }
  
  .join-btn {
    margin-top: 20px;
    --background: #8b2f2f;
    --border-radius: 999px;
    font-weight: 900;
  }
  
  .error {
    color: #b00020;
    font-weight: 800;
    margin-top: 14px;
  }
  
  .success {
    color: #2e7d32;
    font-weight: 800;
    margin-top: 14px;
  }
  </style>