<template>
    <div class="fasting-details" :dir="arabic ? 'rtl' : 'ltr'">
      <section class="occasion">
        <span class="occasion__icon" aria-hidden="true">
          {{ day.fastingStatus === 'fasting' ? '🌿' : '☀️' }}
        </span>
  
        <h2>{{ statusText }}</h2>
        <p v-if="day.fastingName[language]">
          {{ day.fastingName[language] }}
        </p>
      </section>
  
      <section class="details-card">
        <template v-if="day.fastingStatus === 'fasting'">
          <div class="detail-row">
            <span>{{ arabic ? 'الانقطاع' : 'Abstinence' }}</span>
            <strong>
              {{
                yesNo(
                  day.abstinence,
                  arabic ? 'يوجد انقطاع' : 'With abstinence',
                  arabic ? 'لا يوجد انقطاع' : 'No abstinence',
                )
              }}
            </strong>
          </div>
  
          <div class="detail-row">
            <span>{{ arabic ? 'السمك' : 'Fish' }}</span>
            <strong>
              {{
                yesNo(
                  day.fishAllowed,
                  arabic ? 'مسموح' : 'Allowed',
                  arabic ? 'غير مسموح' : 'Not allowed',
                )
              }}
            </strong>
          </div>
        </template>
  
        <div class="detail-row">
          <span>{{ arabic ? 'نغمة الصلاة' : 'Prayer tune' }}</span>
          <strong>{{ day.prayerTune[language] || unavailable }}</strong>
        </div>
      </section>
  
      <section
        v-if="day.reflection[language]"
        class="details-card reflection"
      >
        <h3>{{ arabic ? 'تأمل اليوم' : 'Daily reflection' }}</h3>
        <p>{{ day.reflection[language] }}</p>
      </section>
    </div>
  </template>
  
  <script setup lang="ts">
  import { computed } from 'vue'
  import type { CalendarDay } from '@/config/calendar'
  
  const props = defineProps<{
    day: CalendarDay
    language: 'ar' | 'en'
  }>()
  
  const arabic = computed(() => props.language === 'ar')
  
  const unavailable = computed(() =>
    arabic.value ? 'غير محدد' : 'Not specified',
  )
  
  const statusText = computed(() => {
    if (props.day.fastingStatus === 'fasting') {
      return arabic.value ? 'صوم' : 'Fasting'
    }
  
    if (props.day.fastingStatus === 'non-fasting') {
      return arabic.value ? 'فطار' : 'Non-fasting'
    }
  
    return unavailable.value
  })
  
  function yesNo(
    value: boolean | null,
    yesText: string,
    noText: string,
  ): string {
    if (value === null) return unavailable.value
    return value ? yesText : noText
  }
  </script>
  
  <style scoped>
  .fasting-details {
    display: grid;
    gap: 18px;
  }
  
  .occasion {
    padding: 24px 16px;
    text-align: center;
  }
  
  .occasion__icon {
    display: inline-grid;
    place-items: center;
    width: 88px;
    height: 88px;
    border-radius: 30px;
    background: var(--day-surface);
    box-shadow: 0 8px 24px rgba(24, 42, 68, 0.06);
    font-size: 44px;
  }
  
  .occasion h2 {
    margin: 14px 0 4px;
    color: var(--day-primary);
    font-size: 1.6em;
    font-weight: 800;
  }
  
  .occasion p {
    margin: 0;
    color: var(--day-muted);
  }
  
  .details-card {
    padding: 18px;
    border: 1px solid var(--day-border);
    border-radius: 22px;
    background: var(--day-surface);
  }
  
  .detail-row {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 8px 16px;
    padding-block: 14px;
  }
  
  .detail-row + .detail-row {
    border-top: 1px solid var(--day-border);
  }
  
  .detail-row > span {
    color: var(--day-muted);
  }
  
  .detail-row strong {
    color: var(--day-primary);
  }
  
  .reflection h3 {
    margin: 0 0 10px;
    color: var(--day-primary);
    font-size: 1.1em;
  }
  
  .reflection p {
    margin: 0;
    color: var(--day-text);
    line-height: 1.9;
    white-space: pre-wrap;
  }
  </style>