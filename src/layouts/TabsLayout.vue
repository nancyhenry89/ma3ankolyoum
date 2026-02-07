<!-- src/layouts/TabsLayout.vue -->
<template>
    <ion-page>
      <ion-tabs>
        <ion-router-outlet />
  
        <ion-tab-bar :class="['mkTabBar', themeClass]" slot="bottom">
  <ion-tab-button
    tab="home"
    href="/home"
    class="mkTabBtn"
    :class="{ mkSelected: activeTab === 'home' }"
  >
    <ion-icon :icon="homeOutline" />
    <ion-label>{{ isArabic ? 'الرئيسية' : 'Home' }}</ion-label>
  </ion-tab-button>

  <ion-tab-button
    tab="bible"
    href="/bible"
    class="mkTabBtn"
    :class="{ mkSelected: activeTab === 'bible' }"
  >
    <ion-icon :icon="libraryOutline" />
    <ion-label>{{ isArabic ? 'كتاب مقدس' : 'Bible' }}</ion-label>
  </ion-tab-button>

  <ion-tab-button
    tab="intros"
    href="/bible-intros"
    class="mkTabBtn"
    :class="{ mkSelected: activeTab === 'intros' }"
  >
    <ion-icon :icon="bookOutline" />
    <ion-label>{{ isArabic ? 'مقدمات' : 'Intros' }}</ion-label>
  </ion-tab-button>

  <ion-tab-button
    tab="stories"
    href="/bible-stories"
    class="mkTabBtn"
    :class="{ mkSelected: activeTab === 'stories' }"
  >
    <ion-icon :icon="filmOutline" />
    <ion-label>{{ isArabic ? 'حكايات' : 'Stories' }}</ion-label>
  </ion-tab-button>

  <ion-tab-button
    tab="noor"
    href="/noor-alalam"
    class="mkTabBtn"
    :class="{ mkSelected: activeTab === 'noor' }"
  >
    <ion-icon :icon="tvOutline" />
    <ion-label>{{ isArabic ? 'نور العالم' : 'Noor' }}</ion-label>
  </ion-tab-button>

  <ion-tab-button
    tab="more"
    class="mkTabBtn"
    @click.prevent="openMoreSheet"
    :class="{ mkSelected: activeTab === 'more' }"
  >
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
    IonPage,
    IonTabs,
    IonRouterOutlet,
    IonTabBar,
    IonTabButton,
    IonIcon,
    IonLabel,
    IonActionSheet,
  } from '@ionic/vue'
  import {
    homeOutline,
    bookOutline,
    filmOutline,
    tvOutline,
    ellipsisHorizontalOutline,
    chatbubbleEllipsesOutline,
    settingsOutline,
    informationCircleOutline,
    libraryOutline,
  } from 'ionicons/icons'
  import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  
  type Lang = 'ar' | 'en'
  const router = useRouter()
  const route = useRoute()
  
  // ✅ reactive lang (listens to mk:lang-changed)
  const lang = ref<Lang>(((localStorage.getItem('mk_lang') as Lang) || 'ar') === 'en' ? 'en' : 'ar')
  const isArabic = computed(() => lang.value === 'ar')
  
  function syncLangFromStorage() {
    const v = (localStorage.getItem('mk_lang') as Lang) || 'ar'
    lang.value = v === 'en' ? 'en' : 'ar'
  }
  const activeTab = computed(() => {
  if (showMore.value) return 'more'

  const p = route.path || ''

  if (p === '/home' || p.startsWith('/home/')) return 'home'
  if (p === '/bible-intros' || p.startsWith('/bible-intros/')) return 'intros'
  if (p === '/bible-stories' || p.startsWith('/bible-stories/')) return 'stories'
  if (p === '/noor-alalam' || p.startsWith('/noor-alalam/')) return 'noor'

  // ✅ Bible لازم يكون EXACT /bible أو صفحات chapter فقط
  if (p === '/bible' || p.startsWith('/chapter/')) return 'bible'

  return 'home'
})

  function onLangChanged() {
    syncLangFromStorage()
  }
  
  // ✅ reactive theme (body has theme-dark / theme-light)
  const themeClass = ref<'theme-dark' | 'theme-light'>(
    document.body.classList.contains('theme-dark') ? 'theme-dark' : 'theme-light'
  )
  function syncThemeFromBody() {
    themeClass.value = document.body.classList.contains('theme-dark') ? 'theme-dark' : 'theme-light'
  }
  
  let obs: MutationObserver | null = null
  
  onMounted(() => {
    syncLangFromStorage()
    syncThemeFromBody()
  
    window.addEventListener('mk:lang-changed', onLangChanged)
  
    obs = new MutationObserver(() => syncThemeFromBody())
    obs.observe(document.body, { attributes: true, attributeFilter: ['class'] })
  })
  
  onBeforeUnmount(() => {
    window.removeEventListener('mk:lang-changed', onLangChanged)
    obs?.disconnect()
    obs = null
  })
  
  // ✅ Helpers for manual selected (stable)
  function cleanPath(p: string) {
    return String(p || '').split('?')[0]
  }
  function isActive(prefix: string) {
    const p = cleanPath(route.path)
    return p === prefix || p.startsWith(prefix + '/')
  }
  function isBibleActive() {
    const p = cleanPath(route.path)
    return p === '/bible' || p.startsWith('/bible/') || p.startsWith('/chapter/')
  }
  
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
 /* ===== Keep your good look (same tokens) ===== */
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

