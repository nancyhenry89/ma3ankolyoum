<template>
  <ion-page
    :class="['home', themeClass, isArabic ? 'lang-ar' : 'lang-en']"
    :style="{ '--mk-fontScale': String(fontScale) }"
    :dir="pageDir"
    :lang="lang"
  >
    <ion-content :fullscreen="true" class="content">
      <div
        class="capture home"
        :class="[themeClass, { 'mk-capturing': isCapturing }]"
        ref="captureRef"
      >
        <!-- Background -->
        <div class="bg"></div>

        <div class="wrap">
          <!-- Header: Data -->
          <div class="header" v-if="!isLoading && !noData">
            <ion-menu-button class="burgerBtn mkNoCapture" :auto-hide="false" />

            <!-- Language switch -->
            <ion-button
              class="langBtn mkNoCapture"
              fill="clear"
              size="small"
              :title="isArabic ? 'English' : 'العربية'"
              @click="setLang(isArabic ? 'en' : 'ar')"
              aria-label="Change language"
            >
              <span class="langFlag">
                {{ isArabic ? '🇬🇧' : '🇪🇬' }}
              </span>
            </ion-button>

            <!-- Share -->
            <ion-button class="shareBtn" fill="clear" size="small" @click="showShareSheet = true">
              <IonIcon :icon="shareOutline" />
            </ion-button>

            <ion-action-sheet
              :is-open="showShareSheet"
              :header="ui.share"
              :cssClass="['share-sheet']"
              :buttons="shareButtons"
              @didDismiss="showShareSheet = false"
            />

            <div class="brand">
              <template v-if="isArabic">
                <div class="brand_name">معاً كل يوم</div>
                <div class="accent">مع</div>
                <div class="abouna">القمص يوحنا باقي</div>
              </template>

              <template v-else>
                <div class="brand_name">Together Every Day</div>
                <div class="accent">with</div>
                <div class="abouna">Fr. Yohanna Baky</div>
              </template>
            </div>

            <!-- Dates -->
            <div class="dates" @click="showDatePicker = true">
              {{ gregorianDate }} – {{ copticDate }}
            </div>

            <!-- Announcement -->
            <div
              v-if="hasAnnouncement"
              class="announcement-card"
              :class="{ hasOccasional: hasOccasional }"
              role="button"
              :tabindex="hasOccasional ? 0 : -1"
              @click="hasOccasional && openOccasional()"
              @keydown.enter.prevent="hasOccasional && openOccasional()"
              @keydown.space.prevent="hasOccasional && openOccasional()"
            >
              {{ announcement }}
            </div>

            <!-- Saint -->
            <div
              class="saint"
              :class="{ clickable: hasSaint && isArabic }"
              @click="hasSaint && isArabic && openSaint()"
            >
              <span v-if="hasSaint">{{ saint }}</span>
              <span v-else>{{ ui.noSaint }}</span>
            </div>

            <!-- Title -->
            <div class="title">
              {{ title }}
            </div>
          </div>

          <!-- Header: Loading -->
          <div class="header" v-else-if="isLoading">
            <div class="brand skeleton"></div>
            <div class="dates skeleton"></div>
            <div class="saint skeleton"></div>
            <div class="title skeleton titleSk"></div>
          </div>

          <!-- Header: No data -->
          <div class="header" v-else>
            <div class="brand">معًا كل يوم</div>
            <div class="card" style="margin-top:12px">
              <p class="text alignRight">{{ noDataMsg || ui.noData }}</p>
            </div>
          </div>

          <!-- Story -->
          <div class="card" v-if="!isLoading && !noData">
            <div v-if="hasStory" class="text alignRight md" v-html="storyHtml"></div>
            <p v-else class="text alignRight emptyMsg">
              {{ ui.noStory }}
            </p>

            <!-- Reactions: Story -->
            <div class="reactRow" v-if="hasStory">
              <button class="heartBtn" type="button" @click="onHeart('story')">
                ❤️ <span class="count">{{ reactCounts.story.heart }}</span>
              </button>
            </div>
          </div>

          <div class="card" v-else-if="isLoading">
            <div class="skeleton-line"></div>
            <div class="skeleton-line"></div>
            <div class="skeleton-line short"></div>
          </div>

          <!-- Verse -->
          <div class="verse" v-if="!isLoading && !noData">
            <template v-if="hasVerse">
              <div class="verse-text">"{{ verseText }}"</div>
              <div class="verse-ref">{{ verseRef }}</div>
            </template>
            <div v-else class="verse-empty">
              {{ ui.noVerse }}
            </div>

            <!-- Reactions: Verse -->
            <div class="reactRow" v-if="hasVerse">
              <button class="heartBtn" type="button" @click="onHeart('verse')">
                ❤️ <span class="count">{{ reactCounts.verse.heart }}</span>
              </button>
            </div>
          </div>

          <div class="card" v-else-if="isLoading">
            <div class="skeleton-line"></div>
            <div class="skeleton-line short"></div>
          </div>

          <!-- Reflection -->
          <div class="card" v-if="!isLoading && !noData">
            <div v-if="hasReflection" class="text alignRight">
              <div class="card-title">{{ ui.reflection }}</div>
              <div class="md" v-html="reflectionHtml"></div>
            </div>

            <p v-else class="text alignRight emptyMsg">
              {{ ui.noReflection }}
            </p>

            <!-- Reactions: Reflection -->
            <div class="reactRow" v-if="hasReflection">
              <button class="heartBtn" type="button" @click="onHeart('reflection')">
                ❤️ <span class="count">{{ reactCounts.reflection.heart }}</span>
              </button>
            </div>
          </div>

          <div class="card" v-else-if="isLoading">
            <div class="skeleton-line"></div>
            <div class="skeleton-line"></div>
            <div class="skeleton-line short"></div>
          </div>

          <!-- Bible + Agpeya -->
          <div class="row" v-if="!isLoading && !noData">
            <!-- Bible card -->
            <button
              class="mini-card mini-click"
              type="button"
              @click="hasBible && isArabic && openChapter()"
              :disabled="!hasBible || !isArabic"
              :class="{ disabledCard: !hasBible || !isArabic }"
            >
              <div class="mini-head mini-head-row">
                <span>{{ ui.bible }}</span>

                <!-- Icon only in Arabic -->
                <ion-button
                  v-if="isArabic"
                  class="audioBtn mkNoCapture"
                  fill="clear"
                  size="small"
                  aria-label="عرض الإصحاح"
                >
                  <IonIcon :icon="bookOutline" />
                </ion-button>
              </div>

              <template v-if="hasBible">
                <!-- Always show pill -->
                <div class="mini-sub bible-pill">{{ previewLabel }}</div>

                <!-- Arabic only -->
                <template v-if="isArabic">
                  <div class="mini-title">{{ previewTitle }}</div>
                  <ul class="mini-list">
                    <li v-for="(item, i) in previewSections" :key="i">{{ item }}</li>
                  </ul>
                </template>
              </template>

              <p v-else class="mini-body alignRight emptyMsg">
                {{ ui.noBible }}
              </p>
            </button>

            <!-- Agpeya card -->
            <div class="mini-card">
              <div class="mini-head mini-head-row">
                <span>{{ ui.agbia }}</span>

                <!-- Audio icon ONLY in Arabic -->
                <ion-button
                  v-if="isArabic"
                  class="audioBtn mkNoCapture"
                  fill="clear"
                  size="small"
                  @click.stop="openAgbiaAudio()"
                  aria-label="صوت الأجبية"
                >
                  <IonIcon :icon="volumeHighOutline" :class="{ dimIcon: !hasAnyAgbiaAudio }" />
                </ion-button>
              </div>

              <p v-if="hasAgbia" class="mini-body alignRight">
                {{ agbia }}
              </p>
              <p v-else class="mini-body alignRight emptyMsg">
                {{ ui.noAgbia }}
              </p>

              <div class="mini-author" v-if="agbia_author && hasAgbia">
                {{ agbia_author }}
              </div>
            </div>
          </div>

          <div class="row" v-else-if="isLoading">
            <div class="mini-card">
              <div class="mini-head skeleton" style="height:44px;width:100%"></div>
              <div class="skeleton-line"></div>
              <div class="skeleton-line short"></div>
            </div>
            <div class="mini-card">
              <div class="mini-head skeleton" style="height:44px;width:100%"></div>
              <div class="skeleton-line"></div>
              <div class="skeleton-line short"></div>
            </div>
          </div>

          <!-- Coptic -->
          <CopticSection
            v-if="!isLoading && !noData"
            :dateISO="selectedDateISO"
            :contentBase="CONTENT_BASE"
            :lang="lang"
          />

          <!-- Training -->
          <div class="training" v-if="!isLoading && !noData">
            <div class="training-pill">{{ ui.training }}</div>

            <div v-if="hasTraining" class="training-text alignRight">
              {{ training }}
            </div>
            <div v-else class="training-text alignRight emptyMsg">
              {{ ui.noTraining }}
            </div>

            <!-- Reactions: Training -->
            <div class="reactRow" v-if="hasTraining">
              <button class="heartBtn" type="button" @click="onHeart('training')">
                ❤️ <span class="count">{{ reactCounts.training.heart }}</span>
              </button>
            </div>
          </div>

          <div class="card" v-else-if="isLoading">
            <div class="skeleton-line"></div>
            <div class="skeleton-line short"></div>
          </div>

          <div class="space"></div>

          <StreakRewards
            class="mkNoCapture"
            v-if="!isLoading && !noData && isTodaySelected"
            :todayISO="todayISO()"
            :lang="lang"
          />

          <!-- Stores (Web only) -->
          <div class="storesSoon mkNoCapture" v-if="isWeb && !isLoading && !noData">
            <div class="storesTitle">{{ ui.comingSoon }}</div>

            <div class="storesRow" aria-label="App Store and Google Play">
              <a class="storeBadge" href="#" aria-label="App Store (Coming soon)" @click.prevent>
                <img src="/badges/appstore.png" alt="App Store" />
              </a>

              <a class="storeBadge" href="#" aria-label="Google Play (Coming soon)" @click.prevent>
                <img src="/badges/googleplay.png" alt="Google Play" />
              </a>
            </div>
          </div>

          <div class="space"></div>
        </div>
        <!-- end wrap -->
      </div>
      <!-- end capture -->

      <!-- Date picker -->
      <ion-modal :is-open="showDatePicker" @didDismiss="showDatePicker = false">
        <ion-header>
          <ion-toolbar>
            <ion-title>{{ ui.pickDay }}</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="showDatePicker = false">{{ ui.close }}</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>

        <ion-content class="ion-padding">
          <ion-datetime
            presentation="date"
            :value="selectedDateISO"
            :max="allowFuture ? undefined : todayISOComputed"
            @ionChange="onDateChange"
          />

          <div class="hint">{{ ui.noFutureHint }}</div>
        </ion-content>
      </ion-modal>

      <!-- Settings Modal -->
      <ion-modal :is-open="showSettings" @didDismiss="closeSettings()">
        <ion-header>
          <ion-toolbar>
            <ion-title>{{ ui.settings }}</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="closeSettings()">{{ ui.close }}</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>

        <ion-content class="ion-padding">
          <div class="settingsRow">
            <div class="settingsLabel">{{ ui.darkMode }}</div>
            <ion-toggle :checked="theme === 'dark'" @ionChange="toggleTheme" />
          </div>

          <div class="settingsRow">
            <div class="settingsLabel">{{ ui.fontSize }}</div>
            <div class="rangeWrap">
              <ion-range
                :min="0.85"
                :max="1.2"
                :step="0.05"
                :value="fontScale"
                @ionChange="onFontScale"
              />
              <div class="rangeValue">{{ fontScale.toFixed(2) }}x</div>
            </div>
          </div>

          <template v-if="!isWeb">
            <div class="settingsRow">
              <div class="settingsLabel">{{ ui.dailyReminder }}</div>
              <ion-toggle :checked="reminderEnabled" @ionChange="onReminderToggle" />
            </div>

            <div class="settingsRow" v-if="reminderEnabled">
              <div class="settingsLabel">{{ ui.reminderTime }}</div>
              <input class="timeInput" type="time" v-model="reminderTime" />
            </div>

            <ion-button expand="block" fill="outline" @click="testReminder">
              {{ ui.testNotify }}
            </ion-button>
          </template>

          <div class="hint">{{ ui.settingsHint }}</div>
        </ion-content>
      </ion-modal>

      <!-- About Modal -->
      <ion-modal :is-open="showAbout" @didDismiss="closeAbout()">
        <ion-header>
          <ion-toolbar>
            <ion-title>{{ ui.about }}</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="closeAbout()">{{ ui.close }}</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>

        <ion-content class="ion-padding">
          <!-- Arabic -->
          <section v-if="isArabic" class="about-app" dir="rtl" lang="ar">
            <h2>عن التطبيق</h2>

            <p>
              <strong>معاً كل يوم</strong> هو تطبيق روحي كنسي يهدف إلى مساندة الحياة الروحية اليومية
              من خلال قراءات وتأملات وتدريبات منتظمة تساعد على النمو الروحي والالتصاق بكلمة الله.
            </p>

            <h3>المصادر والاعتمادات</h3>
            <ul>
              <li><strong>إعداد المحتوى:</strong> القمص يوحنا باقي</li>
              <li><strong>الكتاب المقدس:</strong> الترجمة العربية فان دايك، بإذن من دار الكتاب المقدس</li>
              <li><strong>السنكسار:</strong> بحسب سنكسار دير السريان</li>
              <li><strong>التفسير:</strong> موسوعة كنيسة مارمرقس بمصر الجديدة</li>
            </ul>

            <h3>الجهة التابعة</h3>
            <p>
              يُقدَّم هذا التطبيق في إطار الخدمة الروحية، وهو تابع لـ <strong>كنيسة مارمرقس بمصر الجديدة</strong>.
            </p>
          </section>

          <!-- English -->
          <section v-else class="about-app" dir="ltr" lang="en">
            <h2>About the App</h2>

            <p>
              <strong>Together Everyday</strong> is a Christian spiritual app that supports daily spiritual life
              through regular readings, reflections, and practical exercises that help users grow spiritually
              and remain connected to the Word of God.
            </p>

            <h3>Sources & Credits</h3>
            <ul>
              <li><strong>Content prepared by:</strong> Fr. Yohanna Baky</li>
              <li><strong>Bible text:</strong> Arabic Van Dyck translation, used with permission from the Bible Society</li>
              <li><strong>Synaxarium:</strong> According to Deir El-Surian Synaxarium</li>
              <li><strong>Commentary:</strong> St. Mark Church Encyclopedia (Heliopolis, Cairo)</li>
            </ul>

            <h3>Affiliation</h3>
            <p>
              This app is provided as part of a spiritual ministry and is affiliated with
              <strong>St. Mark Church, Heliopolis (Egypt)</strong>.
            </p>
          </section>
        </ion-content>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonContent,
  IonPage,
  IonModal,
  IonDatetime,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonToggle,
  IonRange,
  IonMenuButton,
  IonActionSheet,
  IonIcon
} from '@ionic/vue'

