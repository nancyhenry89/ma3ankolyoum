<template>
    <ion-menu content-id="main-content" side="start" menu-id="main-menu" class="mkMenu">
      <ion-header>
        <ion-toolbar>
          <ion-title class="menu-title">{{ ui.menuTitle }}</ion-title>
  
          <ion-buttons slot="end">
            <ion-button
              fill="clear"
              size="small"
              @click="toggleLang"
              :title="isArabic ? 'English' : 'العربية'"
            >
              <span style="font-size: 22px; line-height: 1;">
                {{ isArabic ? '🇬🇧' : '🇪🇬' }}
              </span>
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
  
      <ion-content>
        <div :class="['home', themeClass, 'mkMenuSurface']">
    <ion-menu-toggle :auto-hide="true">

      <!-- TOP: cards (AR only) -->
      <div v-if="isArabic" class="mkQuickWrap">
        <div class="mkQuickGrid">
          <ion-item button :detail="false" lines="none" @click="go('/bible-intros')" class="mkQuickCard">
            <ion-icon :icon="bookOutline" class="mkQuickIcon" />
            <ion-label class="mkQuickLabel">مقدمات الأسفار</ion-label>
          </ion-item>

          <ion-item button :detail="false" lines="none" @click="go('/bible-stories')" class="mkQuickCard">
            <ion-icon :icon="filmOutline" class="mkQuickIcon" />
            <ion-label class="mkQuickLabel">حكايات الكتاب</ion-label>
          </ion-item>

          <ion-item button :detail="false" lines="none" @click="go('/noor-alalam')" class="mkQuickCard">
            <ion-icon :icon="tvOutline" class="mkQuickIcon" />
            <ion-label class="mkQuickLabel">نور العالم</ion-label>
          </ion-item>

          <ion-item button :detail="false" lines="none" @click="go('/coptic-words')" class="mkQuickCard">
            <ion-icon :icon="chatbubbleEllipsesOutline" class="mkQuickIcon" />
            <ion-label class="mkQuickLabel">كلمات قبطية</ion-label>
          </ion-item>
        </div>
      </div>

      <!-- Bottom list -->
      <ion-list class="mkMenuList">
        <ion-item v-if="!isArabic" button @click="go('/coptic-words')" class="mkMenuItem mkMenuItem--en">
          <ion-icon :icon="chatbubbleEllipsesOutline" slot="start" class="mkMenuIcon" />
          <ion-label class="mkMenuLabel mkMenuLabel--en">Coptic words up to today</ion-label>
        </ion-item>

        <ion-item button @click="openModal('settings')" :class="['mkMenuItem', isArabic ? 'mkMenuItem--ar' : 'mkMenuItem--en']">
          <ion-label :class="['mkMenuLabel', isArabic ? 'mkMenuLabel--ar' : 'mkMenuLabel--en']">{{ ui.settings }}</ion-label>
          <ion-icon :icon="settingsOutline" :slot="isArabic ? 'end' : 'start'" class="mkMenuIcon" />
        </ion-item>

        <ion-item button @click="openModal('about')" :class="['mkMenuItem', isArabic ? 'mkMenuItem--ar' : 'mkMenuItem--en']">
          <ion-label :class="['mkMenuLabel', isArabic ? 'mkMenuLabel--ar' : 'mkMenuLabel--en']">{{ ui.about }}</ion-label>
          <ion-icon :icon="informationCircleOutline" :slot="isArabic ? 'end' : 'start'" class="mkMenuIcon" />
        </ion-item>
      </ion-list>

    </ion-menu-toggle>
  </div>
