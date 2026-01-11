<template>
  <ion-app>
    <AppSideMenu />

    <ion-router-outlet id="main-content" />
  </ion-app>
</template>

<script setup lang="ts">
import { IonApp, IonRouterOutlet } from '@ionic/vue'
import AppSideMenu from '@/components/AppSideMenu.vue'
</script>