import { onMounted, onBeforeUnmount, ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Papa from 'papaparse'
import html2canvas from 'html2canvas'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { useIonRouter } from '@ionic/vue'

import CopticSection from '@/components/CopticSection.vue'
import StreakRewards from '@/components/StreakRewards.vue'

import { shareOutline, volumeHighOutline, bookOutline } from 'ionicons/icons'
import { readDayCache, writeDayCache } from '@/utils/dayCache'
import { scheduleDailyReminder, disableDailyReminder, sendTestReminder } from '@/services/reminder'

import { listenReactions, toggleHeart } from '@/services/reactions'

type Lang = 'ar' | 'en'
const lang = ref<Lang>((localStorage.getItem('mk_lang') as Lang) || 'ar')
const isArabic = computed(() => lang.value === 'ar')
const pageDir = computed(() => (isArabic.value ? 'rtl' : 'ltr'))

const router = useRouter()
const route = useRoute()

function setLang(v: Lang) {
  lang.value = v
  localStorage.setItem('mk_lang', v)

  // remove lang query if present so it doesn't override later
  const q = { ...route.query }
  if ((q as any).lang) delete (q as any).lang
  router.replace({ query: q })

  const iso = String(selectedDateISO.value).substring(0, 10)
  loadByDate(iso).catch(console.error)
}

const ionRouter = useIonRouter()
onMounted(() => {
  App.addListener('backButton', () => {
    if (!ionRouter.canGoBack()) App.exitApp()
  })
})

function applyLangFromQueryOnce() {
  const qLang = typeof route.query.lang === 'string' ? route.query.lang : ''
  if (qLang === 'en' || qLang === 'ar') {
    lang.value = qLang as Lang
    localStorage.setItem('mk_lang', lang.value)

    const q = { ...route.query }
    delete (q as any).lang
    router.replace({ query: q })
  }
}

const allowFuture = computed(() => route.query.debugFuture === '1')

// ====== Settings modal ======
const showSettings = ref(false)
const showAbout = ref(false)

watch(
  () => route.query.lang,
  () => applyLangFromQueryOnce(),
  { immediate: true }
)

watch(
  () => route.query.modal,
  (v) => {
    showSettings.value = v === 'settings'
    showAbout.value = v === 'about'
  },
  { immediate: true }
)

function closeSettings() {
  showSettings.value = false
  const q = { ...route.query }
  delete (q as any).modal
  router.replace({ query: q })
}

function closeAbout() {
  showAbout.value = false
  const q = { ...route.query }
  delete (q as any).modal
  router.replace({ query: q })
}

// ====== Share sheet ======
const showShareSheet = ref(false)
const captureRef = ref<HTMLElement | null>(null)
const isCapturing = ref(false)

const isWeb = computed(() => !Capacitor.isNativePlatform())

async function shareAsImageWeb() {
  if (noData.value || isLoading.value) return

  showShareSheet.value = false
  await new Promise(r => setTimeout(r, 50))

  const el = captureRef.value
  if (!el) return

  const wrap = el.querySelector('.wrap') as HTMLElement | null
  if (!wrap) return

  isCapturing.value = true
  await new Promise(requestAnimationFrame)

  const prevWrapTransform = wrap.style.transform
  wrap.style.transform = 'none'

  try {
    await (document as any).fonts?.ready

    const canvas = await html2canvas(wrap, {
      backgroundColor: '#ffffff',
      useCORS: true,
      scale: Math.min(3, window.devicePixelRatio * 2)
    })

    const blob: Blob | null = await new Promise(resolve =>
      canvas.toBlob(b => resolve(b), 'image/png')
    )

    if (!blob || blob.size < 1000) {
      alert('فشل إنشاء الصورة')
      return
    }

    const fileName = `ma3an-kol-youm-${Date.now()}.png`
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  } finally {
    wrap.style.transform = prevWrapTransform || ''
    isCapturing.value = false
  }
}

const shareButtons = computed(() => {
  // ✅ Web: text + image
  if (isWeb.value) {
    return [
      { text: 'مشاركة كنص', handler: () => { void shareAsText() } },
      { text: 'مشاركة كصورة', handler: () => { void shareAsImageWeb() } },
      { text: 'إلغاء', role: 'cancel' }
    ]
  }
  // ✅ Mobile: text only
  return [
    { text: 'مشاركة كنص', handler: () => { void shareAsText() } },
    { text: 'إلغاء', role: 'cancel' }
  ]
})

// ====== Content base ======
const APP_BASE_URL = new URL(import.meta.env.BASE_URL, window.location.origin).toString()
const CONTENT_BASE = Capacitor.isNativePlatform()
  ? 'https://nancyhenry89.github.io/ma3ankolyoum/content'
  : new URL('content', APP_BASE_URL).toString().replace(/\/$/, '')

// ====== Sheets ======
const SHEET_CSV_URL_AR =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vRzBoz5JKy5BfRIXlo_rOSIYsce_9oXsLG9R07CvC3-MztLmg3vv7EYoNLFdt9YmL21tv8XYevOxedh/pub?gid=0&single=true&output=csv'

const SHEET_CSV_URL_EN =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vRWXF9eFCtpOgzUaGeiNL4_j7_5naGVewHbW4iwU-l4FqQmv0b_25Snb__igfxess03wAjdJ6A9vThP/pub?gid=0&single=true&output=csv'

const sheetUrl = computed(() => (lang.value === 'en' ? SHEET_CSV_URL_EN : SHEET_CSV_URL_AR))

function todayISO(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// ====== UI strings ======
const ui = computed(() => {
  if (lang.value === 'en') {
    return {
      share: 'Share',
      reflection: 'Meditation',
      bible: 'Bible',
      agbia: 'Agpeya',
      training: 'A Step Forward',
      comingSoon: 'Coming soon on',

      noData: 'No data available for this day.',
      noSaint: 'No Synaxarium for today.',
      noStory: 'No story for today.',
      noVerse: 'No verse for today.',
      noReflection: 'No reflection for today.',
      noBible: 'No Bible readings for today.',
      noAgbia: 'No Agpeya reading for today.',
      noTraining: 'No training for today.',

      pickDay: 'Pick a day',
      close: 'Close',
      noFutureHint: 'You cannot select days after today.',

      settings: 'Settings',
      darkMode: 'Dark mode',
      fontSize: 'Font size',
      dailyReminder: 'Daily reminder to read today’s message',
      reminderTime: 'Reminder time',
      testNotify: 'Test notification now',
      settingsHint: 'Settings are saved automatically on this device.',

      about: 'About'
    }
  }

  return {
    share: 'مشاركة',
    reflection: 'التأمل',
    bible: 'الكتاب المقدس',
    agbia: 'الأجبية',
    training: 'خطوة لقدام',
    comingSoon: 'قريباً علي',

    noData: 'لا توجد بيانات متاحة لهذا اليوم.',
    noSaint: 'لا يوجد سنكسار لهذا اليوم.',
    noStory: 'لا توجد قصة لهذا اليوم.',
    noVerse: 'لا توجد آية محددة لهذا اليوم.',
    noReflection: 'لا يوجد تأمل لهذا اليوم.',
    noBible: 'لا توجد قراءات كتاب مقدس مسجَّلة لهذا اليوم.',
    noAgbia: 'لا توجد قراءة من الأجبية لهذا اليوم.',
    noTraining: 'لا يوجد تدريب محدد لهذا اليوم.',

    pickDay: 'اختر يوم',
    close: 'إغلاق',
    noFutureHint: 'لا يمكن اختيار أيام بعد تاريخ اليوم.',

    settings: 'الإعدادات',
    darkMode: 'الوضع الليلي',
    fontSize: 'حجم الخط',
    dailyReminder: 'تذكير يومي لقراءة رسالة اليوم',
    reminderTime: 'وقت التذكير',
    testNotify: 'جرّب إشعار الآن',
    settingsHint: 'الإعدادات بتتخزن تلقائيًا على الجهاز.',

    about: 'عن التطبيق'
  }
})

// ====== Theme + Font scale (persist) ======
type ThemeMode = 'light' | 'dark'
const theme = ref<ThemeMode>((localStorage.getItem('mk_theme') as ThemeMode) || 'light')
const fontScale = ref<number>(Number(localStorage.getItem('mk_fontScale') || '1'))
const reminderEnabled = ref(localStorage.getItem('mk_reminder_enabled') === '1')
const reminderTime = ref(localStorage.getItem('mk_reminder_time') || '09:00')

const themeClass = computed(() => (theme.value === 'dark' ? 'theme-dark' : 'theme-light'))

function applyPrefs() {
  document.documentElement.setAttribute('data-mk-theme', theme.value)
}

function toggleTheme(ev: any) {
  theme.value = ev.detail.checked ? 'dark' : 'light'
  localStorage.setItem('mk_theme', theme.value)
  applyPrefs()
}

function onFontScale(ev: any) {
  const v = Number(ev?.detail?.value)
  fontScale.value = Number.isFinite(v) ? v : 1
  localStorage.setItem('mk_fontScale', String(fontScale.value))
}

// ====== Date picker ======
const showDatePicker = ref(false)
const selectedDateISO = ref(todayISO())
const nowTick = ref(Date.now())

onMounted(() => {
  setInterval(() => { nowTick.value = Date.now() }, 60_000)
})

const todayISOComputed = computed(() => {
  nowTick.value
  return todayISO()
})

const isTodaySelected = computed(() => {
  return String(selectedDateISO.value).substring(0, 10) === todayISOComputed.value
})

function onDateChange(ev: any) {
  const iso = String(ev.detail.value || '').substring(0, 10)
  if (!iso) return
  if (!allowFuture.value && iso > todayISOComputed.value) return

  selectedDateISO.value = iso
  showDatePicker.value = false
  loadByDate(iso)
}

/* ============================
   Reactions (FIXED + expanded)
============================ */
type ReactKey = 'story' | 'verse' | 'reflection' | 'training'

const reactCounts = ref<Record<ReactKey, { heart: number }>>({
  story: { heart: 0 },
  verse: { heart: 0 },
  reflection: { heart: 0 },
  training: { heart: 0 }
})

let unSubs: Array<() => void> = []

function makeItemId(kind: ReactKey) {
  const iso = String(selectedDateISO.value).substring(0, 10)
  return `${iso}:${kind}`
}

function resubscribeReactions() {
  unSubs.forEach(fn => fn?.())
  unSubs = []

  const keys: ReactKey[] = ['story', 'verse', 'reflection', 'training']
  keys.forEach((k) => {
    const un = listenReactions(makeItemId(k), (counts: any) => {
      reactCounts.value[k].heart = Number(counts?.heart || 0)
    })
    if (typeof un === 'function') unSubs.push(un)
  })
}

watch(
  () => selectedDateISO.value,
  () => resubscribeReactions(),
  { immediate: true }
)

onBeforeUnmount(() => {
  unSubs.forEach(fn => fn?.())
  unSubs = []
})

async function onHeart(kind: ReactKey) {
  await toggleHeart(makeItemId(kind))
}
/* ============================
   End reactions
============================ */

// ====== Reminders ======
async function applyReminderSchedule() {
  if (isWeb.value) return
  if (!reminderEnabled.value) {
    await disableDailyReminder()
    return
  }

  const [h, m] = reminderTime.value.split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return
  await scheduleDailyReminder(h, m, lang.value)
}

async function onReminderToggle(ev: any) {
  reminderEnabled.value = !!ev.detail.checked
  localStorage.setItem('mk_reminder_enabled', reminderEnabled.value ? '1' : '0')
  await applyReminderSchedule()
}

watch(reminderTime, async () => {
  localStorage.setItem('mk_reminder_time', reminderTime.value)
  if (reminderEnabled.value) await applyReminderSchedule()
})

async function testReminder() {
  await sendTestReminder(lang.value)
}

// ====== Share as text ======
async function shareAsText() {
  if (noData.value || isLoading.value) return

  const lines: string[] = []
  lines.push(`${gregorianDate.value} – ${copticDate.value}`)

  if (saint.value) lines.push(`\nالسنكسار: ${saint.value}`)
  if (title.value) lines.push(`العنوان: ${title.value}`)

  if (story.value) {
    lines.push('\nالقصة:')
    lines.push(story.value)
  }

  if (verseText.value) {
    lines.push('\nالآية:')
    lines.push(`"${verseText.value}" ${verseRef.value || ''}`.trim())
  }

  if (reflection.value) {
    lines.push('\nالتأمل:')
    lines.push(reflection.value)
  }

  const bibleHead = previewLabel.value || bibleLabel.value
  const bibleTitleLine = previewTitle.value
  const sections = previewSections.value || []

  if (bibleHead || bibleTitleLine || sections.length) {
    lines.push('\nالكتاب المقدس:')
    if (bibleHead) lines.push(bibleHead)
    if (bibleTitleLine) lines.push(bibleTitleLine)
    if (sections.length) lines.push(sections.map(s => `• ${s}`).join('\n'))
  }

  if (agbia.value) {
    lines.push('\nالأجبية:')
    lines.push(agbia.value)
    if (agbia_author.value) lines.push(`(${agbia_author.value})`)
  }

  if (training.value) {
    lines.push('\nالتدريب:')
    lines.push(training.value)
  }

  const text = lines.join('\n')

  if ((navigator as any).share) {
    await (navigator as any).share({ title: 'معًا كل يوم', text })
  } else {
    await navigator.clipboard?.writeText(text)
    alert('تم نسخ النص للمشاركة ✅')
  }
}

// ====== Data state ======
const gregorianDate = ref('')
const copticDate = ref('')
const saint = ref('')
const saintStory = ref('')

const title = ref('')
const story = ref('')
const verseText = ref('')
const verseRef = ref('')
const reflection = ref('')

const training = ref('')

const announcement = ref('')
const hasAnnouncement = computed(() => !!String(announcement.value).trim())
// ===== Occasional (Announcement click -> audio page) =====
const occasional = ref('')         // filename from sheet column: occasional
const occasional_data = ref('')    // text from sheet column: occasional_data

const hasOccasional = computed(() => !!String(occasional.value).trim())

// render occasional_data with new lines + markdown support (same pipeline you use)
const occasionalHtml = computed(() => mdToSafeHtml(occasional_data.value))

function openOccasional() {
  if (!hasOccasional.value) return

  router.push({
    path: `/occasional/${encodeURIComponent(occasional.value.trim())}`,
    query: {
      title: announcement.value || '',         // عنوان الصفحة
      data: occasional_data.value || ''        // النص يظهر هناك
    }
  })
}

function applySpecialMarks(md: string) {
  md = md.replace(/\+\+([^\n]+?)\+\+/g, (_m, inner) => {
    return `<span class="mkSpecial plus">${escapeHtml(inner.trim())}</span>`
  })

  md = md.replace(/(?:--|–)([^\n]+?)(?:--|–)/g, (_m, inner) => {
    return `<span class="mkSpecial dash">${escapeHtml(inner.trim())}</span>`
  })

  return md
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function mdToSafeHtml(md: string) {
  try {
    if (!md) return ''
    const withSpecial = applySpecialMarks(String(md))
    const html = marked.parse(withSpecial, { breaks: true, gfm: true })
    return DOMPurify.sanitize(String(html), {
      USE_PROFILES: { html: true },
      ADD_TAGS: ['span'],
      ADD_ATTR: ['class']
    })
  } catch (e) {
    console.error('mdToSafeHtml error:', e)
    return `<p>${escapeHtml(String(md || ''))}</p>`
  }
}

const storyHtml = computed(() => mdToSafeHtml(story.value))
const reflectionHtml = computed(() => mdToSafeHtml(reflection.value))

// ===== Bible preview =====
type ChapterPreview = {
  bookName: string
  bookNameEn?: string
  chapter: number
  chapterTitle: string
  sections: { title: string }[]
}

const chapterPreview = ref<ChapterPreview | null>(null)

const bibleBookKey = ref('') // Matthew
const bibleChapter = ref<number>(1)
const bibleTitle = ref('')
const bibleItems = ref<string[]>([])
const bibleFromSheet = ref(false)
const bibleIsEmptyFromSheet = ref(false)

const bookNameMapAr: Record<string, string> = { Matthew: 'متى' }
const bookNameMapEn: Record<string, string> = { Matthew: 'Matthew' }

function getBookName(key: string) {
  const k = (key || '').trim()
  if (!k) return ''
  return isArabic.value ? (bookNameMapAr[k] || k) : (bookNameMapEn[k] || k)
}

const bibleLabel = computed(() => {
  const key = (bibleBookKey.value || '').trim()
  const ch = bibleChapter.value || 1
  const name = getBookName(key)
  return name ? `${name} ${ch}` : ''
})

const previewLabel = computed(() => {
  const ch = bibleChapter.value || 1
  const name = getBookName(bibleBookKey.value)
  return name ? `${name} ${ch}` : ''
})

const previewTitle = computed(() => chapterPreview.value?.chapterTitle || bibleTitle.value)

const previewSections = computed(() => {
  const list = chapterPreview.value?.sections?.map(s => s.title).filter(Boolean) || []
  return list.length ? list : bibleItems.value
})

async function loadChapterPreview(bookKey: string, chapter: number) {
  try {
    const slug = String(bookKey || 'Matthew').toLowerCase()
    const url = `${CONTENT_BASE}/bible/${slug}/${chapter}.json`

    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) {
      console.warn('Preview JSON not found:', url)
      chapterPreview.value = null
      return
    }

    const json = await res.json()
    chapterPreview.value = {
      bookName: String(json.bookName || ''),
      bookNameEn: String(json.bookNameEn || ''),
      chapter: Number(json.chapter || chapter),
      chapterTitle: String(json.chapterTitle || ''),
      sections: (json.sections || []).map((s: any) => ({ title: String(s.title || '') }))
    }
  } catch (e) {
    console.error('Failed to load chapter preview', e)
    chapterPreview.value = null
  }
}

// ===== Agbia =====
const agbia = ref('')
const agbia_author = ref('')

const agbia_baker = ref('')
const agbia_third = ref('')
const agbia_sixth = ref('')
const agbia_ninth = ref('')
const agbia_sunset = ref('')
const agbia_sleep = ref('')

const hasAnyAgbiaAudio = computed(() => {
  return !!(
    String(agbia_baker.value).trim() ||
    String(agbia_third.value).trim() ||
    String(agbia_sixth.value).trim() ||
    String(agbia_ninth.value).trim() ||
    String(agbia_sunset.value).trim() ||
    String(agbia_sleep.value).trim()
  )
})

// ===== Flags =====
const hasStory = computed(() => !!String(story.value).trim())
const hasSaint = computed(() => !!String(saint.value).trim())
const hasVerse = computed(() => !!String(verseText.value).trim())
const hasReflection = computed(() => !!String(reflection.value).trim())
const hasAgbia = computed(() => !!String(agbia.value).trim())
const hasTraining = computed(() => !!String(training.value).trim())
const hasBible = computed(() => bibleFromSheet.value)

const isLoading = ref(false)
const noData = ref(false)
const noDataMsg = ref('')

// ===== cache helpers =====
function cacheKey(iso: string) {
  return `${lang.value}:${String(iso).substring(0, 10)}`
}

function normalizeKeys(row: any) {
  const out: Record<string, any> = {}
  Object.keys(row || {}).forEach(k => {
    const nk = String(k).trim().toLowerCase().replace(/\s+/g, '_')
    out[nk] = row[k]
  })
  return out
}

function pick(row: any, ...keys: string[]) {
  for (const k of keys) {
    const kk = k.trim().toLowerCase().replace(/\s+/g, '_')
    if (row[kk] !== undefined && row[kk] !== null && String(row[kk]).trim() !== '') {
      return row[kk]
    }
  }
  return ''
}

function applyCachedDay(c: any) {
  gregorianDate.value = c.gregorianDate || ''
  copticDate.value = c.copticDate || ''
  saint.value = c.saint || ''
  saintStory.value = c.saintStory || ''
  announcement.value = c.announcement || ''
  occasional.value = c.occasional || ''
  occasional_data.value = c.occasional_data || ''

  title.value = c.title || ''
  story.value = c.story || ''
  verseText.value = c.verseText || ''
  verseRef.value = c.verseRef || ''
  reflection.value = c.reflection || ''

  bibleFromSheet.value = !!c.bibleFromSheet
  bibleIsEmptyFromSheet.value = !bibleFromSheet.value

  agbia.value = c.agbia || ''
  agbia_author.value = c.agbia_author || ''

  agbia_baker.value  = c.baker  || ''
  agbia_third.value  = c.third  || ''
  agbia_sixth.value  = c.sixth  || ''
  agbia_ninth.value  = c.ninth  || ''
  agbia_sunset.value = c.sunset || ''
  agbia_sleep.value  = c.sleep  || ''

  training.value = c.training || ''

  bibleBookKey.value = (c.bibleBookKey || 'Matthew').trim()
  bibleChapter.value = Number(c.bibleChapter || 1)
  bibleTitle.value = c.bibleTitle || ''
  bibleItems.value = Array.isArray(c.bibleItems) ? c.bibleItems : []

  if (bibleFromSheet.value) {
    loadChapterPreview(bibleBookKey.value, bibleChapter.value)
  } else {
    chapterPreview.value = null
  }
}

function clearData() {
  gregorianDate.value = ''
  copticDate.value = ''
  saint.value = ''
  saintStory.value = ''
  title.value = ''
  story.value = ''
  verseText.value = ''
  verseRef.value = ''
  reflection.value = ''
  agbia.value = ''
  agbia_author.value = ''
  training.value = ''
  announcement.value = ''
  occasional.value = ''
  occasional_data.value = ''

  bibleFromSheet.value = false
  bibleIsEmptyFromSheet.value = true
  chapterPreview.value = null

  bibleBookKey.value = ''
  bibleChapter.value = 1
  bibleTitle.value = ''
  bibleItems.value = []
}

// ===== rows cache =====
const rowsCache = ref<Record<Lang, any[] | null>>({ ar: null, en: null })

async function fetchRows() {
  const key = lang.value
  if (rowsCache.value[key]) return rowsCache.value[key]!

  const res = await fetch(sheetUrl.value, { cache: 'no-store' })
  const csv = await res.text()

  const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true })
  const rows = (parsed.data as any[])
    .map(r => normalizeKeys(r))
    .filter(r => r.date_iso)

  rowsCache.value[key] = rows
  return rows
}

