<template>
    <ion-page>
      <ion-header class="mk-header">
        <ion-toolbar>
          <ion-buttons slot="start">
            <ion-back-button default-href="/tabs/home" />
          </ion-buttons>
  
          <ion-title>مؤتمراتي</ion-title>
  
          <ion-buttons slot="end">
            <ion-button class="add-btn" @click="goJoin">
              +
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
  
      <ion-content class="conferences-page" dir="rtl">
        <div class="page-wrap">
          <p v-if="loading" class="center">جاري التحميل...</p>
  
          <template v-else>
            <div class="hero">
              <div>
                <div class="eyebrow">مساحتك الخاصة</div>
                <h1>مؤتمراتي</h1>
                <p>كل المؤتمرات التي انضممتِ إليها، الحالية والسابقة، في مكان واحد.</p>
              </div>
  
              <button class="hero-add" type="button" @click="goJoin">
                + انضمام
              </button>
            </div>
  
            <section v-if="currentConferences.length">
              <div class="section-head">
                <h2>المؤتمر الحالي</h2>
                <span>{{ currentConferences.length }}</span>
              </div>
  
              <div
                v-for="conf in currentConferences"
                :key="conf.conference_id"
                class="conf-card live-card"
                @click="openConference(conf.conference_id)"
              >
                <div class="logo-wrap">
                  <img v-if="conf.logo_url" :src="conf.logo_url" class="logo" />
                  <div v-else class="logo fallback-logo">✨</div>
                </div>
  
                <div class="conf-info">
                  <div class="top-line">
                    <h3>{{ conf.title }}</h3>
                    <span class="badge live">جاري الآن</span>
                  </div>
  
                  <p v-if="conf.subtitle">{{ conf.subtitle }}</p>
  
                  <div class="dates">
                    <span v-if="conf.start_date">من {{ conf.start_date }}</span>
                    <span v-if="conf.end_date">إلى {{ conf.end_date }}</span>
                  </div>
                </div>
  
                <div class="arrow">‹</div>
              </div>
            </section>
  
            <section v-if="upcomingConferences.length">
              <div class="section-head">
                <h2>مؤتمرات قادمة</h2>
                <span>{{ upcomingConferences.length }}</span>
              </div>
  
              <div
                v-for="conf in upcomingConferences"
                :key="conf.conference_id"
                class="conf-card"
                @click="openConference(conf.conference_id)"
              >
                <div class="logo-wrap">
                  <img v-if="conf.logo_url" :src="conf.logo_url" class="logo" />
                  <div v-else class="logo fallback-logo">🎟️</div>
                </div>
  
                <div class="conf-info">
                  <div class="top-line">
                    <h3>{{ conf.title }}</h3>
                    <span class="badge upcoming">قادم</span>
                  </div>
  
                  <p v-if="conf.subtitle">{{ conf.subtitle }}</p>
  
                  <div class="dates">
                    <span v-if="conf.start_date">من {{ conf.start_date }}</span>
                    <span v-if="conf.end_date">إلى {{ conf.end_date }}</span>
                  </div>
                </div>
  
                <div class="arrow">‹</div>
              </div>
            </section>
  
            <section v-if="pastConferences.length">
              <div class="section-head">
                <h2>مؤتمرات حضرتها</h2>
                <span>{{ pastConferences.length }}</span>
              </div>
  
              <div
                v-for="conf in pastConferences"
                :key="conf.conference_id"
                class="conf-card past-card"
                @click="openConference(conf.conference_id)"
              >
                <div class="logo-wrap">
                  <img v-if="conf.logo_url" :src="conf.logo_url" class="logo" />
                  <div v-else class="logo fallback-logo">📚</div>
                </div>
  
                <div class="conf-info">
                  <div class="top-line">
                    <h3>{{ conf.title }}</h3>
                    <span class="badge ended">
                      {{ conf.status === 'archived' ? 'أرشيف' : 'انتهى' }}
                    </span>
                  </div>
  
                  <p v-if="conf.subtitle">{{ conf.subtitle }}</p>
  
                  <div class="dates">
                    <span v-if="conf.start_date">من {{ conf.start_date }}</span>
                    <span v-if="conf.end_date">إلى {{ conf.end_date }}</span>
                  </div>
                </div>
  
                <div class="arrow">‹</div>
              </div>
            </section>
  
            <div v-if="!joinedConferences.length" class="empty">
              <div class="empty-icon">🎟️</div>
              <h2>لم تنضمي لأي مؤتمر بعد</h2>
              <p>اضغطي على زر الانضمام وأدخلي كود المؤتمر وكلمة المرور.</p>
  
              <ion-button expand="block" class="join-btn" @click="goJoin">
                الانضمام لمؤتمر
              </ion-button>
            </div>
          </template>
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
    IonButton,
    IonContent,
  } from '@ionic/vue'
  
  import { computed, onMounted, ref } from 'vue'
  import { useRouter } from 'vue-router'
  
  import {
    fetchConferences,
    type ConferenceRow,
  } from '@/services/sheets'
  
  import {
    getLocalJoinedConferences,
  } from '@/services/conferenceLocal'
  
  const router = useRouter()
  
  const loading = ref(true)
  const joinedIds = ref<string[]>([])
  const joinedConferences = ref<ConferenceRow[]>([])
  
  onMounted(async () => {
    await load()
  })
  
  async function load() {
    loading.value = true
  
    try {
      joinedIds.value = getLocalJoinedConferences()
  
      const all = await fetchConferences(true)
  
      joinedConferences.value = all.filter((conf) =>
        joinedIds.value.includes(conf.conference_id)
      )
    } catch (e) {
      console.error('Failed to load conferences', e)
      joinedConferences.value = []
    } finally {
      loading.value = false
    }
  }
  
  const currentConferences = computed(() =>
    joinedConferences.value.filter((c) => c.status === 'live')
  )
  
  const upcomingConferences = computed(() =>
    joinedConferences.value.filter((c) => c.status === 'upcoming')
  )
  
  const pastConferences = computed(() =>
    joinedConferences.value.filter(
      (c) => c.status === 'ended' || c.status === 'archived'
    )
  )
  
  function openConference(id: string) {
    router.push(`/conference/${id}`)
  }
  
  function goJoin() {
    router.push('/conferences/join')
  }
  </script>
  
  <style scoped>
  .mk-header ion-toolbar {
    --background: #0f172a;
    --color: #f8fafc;
  }
  
  .add-btn {
    --color: #f8fafc;
    font-weight: 950;
    font-size: 22px;
  }
  
  .conferences-page {
    --background: #f6fbff;
  }
  
  .page-wrap {
    padding: 16px;
    max-width: 760px;
    margin: 0 auto;
  }
  
  .center {
    text-align: center;
    padding: 48px 0;
    color: #334155;
    font-weight: 800;
  }
  
  .hero {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 14px;
    background:
      radial-gradient(circle at top left, rgba(14, 165, 233, .22), transparent 38%),
      linear-gradient(135deg, #ffffff 0%, #e0f2fe 100%);
    border: 1px solid rgba(14, 116, 144, .16);
    border-radius: 30px;
    padding: 20px;
    margin-bottom: 22px;
    box-shadow: 0 16px 35px rgba(15, 23, 42, .10);
  }
  
  .eyebrow {
    color: #0284c7;
    font-weight: 950;
    font-size: 13px;
    margin-bottom: 4px;
  }
  
  .hero h1 {
    margin: 0;
    color: #0f172a;
    font-size: 26px;
    font-weight: 950;
  }
  
  .hero p {
    margin: 8px 0 0;
    color: #334155;
    line-height: 1.7;
    font-weight: 700;
  }
  
  .hero-add {
    border: 0;
    border-radius: 999px;
    background: #0891b2;
    color: white;
    padding: 9px 14px;
    font-weight: 950;
    box-shadow: 0 8px 20px rgba(8, 145, 178, .22);
    white-space: nowrap;
  }
  
  section {
    margin-bottom: 26px;
  }
  
  .section-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 0 4px 12px;
  }
  
  .section-head h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 950;
    color: #0f172a;
  }
  
  .section-head span {
    min-width: 26px;
    height: 26px;
    border-radius: 999px;
    background: #e0f2fe;
    color: #0369a1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-weight: 950;
    font-size: 12px;
  }
  
  .conf-card {
    display: flex;
    align-items: center;
    gap: 13px;
    background: white;
    border-radius: 24px;
    padding: 14px;
    margin-bottom: 12px;
    border: 1px solid rgba(15, 23, 42, .08);
    box-shadow: 0 8px 22px rgba(15, 23, 42, .06);
  }
  
  .conf-card.live-card {
    background: #ecfeff;
    border: 2px solid #0891b2;
    box-shadow: 0 14px 32px rgba(8, 145, 178, .16);
  }
  
  .conf-card.past-card {
    opacity: .88;
  }
  
  .logo-wrap {
    flex-shrink: 0;
  }
  
  .logo {
    width: 66px;
    height: 66px;
    object-fit: contain;
    border-radius: 18px;
    background: #ffffff;
    padding: 7px;
    box-shadow: 0 5px 14px rgba(15, 23, 42, .07);
  }
  
  .fallback-logo {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
  }
  
  .conf-info {
    flex: 1;
    min-width: 0;
  }
  
  .top-line {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px;
  }
  
  .conf-info h3 {
    margin: 0 0 5px;
    color: #0f172a;
    font-size: 17px;
    font-weight: 950;
    line-height: 1.4;
  }
  
  .conf-info p {
    margin: 0 0 8px;
    color: #334155;
    font-size: 14px;
    line-height: 1.6;
    font-weight: 700;
  }
  
  .dates {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  
  .dates span {
    background: #f8fafc;
    color: #475569;
    border-radius: 999px;
    padding: 4px 9px;
    font-size: 11px;
    font-weight: 800;
  }
  
  .live-card .dates span {
    background: white;
  }
  
  .badge {
    flex-shrink: 0;
    display: inline-block;
    border-radius: 999px;
    padding: 4px 9px;
    font-size: 11px;
    font-weight: 950;
  }
  
  .badge.live {
    background: #0891b2;
    color: white;
  }
  
  .badge.upcoming {
    background: #dbeafe;
    color: #1d4ed8;
  }
  
  .badge.ended {
    background: #e2e8f0;
    color: #475569;
  }
  
  .arrow {
    color: #94a3b8;
    font-size: 30px;
    font-weight: 300;
  }
  
  .empty {
    text-align: center;
    padding: 42px 12px;
    background: white;
    border-radius: 28px;
    border: 1px solid rgba(15, 23, 42, .08);
    box-shadow: 0 8px 22px rgba(15, 23, 42, .06);
  }
  
  .empty-icon {
    font-size: 52px;
    margin-bottom: 12px;
  }
  
  .empty h2 {
    margin: 0 0 8px;
    color: #0f172a;
    font-weight: 950;
  }
  
  .empty p {
    color: #475569;
    line-height: 1.7;
    font-weight: 700;
  }
  
  .join-btn {
    margin-top: 14px;
    --background: #0891b2;
    --border-radius: 999px;
    font-weight: 950;
  }
  
  .conf-card:active,
  .hero-add:active {
    transform: scale(.985);
  }
  
  @media (max-width: 390px) {
    .page-wrap {
      padding: 13px;
    }
  
    .hero {
      flex-direction: column;
    }
  
    .hero-add {
      width: 100%;
    }
  
    .conf-card {
      gap: 10px;
      padding: 12px;
    }
  
    .logo {
      width: 58px;
      height: 58px;
    }
  
    .arrow {
      display: none;
    }
  }
  </style>