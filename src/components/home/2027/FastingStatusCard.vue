<template>
    <button
      type="button"
      class="fasting-card"
      :dir="language === 'ar' ? 'rtl' : 'ltr'"
      @click="emit('open', dateISO)"
    >
      <span class="fasting-card__icon" aria-hidden="true">
        {{ matchingDay?.fastingStatus === 'non-fasting' ? '☀️' : '🌿' }}
      </span>
  
      <span class="fasting-card__body">
        <span class="fasting-card__title">{{ statusText }}</span>
  
        <span v-if="occasion" class="fasting-card__occasion">
          {{ occasion }}
        </span>
      </span>
  
      <span class="fasting-card__arrow" aria-hidden="true">
        {{ language === 'ar' ? '←' : '→' }}
      </span>
    </button>
  </template>
  <script setup lang="ts">
  import { computed } from 'vue'
  import type { CalendarDay } from '@/config/calendar'
  
  const props = withDefaults(
    defineProps<{
      dateISO: string
      day: CalendarDay | null
      language?: 'ar' | 'en'
      loading?: boolean
      error?: boolean
    }>(),
    {
      language: 'ar',
      loading: false,
      error: false,
    },
  )
  
  const emit = defineEmits<{
    open: [dateISO: string]
  }>()
  
  // Only display information belonging to the selected date.
  const matchingDay = computed(() =>
    props.day?.dateISO === props.dateISO ? props.day : null,
  )
  
  const occasion = computed(() => {
    if (props.loading || props.error) return ''
  
    return matchingDay.value?.fastingName[props.language] ?? ''
  })
  
  const statusText = computed(() => {
    const arabic = props.language === 'ar'
  
    if (props.loading) {
      return arabic ? 'جارٍ التحميل…' : 'Loading…'
    }
  
    if (props.error) {
      return arabic ? 'تعذّر تحميل البيانات' : 'Unable to load data'
    }
  
    switch (matchingDay.value?.fastingStatus) {
        case 'fasting':
  return arabic ? 'صوم' : 'Fasting'

case 'non-fasting':
  return arabic ? 'فطار' : 'Non-fasting'
  
      default:
        return arabic ? 'المعلومات غير متاحة' : 'Information unavailable'
    }
  })
  </script>
  
  <style scoped>
  .fasting-card {
    display: flex;
    align-items: center;
    gap: 14px;
    width: 100%;
    padding: 18px;
    overflow: hidden;
    border: 1px solid var(--day-border, #d8e8e9);
    border-radius: 22px;
    background: linear-gradient(
      120deg,
      var(--day-surface, #fff),
      var(--day-background, #f4f9f9)
    );
    box-shadow: 0 6px 20px rgba(24, 42, 68, 0.06);
    color: var(--day-text, #17394a);
    font: inherit;
    text-align: start;
    cursor: pointer;
    transition: transform 150ms ease, box-shadow 150ms ease;
  }
  
  .fasting-card__icon {
    display: grid;
    place-items: center;
    flex: 0 0 60px;
    height: 60px;
    border: 1px solid var(--day-border, #d8e8e9);
    border-radius: 20px;
    background: var(--day-surface, #fff);
    font-size: 30px;
    line-height: 1;
  }
  
  .fasting-card__body {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }
  
  .fasting-card__title {
    color: var(--day-primary, #087f8c);
    font-size: 1.25em;
    font-weight: 800;
  }
  
  .fasting-card__occasion {
    color: var(--day-muted, #596f7a);
    font-size: 0.95em;
  }
  
  .fasting-card__arrow {
    display: grid;
    place-items: center;
    flex: 0 0 34px;
    height: 34px;
    border-radius: 50%;
    background: var(--day-surface, #fff);
    color: var(--day-primary, #087f8c);
    font-size: 18px;
  }
  
  .fasting-card:active {
    transform: scale(0.98);
    box-shadow: 0 2px 8px rgba(24, 42, 68, 0.05);
  }
  
  .fasting-card:focus-visible {
    outline: 3px solid var(--day-primary, #087f8c);
    outline-offset: 3px;
  }
  
  @media (prefers-reduced-motion: reduce) {
    .fasting-card {
      transition: none;
    }
  }
  </style>