<template>
    <section class="home-2027">
        <FastingStatusCard
  :dateISO="dateISO"
  :day="calendarDay"
  :language="language"
  :loading="calendarLoading"
  :error="calendarError"
@open="openFasting"
/>
  
      <!-- Shared daily sections will go here gradually. -->
      <slot />
    </section>
  </template>
  
  <script setup lang="ts">
  import type { CalendarDay } from '@/config/calendar'
  import FastingStatusCard from '@/components/home/2027/FastingStatusCard.vue'
  import { useRouter } from 'vue-router'
  defineProps<{
    dateISO: string
    language: 'ar' | 'en'
    calendarDay: CalendarDay | null
    calendarLoading: boolean
    calendarError: boolean
  }>()
  
  const router = useRouter()

function openFasting(dateISO: string) {
  return router.push({
    name: 'Fasting',
    params: { dateISO },
  })
}
  </script>
  
  <style scoped>
  .home-2027 {
    display: grid;
    gap: 16px;
    margin-block: 16px;
  }
  </style>