function applyRow(rowRaw: any) {
  const row = normalizeKeys(rowRaw)

  gregorianDate.value = pick(row, 'gregorian', 'gregorian_date')
  copticDate.value = pick(row, 'coptic', 'coptic_date')
  saint.value = pick(row, 'saint')
  saintStory.value = pick(row, 'saint_story', 'saintstory', 'synaxarium', 'synaxarion')

  title.value = pick(row, 'title')
  story.value = pick(row, 'story')
  verseText.value = pick(row, 'verse_text', 'verse')

  const vr = pick(row, 'verse_ref', 'verse_reference')
  verseRef.value = vr ? `(${vr})` : ''

  reflection.value = pick(row, 'reflection')
  announcement.value = pick(row, 'announcement', 'إعلان', 'announcements')

  // Bible
  bibleBookKey.value = pick(row, 'bible_book', 'book_key') || 'Matthew'
  const chRaw = String(pick(row, 'bible_chapter', 'chapter') || '').trim()
  const chNum = parseInt(chRaw, 10)
  bibleChapter.value = Number.isFinite(chNum) && chNum > 0 ? chNum : 1

  bibleTitle.value = pick(row, 'bible_title', 'chapter_title')
  const itemsRaw = pick(row, 'bible_items', 'items')

  const sheetBook = String(pick(row, 'bible_book', 'book_key') || '').trim()
  const sheetChapterRaw = String(pick(row, 'bible_chapter', 'chapter') || '').trim()
  const sheetTitle = String(pick(row, 'bible_title', 'chapter_title') || '').trim()
  const sheetItems = String(pick(row, 'bible_items', 'items') || '').trim()

  const sheetHasBible = !!sheetBook || !!sheetChapterRaw || !!sheetTitle || !!sheetItems
  bibleFromSheet.value = sheetHasBible
  bibleIsEmptyFromSheet.value = !sheetHasBible

  // Occasional
  occasional.value = pick(row, 'occasional', 'occasion', 'audio')
  occasional_data.value = pick(row, 'occasional_data', 'occasion_data', 'occasional text', 'occasion_text')

  if (!sheetHasBible) {
    chapterPreview.value = null
    bibleItems.value = []
    bibleTitle.value = ''
  } else {
    bibleItems.value = String(itemsRaw || '')
      .split('|')
      .map((s: string) => s.trim())
      .filter(Boolean)

    loadChapterPreview(bibleBookKey.value || 'Matthew', bibleChapter.value || 1)
  }

  // Agbia
  agbia.value = pick(row, 'agbia')
  agbia_author.value = pick(row, 'agbia_author', 'agbiaauthor', 'agbia_author_name', 'agbia_author_ar')

  agbia_baker.value  = pick(row, 'baker', 'agbia_baker')
  agbia_third.value  = pick(row, 'third', 'agbia_third')
  agbia_sixth.value  = pick(row, 'sixth', 'agbia_sixth')
  agbia_ninth.value  = pick(row, 'ninth', 'agbia_ninth')
  agbia_sunset.value = pick(row, 'sunset', 'agbia_sunset', 'ghoroub')
  agbia_sleep.value  = pick(row, 'sleep', 'agbia_sleep', 'noum')

  // Training
  training.value = pick(
    row,
    'training',
    'التدريب',
    'تدريب',
    'خطوة_لقدام',
    'خطوة_لقدام؟',
    'a_step_forward',
    'step_forward',
    'step'
  )
}

