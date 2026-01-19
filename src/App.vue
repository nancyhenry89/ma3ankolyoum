<template>
  <ion-app>
    <AppSideMenu />
    <ion-router-outlet id="main-content" />
  </ion-app>
</template>

<script setup lang="ts">
  import { IonApp, IonRouterOutlet } from '@ionic/vue'
  import AppSideMenu from '@/components/AppSideMenu.vue'
  import { onBeforeMount } from "vue"
  import { ensureAnonAuth, initAppCheckWeb } from '@/lib/firebase'
  
  onBeforeMount(async () => {
    initAppCheckWeb()
    await ensureAnonAuth()
  })
  </script>
  
