<template>
    <ion-page
      class="day-themed fasting-page"
      :data-day-theme="dayTheme"
      :dir="arabic ? 'rtl' : 'ltr'"
      :lang="language"
    >
      <ion-header class="ion-no-border">
        <ion-toolbar>
          <ion-buttons slot="start">
            <ion-button @click="goHome">
              {{ arabic ? '→ الرئيسية' : '← Home' }}
            </ion-button>
          </ion-buttons>
  
          <ion-title>
            {{ arabic ? 'تفاصيل اليوم' : 'Day details' }}
          </ion-title>
        </ion-toolbar>
      </ion-header>
  
      <ion-content>
        <main class="page-wrap">
          <template v-if="dateISO">
            <section class="date-card">
              <div class="date-navigation">
                <button
                  type="button"
                  :disabled="!canGoPrevious"
                  :aria-label="arabic ? 'اليوم السابق' : 'Previous day'"
                  @click="moveDay(-1)"
                >
                  {{ arabic ? '→' : '←' }}
                </button>
  
                <div class="date-text" aria-live="polite">
                  <strong>{{ gregorianDate }}</strong>
  
                  <span v-if="datesLoading">
                    {{ arabic ? 'جارٍ تحميل التاريخ القبطي…' : 'Loading Coptic date…' }}
                  </span>
  
                  <span v-else-if="copticDate">{{ copticDate }}</span>
  
                  <span v-else>
                    {{
                      datesError
                        ? arabic
                          ? 'تعذّر تحميل التاريخ القبطي'
                          : 'Unable to load Coptic date'
                        : arabic
                          ? 'التاريخ القبطي غير متاح'
                          : 'Coptic date unavailable'
                    }}
                  </span>
                </div>
  
                <button
                  type="button"
                  :aria-label="arabic ? 'اليوم التالي' : 'Next day'"
                  @click="moveDay(1)"
                >
                  {{ arabic ? '←' : '→' }}
                </button>
              </div>
            </section>
  
            <div v-if="calendarLoading" class="message" role="status">
              <ion-spinner name="crescent" />
              <p>{{ arabic ? 'جارٍ تحميل تفاصيل اليوم…' : 'Loading day details…' }}</p>
            </div>
  
            <div v-else-if="calendarError" class="message" role="alert">
              {{ arabic ? 'تعذّر تحميل البيانات. تأكدي من الاتصال بالإنترنت.' : 'Unable to load data. Check your internet connection.' }}
            </div>
  
            <FastingDayDetails
              v-else-if="calendarDay"
              :day="calendarDay"
              :language="language"
            />
  
            <div v-else class="message">
              {{ arabic ? 'لا توجد تفاصيل متاحة لهذا اليوم.' : 'No details available for this day.' }}
            </div>
          </template>
  
          <div v-else class="message">
            {{ arabic ? 'التاريخ غير صالح أو خارج نطاق التقويم.' : 'Invalid date or outside the calendar range.' }}
          </div>
        </main>
      </ion-content>
    </ion-page>
  </template>
  
  <script setup lang="ts">
  import {
    IonPage,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonTitle,
    IonContent,
    IonSpinner,
  } from '@ionic/vue'
  
  import FastingDayDetails from '@/components/fasting/FastingDayDetails.vue'
  import { useFastingPage } from '@/composables/useFastingPage'
  import '@/theme/day-themes.css'
  
  const {
    language,
    arabic,
    dateISO,
    dayTheme,
    calendarDay,
    calendarLoading,
    calendarError,
    datesLoading,
    datesError,
    gregorianDate,
    copticDate,
    canGoPrevious,
    moveDay,
    goHome,
  } = useFastingPage()
  </script>
  
  <style scoped>
  .fasting-page {
    font-family: 'Noto Naskh Arabic', system-ui, sans-serif;
  }
  
  ion-toolbar {
    --background: var(--day-background);
    --color: var(--day-text);
  }
  
  ion-button {
    --color: var(--day-primary);
  }
  
  ion-content {
    --padding-bottom: calc(24px + env(safe-area-inset-bottom));
  }
  
  .page-wrap {
    max-width: 680px;
    margin-inline: auto;
    padding: 20px 16px;
  }
  
  .date-card {
    padding: 14px;
    border: 1px solid var(--day-border);
    border-radius: 22px;
    background: var(--day-surface);
  }
  
  .date-navigation {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .date-text {
    display: grid;
    flex: 1;
    gap: 5px;
    min-width: 0;
    text-align: center;
  }
  
  .date-text strong {
    color: var(--day-text);
  }
  
  .date-text span {
    color: var(--day-muted);
    font-size: 0.9em;
  }
  
  .date-navigation button {
    display: grid;
    place-items: center;
    flex: 0 0 38px;
    height: 38px;
    border: 1px solid var(--day-border);
    border-radius: 50%;
    background: var(--day-background);
    color: var(--day-primary);
    font: inherit;
    cursor: pointer;
  }
  
  .date-navigation button:disabled {
    opacity: 0.35;
    cursor: default;
  }
  
  .date-navigation button:focus-visible {
    outline: 2px solid var(--day-primary);
    outline-offset: 3px;
  }
  
  .message {
    padding: 36px 16px;
    color: var(--day-muted);
    text-align: center;
  }
  
  ion-spinner {
    color: var(--day-primary);
  }
  </style>