async function refreshHomeFromNetwork(targetISO: string) {
  const rows = await fetchRows()
  const toISO = (r: any) => String(r.date_iso || '').trim().substring(0, 10)

  let found = rows.find(r => toISO(r) === targetISO) || null

  if (!found) {
    const sorted = [...rows]
      .filter(r => toISO(r))
      .sort((a, b) => toISO(a).localeCompare(toISO(b)))
    found = sorted[sorted.length - 1] || null
  }

  if (!found) {
    clearData()
    noData.value = true
    noDataMsg.value = 'لا توجد بيانات متاحة لهذا اليوم.'
    return
  }

  applyRow(found)

  writeDayCache(cacheKey(targetISO), {
    dateISO: targetISO,
    gregorianDate: gregorianDate.value,
    copticDate: copticDate.value,
    saint: saint.value,
    saintStory: saintStory.value,
    title: title.value,
    story: story.value,
    verseText: verseText.value,
    verseRef: verseRef.value,
    reflection: reflection.value,
    agbia: agbia.value,
    agbia_author: agbia_author.value,
    training: training.value,
    bibleBookKey: bibleBookKey.value,
    bibleChapter: bibleChapter.value,
    bibleTitle: bibleTitle.value,
    bibleItems: bibleItems.value,
    bibleFromSheet: bibleFromSheet.value,
    announcement: announcement.value,
    occasional: occasional.value,
    occasional_data: occasional_data.value,

    baker: pick(normalizeKeys(found), 'baker') || '',
    third: pick(normalizeKeys(found), 'third') || '',
    sixth: pick(normalizeKeys(found), 'sixth') || '',
    ninth: pick(normalizeKeys(found), 'ninth') || '',
    sunset: pick(normalizeKeys(found), 'sunset') || '',
    sleep: pick(normalizeKeys(found), 'sleep') || '',
  })
}