.mkTabBar{
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);

  /* ✅ TabBar height ثابت (يمنع قص label) */
  height: calc(58px + env(safe-area-inset-bottom));
  padding-bottom: env(safe-area-inset-bottom);

  /* ✅ kill ionic blue */
  --color: color-mix(in srgb, var(--mk-text) 70%, transparent);
  --color-selected: var(--mk-accent);
}

/* =========================
   Stop any flash/jump + freeze layout
========================= */
.mkTabBar :deep(ion-tab-button){
  /* base colors */
  --color: color-mix(in srgb, var(--mk-text) 65%, transparent);
  --color-selected: var(--mk-accent);

  /* ✅ no activated bg / no ripple */
  --background: transparent !important;
  --background-focused: transparent !important;
  --background-hover: transparent !important;
  --background-activated: transparent !important;
  --ripple-color: transparent !important;

  /* IMPORTANT: prevent Ionic from changing spacing */
  margin: 0 !important;
  padding: 0 !important;
}

/* ✅ freeze the actual clickable area */
.mkTabBar :deep(ion-tab-button::part(native)){
  background: transparent !important;
  -webkit-tap-highlight-color: transparent;

  /* fixed height */
  min-height: 58px !important;
  height: 58px !important;

  /* fixed layout */
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: center !important;

  /* ✅ fixed gap (no jump on press/selected) */
  gap: 3px !important;

  /* fixed padding */
  padding: 8px 0 !important;

  /* ✅ no transforms ever */
  transform: none !important;
  transition: color 140ms ease !important; /* color only */
}

/* ✅ icon fixed size */
.mkTabBar :deep(ion-tab-button ion-icon){
  font-size: 22px !important;
  width: 22px !important;
  height: 22px !important;
  flex: 0 0 22px !important;
  margin: 0 !important;
  padding: 0 !important;
  transform: none !important;
}

/* ✅ label fixed size + no clipping */
.mkTabBar :deep(ion-tab-button ion-label){
  font-size: 11px !important;
  font-weight: 900 !important;
  line-height: 1.15 !important;

  margin: 0 !important;
  padding: 0 !important;

  display: block !important;
  white-space: nowrap !important;
  overflow: visible !important;

  transform: none !important;
  opacity: 1 !important;
}

/* =========================
   ✅ Disable Ionic automatic "tab-selected" coloring
   (WITHOUT using inherit)
========================= */
.mkTabBar :deep(ion-tab-button.tab-selected){
  /* keep layout, but do NOT color */
  --color: color-mix(in srgb, var(--mk-text) 65%, transparent) !important;
  --color-selected: color-mix(in srgb, var(--mk-text) 65%, transparent) !important;
}
.mkTabBar :deep(ion-tab-button.tab-selected ion-icon),
.mkTabBar :deep(ion-tab-button.tab-selected ion-label){
  color: color-mix(in srgb, var(--mk-text) 65%, transparent) !important;
}

/* =========================
   ✅ Our ONLY selected state (mkSelected)
========================= */
.mkTabBar :deep(ion-tab-button.mkSelected){
  --color: var(--mk-accent) !important;
  --color-selected: var(--mk-accent) !important;
}
.mkTabBar :deep(ion-tab-button.mkSelected) ion-icon,
.mkTabBar :deep(ion-tab-button.mkSelected) ion-label{
  color: var(--mk-accent) !important;
}

/* ===== Dark mode fallback selectors ===== */
:global(html.ion-palette-dark) .mkTabBar,
:global(html.dark) .mkTabBar,
:global(body.dark) .mkTabBar,
:global(ion-app.ion-palette-dark) .mkTabBar,
:global(ion-app.dark) .mkTabBar{
  --mk-bg: rgba(0,0,0,0.35);
  --mk-text: #f5f7fa;
  --mk-border: rgba(255,255,255,0.12);
  --mk-accent: #28d6cc;

  background: var(--mk-bg);
  border-top: 1px solid var(--mk-border);
}


  </style>
  