</ion-content>


    </ion-menu>
  </template>
  
  <script setup lang="ts">
  import {
    IonMenu,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonMenuToggle,
    IonButtons,
    IonButton,
    IonIcon,
    menuController
  } from '@ionic/vue'
  
  import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
  import { useRouter } from 'vue-router'

  import {
    bookOutline,
    filmOutline,
    chatbubbleEllipsesOutline,
    settingsOutline,
    informationCircleOutline,
    tvOutline
  } from 'ionicons/icons'
  
  type Lang = 'ar' | 'en'
  const router = useRouter()
  
  const lang = ref<Lang>((localStorage.getItem('mk_lang') as Lang) || 'ar')
  const isArabic = computed(() => lang.value === 'ar')
  const themeClass = computed(() =>
  document.body.classList.contains('theme-dark') ? 'theme-dark' : 'theme-light'
)

  function syncLangFromStorage() {
    const v = (localStorage.getItem('mk_lang') as Lang) || 'ar'
    lang.value = v === 'en' ? 'en' : 'ar'
  }
  
  const ui = computed(() => {
    return lang.value === 'en'
      ? { menuTitle: 'Menu', settings: 'Settings', about: 'About' }
      : { menuTitle: 'القائمة', settings: 'الإعدادات', about: 'عن التطبيق' }
  })
  
  function toggleLang() {
    const next: Lang = isArabic.value ? 'en' : 'ar'
    localStorage.setItem('mk_lang', next)
    lang.value = next
    window.dispatchEvent(new CustomEvent('mk:lang-changed', { detail: next }))
  }
  
  /** ✅ normal navigation pages */
  async function go(path: string) {
    await menuController.close('main-menu')
    router.push({ path })
  }
  
  /** ✅ same-page modals (settings/about) */
  async function openModal(modal: 'settings' | 'about') {
    await menuController.close('main-menu')
  
    const current = router.currentRoute.value
    router.push({
      path: current.path,
      query: { ...current.query, modal }
    })
  }
  
  function onLangChanged() {
    syncLangFromStorage()
  }
  
  onMounted(() => {
    window.addEventListener('mk:lang-changed', onLangChanged)
    syncLangFromStorage()
  })
  
  onBeforeUnmount(() => {
    window.removeEventListener('mk:lang-changed', onLangChanged)
  })
  </script>
  
  <style scoped>
  /* =========================================================
   mk vars available inside menu (HomePage vars are scoped)
========================================================= */
:global(.mkMenu .home.theme-light){
  --mk-bg1: #f4f7fb;
  --mk-bg2: #ffffff;
  --mk-text: #0b1f33;
  --mk-card: #ffffff;

  --mk-accent: #20b2aa;
  --mk-danger: #ff2a00;

  --mk-border: rgba(24,42,68,0.10);
  --mk-shadow: 0 8px 18px rgba(10,20,30,0.07);
  --mk-shadow-strong: 0 14px 28px rgba(10,20,30,0.10);

  --mk-soft-border: rgba(32,178,170,0.28);
}

:global(.mkMenu .home.theme-dark){
  --mk-bg1: #060b12;
  --mk-bg2: #0b1220;
  --mk-text: #f5f7fa;
  --mk-card: rgba(255,255,255,0.08);

  --mk-accent: #28d6cc;
  --mk-danger: #ff7a7a;

  --mk-border: rgba(255,255,255,0.14);
  --mk-shadow: 0 14px 28px rgba(0,0,0,0.45);
  --mk-shadow-strong: 0 18px 34px rgba(0,0,0,0.60);

  --mk-soft-border: rgba(40,214,204,0.35);
}

/* =========================================================
   Surface / background inside the menu
========================================================= */
.mkMenuSurface{
  min-height: 100%;
  padding-bottom: 14px;
  background:
    radial-gradient(1200px 600px at 20% -10%, rgba(32,178,170,0.16), transparent 60%),
    radial-gradient(900px 500px at 90% 0%, rgba(24,42,68,0.10), transparent 55%),
    linear-gradient(to bottom, var(--mk-bg1), var(--mk-bg2));
}

/* Optional: fix menu width on tablets (uncomment if needed)
:global(.mkMenu){ --width: 360px; }
*/

/* =========================================================
   Header title font
========================================================= */
.menu-title{
  font-family: "Noto Kufi Arabic", system-ui, sans-serif;
}

/* =========================================================
   Center container on wide menus
========================================================= */
.mkQuickWrap,
.mkMenuList{
  max-width: 420px;
  margin-inline: auto;
}

