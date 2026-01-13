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
        <ion-list class="mkMenuList">
          <ion-menu-toggle :auto-hide="true">
  
            <!-- ✅ Arabic only -->
            <template v-if="isArabic">
              <ion-item button @click="go('/bible-intros')" class="mkMenuItem mkMenuItem--ar">
                <ion-label class="mkMenuLabel mkMenuLabel--ar">مقدمات أسفار الكتاب المقدس</ion-label>
                <ion-icon :icon="bookOutline" slot="end" class="mkMenuIcon" />
              </ion-item>
  
              <ion-item button @click="go('/bible-stories')" class="mkMenuItem mkMenuItem--ar">
                <ion-label class="mkMenuLabel mkMenuLabel--ar">حكايات الكتاب المقدس</ion-label>
                <ion-icon :icon="filmOutline" slot="end" class="mkMenuIcon" />
              </ion-item>
            </template>
            <ion-item button @click="go('/noor-alalam')" class="mkMenuItem mkMenuItem--ar">
  <ion-label class="mkMenuLabel mkMenuLabel--ar">برنامج نور العالم</ion-label>
  <ion-icon :icon="tvOutline" slot="end" class="mkMenuIcon" />
</ion-item>

            <!-- ✅ Visible in AR + EN -->
            <ion-item button @click="go('/coptic-words')" :class="['mkMenuItem', isArabic ? 'mkMenuItem--ar' : 'mkMenuItem--en']">
              <ion-label :class="['mkMenuLabel', isArabic ? 'mkMenuLabel--ar' : 'mkMenuLabel--en']">
                {{ isArabic ? 'كلمات قبطية حتى اليوم' : 'Coptic words up to today' }}
              </ion-label>
  
              <!-- icon on right for AR, on left for EN -->
              <ion-icon
                :icon="chatbubbleEllipsesOutline"
                :slot="isArabic ? 'end' : 'start'"
                class="mkMenuIcon"
              />
            </ion-item>
  
            <!-- Existing -->
            <ion-item button @click="openModal('settings')" :class="['mkMenuItem', isArabic ? 'mkMenuItem--ar' : 'mkMenuItem--en']">
              <ion-label :class="['mkMenuLabel', isArabic ? 'mkMenuLabel--ar' : 'mkMenuLabel--en']">{{ ui.settings }}</ion-label>
              <ion-icon :icon="settingsOutline" :slot="isArabic ? 'end' : 'start'" class="mkMenuIcon" />
            </ion-item>
  
            <ion-item button @click="openModal('about')" :class="['mkMenuItem', isArabic ? 'mkMenuItem--ar' : 'mkMenuItem--en']">
              <ion-label :class="['mkMenuLabel', isArabic ? 'mkMenuLabel--ar' : 'mkMenuLabel--en']">{{ ui.about }}</ion-label>
              <ion-icon :icon="informationCircleOutline" :slot="isArabic ? 'end' : 'start'" class="mkMenuIcon" />
            </ion-item>
  
          </ion-menu-toggle>
        </ion-list>
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
  /* --- Icon color: choose ONE behavior by editing below --- */
  
  /* Option 1: always teal */
  .mkMenuIcon{
    color: var(--ion-color-primary);
    font-size: 20px;
    opacity: 0.95;
  }
  
  /* Option 2: black in light / teal in dark (uncomment to use)
  :global(body:not(.theme-dark)) .mkMenuIcon{ color: #000; }
  :global(body.theme-dark) .mkMenuIcon{ color: var(--ion-color-primary); }
  */
  
  .mkMenuItem{
    --padding-start: 14px;
    --inner-padding-end: 14px;
    --min-height: 48px;
  }
  
  .mkMenuLabel{
    font-size: 15px;
    line-height: 1.25;
    font-family: "Noto Kufi Arabic", system-ui, sans-serif;
  }
  .menu-title{
    font-family: "Noto Kufi Arabic", system-ui, sans-serif;
  }
  
  /* ✅ Arabic: keep RTL page but left-align text inside label */
  .mkMenuLabel--ar{
    text-align: right;
  }
  
  /* (Optional) make Arabic labels not stick to icon too close */
  .mkMenuItem--ar ion-label{
    margin-right: 0;
    margin-left: 8px;
  }
  
  /* English labels normal */
  .mkMenuLabel--en{
    text-align: left;
  }
  </style>
  