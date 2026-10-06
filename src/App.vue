<template>
  <ion-app>
    <AppSideMenu />
    <ion-router-outlet id="main-content" />
  </ion-app>
</template>

<script setup lang="ts">
import { IonApp, IonRouterOutlet, alertController } from '@ionic/vue'
import AppSideMenu from '@/components/AppSideMenu.vue'
import { onBeforeMount, onMounted, onBeforeUnmount } from 'vue'
import { ensureAnonAuth, initAppCheckWeb } from '@/lib/firebase'

onBeforeMount(async () => {
  initAppCheckWeb()
  await ensureAnonAuth()
})

const handlePushAnnouncement = async (event: Event) => {
  const customEvent = event as CustomEvent

  const title = customEvent.detail?.title || 'معًا كل يوم'
  const message = customEvent.detail?.message || ''

  const alert = await alertController.create({
    header: title,
    message: message,
    buttons: ['تمام']
  })

  await alert.present()
}

onMounted(() => {
  window.addEventListener(
    'push-announcement',
    handlePushAnnouncement
  )
})

onBeforeUnmount(() => {
  window.removeEventListener(
    'push-announcement',
    handlePushAnnouncement
  )
})
</script>
  
