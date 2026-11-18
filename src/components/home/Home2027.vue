<template>
  <section class="home-2027">
    <div class="daily-cards" :class="{ 'daily-cards--pair': $slots.liturgy }">
      <FastingStatusCard
        :dateISO="dateISO"
        :day="calendarDay"
        :language="language"
        :loading="calendarLoading"
        :error="calendarError"
        @open="openFasting"
      />
      <slot name="liturgy" />
    </div>
    <slot />
  </section>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { CalendarDay } from '@/config/calendar'
import FastingStatusCard from '@/components/home/2027/FastingStatusCard.vue'

defineProps<{
  dateISO: string
  language: 'ar' | 'en'
  calendarDay: CalendarDay | null
  calendarLoading: boolean
  calendarError: boolean
}>()

const router = useRouter()

function openFasting(dateISO: string) {
  return router.push({ name: 'Fasting', params: { dateISO } })
}
</script>

<style scoped>
.home-2027 {
  display: grid;
  gap: 16px;
  margin-block: 16px;
}

.daily-cards {
  display: grid;
  gap: 12px;
}

.daily-cards--pair {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.daily-cards--pair > :deep(button) {
  min-width: 0;
}

@media (max-width: 650px) {
  .daily-cards--pair {
    gap: 8px;
  }

  .daily-cards--pair :deep(.fasting-card) {
    gap: 0.4rem;
    min-height: 82px;
    padding: 0.6rem;
  }

  .daily-cards--pair :deep(.fasting-card__icon) {
    flex-basis: 32px;
    height: 32px;
    border-radius: 10px;
    font-size: 18px;
  }

  .daily-cards--pair :deep(.fasting-card__arrow) {
    flex-basis: 20px;
    height: 20px;
    font-size: 14px;
  }

  .daily-cards--pair :deep(.fasting-card__title),
  .daily-cards--pair :deep(.fasting-card__occasion) {
    font-size: 0.8em;
  }
}
</style>