async function loadByDate(dateISO: string) {
  const targetISO = String(dateISO).trim().substring(0, 10)

  const cached = readDayCache(cacheKey(targetISO))
  if (cached) {
    isLoading.value = false
    noData.value = false
    noDataMsg.value = ''
    applyCachedDay(cached)
    refreshHomeFromNetwork(targetISO).catch(console.error)
    return
  }

  isLoading.value = true
  noData.value = false
  noDataMsg.value = ''

  try {
    await refreshHomeFromNetwork(targetISO)
  } catch (e) {
    console.error(e)
    clearData()
    noData.value = true
    noDataMsg.value = 'حصلت مشكلة في تحميل البيانات. تأكد من الإنترنت.'
  } finally {
    isLoading.value = false
  }
}

// ===== Navigation =====
function openChapter() {
  if (!isArabic.value) return
  const bookKey = bibleBookKey.value || 'Matthew'
  const ch = bibleChapter.value || 1
  router.push(`/chapter/${bookKey}/${ch}`)
}

function openSaint() {
  if (!isArabic.value) return
  router.push(`/saint/${selectedDateISO.value}`)
}

function openAgbiaAudio() {
  if (!isArabic.value) return
  const iso = String(selectedDateISO.value).substring(0, 10)
  router.push({ path: `/agbia-audio/${iso}` })
}

// ===== init =====
const initialISO = String(selectedDateISO.value).substring(0, 10)
const cachedInit = readDayCache(cacheKey(initialISO))

if (cachedInit) {
  applyCachedDay(cachedInit)
  noData.value = false
  noDataMsg.value = ''
  isLoading.value = false
} else {
  isLoading.value = true
}

onMounted(() => {
  applyPrefs()
  applyLangFromQueryOnce()

  const queryDate = typeof route.query.date === 'string'
    ? route.query.date.substring(0, 10)
    : null

  if (queryDate) {
    if (!allowFuture.value && queryDate > todayISO()) return
    selectedDateISO.value = queryDate
    loadByDate(queryDate)
  } else {
    const iso = String(selectedDateISO.value).substring(0, 10)
    const cached = readDayCache(cacheKey(iso))
    if (cached) refreshHomeFromNetwork(iso).catch(console.error)
    else loadByDate(iso).catch(console.error)
  }

  if (!isWeb.value && reminderEnabled.value) {
    applyReminderSchedule().catch(console.error)
  }
})
</script>

