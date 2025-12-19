<template>
  <ion-app>
    <ion-menu content-id="main-content" side="start">
      <ion-header>
        <ion-toolbar>
          <ion-title>القائمة</ion-title>
        </ion-toolbar>
      </ion-header>

      <ion-content>
        <ion-list>
          <ion-menu-toggle :auto-hide="true">

            <ion-item button @click="openSettings">
              <ion-label>الإعدادات</ion-label>
            </ion-item>

            <ion-item button @click="openAbout">
              <ion-label>عن التطبيق</ion-label>
            </ion-item>
          </ion-menu-toggle>
        </ion-list>
      </ion-content>
    </ion-menu>

    <!-- مهم: الـ id هنا -->
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
  menuController
} from '@ionic/vue'

import { useRouter } from 'vue-router'
const router = useRouter()

async function openSettings() {
  await menuController.close()
  router.push({ path: '/', query: { modal: 'settings' } })
}

async function openAbout() {
  await menuController.close()
  router.push({ path: '/', query: { modal: 'about' } })
}
</script>
