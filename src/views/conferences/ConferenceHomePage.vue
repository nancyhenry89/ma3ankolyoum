<template>
    <ion-page>
      <ion-header class="mk-header">
        <ion-toolbar>
          <ion-buttons slot="start">
            <ion-back-button default-href="/conferences" />
          </ion-buttons>
  
          <ion-title>{{ conference?.title || 'المؤتمر' }}</ion-title>
        </ion-toolbar>
      </ion-header>
  
      <ion-content class="conference-home" dir="rtl">
        <div class="page-wrap">
          <div v-if="loading" class="loading">
            جاري التحميل...
          </div>
  
          <template v-else-if="conference">
            <div class="hero">
              <div class="hero-bg"></div>
  
              <img
                v-if="conference.logo_url"
                :src="conference.logo_url"
                class="logo"
              />
  
              <div v-else class="logo fallback-logo">
                ✨
              </div>
  
              <div class="hero-content">
                <div class="eyebrow">مساحة المؤتمر</div>
  
                <h1>{{ conference.title }}</h1>
  
                <p v-if="conference.subtitle">
                  {{ conference.subtitle }}
                </p>
  
                <div class="status" :class="conference.status">
                  {{ statusLabel }}
                </div>
              </div>
            </div>
  
            <div class="quick-card">
              <div>
                <span class="quick-label">الحالة</span>
                <strong>{{ statusLabel }}</strong>
              </div>
  
              <div v-if="conference.start_date">
                <span class="quick-label">البداية</span>
                <strong>{{ conference.start_date }}</strong>
              </div>
  
              <div v-if="conference.end_date">
                <span class="quick-label">النهاية</span>
                <strong>{{ conference.end_date }}</strong>
              </div>
            </div>
  
            <div class="section-title">
              <h2>محتوى المؤتمر</h2>
              <span>اختاري القسم</span>
            </div>
  
            <div class="grid">
              <button class="menu-card primary" @click="go('/schedule')">
                <span class="icon">🗓️</span>
                <span class="title">البرنامج</span>
                <span class="sub">مواعيد اليوم والأنشطة</span>
              </button>
  
              <button class="menu-card" @click="go('/announcements')">
                <span class="icon">📢</span>
                <span class="title">الإعلانات</span>
                <span class="sub">آخر التنبيهات المهمة</span>
              </button>
  
              <button class="menu-card" @click="go('/bible-studies')">
                <span class="icon">📖</span>
                <span class="title">دراسات الكتاب</span>
                <span class="sub">الآيات والملاحظات</span>
              </button>
  
              <button class="menu-card" @click="go('/questions')">
                <span class="icon">❓</span>
                <span class="title">الأسئلة</span>
                <span class="sub">اسألي بدون اسم</span>
              </button>
  
              <button class="menu-card" @click="go('/quotes')">
                <span class="icon">💬</span>
                <span class="title">اقتباسات</span>
                <span class="sub">أقوال ومعاني قصيرة</span>
              </button>
  
              <button class="menu-card" @click="go('/recordings')">
                <span class="icon">🎧</span>
                <span class="title">التسجيلات</span>
                <span class="sub">محاضرات صوتية</span>
              </button>
  
              <button class="menu-card" @click="go('/links')">
                <span class="icon">🔗</span>
                <span class="title">المصادر</span>
                <span class="sub">ملفات وروابط مهمة</span>
              </button>
  
              <button class="menu-card" @click="go('/my-notes')">
                <span class="icon">📝</span>
                <span class="title">ملاحظاتي</span>
                <span class="sub">كل ملاحظاتك الخاصة</span>
              </button>
            </div>
          </template>
  
          <div v-else class="loading">
            المؤتمر غير موجود
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
  } from '@ionic/vue'
  
  import { computed, onMounted, ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  
  import { fetchConferences } from '@/services/sheets'
  
  const route = useRoute()
  const router = useRouter()
  
  const conferenceId = String(route.params.id || '')
  
  const loading = ref(true)
  const conference = ref<any>(null)
  
  const statusLabel = computed(() => {
    const status = conference.value?.status
  
    switch (status) {
      case 'live':
        return 'جاري الآن'
      case 'upcoming':
        return 'قادم'
      case 'ended':
        return 'انتهى'
      case 'archived':
        return 'أرشيف'
      default:
        return status || ''
    }
  })
  
  onMounted(async () => {
    try {
      const all = await fetchConferences()
  
      conference.value =
        all.find((c) => c.conference_id === conferenceId) || null
    } catch (e) {
      console.error(e)
    } finally {
      loading.value = false
    }
  })
  
  function go(path: string) {
    router.push(`/conference/${conferenceId}${path}`)
  }
  </script>
  
  <style scoped>
  .mk-header ion-toolbar {
    --background: #0f172a;
    --color: #f8fafc;
  }
  
  .conference-home {
    --background: #f6fbff;
  }
  
  .page-wrap {
    padding: 16px;
    max-width: 760px;
    margin: 0 auto;
  }
  
  .loading {
    text-align: center;
    padding: 48px 0;
    color: #334155;
    font-weight: 800;
  }
  
  .hero {
    position: relative;
    overflow: hidden;
    border-radius: 30px;
    padding: 24px 18px;
    margin-bottom: 16px;
    background:
      radial-gradient(circle at top left, rgba(14, 165, 233, .24), transparent 38%),
      linear-gradient(135deg, #ffffff 0%, #e0f2fe 100%);
    border: 1px solid rgba(14, 116, 144, .16);
    box-shadow: 0 16px 35px rgba(15, 23, 42, .10);
    text-align: center;
  }
  
  .hero-bg {
    position: absolute;
    width: 180px;
    height: 180px;
    border-radius: 50%;
    background: rgba(6, 182, 212, .10);
    top: -70px;
    right: -60px;
  }
  
  .logo {
    position: relative;
    width: 108px;
    height: 108px;
    object-fit: contain;
    margin: 0 auto 12px;
    display: block;
    border-radius: 28px;
    background: white;
    padding: 10px;
    box-shadow: 0 10px 28px rgba(15, 23, 42, .10);
  }
  
  .fallback-logo {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 42px;
  }
  
  .hero-content {
    position: relative;
  }
  
  .eyebrow {
    color: #0284c7;
    font-weight: 950;
    font-size: 13px;
    margin-bottom: 4px;
  }
  
  .hero h1 {
    margin: 0;
    font-size: 25px;
    line-height: 1.45;
    font-weight: 950;
    color: #0f172a;
  }
  
  .hero p {
    margin: 8px auto 0;
    max-width: 420px;
    color: #334155;
    line-height: 1.7;
    font-weight: 700;
  }
  
  .status {
    display: inline-block;
    margin-top: 13px;
    padding: 6px 14px;
    border-radius: 999px;
    font-weight: 950;
    font-size: 13px;
  }
  
  .status.live {
    background: #dcfce7;
    color: #166534;
  }
  
  .status.upcoming {
    background: #ecfeff;
    color: #155e75;
  }
  
  .status.ended {
    background: #e2e8f0;
    color: #475569;
  }
  
  .status.archived {
    background: #f1f5f9;
    color: #64748b;
  }
  
  .quick-card {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 11px;
    background: #ffffff;
    border: 1px solid rgba(15, 23, 42, .08);
    border-radius: 24px;
    padding: 13px;
    margin-bottom: 22px;
    box-shadow: 0 8px 22px rgba(15, 23, 42, .06);
  }
  
  .quick-card div {
    text-align: center;
    background: #f8fafc;
    border-radius: 18px;
    padding: 11px 6px;
  }
  
  .quick-label {
    display: block;
    color: #64748b;
    font-size: 12px;
    font-weight: 800;
    margin-bottom: 5px;
  }
  
  .quick-card strong {
    color: #0f172a;
    font-size: 13px;
    font-weight: 950;
  }
  
  .section-title {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 12px;
    margin: 0 4px 13px;
  }
  
  .section-title h2 {
    margin: 0;
    color: #0f172a;
    font-size: 19px;
    font-weight: 950;
  }
  
  .section-title span {
    color: #64748b;
    font-size: 13px;
    font-weight: 800;
  }
  
  .grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 13px;
    padding-bottom: 18px;
  }
  
  .menu-card {
    border: 0;
    text-align: right;
    border-radius: 24px;
    background: #ffffff;
    padding: 16px 14px;
    min-height: 138px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    box-shadow: 0 8px 22px rgba(15, 23, 42, .07);
    border: 1px solid rgba(15, 23, 42, .07);
  }
  
  .menu-card.primary {
    background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%);
    color: white;
    box-shadow: 0 14px 30px rgba(8, 145, 178, .24);
  }
  
  .icon {
    font-size: 31px;
    line-height: 1;
  }
  
  .title {
    font-weight: 950;
    color: #0f172a;
    font-size: 16px;
  }
  
  .sub {
    color: #64748b;
    font-size: 12px;
    line-height: 1.6;
    font-weight: 700;
  }
  
  .menu-card.primary .title,
  .menu-card.primary .sub {
    color: white;
  }
  
  .menu-card:active {
    transform: scale(.98);
  }
  
  @media (max-width: 390px) {
    .page-wrap {
      padding: 13px;
    }
  
    .quick-card {
      grid-template-columns: 1fr;
    }
  
    .menu-card {
      min-height: 128px;
      padding: 14px 12px;
    }
  
    .hero h1 {
      font-size: 22px;
    }
  }
  </style>