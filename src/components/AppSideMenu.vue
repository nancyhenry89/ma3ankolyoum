<template>
    <ion-menu content-id="main-content" side="start" menu-id="main-menu">
      <ion-header>
        <ion-toolbar>
          <ion-title>{{ ui.menuTitle }}</ion-title>
  
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
        <ion-list>
          <ion-menu-toggle :auto-hide="true">
              <!-- ✅ Arabic only -->
              <template v-if="isArabic">
                <ion-item button @click="go('/bible-intros')">
                <ion-label>مقدمات أسفار الكتاب المقدس</ion-label>
              </ion-item>
              <ion-item button @click="go('/bible-stories')">
                <ion-label>حكايات الكتاب المقدس</ion-label>
              </ion-item>
  

            </template>
            <!-- ✅ Visible in AR + EN -->
            <ion-item button @click="go('/coptic-words')">
              <ion-label>
                {{ isArabic ? 'كلمات قبطية حتى اليوم' : 'Coptic words up to today' }}
              </ion-label>
            </ion-item>
  

  
            <!-- Existing -->
            <ion-item button @click="openModal('settings')">
              <ion-label>{{ ui.settings }}</ion-label>
            </ion-item>
  
            <ion-item button @click="openModal('about')">
              <ion-label>{{ ui.about }}</ion-label>
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
    menuController
  } from '@ionic/vue'
  
  import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
  import { useRouter } from 'vue-router'
  
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
  
    // ✅ notify pages
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
  
  onMounted(() => {
    const handler = () => syncLangFromStorage()
    window.addEventListener('mk:lang-changed', handler)
  
    syncLangFromStorage()
  
    onBeforeUnmount(() => {
      window.removeEventListener('mk:lang-changed', handler)
    })
  })
  </script>
  