<template>
    <ion-page>
      <ion-header class="mk-header">
        <ion-toolbar>
          <ion-buttons slot="start">
            <ion-back-button :default-href="`/conference/${conferenceId}`" />
          </ion-buttons>
  
          <ion-title>برنامج المؤتمر</ion-title>
        </ion-toolbar>
      </ion-header>
  
      <ion-content class="schedule-page" dir="rtl">
        <div class="page-wrap">
          <p v-if="loading" class="center">جاري التحميل...</p>
  
          <div v-else-if="schedule.length === 0" class="empty">
            <div class="empty-icon">🗓️</div>
            <h2>لا يوجد برنامج لهذا المؤتمر.</h2>
          </div>
  
          <template v-else>
            <div class="top-card">
              <div class="top-line">
                <div>
                  <div class="eyebrow">برنامج اليوم</div>
                  <h1>{{ todayTitle }}</h1>
                </div>
  
                <div class="clock">
                  {{ currentClock }}
                </div>
              </div>
  
              <div v-if="currentItem" class="current-banner">
                <div class="pulse"></div>
  
                <div class="current-content">
                  <div class="current-label">يحدث الآن</div>
                  <h2>{{ currentItem.title }}</h2>
  
                  <div class="current-meta">
                    <span>🕒 {{ displayRange(currentItem) }}</span>
                    <span v-if="currentItem.location">📍 {{ currentItem.location }}</span>
                  </div>
  
                  <p v-if="currentItem.speaker">
                    {{ currentItem.speaker }}
                  </p>
                </div>
              </div>
  
              <div v-else class="current-banner quiet">
                <div class="current-content">
                  <div class="current-label">لا يوجد نشاط الآن</div>
                  <h2 v-if="nextItem">القادم: {{ nextItem.title }}</h2>
                  <h2 v-else>لا توجد فقرات قادمة</h2>
  
                  <div v-if="nextItem" class="current-meta">
                    <span>🕒 {{ formatDayTitle(nextItem.day) }} - {{ displayStart(nextItem) }}</span>
                    <span v-if="nextItem.location">📍 {{ nextItem.location }}</span>
                  </div>
                </div>
              </div>
            </div>
  
            <section v-for="day in groupedDays" :key="day.day" class="day-section">
              <div class="day-head">
                <h2>{{ formatDayTitle(day.day) }}</h2>
                <span>{{ day.items.length }} فقرة</span>
              </div>
  
              <div class="timeline-list">
                <div
                  v-for="item in day.items"
                  :key="`${item.day}-${item.start_time}-${item.title}`"
                  class="timeline-item"
                  :class="{
                    active: isCurrent(item),
                    past: isPast(item),
                    future: isFuture(item),
                  }"
                >
                  <div class="time-col">
                    <div class="start">{{ displayStart(item) }}</div>
                    <div class="end">{{ displayEnd(item) }}</div>
                  </div>
  
                  <div class="rail">
                    <div class="line top"></div>
                    <div class="dot">
                      <span v-if="isCurrent(item)">●</span>
                    </div>
                    <div class="line bottom"></div>
                  </div>
  
                  <div class="event-card">
                    <div class="event-head">
                      <h3>{{ item.title }}</h3>
                      <span v-if="isCurrent(item)" class="now-pill">الآن</span>
                      <span v-else-if="isPast(item)" class="done-pill">انتهى</span>
                    </div>
  
                    <p v-if="item.speaker" class="speaker">
                      {{ item.speaker }}
                    </p>
  
                    <p v-if="item.location" class="location">
                      📍 {{ item.location }}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </template>
        </div>
      </ion-content>
    </ion-page>
  </template>
  
  <script setup lang="ts">
  import {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonContent,
  } from '@ionic/vue'
  
  import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
  import { useRoute } from 'vue-router'
  
  import {
    fetchConferenceSchedule,
    type ConferenceScheduleRow,
  } from '@/services/sheets'
  
  const route = useRoute()
  const conferenceId = String(route.params.id || '')
  
  const loading = ref(true)
  const schedule = ref<ConferenceScheduleRow[]>([])
  const nowTick = ref(Date.now())
  
  let timer: any = null
  
  onMounted(async () => {
    timer = setInterval(() => {
      nowTick.value = Date.now()
    }, 15_000)
  
    try {
      schedule.value = await fetchConferenceSchedule(conferenceId, true)
    } catch (e) {
      console.error('Failed to load schedule', e)
      schedule.value = []
    } finally {
      loading.value = false
    }
  })
  
  onBeforeUnmount(() => {
    if (timer) clearInterval(timer)
  })
  
  const currentClock = computed(() => {
    nowTick.value
    return new Date().toLocaleTimeString('en-EG', {
      hour: '2-digit',
      minute: '2-digit',
    })
  })
  
  const todayTitle = computed(() => {
    const today = todayISO()
    const hasToday = schedule.value.some((x) => extractISODate(x.day) === today)
    return hasToday ? formatDayTitle(today) : 'كل الأيام'
  })
  
  const groupedDays = computed(() => {
    const map = new Map<string, ConferenceScheduleRow[]>()
  
    schedule.value.forEach((item) => {
      const day = extractISODate(item.day) || item.day || 'اليوم'
      if (!map.has(day)) map.set(day, [])
      map.get(day)!.push(item)
    })
  
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, items]) => ({
        day,
        items: items.sort((a, b) => {
          const ad = getStartDate(a)?.getTime() || 0
          const bd = getStartDate(b)?.getTime() || 0
          return ad - bd
        }),
      }))
  })
  
  const sortedItems = computed(() => {
    return [...schedule.value].sort((a, b) => {
      const ad = getStartDate(a)?.getTime() || 0
      const bd = getStartDate(b)?.getTime() || 0
      return ad - bd
    })
  })
  
  const currentItem = computed(() => {
    nowTick.value
    return sortedItems.value.find((item) => isCurrent(item)) || null
  })
  
  const nextItem = computed(() => {
    nowTick.value
    const now = Date.now()
  
    return sortedItems.value.find((item) => {
      const start = getStartDate(item)
      return start ? start.getTime() > now : false
    }) || null
  })
  
  function isCurrent(item: ConferenceScheduleRow) {
    nowTick.value
  
    const start = getStartDate(item)
    const end = getEndDate(item)
  
    if (!start || !end) return false
  
    const now = Date.now()
  
    return now >= start.getTime() && now < end.getTime()
  }
  
  function isPast(item: ConferenceScheduleRow) {
    nowTick.value
  
    const end = getEndDate(item)
    if (!end) return false
  
    return Date.now() >= end.getTime()
  }
  
  function isFuture(item: ConferenceScheduleRow) {
    nowTick.value
  
    const start = getStartDate(item)
    if (!start) return false
  
    return Date.now() < start.getTime()
  }
  
  function getStartDate(item: ConferenceScheduleRow) {
    return makeDateTime(
      item.day,
      item.start_time,
      item.start_ampm || item.ampm
    )
  }
  
  function getEndDate(item: ConferenceScheduleRow) {
    return makeDateTime(
      item.day,
      item.end_time,
      item.end_ampm || item.ampm
    )
  }
  
  function makeDateTime(dayValue: string, timeValue: string, periodValue?: string): Date | null {
    const date = extractISODate(dayValue)
    const time = normalizeTimeTo24(timeValue, periodValue)
  
    if (!date || !time) return null
  
    const d = new Date(`${date}T${time}:00`)
    if (Number.isNaN(d.getTime())) return null
  
    return d
  }
  
  function normalizeTimeTo24(timeValue: string, periodValue?: string) {
    const raw = String(timeValue || '').trim()
    const period = String(periodValue || '').trim().toUpperCase()
  
    const match = raw.match(/(\d{1,2})(?::(\d{2}))?/)
    if (!match) return ''
  
    let h = Number(match[1])
    const m = Number(match[2] || 0)
  
    if (!Number.isFinite(h) || !Number.isFinite(m)) return ''
  
    if (period === 'PM' && h < 12) h += 12
    if (period === 'AM' && h === 12) h = 0
  
    h = Math.min(23, Math.max(0, h))
    const mm = Math.min(59, Math.max(0, m))
  
    return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
  }
  
  function extractISODate(value: string) {
    const s = String(value || '').trim()
    const match = s.match(/\d{4}-\d{2}-\d{2}/)
    return match?.[0] || ''
  }
  
  function todayISO() {
    const d = new Date()
    return [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, '0'),
      String(d.getDate()).padStart(2, '0'),
    ].join('-')
  }
  
  function displayStart(item: ConferenceScheduleRow) {
    return displayTime(item.start_time, item.start_ampm || item.ampm)
  }
  
  function displayEnd(item: ConferenceScheduleRow) {
    return displayTime(item.end_time, item.end_ampm || item.ampm)
  }
  
  function displayRange(item: ConferenceScheduleRow) {
    return `${displayStart(item)} - ${displayEnd(item)}`
  }
  
  function displayTime(time: string, period?: string) {
    const t = String(time || '').trim()
    const p = String(period || '').trim().toUpperCase()
  
    if (!t) return ''
  
    if (p === 'AM' || p === 'PM') {
      return `${t} ${p}`
    }
  
    return t
  }
  
  function formatDayTitle(day: string) {
    const iso = extractISODate(day) || day
  
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return day
  
    try {
      return new Date(`${iso}T12:00:00`).toLocaleDateString('ar-EG', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      })
    } catch {
      return day
    }
  }
  </script>
  
  <style scoped>
  .mk-header ion-toolbar {
    --background: #0f172a;
    --color: #f8fafc;
  }
  
  .schedule-page {
    --background: #f6fbff;
  }
  
  .page-wrap {
    padding: 16px;
    max-width: 760px;
    margin: 0 auto;
  }
  
  .center,
  .empty {
    text-align: center;
    padding: 48px 0;
    color: #334155;
  }
  
  .empty-icon {
    font-size: 54px;
  }
  
  .top-card {
    background:
      radial-gradient(circle at top left, rgba(14, 165, 233, .22), transparent 38%),
      linear-gradient(135deg, #ffffff 0%, #e0f2fe 100%);
    border: 1px solid rgba(14, 116, 144, .16);
    border-radius: 30px;
    padding: 18px;
    margin-bottom: 24px;
    box-shadow: 0 16px 35px rgba(15, 23, 42, .10);
  }
  
  .top-line {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 16px;
  }
  
  .eyebrow {
    color: #0284c7;
    font-weight: 900;
    font-size: 13px;
    margin-bottom: 4px;
  }
  
  .top-line h1 {
    margin: 0;
    color: #0f172a;
    font-size: 21px;
    font-weight: 950;
  }
  
  .clock {
    direction: ltr;
    background: #0f172a;
    color: #f8fafc;
    border-radius: 16px;
    padding: 8px 11px;
    font-weight: 900;
    box-shadow: 0 6px 16px rgba(15, 23, 42, .18);
  }
  
  .current-banner {
    display: flex;
    gap: 14px;
    align-items: flex-start;
    background: #ffffff;
    border: 2px solid #0891b2;
    border-radius: 24px;
    padding: 16px;
    box-shadow: 0 12px 30px rgba(8, 145, 178, .18);
  }
  
  .current-banner.quiet {
    border-color: rgba(15, 23, 42, .12);
    box-shadow: none;
  }
  
  .pulse {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    margin-top: 7px;
    background: #06b6d4;
    box-shadow: 0 0 0 8px rgba(6, 182, 212, .12);
    animation: pulse 1.4s infinite;
  }
  
  .current-content {
    flex: 1;
  }
  
  .current-label {
    color: #0891b2;
    font-weight: 950;
    font-size: 13px;
  }
  
  .current-content h2 {
    margin: 6px 0 8px;
    color: #0f172a;
    font-size: 22px;
    font-weight: 950;
    line-height: 1.45;
  }
  
  .current-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
  }
  
  .current-meta span {
    background: #ecfeff;
    color: #155e75;
    border-radius: 999px;
    padding: 6px 10px;
    font-size: 13px;
    font-weight: 800;
  }
  
  .current-content p {
    margin: 10px 0 0;
    color: #334155;
    font-weight: 800;
  }
  
  .day-section {
    margin-top: 24px;
  }
  
  .day-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 14px;
  }
  
  .day-head h2 {
    margin: 0;
    color: #0f172a;
    font-size: 18px;
    font-weight: 950;
  }
  
  .day-head span {
    color: #64748b;
    font-size: 13px;
    font-weight: 800;
  }
  
  .timeline-list {
    position: relative;
  }
  
  .timeline-item {
    display: grid;
    grid-template-columns: 78px 24px 1fr;
    gap: 10px;
    min-height: 96px;
  }
  
  .time-col {
    text-align: center;
    direction: ltr;
    padding-top: 14px;
  }
  
  .start {
    color: #0f172a;
    font-size: 15px;
    font-weight: 950;
  }
  
  .end {
    color: #64748b;
    font-size: 12px;
    font-weight: 800;
    margin-top: 3px;
  }
  
  .rail {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  .line {
    width: 3px;
    flex: 1;
    background: #cbd5e1;
    border-radius: 99px;
  }
  
  .dot {
    width: 15px;
    height: 15px;
    border-radius: 50%;
    background: #94a3b8;
    border: 3px solid #f6fbff;
    box-shadow: 0 0 0 2px #cbd5e1;
  }
  
  .timeline-item.active .dot {
    width: 26px;
    height: 26px;
    background: #06b6d4;
    border-color: #ffffff;
    box-shadow:
      0 0 0 5px rgba(6, 182, 212, .18),
      0 8px 18px rgba(8, 145, 178, .28);
    transform: translateY(-4px);
  }
  
  .timeline-item.active .line {
    background: #38bdf8;
  }
  
  .timeline-item.past {
    opacity: .55;
  }
  
  .event-card {
    background: #ffffff;
    border: 1px solid rgba(15, 23, 42, .08);
    border-radius: 22px;
    padding: 14px;
    margin-bottom: 14px;
    box-shadow: 0 8px 22px rgba(15, 23, 42, .06);
  }
  
  .timeline-item.active .event-card {
    border: 2px solid #0891b2;
    background: #ecfeff;
    box-shadow: 0 14px 32px rgba(8, 145, 178, .18);
  }
  
  .event-head {
    display: flex;
    justify-content: space-between;
    gap: 8px;
  }
  
  .event-head h3 {
    margin: 0 0 6px;
    color: #0f172a;
    font-size: 17px;
    font-weight: 950;
    line-height: 1.5;
  }
  
  .now-pill,
  .done-pill {
    flex-shrink: 0;
    height: fit-content;
    border-radius: 999px;
    padding: 4px 9px;
    font-size: 11px;
    font-weight: 950;
  }
  
  .now-pill {
    background: #0891b2;
    color: white;
  }
  
  .done-pill {
    background: #e2e8f0;
    color: #475569;
  }
  
  .speaker,
  .location {
    margin: 4px 0;
    color: #334155;
    font-size: 14px;
    line-height: 1.6;
  }
  
  @keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 rgba(6, 182, 212, .30);
    }
    70% {
      box-shadow: 0 0 0 12px rgba(6, 182, 212, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(6, 182, 212, 0);
    }
  }
  
  @media (max-width: 390px) {
    .page-wrap {
      padding: 13px;
    }
  
    .timeline-item {
      grid-template-columns: 68px 22px 1fr;
    }
  
    .current-content h2 {
      font-size: 20px;
    }
  }
  </style>