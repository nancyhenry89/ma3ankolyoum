<template>
  <ion-app>
    <AppSideMenu />

    <ion-router-outlet id="main-content" />
  </ion-app>
</template>

<script setup lang="ts">
  import { IonApp, IonRouterOutlet } from '@ionic/vue'
  import { onMounted } from 'vue'
  import AppSideMenu from '@/components/AppSideMenu.vue'
  
  import { ensureAnonAuth, initAppCheckWeb } from '@/lib/firebase'
  
  onMounted(async () => {
    // Web only (reCAPTCHA v3)
    initAppCheckWeb()
  
    // Ensure request.auth exists before any Firestore reads/writes that require auth
    await ensureAnonAuth()
  })
  </script>
  