<style scoped>
  /* =========================================================
     Theme variables (keep as-is)
  ========================================================= */
  .home.theme-light {
    --mk-bg1: #f4f7fb;
    --mk-bg2: #ffffff;
  
    --mk-text: #0b1f33;
    --mk-card: #ffffff;
  
    --mk-accent: #20b2aa;   /* teal */
    --mk-dark: #182a44;     /* indigo/navy */
    --mk-danger: #ff2a00;
  
    --mk-border: rgba(24,42,68,0.10);
    --mk-shadow: 0 8px 18px rgba(10,20,30,0.07);
    --mk-shadow-strong: 0 14px 28px rgba(10,20,30,0.10);
  
    --mk-soft: rgba(32,178,170,0.12);
    --mk-soft-border: rgba(32,178,170,0.28);
  }
  
  .home.theme-dark {
    --mk-bg1: #060b12;
    --mk-bg2: #0b1220;
  
    --mk-text: #f5f7fa;
    --mk-card: rgba(255,255,255,0.08);
  
    --mk-accent: #28d6cc;
    --mk-dark: #0f1b2f;
    --mk-danger: #ff7a7a;
  
    --mk-border: rgba(255,255,255,0.14);
    --mk-shadow: 0 14px 28px rgba(0,0,0,0.45);
    --mk-shadow-strong: 0 18px 34px rgba(0,0,0,0.60);
  
    --mk-soft: rgba(40,214,204,0.20);
    --mk-soft-border: rgba(40,214,204,0.35);
  }
  
  /* =========================================================
     Global / Layout
  ========================================================= */
  .home {
    font-family: "Noto Naskh Arabic", system-ui, sans-serif;
    letter-spacing: 0;
  }
  .content { color: var(--mk-text); }
  
  .home.theme-dark,
  .home.theme-dark .content,
  .home.theme-dark .text,
  .home.theme-dark .mini-body,
  .home.theme-dark .mini-list,
  .home.theme-dark .mini-sub,
  .home.theme-dark .brand,
  .home.theme-dark .title {
    color: var(--mk-text);
  }
  
  /* Background */
  .bg{
  position: absolute;
  inset: 0;
  min-height: 100%;
  background:
    radial-gradient(1200px 600px at 20% -10%, rgba(32,178,170,0.22), transparent 60%),
    radial-gradient(900px 500px at 90% 0%, rgba(24,42,68,0.18), transparent 55%),
    linear-gradient(to bottom, var(--mk-bg1), var(--mk-bg2));
  z-index: 0;
  pointer-events: none;
}

  .wrap {
    position: relative;
    z-index: 1;
    padding: calc(env(safe-area-inset-top) + 22px) 16px 0;
    max-width: 720px;
    margin: 0 auto;

  }
  .capture.home{
  position: relative;
  overflow: visible; /* خليها visible عشان الصفحة تكمل */
}