/* =========================================================
   Quick cards (Top)
========================================================= */
.mkQuickWrap{
  padding: 12px 12px 6px;
}

.mkQuickGrid{
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

@media (max-width: 360px){
  .mkQuickGrid{ grid-template-columns: 1fr; }
}

/* host */
.mkQuickCard{
  --min-height: 104px;
}

/* actual card */
.mkQuickCard::part(native){
  min-height: 104px;
  padding: 12px 10px !important;
  border-radius: 18px !important;

  border: 1px solid color-mix(in srgb, var(--mk-border) 85%, transparent) !important;

  background:
    radial-gradient(
      720px 240px at 20% 0%,
      color-mix(in srgb, var(--mk-accent) 14%, transparent),
      transparent 62%
    ),
    var(--mk-card) !important;

  box-shadow: var(--mk-shadow) !important;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;

  text-align: center;
  align-content: center;

  transition: transform .16s ease, box-shadow .22s ease, border-color .22s ease;
}

.mkQuickIcon{
  font-size: 30px;
  color: var(--mk-accent) !important;
  opacity: 0.98;
}

.mkQuickLabel{
  margin: 0;
  width: 100%;
  text-align: center;

  font-family: "Noto Kufi Arabic", system-ui, sans-serif;
  font-weight: 1000;
  font-size: 15px;
  line-height: 2;
  color: var(--mk-text) !important;

  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;

  padding: 0 6px;
}

/* press */
.mkQuickCard:active::part(native){
  transform: translateY(1px) scale(0.985);
}

/* hover */
@media (hover:hover){
  .mkQuickCard:hover::part(native){
    border-color: var(--mk-soft-border) !important;
    box-shadow: var(--mk-shadow-strong) !important;
    transform: translateY(-1px);
  }
}

/* =========================================================
   Divider between cards and list
========================================================= */
.mkDivider{
  height: 1px;
  margin: 8px 14px 4px;
  background: color-mix(in srgb, var(--mk-border) 80%, transparent);
}

/* =========================================================
   Bottom list styling (Settings / About)
========================================================= */
.mkMenuList{
  margin-top: 6px;
  padding-top: 0;
  padding-bottom: 0;
}

/* remove Ionic default list padding (reliable) */
:global(.mkMenu ion-list){
  padding-top: 0 !important;
  padding-bottom: 0 !important;
}

.mkMenuItem{
  --padding-start: 14px;
  --inner-padding-end: 14px;
  --min-height: 54px;
}

/* make rows match cards width */
.mkMenuItem::part(native){
  max-width: 420px;
  margin-inline: auto;
}

.mkMenuLabel{
  font-size: 16px;
  line-height: 1.25;
  font-family: "Noto Kufi Arabic", system-ui, sans-serif;
}

.mkMenuLabel--ar{ text-align: right; }
.mkMenuLabel--en{ text-align: left; }

.mkMenuItem--ar ion-label{
  margin-right: 0;
  margin-left: 8px;
}

/* single source of truth for icons */
.mkMenuIcon{
  color: var(--mk-accent);
  font-size: 22px;
  opacity: 0.95;
}
/* ==========================================
   FIX: kill ion-item inner padding via vars
   (works with Shadow DOM)
========================================== */
.mkQuickCard{
  /* remove all item paddings that push content in RTL */
  --padding-start: 0px;
  --padding-end: 0px;

  /* for some modes/versions */
  --inner-padding-start: 0px;
  --inner-padding-end: 0px;

  /* kill iOS safe area that sometimes gets added */
  --ion-safe-area-right: 0px;
  --ion-safe-area-left: 0px;
}

/* keep our custom padding on the actual native button */
.mkQuickCard::part(native){
  padding: 12px 10px !important;
}

/* ensure label/icon don't get extra spacing */
.mkQuickCard ion-label{
  margin: 0 !important;
  padding: 0 !important;
  width: 100%;
  text-align: center;
  width:72px
}


  </style>
  