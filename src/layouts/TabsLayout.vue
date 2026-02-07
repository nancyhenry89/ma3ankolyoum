<template>
    <ion-page>
      <ion-tabs>
        <ion-router-outlet />
  
        <ion-tab-bar :class="['mkTabBar', themeClass]" slot="bottom">
          <ion-tab-button tab="home" href="/home" class="mkTabBtn">
            <ion-icon :icon="homeOutline" />
            <ion-label>{{ isArabic ? 'الرئيسية' : 'Home' }}</ion-label>
          </ion-tab-button>
  
          <ion-tab-button tab="intros" href="/bible-intros" class="mkTabBtn">
            <ion-icon :icon="bookOutline" />
            <ion-label>{{ isArabic ? 'مقدمات' : 'Intros' }}</ion-label>
          </ion-tab-button>
  
          <ion-tab-button tab="stories" href="/bible-stories" class="mkTabBtn">
            <ion-icon :icon="filmOutline" />
            <ion-label>{{ isArabic ? 'حكايات' : 'Stories' }}</ion-label>
          </ion-tab-button>
  
          <ion-tab-button tab="noor" href="/noor-alalam" class="mkTabBtn">
            <ion-icon :icon="tvOutline" />
            <ion-label>{{ isArabic ? 'نور العالم' : 'Noor' }}</ion-label>
          </ion-tab-button>
  
          <!-- ✅ More (ActionSheet) -->
          <ion-tab-button tab="more" class="mkTabBtn" @click.prevent="openMoreSheet">
            <ion-icon :icon="ellipsisHorizontalOutline" />
            <ion-label>{{ isArabic ? 'أكتر' : 'More' }}</ion-label>
          </ion-tab-button>
        </ion-tab-bar>
      </ion-tabs>
  
      <ion-action-sheet
        :is-open="showMore"
        :header="isArabic ? 'أكتر' : 'More'"
        :buttons="moreButtons"
        @didDismiss="showMore = false"
      />
    </ion-page>
  </template>
  
  <script setup lang="ts">
  import {
    IonPage, IonTabs, IonRouterOutlet, IonTabBar, IonTabButton,
    IonIcon, IonLabel, IonActionSheet,
  } from '@ionic/vue'
  import {
    homeOutline, bookOutline, filmOutline, tvOutline, ellipsisHorizontalOutline,
    chatbubbleEllipsesOutline, settingsOutline, informationCircleOutline,
  } from 'ionicons/icons'
  import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  
  type Lang = 'ar' | 'en'
  const router = useRouter()
  const route = useRoute()
  
  // ✅ reactive lang (listens to your existing mk:lang-changed)
  const lang = ref<Lang>(((localStorage.getItem('mk_lang') as Lang) || 'ar') === 'en' ? 'en' : 'ar')
  const isArabic = computed(() => lang.value === 'ar')
  
  function syncLangFromStorage() {
    const v = (localStorage.getItem('mk_lang') as Lang) || 'ar'
    lang.value = v === 'en' ? 'en' : 'ar'
  }
  function onLangChanged() {
    syncLangFromStorage()
  }
  
  // ✅ reactive themeClass (body has theme-dark / theme-light)
  const themeClass = ref<'theme-dark' | 'theme-light'>(
    document.body.classList.contains('theme-dark') ? 'theme-dark' : 'theme-light'
  )
  
  function syncThemeFromBody() {
    themeClass.value = document.body.classList.contains('theme-dark') ? 'theme-dark' : 'theme-light'
  }
  
  onMounted(() => {
    syncLangFromStorage()
    syncThemeFromBody()
  
    window.addEventListener('mk:lang-changed', onLangChanged)
  
    // watch body class changes (in case you toggle theme)
    const obs = new MutationObserver(() => syncThemeFromBody())
    obs.observe(document.body, { attributes: true, attributeFilter: ['class'] })
  
    onBeforeUnmount(() => {
      window.removeEventListener('mk:lang-changed', onLangChanged)
      obs.disconnect()
    })
  })
  
  // ✅ More sheet
  const showMore = ref(false)
  function openMoreSheet() {
    showMore.value = true
  }
  
  const moreButtons = computed(() => {
    const go = (path: string) => router.push(path)
    const openModal = (modal: 'settings' | 'about') => {
      router.push({ path: route.path, query: { ...route.query, modal } })
    }
  
    return [
      {
        text: isArabic.value ? 'كلمات قبطية' : 'Coptic words',
        icon: chatbubbleEllipsesOutline,
        handler: () => go('/coptic-words'),
      },
      {
        text: isArabic.value ? 'الإعدادات' : 'Settings',
        icon: settingsOutline,
        handler: () => openModal('settings'),
      },
      {
        text: isArabic.value ? 'عن التطبيق' : 'About',
        icon: informationCircleOutline,
        handler: () => openModal('about'),
      },
      { text: isArabic.value ? 'إلغاء' : 'Cancel', role: 'cancel' },
    ]
  })
  </script>
  
  <style scoped>
  /* =========================================================
     Match your app theme variables (same spirit as Home/Menu)
  ========================================================= */
  .mkTabBar.theme-light{
    --mk-bg: rgba(255,255,255,0.92);
    --mk-text: #0b1f33;
    --mk-border: rgba(24,42,68,0.10);
    --mk-accent: #20b2aa;
  
    background: var(--mk-bg);
    border-top: 1px solid var(--mk-border);
  }
  
  .mkTabBar.theme-dark{
    --mk-bg: rgba(0,0,0,0.35);
    --mk-text: #f5f7fa;
    --mk-border: rgba(255,255,255,0.12);
    --mk-accent: #28d6cc;
  
    background: var(--mk-bg);
    border-top: 1px solid var(--mk-border);
  }
  
  /* glass + safe area */
  .mkTabBar{
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    padding-bottom: env(safe-area-inset-bottom);
  
    /* ✅ kill default ionic blue & use your accent */
    --color: color-mix(in srgb, var(--mk-text) 70%, transparent);
    --color-selected: var(--mk-accent);
  }
  
  /* Make icons/labels consistent */
  .mkTabBtn{
    --color: color-mix(in srgb, var(--mk-text) 65%, transparent);
    --color-selected: var(--mk-accent);
  }
  
  .mkTabBar :deep(ion-icon){
    font-size: 22px;
  }
  
  .mkTabBar :deep(ion-label){
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 0;
  }
  
  /* Optional: slightly lift selected tab */
  .mkTabBar :deep(ion-tab-button.tab-selected){
    transform: translateY(-1px);
  }
  </style>
  