/* وقت الالتقاط بس */
.capture.home.mk-capturing{
  overflow: hidden;
}


  .capture {  margin: 0 auto; }
  
  /* =========================================================
     Unified gradients (what you asked for)
  ========================================================= */
  /* Clickable (Saint + Bible title + Agbia title) */
  .home {
    --mk-clickable-grad:
      radial-gradient(600px 200px at 20% 0%, rgba(32,178,170,0.35), transparent 60%),
      linear-gradient(135deg, var(--mk-dark), rgba(16,27,47,0.90));
  }
  
  /* Verse + Training gradient: 28d6cc -> white */
  .home {
  --mk-soft-grad:
    radial-gradient(700px 240px at 15% 0%, rgba(40, 214, 204, 0.38), rgba(255, 255, 255, 0) 62%),
    linear-gradient(135deg, #28d6cc30, #f0f0f0);

}


/* أهم النصوص */
.brand{ font-size: calc(20px * var(--mk-fontScale)); }
.brand_name{ font-size: calc(16px * var(--mk-fontScale)); }
.brand .accent{ font-size: calc(14px * var(--mk-fontScale)); }
.abouna{ font-size: calc(15px * var(--mk-fontScale)); }

.dates{ font-size: calc(16px * var(--mk-fontScale)); }
.saint{ font-size: calc(18px * var(--mk-fontScale)); }

.title{ font-size: calc(38px * var(--mk-fontScale)); }

.text{ font-size: calc(22px * var(--mk-fontScale)); }
.emptyMsg{ font-size: calc(18px * var(--mk-fontScale)); }

.verse-text{ font-size: calc(24px * var(--mk-fontScale)); }
.verse-ref{ font-size: calc(16px * var(--mk-fontScale)); }
.verse-empty{ font-size: calc(18px * var(--mk-fontScale)); }

.mini-sub{ font-size: calc(16px * var(--mk-fontScale)); }
.bible-pill{ font-size: calc(20px * var(--mk-fontScale)); }
.mini-title{ font-size: calc(18px * var(--mk-fontScale)); }
.mini-list{ font-size: calc(15px * var(--mk-fontScale)); }
.mini-body{ font-size: calc(19px * var(--mk-fontScale)); }
.mini-author{ font-size: calc(20px * var(--mk-fontScale)); }

.training-pill{ font-size: calc(20px * var(--mk-fontScale)); }
.training-text{ font-size: calc(20px * var(--mk-fontScale)); }
.card-title{ font-size: calc(20px * var(--mk-fontScale)); }

  /* =========================================================
     Header
  ========================================================= */
  .header {
    text-align: center;
    margin-bottom: 14px;
    position: relative;
  }
  
  .brand,
  .title,
  .mini-head {
    font-family: "Noto Kufi Arabic", system-ui, sans-serif;
  }
  
  .brand {
    font-weight: 900;
    color: var(--mk-text);
  }
  .brand_name { font-size: 16px; }
  .brand .accent { font-size: 14px; color: var(--mk-accent); }
  .abouna { font-size: 15px; }
  .mkSpecial{
  display: inline;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 900;
  background: rgba(40,214,204,0.18);
  border: 1px solid rgba(40,214,204,0.45);
  color: inherit;
}

.home.theme-dark .mkSpecial{
  background: rgba(56,242,229,0.14);
  border-color: rgba(56,242,229,0.22);
}

  .dates {
    margin-top: 6px;
    font-size: 16px;
    font-weight: 800;
    cursor: pointer;
    text-decoration: underline;
    opacity: 0.9;
    color: var(--mk-text);
    font-family:"Noto Kufi Arabic", system-ui, sans-serif;
  }
  
  /* =========================================================
     Clickable elements (Saint + Bible & Agbia titles)
  ========================================================= */
  .saint {
    margin: 10px 0;
    padding: 10px 12px;
    border-radius: 16px;
    font-size: 18px;
    font-weight: 900;
    cursor: pointer;
    font-family:"Noto Kufi Arabic", system-ui, sans-serif;
        background: var(--mk-clickable-grad);
    color: #ffffff;
    border: 1px solid rgba(255,255,255,0.16);
    box-shadow: var(--mk-shadow-strong);
  }
  
  /* Titles (Bible + Agbia) */
  .mini-head {
    width: 100%;
    border-radius: 14px;
    padding: 12px 12px;
    font-size: 20px;
    font-weight: 900;
    line-height: 1.2;
  
    background: var(--mk-clickable-grad);
    color: #ffffff;
    border: 1px solid rgba(255,255,255,0.16);
    box-shadow: var(--mk-shadow-strong);
  }
  
  /* header row (title + icon btn) */
  .mini-head-row{
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:10px;
  }
  
  /* audio icon in the mini-head */
  .audioBtn{
    margin:0;
    padding:0;
    min-width:auto;
    height:auto;
    color:#fff;
    opacity: 0.95;
  }
  .audioBtn[disabled]{ opacity:0.35; }
  .mini-head .audioBtn,
  .mini-head ion-icon { color:#fff !important; }
  
  /* =========================================================
     Title
  ========================================================= */
  .title {
    margin-top: 17px;
    line-height: 1.2;
    font-weight: 900;
    color: var(--mk-text);
  }
  .timeInput{
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid var(--mk-border);
  background: var(--mk-card);
  color: var(--mk-text);
  font-weight: 800;
  min-width: 140px;
}

  .announcement-card {
  margin: 10px 0 6px;
  padding: 14px 16px;
  border-radius: 16px;
  font-size: 15px;
  font-weight: 800;
  text-align: center;
  font-family:"Noto Kufi Arabic", system-ui, sans-serif;
    background: linear-gradient(135deg, #ffd166, #fff1c1);
  color: #3a2c00;
  box-shadow: var(--mk-shadow);
}
.home.theme-dark .announcement-card {
  background: linear-gradient(135deg, #ffd166, #bfa14a);
  color: #1a1400;
}
.langBtn{
  position: absolute;
  top: -4px;
  right: 0;
  opacity: 1;
  background: rgba(255,255,255,0.60);
  border-radius: 12px;
  backdrop-filter: blur(8px);
  padding: 6px 10px;
  z-index: 3;
}
.langFlag{
  font-size: 22px;     /* حجم العلم */
  line-height: 1;
  display: inline-block;
}

.langBtn{
  position: absolute;
  top: -4px;
  right: 0;
  opacity: 1;
  background: rgba(255,255,255,0.65);
  border-radius: 12px;
  backdrop-filter: blur(8px);
  padding: 6px 8px;
  z-index: 3;
}

.home.theme-dark .langBtn{
  background: rgba(0,0,0,0.35);
}
.langFlag{
  font-size: 22px;     /* حجم العلم */
  line-height: 1;
  display: inline-block;
}

.langBtn{
  position: absolute;
  top: -4px;
  right: 0;
  opacity: 1;
  background: rgba(255,255,255,0.65);
  border-radius: 12px;
  backdrop-filter: blur(8px);
  padding: 6px 8px;
  z-index: 3;
}

.home.theme-dark .langBtn{
  background: rgba(0,0,0,0.35);
}

.home.theme-dark .langBtn{
  background: rgba(0,0,0,0.30);
}
.langTxt{ font-weight: 900; letter-spacing: 0.5px; }

.home.lang-en .text,
.home.lang-en .mini-body,
.home.lang-en .mini-list{
  text-align: left;
}
.home.lang-en .alignRight{ text-align: left; }

  /* =========================================================
     Cards
  ========================================================= */
  .card,
  .mini-card {
    background: var(--mk-card);
    border-radius: 18px;
    border: 1px solid var(--mk-border);
    box-shadow: var(--mk-shadow);
    font-weight: bold;
  }
  
  .home.theme-dark .card,
  .home.theme-dark .mini-card {
    background: rgba(255,255,255,0.06);
  }
  
  .card {
    padding: 20px 18px;
    margin: 12px 0;
    font-family:"Noto Kufi Arabic", system-ui, sans-serif;  }
  
  .text {
    line-height: 2;
    color: var(--mk-text);

  white-space: pre-line;

  }
  /* Markdown content */
.md{
  white-space: normal; /* لأن marked بيطلع <p> */
}

.md p{
  margin: 0 0 12px;
}

.md p:last-child{
  margin-bottom: 0;
}

.md strong{
  font-weight: 1000;
}

.md em{
  font-style: italic;
}

.md a{
  color: var(--mk-accent);
  font-weight: 900;
  text-decoration: underline;
}

.md ul, .md ol{
  margin: 10px 0;
  padding-right: 22px; /* RTL */
}

.md blockquote{
  margin: 10px 0;
  padding: 10px 12px;
  border-right: 4px solid var(--mk-accent);
  background: rgba(0,0,0,0.03);
  border-radius: 12px;
}

.home.theme-dark .md blockquote{
  background: rgba(255,255,255,0.06);
}

  .alignRight { text-align: right; }
  
  /* =========================================================
     Verse (gradient 28d6cc -> white)
  ========================================================= */
  .verse {
    border-radius: 18px;
    padding: 16px 44px;
    text-align: center;
    margin: 12px 0;
    position: relative;
    overflow: hidden;
  
    background: var(--mk-soft-grad);
    box-shadow: var(--mk-shadow-strong);
  }
  
  /* decorative quote but subtle */
  .verse::before {
    content: "“";
    position: absolute;
    top: -18px;
    right: 14px;
    font-size: 90px;
    opacity: 0.10;
    color: rgba(24,42,68,0.85);
    font-family: "Amiri", serif;
  }
  
  .verse-text {
    font-family: "Amiri", "Noto Naskh Arabic", serif;
    font-size: 24px;
    font-weight: 700;
    line-height: 2;
    color: #0b1f33; /* readable on white */
  }
  
  .verse-ref {
    margin-top: 6px;
    font-family: "Amiri", "Noto Naskh Arabic", serif;
    font-size: 16px;
    font-weight: 800;
    color: #061018;
  }
  
  /* Dark mode: keep it readable (same grad but text switches) */

  .home.theme-dark .verse-text { color: #061018; }
  .home.theme-dark .verse-ref { color: #061018; }
  .home.theme-dark .verse::before { color: rgba(6,16,24,0.8); }
  
  /* =========================================================
     Row cards (Bible + Agbia)
  ========================================================= */
  .row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-top: 12px;
  }
  
  .mini-card {
    padding: 14px 14px 16px;
    text-align: center;
  }
  
  .mini-click {
    width: 100%;
    cursor: pointer;
  }
  .emptyMsg {
  opacity: 0.7;
  font-size: 18px;
}

.verse-empty {
  font-size: 18px;
  font-weight: 700;
  color: #061018;
}
.home.theme-dark .verse-empty {
  color: #061018;
}

  .mini-card.mini-click{
    display: flex;
    flex-direction: column;
    justify-content: flex-sart;
    gap: 10px;
  }
  .mini-card.mini-click:active { transform: translateY(1px); }
  
  /* “متى 2” */
  .mini-sub {
    margin-top: 2px;
    font-size: 16px;
    font-weight: 800;
    opacity: 0.9;
    color: var(--mk-text);
  }
  
  /* optional pill styling */
  .bible-pill{
    background:
      radial-gradient(360px 120px at 20% 0%, rgba(32,178,170,0.38), transparent 65%),
      linear-gradient(135deg, #20b2aa, #0f2238);
    color:#fff;
    font-weight: 900;
    border-radius: 14px;
    padding: 10px 18px;
    font-size: 20px;
    display: inline-block;
    margin-bottom: 12px;
    width: 50%;
    margin-inline: auto;
    font-family:"Noto Kufi Arabic", system-ui, sans-serif;
  }
  
  /* chapter title line */
  .mini-title{
    color: var(--mk-accent);
    font-size: 18px;
    font-weight: 900;
    line-height: 1.35;
    margin-top: 2px;
    font-family:"Noto Kufi Arabic", system-ui, sans-serif;
  }
  .disabledCard {
  opacity: 0.7;
  cursor: default;
}

  /* list */
  .mini-list{
    margin-top: 8px;
    padding: 0;
    list-style: none;
    text-align: right;
    font-size: 15px;
    line-height: 1.85;
    color: var(--mk-text);
    font-family:"Noto Kufi Arabic", system-ui, sans-serif;  }
  
  .mini-list li{
    position: relative;
    padding-right: 18px;
    margin: 6px 0;
    opacity: 0.95;
  }
  .mini-list li::before{
    content: "•";
    position: absolute;
    right: 0;
    top: 0;
    font-weight: 900;
    color: var(--mk-accent);
    opacity: 0.9;
  }
  
  .mini-body {
    font-size: 19px;
    line-height: 2;
    margin-top: 10px;
    color: var(--mk-text);
    padding:10px;
    font-family:"Noto Kufi Arabic", system-ui, sans-serif;  }
  .mini-author {
    margin-top: 8px;
    font-weight: 900;
    color: var(--mk-danger);
    font-family: "Amiri", "Noto Naskh Arabic", serif;
    font-size:20px
  }
  
.text.alignRight {
    text-align: justify;
}
  /* =========================================================
     Training (gradient 28d6cc -> white)
  ========================================================= */
  .training {
    margin-top: 16px;
    padding: 18px 16px 22px;
    border-radius: 18px;
    text-align: center;
    position: relative;
    overflow: hidden;
  
    background: var(--mk-soft-grad);
    box-shadow: var(--mk-shadow-strong);
  }
  
  /* subtle decoration */

  .disabledSaint {
  cursor: default;
  opacity: 0.65;
  filter: grayscale(0.1);
}

.saint.clickable {
  cursor: pointer;
}

.saint:not(.clickable) {
  pointer-events: none; /* extra safety */
}

  .training-pill{
    color: #20b2aa;
    font-weight: 900;
    border-radius: 14px;
    padding: 8px 18px;
    font-size: 20px;
    display: inline-block;
    margin-bottom: 12px;
    font-family:"Noto Kufi Arabic", system-ui, sans-serif;

  }
  .training-pill{
    color: #20b2aa;
    font-weight: 900;
    border-radius: 14px;
    padding: 8px 18px;
    font-size: 20px;
    display: inline-block;
    margin-bottom: 12px;

  }
  .card-title{
    color: #20b2aa;
    font-weight: 900;
    border-radius: 14px;
    padding: 8px 18px;
    font-size: 20px;
    display: inline-block;
    text-align: center;
    width:100%;
    font-family:"Noto Kufi Arabic", system-ui, sans-serif;

  }
  .training-text{
    font-size: 20px;
    line-height: 2;
    font-weight: 900;
    color: #0b1f33;
    text-align:center;
    font-family:"Noto Kufi Arabic", system-ui, sans-serif;  }
  
  /* Dark mode for training */

  .home.theme-dark .training-text { color: #061018; }
  .home.theme-dark .training-pill {
    color: #061018;

  }
  .home.theme-dark .training::before { color: rgba(6,16,24,0.8); }
  
  /* =========================================================
     Misc
  ========================================================= */
  .space { height: 24px; }
  
  .hint {
    margin-top: 12px;
    font-size: 14px;
    opacity: 0.8;
    text-align: center;
  }
  
  /* Settings rows */
  .settingsRow {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    padding: 12px 0;
    border-bottom: 1px solid rgba(0,0,0,0.08);
  }
  .home.theme-dark .settingsRow {
    border-bottom-color: rgba(255,255,255,0.12);
  }
  .settingsLabel { font-weight: 800; }
  
  .rangeWrap {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 220px;
  }
  .rangeValue {
    font-weight: 800;
    min-width: 48px;
    text-align: left;
  }
  
  /* Burger */
  .burgerBtn{
    position: absolute;
    top: -4px;
    left: 0;
    color: #fff;
    background:#0f1b2f;
    border-radius: 12px;
    backdrop-filter: blur(8px);
    padding: 6px;
  }
  .home.theme-dark .burgerBtn{
    background: rgba(0,0,0,0.30);
  }
  
  /* Share btn (you had opacity:0 — keeping your behavior) */
  .shareBtn{
    opacity: 0;
    position: absolute;
    top: -4px;
    right: 160px;
    color: var(--mk-text);
    background: rgba(255,255,255,0.60);
    border-radius: 12px;
    backdrop-filter: blur(8px);
  }
  .home.theme-dark .shareBtn{
    background: rgba(0,0,0,0.30);
  }
  
  /* ActionSheet center */
  :deep(ion-action-sheet.share-sheet .action-sheet-wrapper),
  :deep(.share-sheet .action-sheet-wrapper),
  :deep(.share-sheet .action-sheet-container),
  :deep(.share-sheet .action-sheet-group),
  :deep(.share-sheet .action-sheet-button) {
    text-align: center !important;
  }
  :deep(.share-sheet .action-sheet-button) { justify-content: center !important; }
  :deep(.share-sheet .action-sheet-button .action-sheet-button-inner),
  :deep(.share-sheet .action-sheet-button-inner) {
    justify-content: center !important;
  }
  :deep(.share-sheet .action-sheet-title),
  :deep(.share-sheet .action-sheet-header) {
    text-align: center !important;
  }
  
  /* Skeleton alignment (RTL friendly) */
  .skeleton{
    margin: 10px 0;
    width: 100%;
  }
  .skeleton-line{
    margin-right: 0;
    margin-left: auto;
  }
  .skeleton-line.short{
    width: 60%;
    margin-right: 0;
    margin-left: auto;
  }
  
  .home.theme-light .skeleton,
  .home.theme-light .skeleton-line{
    background: linear-gradient(90deg, rgba(0,0,0,0.06), rgba(0,0,0,0.10), rgba(0,0,0,0.06));
  }
  
  @keyframes sk{
    0%{ filter: brightness(1); }
    50%{ filter: brightness(1.25); }
    100%{ filter: brightness(1); }
  }
  .titleSk{ height: 44px; width: 100%; border-radius: 18px; }
  
  .capture-clone {
    position: fixed;
    top: 0;
    left: 0;
    z-index: -1;
    pointer-events: none;
  }
  .storesSoon{
  margin: 18px 0 6px;
  text-align: center;
  padding: 16px 14px;
  border-radius: 18px;

}

.storesTitle{
  font-family: "Noto Kufi Arabic", system-ui, sans-serif;
  font-size: 18px;
  font-weight: 900;
  margin-bottom: 10px;
  color: var(--mk-text);
}

.storesRow{
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

.storeBadge{
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  padding: 8px 10px;
  background: rgba(0,0,0,0.03);
  border: 1px solid rgba(0,0,0,0.06);
}
.announcement-card.hasOccasional{
  position: relative;
  cursor: pointer;

  background:linear-gradient(-45deg, rgb(0 142 135 / 31%), rgb(32 38 178 / 31%), rgb(0 146 146 / 29%), rgb(224 165 18 / 36%));
  background-size: 300% 300%;
  animation: occasionalGlow 14s ease-in-out infinite;

  color: var(--mk-text);
  box-shadow: -2px 0px 20px 0px rgba(0,147,255,0.28);
}

@keyframes occasionalGlow {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

/* Dark mode */
.home.theme-dark .announcement-card.hasOccasional{
  background: linear-gradient(
    -45deg,
    rgba(40,214,204,0.28),
    rgba(32,178,170,0.22),
    rgba(255,255,255,0.08),
    rgba(40,214,204,0.28)
  );
  background-size: 300% 300%;
  animation: occasionalGlowDark 16s ease-in-out infinite;

  border-color: rgba(40,214,204,0.35);
  color: var(--mk-text);
  box-shadow: 0 0 24px rgba(40,214,204,0.22);
}

@keyframes occasionalGlowDark {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

/* Press feedback */
.announcement-card.hasOccasional:active{
  transform: translateY(1px);
}

.home.theme-dark .storeBadge{
  background: rgba(255,255,255,0.06);
  border-color: rgba(255,255,255,0.12);
}
/* ===== Reactions (Option F: glass chip) ===== */
.reactRow{
  display:flex;
  justify-content:center;
  margin-top: 12px;
}

.heartBtn{
  appearance:none;
  border: 1px solid rgba(0,0,0,0.10);
  background: rgba(255,255,255,0.55);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  padding: 10px 14px;
  border-radius: 16px;
  display:inline-flex;
  align-items:center;
  gap:10px;
  cursor:pointer;
  font-weight: 900;
  font-size: 14px;
  color: var(--mk-text);
  box-shadow: 0 10px 24px rgba(0,0,0,0.10);
}

.home.theme-dark .heartBtn{
  border-color: rgba(255,255,255,0.14);
  background: rgba(0,0,0,0.18);
  box-shadow: 0 10px 24px rgba(0,0,0,0.45);
}

.heartBtn:active{ transform: translateY(1px); }

.heartBtn .count{
  background: rgba(32,178,170,0.18);
  border: 1px solid rgba(32,178,170,0.28);
  padding: 2px 8px;
  border-radius: 999px;
}
.home.theme-dark .heartBtn .count{
  background: rgba(40,214,204,0.14);
  border-color: rgba(40,214,204,0.22);
}

.storeBadge img{
  height: 44px;
  width: auto;
  display: block;
}
:deep(.md .mkSpecial){
  font-weight: 900;
  font-style: italic;
  color: #1ea19a;
}

/* ++ */
:deep(.md .mkSpecial.plus)::before{
  content: "+ ";
  font-weight: 900;
}

/* -- */
:deep(.md .mkSpecial.dash)::before{
  content: "— ";
  font-weight: 900;
}

.md li{
  margin: 6px 0;
}
/* ===== capture mode (LOCAL) ===== */
.capture.home.mk-capturing .mkNoCapture{
  display: none !important;
}

/* ============================
   EN overrides (MUST be last)
============================ */
.home.lang-en{
  font-family: "Inter", system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
}

/* أي عنصر كان متثبت له خط عربي → نعمل override في EN */
.home.lang-en .brand,
.home.lang-en .title,
.home.lang-en .mini-head,
.home.lang-en .storesTitle,
.home.lang-en .training-pill,
.home.lang-en .card-title{
  font-family: "Merriweather", serif !important;
}

.home.lang-en .dates,
.home.lang-en .text,
.home.lang-en .mini-body,
.home.lang-en .mini-list,
.home.lang-en .training-text,
.home.lang-en .verse-text,
.home.lang-en .verse-ref,
.home.lang-en .announcement-card,
.home.lang-en .settingsLabel,
.home.lang-en .hint{
  font-family: "Inter", system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif !important;
}

/* Coptic meaning in EN */
.home.lang-en :deep(.coptic .meaning-word){
  font-family: "Inter", system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif !important;
  font-weight: 700;
}

/* EN alignment */
.home.lang-en .alignRight{ text-align: left; }
.home.lang-en .mini-list{ text-align: left; }
.home.lang-en .mini-list li{
  padding-right: 0;
  padding-left: 18px;
}
.home.lang-en .training-text.alignRight {
    text-align: center!important;
}
.home.lang-en .mini-list li::before{
  right: auto;
  left: 0;
}


/* Titles can use Merriweather */
.home.lang-en .coptic-title,
.home.lang-en .srTitle,
.home.lang-en .card-title {
  font-family: "Merriweather", serif;
}
.announcement-card{
  white-space: pre-line;
}
/* Fine-tuning some elements */
.home.lang-en .meaning-word {
  font-family: "Inter", sans-serif;
  font-weight: 600;
}

.home.lang-en .srHeroTitle {
  font-family: "Merriweather", serif;
  font-weight: 700;
}

  /* =========================================================
     Mobile
  ========================================================= */
  @media (max-width: 420px) {
  .title { font-size: calc(34px * var(--mk-fontScale)); }
  .row { grid-template-columns: 1fr; }
}

  </style>
  