<template>
  <ion-app>
    <ion-menu content-id="main-content" side="start">
      <ion-header>
        <ion-toolbar>
          <ion-title>{{ ui.menuTitle }}</ion-title>

          <!-- Language switch inside menu header -->
          <ion-buttons slot="end">
            <ion-button fill="clear" size="small" @click="toggleLang" :title="isArabic ? 'English' : 'العربية'">
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
            <ion-item button @click="openSettings">
              <ion-label>{{ ui.settings }}</ion-label>
            </ion-item>

            <ion-item button @click="openAbout">
              <ion-label>{{ ui.about }}</ion-label>
            </ion-item>
          </ion-menu-toggle>
        </ion-list>
      </ion-content>
    </ion-menu>

    <ion-router-outlet id="main-content" />
  </ion-app>
</template>

<script setup lang="ts">
import {
  IonApp,
  IonMenu,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonMenuToggle,
  IonRouterOutlet,
  IonButtons,
  IonButton,
  menuController
} from '@ionic/vue'

import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

type Lang = 'ar' | 'en'
const router = useRouter()

const lang = ref<Lang>((localStorage.getItem('mk_lang') as Lang) || 'ar')
const isArabic = computed(() => lang.value === 'ar')

const ui = computed(() => {
  if (lang.value === 'en') {
    return {
      menuTitle: 'Menu',
      settings: 'Settings',
      about: 'About'
    }
  }
  return {
    menuTitle: 'القائمة',
    settings: 'الإعدادات',
    about: 'عن التطبيق'
  }
})

function toggleLang() {
  lang.value = isArabic.value ? 'en' : 'ar'
  localStorage.setItem('mk_lang', lang.value)

  // no query params
  const current = router.currentRoute.value
  router.replace({ path: current.path, query: { ...current.query } })
}

async function openSettings() {
  await menuController.close()
  router.push({ path: '/', query: { modal: 'settings' } })
}

async function openAbout() {
  await menuController.close()
  router.push({ path: '/', query: { modal: 'about' } })
}

</script>
