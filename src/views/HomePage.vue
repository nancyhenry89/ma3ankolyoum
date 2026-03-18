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
          <!-- =========================
               HEADER (DATA)
          ========================== -->
          <div class="header" v-if="!isLoading && !noData">
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

            <!-- Share (Web only) -->
            <ion-button
              v-if="isWeb"
              class="shareBtn mkNoCapture"
              fill="clear"
              size="small"
              @click="showShareSheet = true"
            >
              <IonIcon :icon="shareSocial" />
            </ion-button>

            <ion-action-sheet
              :is-open="showShareSheet"
              :header="ui.share"
              :cssClass="['share-sheet']"
              :buttons="shareButtons"
              @didDismiss="showShareSheet = false"
            />

            <!-- Web Bible 2026 -->
            <ion-button
              v-if="isWeb"
              class="bible2026Btn mkNoCapture"
              fill="clear"
              size="small"
              href="https://ma3ankolyoum.org/bible-2026"
              target="_blank"
              rel="noopener"
              aria-label="Bible 2026"
            >
              <span class="bibleIcon">📖</span>
            </ion-button>

            <!-- Brand -->
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

            <!-- Stores badges (Web only) -->
            <div class="storesSoon mkNoCapture" v-if="isWeb && !isLoading && !noData">
              <div class="storesTitle">{{ ui.comingSoon }}</div>

              <div class="storesRow mkNoCapture" aria-label="App Store and Google Play">
                <a
                  class="storeBadge"
                  href="https://apps.apple.com/app/%D9%85%D8%B9%D8%A7-%D9%83%D9%84-%D9%8A%D9%88%D9%85/id6756967997"
                  target="_blank"
                  rel="noopener"
                  aria-label="Download on the App Store"
                >
                  <img src="/badges/appstore.png" alt="Download on the App Store" />
                </a>

                <a
                  class="storeBadge"
                  href="https://play.google.com/store/apps/details?id=com.nancyhenry.ma3ankolyoum&pcampaignid=web_share"
                  target="_blank"
                  rel="noopener"
                  aria-label="Get it on Google Play"
                >
                  <img src="/badges/googleplay.png" alt="Get it on Google Play" />
                </a>
              </div>
            </div>

            <!-- Dates -->
            <div class="dates" @click="showDatePicker = true">
              {{ gregorianDate }} – {{ copticDate }}
            </div>

            <!-- Occasions -->
            <OccasionsSection
              class="mkNoCapture"
              :youtube-id="oc_vid"
              :title="oc_title"
              :sub-title="oc_sub_title"
              :content="oc_content"
              :media-url="oc_media"
              :bg-color="oc_bg"
              :lang="lang"
            />

            <!-- Daily Audio CTA (Arabic only) -->
            <div v-if="isArabic && hasDailyAudio" class="audioCtaWrap mkNoCapture">
              <button
                class="audioPill"
                type="button"
                @click="openDailyAudioPlayer()"
                aria-label="اسمع رسالة اليوم"
              >
                <span class="audioPillIcon">🎧</span>
                <span class="audioPillText">اسمع رسالة اليوم</span>
              </button>
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
              <div class="md" v-html="announcementHtml"></div>
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

          <!-- =========================
               HEADER (LOADING)
          ========================== -->
          <div class="header" v-else-if="isLoading">
            <div class="brand skeleton"></div>
            <div class="dates skeleton"></div>
            <div class="saint skeleton"></div>
            <div class="title skeleton titleSk"></div>
          </div>

          <!-- =========================
               HEADER (NO DATA)
          ========================== -->
          <div class="header" v-else>
            <div class="brand">معًا كل يوم</div>
            <div class="card" style="margin-top: 12px">
              <p class="text alignRight">{{ noDataMsg || ui.noData }}</p>
            </div>
          </div>

          <!-- =========================
               DAILY AUDIO MINI PLAYER (fixed)
               - keep INSIDE capture, outside header
          ========================== -->
          <div class="mkMiniPlayer mkNoCapture" :class="{ open: dailyAudioOpen }">
            <div class="mkMiniInner">
              <div class="mkMiniHead">
                <div class="mkMiniMeta">
                  <div class="mkMiniTitle">🎧 رسالة اليوم</div>
                  <div class="mkMiniSub">{{ gregorianDate }} – {{ copticDate }}</div>
                </div>

                <button
                  class="mkMiniClose"
                  type="button"
                  @click="closeDailyAudioPlayer()"
                  aria-label="إغلاق"
                >
                  ✕
                </button>
              </div>

              <audio
                ref="dailyAudioEl"
                class="mkAudioPlayer"
                :src="dailyAudioUrl"
                controls
                preload="none"
                controlsList="nodownload"
                @error="dailyAudioError = true"
              />

              <div v-if="dailyAudioError" class="mkAudioErr">
                تعذر تشغيل الملف.
              </div>
            </div>
          </div>

          <!-- spacer to keep content readable above player -->
          <div class="mkPlayerSpacer" :class="{ open: dailyAudioOpen }" />

          <!-- =========================
               STORY
          ========================== -->
          <div
            class="card shareable"
            v-if="!isLoading && !noData"
            :ref="(el) => setSectionEl('story', el)"
          >
            <div v-if="hasStory" class="text alignRight md" v-html="storyHtml"></div>
            <p v-else class="text alignRight emptyMsg">{{ ui.noStory }}</p>

            <div class="reactRow mkNoCapture" v-if="hasStory">
              <button
                class="heartBtn"
                :class="{ active: reactMine.story.heart }"
                @click="onHeart('story')"
              >
                ❤️ <span class="count">{{ reactCounts.story.heart }}</span>
              </button>
            </div>

            <ion-button
              class="sectionShareBtn mkNoCapture"
              fill="clear"
              size="small"
              @click.stop="shareSection('story')"
              aria-label="Share story"
            >
              <IonIcon :icon="shareSocial" />
            </ion-button>
          </div>

          <div class="card" v-else-if="isLoading">
            <div class="skeleton-line"></div>
            <div class="skeleton-line"></div>
            <div class="skeleton-line short"></div>
          </div>

          <!-- =========================
               VERSE
          ========================== -->
          <div
            class="verse shareable"
            v-if="!isLoading && !noData"
            :ref="(el) => setSectionEl('verse', el)"
          >
            <template v-if="hasVerse">
              <div class="verse-text">"{{ verseText }}"</div>
              <div class="verse-ref">{{ verseRef }}</div>
            </template>
            <div v-else class="verse-empty">{{ ui.noVerse }}</div>

            <div class="reactRow mkNoCapture" v-if="hasVerse">
              <button
                class="heartBtn"
                :class="{ active: reactMine.verse.heart }"
                @click="onHeart('verse')"
              >
                ❤️ <span class="count">{{ reactCounts.verse.heart }}</span>
              </button>
            </div>

            <ion-button
              class="sectionShareBtn mkNoCapture"
              fill="clear"
              size="small"
              @click.stop="shareSection('verse')"
              aria-label="Share verse"
            >
              <IonIcon :icon="shareSocial" />
            </ion-button>
          </div>

          <div class="card" v-else-if="isLoading">
            <div class="skeleton-line"></div>
            <div class="skeleton-line short"></div>
          </div>

          <!-- =========================
               REFLECTION
          ========================== -->
          <div
            class="card shareable"
            v-if="!isLoading && !noData"
            :ref="(el) => setSectionEl('reflection', el)"
          >
            <div v-if="hasReflection" class="text alignRight">
              <div class="card-title">{{ ui.reflection }}</div>
              <div class="md" v-html="reflectionHtml"></div>
            </div>

            <p v-else class="text alignRight emptyMsg">{{ ui.noReflection }}</p>

            <div class="reactRow mkNoCapture" v-if="hasReflection">
              <button
                class="heartBtn"
                :class="{ active: reactMine.reflection.heart }"
                @click="onHeart('reflection')"
              >
                ❤️ <span class="count">{{ reactCounts.reflection.heart }}</span>
              </button>
            </div>

            <ion-button
              class="sectionShareBtn mkNoCapture"
              fill="clear"
              size="small"
              @click.stop="shareSection('reflection')"
              aria-label="Share reflection"
            >
              <IonIcon :icon="shareSocial" />
            </ion-button>
          </div>

          <div class="card" v-else-if="isLoading">
            <div class="skeleton-line"></div>
            <div class="skeleton-line"></div>
            <div class="skeleton-line short"></div>
          </div>
          <DailyPrayerCTA />
          <!-- =========================
               TRAINING
          ========================== -->
          <div
            class="training shareable"
            v-if="!isLoading && !noData"
            :ref="(el) => setSectionEl('training', el)"
          >
            <div class="training-pill">{{ ui.training }}</div>

            <div v-if="hasTraining" class="training-text alignRight">
              {{ training }}
            </div>
            <div v-else class="training-text alignRight emptyMsg">
              {{ ui.noTraining }}
            </div>

            <div class="reactRow mkNoCapture" v-if="hasTraining">
              <button
                class="heartBtn"
                :class="{ active: reactMine.training.heart }"
                @click="onHeart('training')"
              >
                ❤️ <span class="count">{{ reactCounts.training.heart }}</span>
              </button>
            </div>

            <ion-button
              class="sectionShareBtn mkNoCapture"
              fill="clear"
              size="small"
              @click.stop="shareSection('training')"
              aria-label="Share training"
            >
              <IonIcon :icon="shareSocial" />
            </ion-button>
          </div>

          <div class="card" v-else-if="isLoading">
            <div class="skeleton-line"></div>
            <div class="skeleton-line short"></div>
          </div>

          <!-- =========================
               BIBLE + AGPEYA
          ========================== -->
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
                <div class="mini-sub bible-pill">{{ previewLabel }}</div>

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
              <div class="mini-head skeleton" style="height: 44px; width: 100%"></div>
              <div class="skeleton-line"></div>
              <div class="skeleton-line short"></div>
            </div>
            <div class="mini-card">
              <div class="mini-head skeleton" style="height: 44px; width: 100%"></div>
              <div class="skeleton-line"></div>
              <div class="skeleton-line short"></div>
            </div>
          </div>

          <!-- =========================
               COPTIC
          ========================== -->
          <CopticSection
            v-if="!isLoading && !noData"
            :dateISO="selectedDateISO"
            :contentBase="CONTENT_BASE"
            :lang="lang"
          />

          <div class="space"></div>

          <SpiritualNotesCard
            class="mkNoCapture"
            v-if="!isLoading && !noData && isTodaySelected"
            :todayISO="todayISO()"
            :lang="lang"
          />

          <div class="space"></div>

          <StreakRewards
           data-html2canvas-ignore="true"
            class="mkNoCapture"
            v-if="!isLoading && !noData && isTodaySelected"
            :todayISO="todayISO()"
            :lang="lang"
          />

          <!-- Stores badges (Web only) - single instance -->
          <div class="storesSoon mkNoCapture" v-if="isWeb && !isLoading && !noData">
            <div class="storesTitle">{{ ui.comingSoon }}</div>

            <div class="storesRow mkNoCapture" aria-label="App Store and Google Play">
              <a
                class="storeBadge"
                href="https://apps.apple.com/app/%D9%85%D8%B9%D8%A7-%D9%83%D9%84-%D9%8A%D9%88%D9%85/id6756967997"
                target="_blank"
                rel="noopener"
                aria-label="Download on the App Store"
              >
                <img src="/badges/appstore.png" alt="Download on the App Store" />
              </a>

              <a
                class="storeBadge"
                href="https://play.google.com/store/apps/details?id=com.nancyhenry.ma3ankolyoum&pcampaignid=web_share"
                target="_blank"
                rel="noopener"
                aria-label="Get it on Google Play"
              >
                <img src="/badges/googleplay.png" alt="Get it on Google Play" />
              </a>
            </div>
          </div>

          <div class="space"></div>
        </div>
        <!-- end wrap -->
      </div>
      <!-- end capture -->

      <!-- ✅ ShareShot for SECTION share (native only) -->
      <div v-if="!isWeb" class="shareShotWrap mkNoCapture" aria-hidden="true">
        <div class="shareShot" ref="sectionShotRef">
          <div class="shotTop">
            <div class="shotTitle">{{ isArabic ? 'معًا كل يوم' : 'Together Every Day' }}</div>
            <div class="shotDate">{{ gregorianDate }} – {{ copticDate }}</div>
          </div>

          <div class="shotBody">
            <template v-if="shotKind === 'story'">
              <div class="shotHeading">{{ isArabic ? 'القصة' : 'Story' }}</div>
              <div class="md" v-html="storyHtml"></div>
            </template>

            <template v-else-if="shotKind === 'verse'">
              <div class="shotHeading">{{ isArabic ? 'الآية' : 'Verse' }}</div>
              <div class="shotVerse">"{{ verseText }}"</div>
              <div class="shotVerseRef">{{ verseRef }}</div>
            </template>

            <template v-else-if="shotKind === 'reflection'">
              <div class="shotHeading">{{ isArabic ? 'التأمل' : 'Meditation' }}</div>
              <div class="md" v-html="reflectionHtml"></div>
            </template>

            <template v-else-if="shotKind === 'training'">
              <div class="shotHeading">{{ isArabic ? 'خطوة لقدام' : 'A Step Forward' }}</div>
              <div class="shotTraining">{{ training }}</div>
            </template>
          </div>

          <div class="shotFooter">
            <span>{{ title }}</span>
            <span class="shotSmall">{{ isArabic ? 'مشاركة' : 'Share' }}</span>
          </div>
        </div>
      </div>

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

      <HomePopup :enabled="isArabic" />
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
  IonActionSheet,
  IonIcon
} from '@ionic/vue'
import HomePopup from "@/components/HomePopup.vue"
import OccasionsSection from "@/components/OccasionsSection.vue"
import DailyPrayerCTA from "@/components/DailyPrayerCTA.vue"
import { onMounted, onBeforeUnmount, ref, computed, watch } from 'vue'
import { onIonViewDidEnter, onIonViewWillLeave } from '@ionic/vue'
import { useRouter, useRoute } from 'vue-router'
import Papa from 'papaparse'
import html2canvas from 'html2canvas'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { IonMenuButton } from '@ionic/vue'
import SpiritualNotesCard from "@/components/SpiritualNotesCard.vue";

import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { useIonRouter } from '@ionic/vue'

import CopticSection from '@/components/CopticSection.vue'
import StreakRewards from '@/components/StreakRewards.vue'

import { shareOutline, volumeHighOutline, bookOutline, shareSocial } from 'ionicons/icons'
import { readDayCache, writeDayCache } from '@/utils/dayCache'
import { scheduleDailyReminder, disableDailyReminder, sendTestReminder } from '@/services/reminder'

import { listenReactions, toggleHeart } from '@/services/reactions'
import { Share } from '@capacitor/share'
import { Filesystem, Directory } from '@capacitor/filesystem'

import { hasReminderPermission, resyncReminderIfNeeded,requestReminderPermission  } from '@/services/reminder'

import { nextTick } from "vue"

function getShareFooter(lang: 'ar' | 'en') {
  const android = 'https://play.google.com/store/apps/details?id=com.nancyhenry.ma3ankolyoum'
  const ios = 'https://apps.apple.com/app/%D9%85%D8%B9%D8%A7-%D9%83%D9%84-%D9%8A%D9%88%D9%85/id6756967997'
  const web = 'Ma3ankolyoum.org'

  if (lang === 'ar') {
    return [
      'معًا كل يوم – مع القمص يوحنا باقي',
      `🔗 Android: ${android}`,
      `🔗 iPhone: ${ios}`,
      `🔗 Web: ${web}`,
      '❤️ ابدأ يومك مع الله',
      '📲 تمت المشاركة من تطبيق “معًا كل يوم”',
    ].join('\n')
  }

  return [
    'Together Every Day – with Fr. Yohanna Baky',
    `🔗 Android: ${android}`,
    `🔗 iPhone: ${ios}`,
    `🔗 Web: ${web}`,
    '❤️ Start your day with God',
    '📲 Shared from the “Together Every Day” app',
  ].join('\n')
}
// ===== Daily Audio Mini Player (inline) =====
const dailyAudioOpen = ref(false)
const dailyAudioError = ref(false)
const dailyAudioEl = ref<HTMLAudioElement | null>(null)

const dailyAudioUrl = computed(() => {
  // daily_audio already contains full url from sheet
  return String(daily_audio.value || '').trim()
})

async function openDailyAudioPlayer() {
  if (!isArabic.value || !hasDailyAudio.value) return
  dailyAudioError.value = false
  dailyAudioOpen.value = true

  await nextTick()
  try {
    await dailyAudioEl.value?.play()
  } catch {
    // iOS might block autoplay; user can press play from controls
  }
}

function closeDailyAudioPlayer() {
  dailyAudioOpen.value = false
  try { dailyAudioEl.value?.pause() } catch {}
}

function buildSectionShareText(kind: ShareKind, lang: 'ar'|'en') {
  const sectionTitle =
    lang === 'ar'
      ? ({
          story:'القصة',
          verse:'الآية',
          reflection:'التأمل',
          training:'خطوة لقدّام',
          bible:'الكتاب المقدس',
          agbia:'الأجبية',
          coptic:'القبطي',
        } as const)[kind] || 'مشاركة'
      : ({
          story:'Story',
          verse:'Verse',
          reflection:'Meditation',
          training:'A Step Forward',
          bible:'Bible',
          agbia:'Agpeya',
          coptic:'Coptic',
        } as const)[kind] || 'Share'

  const sectionBody = getSectionPlainText(kind as any, lang)

  return [
    `${sectionTitle}`,
    '',
    sectionBody,
    '',
    '—',
    getShareFooter(lang),
  ].join('\n')
}

type SectionShareKind = 'story' | 'verse' | 'reflection' | 'training'

async function shareSectionText(kind: SectionShareKind, lang:'ar'|'en') {
  const text = buildSectionShareText(kind, lang)
  await Share.share({ title: lang === 'ar' ? 'معًا كل يوم' : 'Together Every Day', text })
}
function getSectionPlainText(kind: ShareKind, lang:'ar'|'en') {
  if (kind === 'verse') return `"${verseText.value}"\n${verseRef.value}`
  if (kind === 'training') return training.value || ''
  if (kind === 'story') return stripHtml(storyHtml.value || '')
  if (kind === 'reflection') return stripHtml(reflectionHtml.value || '')

  // ✅ اختياري: Bible/Agbia/Coptic كـ نص بسيط
  if (kind === 'bible') return `${previewLabel.value}\n${previewTitle.value}\n${(previewSections.value||[]).join('\n')}`.trim()
  if (kind === 'agbia') return [agbia.value, agbia_author.value ? `(${agbia_author.value})` : ''].filter(Boolean).join('\n')
  if (kind === 'coptic') return '' // لو مش عندك نص جاهز هنا

  return ''
}

function stripHtml(html: string) {
  const div = document.createElement('div')
  div.innerHTML = html
  return (div.textContent || div.innerText || '').trim()
}

const sectionShotRef = ref<HTMLElement | null>(null)
const shotKind = ref<ReactKey>('story') // reuse ReactKey: story/verse/reflection/training

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}

type Lang = 'ar' | 'en'
const lang = ref<Lang>((localStorage.getItem('mk_lang') as Lang) || 'ar')
const isArabic = computed(() => lang.value === 'ar')
const pageDir = computed(() => (isArabic.value ? 'rtl' : 'ltr'))

const router = useRouter()
const route = useRoute()

function setLang(v: Lang) {
  lang.value = v
  localStorage.setItem('mk_lang', v)

  // ✅ مهم: بلغ كل اللي بيسمع (TabsLayout وغيره)
  window.dispatchEvent(new CustomEvent('mk:lang-changed', { detail: v }))

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
function syncLangFromStorage() {
  const v = (localStorage.getItem('mk_lang') as any) === 'en' ? 'en' : 'ar'
  lang.value = v
}

onMounted(() => {
  const handler = () => {
    syncLangFromStorage()
    const iso = String(selectedDateISO.value).substring(0, 10)
    loadByDate(iso).catch(console.error)
  }

  window.addEventListener('mk:lang-changed', handler)
  onBeforeUnmount(() => window.removeEventListener('mk:lang-changed', handler))
})

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
type ShareKind = 'story' | 'verse' | 'reflection' | 'bible' | 'agbia' | 'coptic' | 'training'

const sectionEls = ref<Record<ShareKind, HTMLElement | null>>({
  story: null,
  verse: null,
  reflection: null,
  bible: null,
  agbia: null,
  coptic: null,
  training: null
})

import type { ComponentPublicInstance } from 'vue'

function setSectionEl(kind: ShareKind, el: Element | ComponentPublicInstance | null) {
  const dom =
    (el as any)?.$el instanceof HTMLElement
      ? ((el as any).$el as HTMLElement) // component root element
      : (el as any) instanceof HTMLElement
        ? ((el as any) as HTMLElement)  // normal element
        : null

  sectionEls.value[kind] = dom
}

const isWeb = computed(() => !Capacitor.isNativePlatform())
function forceHideNoCapture(root?: HTMLElement | null) {
  const scope: ParentNode = root || document;

  const els = Array.from(scope.querySelectorAll<HTMLElement>(".mkNoCapture"));

  // احفظ الستايل القديم
  const prev = new Map<HTMLElement, string | null>();

  for (const el of els) {
    prev.set(el, el.getAttribute("style"));
    el.style.setProperty("display", "none", "important");
  }

  // مهم: كمان اخفي أي streaks بالاسم لو حصل إن الكلاس مش راكب على root
  // (اختياري بس مفيد)
  const streaks = Array.from(document.querySelectorAll<HTMLElement>(".srCard, .srWrap, .srCardWrap"));
  for (const el of streaks) {
    if (!prev.has(el)) {
      prev.set(el, el.getAttribute("style"));
      el.style.setProperty("display", "none", "important");
    }
  }

  return () => {
    for (const [el, old] of prev.entries()) {
      if (old === null) el.removeAttribute("style");
      else el.setAttribute("style", old);
    }
  };
}

function raf2() {
  return new Promise<void>(resolve =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  );
}
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
  const restore = forceHideNoCapture(wrap)
  await raf2()
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
    restore()
    wrap.style.transform = prevWrapTransform || ''
    isCapturing.value = false
  }
}
async function shareSectionImage(kind: ShareKind) {
  if (noData.value || isLoading.value) return

  // ✅ Web: keep your current behavior (no change)
  if (isWeb.value) {
    const el = sectionEls.value[kind]
    if (!el) return
    isCapturing.value = true
    await new Promise(requestAnimationFrame)
    const restore = forceHideNoCapture(el)
    await raf2()
    try {
      await (document as any).fonts?.ready
      const canvas = await html2canvas(el, {
        backgroundColor: '#ffffff',
        useCORS: true,
        scale: Math.min(3, window.devicePixelRatio * 2),
      })

      const blob: Blob | null = await new Promise(resolve =>
        canvas.toBlob(b => resolve(b), 'image/png')
      )
      if (!blob || blob.size < 1000) return alert('فشل إنشاء الصورة')

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `mky-${kind}-${Date.now()}.png`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } finally {
      restore()
      isCapturing.value = false
    }
    return
  }

  // ✅ Native: use ShareShot (painted but invisible)
  if (kind !== 'story' && kind !== 'verse' && kind !== 'reflection' && kind !== 'training') {
    // only the kinds we built shots for
    return
  }

  isCapturing.value = true
  try {
    shotKind.value = kind as any
    await nextTick()
    await (document as any).fonts?.ready?.catch(() => {})
    await sleep(60) // important: let it paint on iOS/Android

    const el = sectionShotRef.value
    if (!el) return

    const canvas = await html2canvas(el, {
      backgroundColor: '#ffffff',
      useCORS: true,
      scale: Math.min(3, window.devicePixelRatio * 2),
      scrollX: 0,
      scrollY: 0,
    })

    const base64 = canvas.toDataURL('image/png').split(',')[1]
    const fileName = `mky-${kind}-${Date.now()}.png`

    const saved = await Filesystem.writeFile({
      path: fileName,
      data: base64,
      directory: Directory.Cache,
      recursive: true,
    })

    await Share.share({
      title: isArabic.value ? 'معًا كل يوم' : 'Together Every Day',
      url: saved.uri,
    })
  } catch (e) {
    console.error(e)
    alert('فشل مشاركة الصورة')
  } finally {
    isCapturing.value = false
  }
}

async function shareSection(kind: ShareKind) {
  if (noData.value || isLoading.value) return

  if (isWeb.value) {
    await shareSectionImage(kind)
    return
  }

  // native: only the 4 supported kinds
  if (!['story','verse','reflection','training'].includes(kind)) {
  await shareAsText()
  return
}

await shareSectionText(kind as SectionShareKind, lang.value)

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
comingSoon: 'Available now on Google Play and App Store',

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
    comingSoon: 'متاح الآن على Google Play و App Store',

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
   Reactions (Ionic-safe)
============================ */
type ReactKey = 'story' | 'verse' | 'reflection' | 'training'

const reactCounts = ref<Record<ReactKey, { heart: number }>>({
  story: { heart: 0 },
  verse: { heart: 0 },
  reflection: { heart: 0 },
  training: { heart: 0 }
})

const reactMine = ref<Record<ReactKey, { heart: boolean }>>({
  story: { heart: false },
  verse: { heart: false },
  reflection: { heart: false },
  training: { heart: false }
})

let unSubs: Array<() => void> = []
let reactionsActive = false

function makeItemId(kind: ReactKey) {
  const iso = String(selectedDateISO.value).substring(0, 10)
  return `${iso}:${kind}`
}

function stopReactions() {
  unSubs.forEach(fn => fn?.())
  unSubs = []
  reactionsActive = false
}

function startReactions() {
  stopReactions()
  reactionsActive = true

  const keys: ReactKey[] = ['story', 'verse', 'reflection', 'training']
  keys.forEach((k) => {
    const un = listenReactions(makeItemId(k), (payload) => {
      reactCounts.value[k].heart = Number(payload.counts.heart || 0)
      reactMine.value[k].heart = !!payload.me.heart
    })
    if (typeof un === 'function') unSubs.push(un)
  })
}

// ✅ Ionic lifecycle: الصفحة بتفضل cached، فلازم نبدأ/نقف هنا
onIonViewDidEnter(() => {
  startReactions()
})

onIonViewWillLeave(() => {
  stopReactions()
})

// ✅ لما التاريخ يتغير وإحنا داخل الصفحة فقط
watch(
  () => selectedDateISO.value,
  () => {
    if (reactionsActive) startReactions()
  }
)

async function onHeart(kind: ReactKey) {
  const wasOn = !!reactMine.value[kind].heart
  reactMine.value[kind].heart = !wasOn
  reactCounts.value[kind].heart = Math.max(
    0,
    Number(reactCounts.value[kind].heart || 0) + (wasOn ? -1 : 1)
  )

  try {
    await toggleHeart(makeItemId(kind))
  } catch (e) {
    reactMine.value[kind].heart = wasOn
    reactCounts.value[kind].heart = Math.max(
      0,
      Number(reactCounts.value[kind].heart || 0) + (wasOn ? +1 : -1)
    )
    console.error(e)
  }
}
/* ============================
   End reactions
============================ */


// ====== Reminders ======

async function applyReminderSchedule(userInitiated = false) {
  if (isWeb.value) return

  if (!reminderEnabled.value) {
    await disableDailyReminder()
    return
  }

  // ✅ لا تطلب إذن إلا لو userInitiated
  if (!(await hasReminderPermission())) {
    if (!userInitiated) return

    const granted = await requestReminderPermission()
    if (!granted) {
      reminderEnabled.value = false
      localStorage.setItem('mk_reminder_enabled', '0')
      return
    }
  }

  const [h, m] = reminderTime.value.split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return

  await scheduleDailyReminder(h, m, lang.value, userInitiated)
}

async function onReminderToggle(ev: any) {
  reminderEnabled.value = !!ev.detail.checked
  localStorage.setItem('mk_reminder_enabled', reminderEnabled.value ? '1' : '0')

  await applyReminderSchedule(true) // ✅ user initiated
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
const oc_vid = ref('')
const oc_title = ref('')
const oc_sub_title = ref('')
const oc_content = ref('')
const oc_media = ref('')
const oc_bg = ref('') // optional

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
const daily_audio = ref('')
const hasDailyAudio = computed(() => !!String(daily_audio.value).trim())

const hasOccasional = computed(() => !!String(occasional.value).trim())

// render occasional_data with new lines + markdown support (same pipeline you use)
const occasionalHtml = computed(() => mdToSafeHtml(occasional_data.value))
const announcementHtml = computed(() => mdToSafeHtml(announcement.value))

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

const bookDisplayName = computed(() => {
  const p = chapterPreview.value
  if (!p) return '' // no fallback names from code
  return isArabic.value
    ? String(p.bookName || '').trim()
    : String(p.bookNameEn || '').trim()
})

const previewLabel = computed(() => {
  const ch = bibleChapter.value || 1

  const name = isArabic.value
    ? String(chapterPreview.value?.bookName || '').trim()
    : String(chapterPreview.value?.bookNameEn || '').trim()

  // JSON-only (no code maps)
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
  oc_content.value = c.oc_content || ''
oc_media.value = c.oc_media || ''
oc_bg.value = c.oc_bg || ''

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
  oc_vid.value = c.oc_vid || ''
oc_title.value = c.oc_title || ''
oc_sub_title.value = c.oc_sub_title || ''

  agbia_baker.value  = c.baker  || ''
  agbia_third.value  = c.third  || ''
  agbia_sixth.value  = c.sixth  || ''
  agbia_ninth.value  = c.ninth  || ''
  agbia_sunset.value = c.sunset || ''
  agbia_sleep.value  = c.sleep  || ''
  daily_audio.value = c.daily_audio || ''

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
  oc_content.value = ''
oc_media.value = ''
oc_bg.value = ''

  title.value = ''
  story.value = ''
  oc_vid.value = ''
oc_title.value = ''
oc_sub_title.value = ''

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
  daily_audio.value = ''

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
  oc_content.value = pick(row, 'oc_content')
oc_media.value = pick(row, 'oc_media')
oc_bg.value = pick(row, 'oc_bg', 'oc_bg_color', 'oc_color')

  reflection.value = pick(row, 'reflection')
  announcement.value = pick(row, 'announcement', 'إعلان', 'announcements')
  daily_audio.value = pick(row, 'daily_audio', 'daily_message_audio', 'audio_daily')

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
// Occasions (YouTube)
oc_vid.value = pick(row, 'oc_vid', 'ocvid', 'oc_video', 'occasion_vid')

// ⚠️ مهم: بلاش اسمها title/sub_title لو أنت أصلاً مستخدم title للعنوان الرئيسي.
// الأفضل في الشيت: oc_title / oc_sub_title
oc_title.value = pick(row, 'oc_title', 'occasions_title', 'occasion_title')
oc_sub_title.value = pick(row, 'oc_sub_title', 'occasions_sub_title', 'occasion_sub_title')

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
    oc_content: oc_content.value,
oc_media: oc_media.value,
oc_bg: oc_bg.value,

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
    daily_audio: daily_audio.value,
    oc_vid: oc_vid.value,
oc_title: oc_title.value,
oc_sub_title: oc_sub_title.value,

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

  const bookKey = bibleBookKey.value || "Matthew"
  const ch = bibleChapter.value || 1

  router.push({
    name: "Chapter",
    params: { bookKey, chapter: String(ch) },
    query: { d: selectedDateISO.value }, // ✅ same day from sheet
  })
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

onMounted(async () => {
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
    if (await hasReminderPermission()) {
      await resyncReminderIfNeeded()
    }
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
  .storeBadge.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  filter: grayscale(100%);
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
    width: 90%;
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
  top: 0;        /* بدل -4 */
  left: 0;
  z-index: 5;    /* أعلى من الباقي */
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
    opacity: 1;
    position: absolute;
    top: 4px;
    left: 0px;
    color: var(--mk-text);
    background: transparent;
    border-radius: 12px;
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
  :deep(ion-content.content){
  --padding-bottom: calc(16px + 72px + env(safe-area-inset-bottom));
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
/* ===== Reactions – Spiritual Glow ===== */

.reactRow{
  display:flex;
  justify-content:center;
  margin-top: 12px;
}

/* Base button */
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
  transition:
    box-shadow 0.35s ease,
    transform 0.18s ease,
    border-color 0.35s ease;
}

.home.theme-dark .heartBtn{
  border-color: rgba(255,255,255,0.14);
  background: rgba(0,0,0,0.18);
  box-shadow: 0 10px 24px rgba(0,0,0,0.45);
}

/* ===== ACTIVE (glow) ===== */
.heartBtn.active{
  border-color: rgba(40,214,204,0.45);
  box-shadow:
    0 0 0 2px rgba(40,214,204,0.12),
    0 12px 28px rgba(40,214,204,0.28),
    0 0 18px rgba(40,214,204,0.25);

  animation: heartGlow 3.6s ease-in-out infinite;
  background: #cdfffc;
}

/* Dark mode glow tuning */
.home.theme-dark .heartBtn.active{
  box-shadow:
    0 0 0 2px rgba(40,214,204,0.18),
    0 14px 32px rgba(40,214,204,0.35),
    0 0 22px rgba(40,214,204,0.30);
}

/* Count pill */
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

/* Press feedback */
.heartBtn:active{
  transform: scale(0.96);
}

/* ===== Animations ===== */

/* slow breathing glow */
@keyframes heartGlow {
  0%{
    box-shadow:
      0 0 0 2px rgba(40,214,204,0.10),
      0 10px 22px rgba(40,214,204,0.22),
      0 0 14px rgba(40,214,204,0.18);
  }
  50%{
    box-shadow:
      0 0 0 4px rgba(40,214,204,0.18),
      0 16px 34px rgba(40,214,204,0.38),
      0 0 26px rgba(40,214,204,0.32);
  }
  100%{
    box-shadow:
      0 0 0 2px rgba(40,214,204,0.10),
      0 10px 22px rgba(40,214,204,0.22),
      0 0 14px rgba(40,214,204,0.18);
  }
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
.audioCtaWrap{
  margin-top: 10px;
  display:flex;
  justify-content:center;
}

.audioPill{
  position: relative;
  display:inline-flex;
  align-items:center;
  gap:10px;
  padding: 6px 14px;
  border-radius: 999px;
  border: 1px solid rgba(0,0,0,0.10);
  background:
    radial-gradient(520px 140px at 20% 0%, rgba(40,214,204,0.22), transparent 62%),
    rgba(255,255,255,0.70);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  font-family: "Noto Kufi Arabic", system-ui, sans-serif;
  color: var(--mk-text);
  font-weight: 1000;
  box-shadow:
    0 10px 24px rgba(0,0,0,0.10),
    0 0 0 2px rgba(40,214,204,0.08);
  cursor:pointer;

  transition: transform .16s ease, box-shadow .25s ease, border-color .25s ease;
}

.home.theme-dark .audioPill{
  border-color: rgba(255,255,255,0.14);
  background:
    radial-gradient(520px 140px at 20% 0%, rgba(40,214,204,0.18), transparent 62%),
    rgba(0,0,0,0.22);
  box-shadow:
    0 14px 30px rgba(0,0,0,0.50),
    0 0 0 2px rgba(40,214,204,0.10);
}

.audioPill:hover{
  border-color: rgba(40,214,204,0.30);
  box-shadow:
    0 12px 28px rgba(0,0,0,0.12),
    0 0 0 3px rgba(40,214,204,0.12),
    0 0 18px rgba(40,214,204,0.18);
}

.audioPill:active{ transform: scale(0.98); }

.audioPillIcon{
  font-size: 18px;
  line-height: 1;
}

.audioPillText{
  font-size: 14px;
  letter-spacing: 0;
}

.audioPillDur{
  font-size: 12px;
  opacity: 0.85;
  padding: 2px 10px;
  border-radius: 999px;
  border: 1px solid rgba(0,0,0,0.10);
  background: rgba(0,0,0,0.03);
}

.home.theme-dark .audioPillDur{
  border-color: rgba(255,255,255,0.16);
  background: rgba(255,255,255,0.06);
}

.audioPillArrow{
  margin-inline-start: 2px;
  font-size: 18px;
  opacity: 0.65;
  transform: translateY(-1px);
}
.audioPill{
  animation: audioBreath 4.6s ease-in-out infinite;
}

@keyframes audioBreath{
  0%,100%{
    box-shadow:
      0 10px 24px rgba(0,0,0,0.10),
      0 0 0 2px rgba(40,214,204,0.08);
  }
  50%{
    box-shadow:
      0 14px 30px rgba(0,0,0,0.12),
      0 0 0 4px rgba(40,214,204,0.14),
      0 0 22px rgba(40,214,204,0.18);
  }
}

.home.theme-dark .audioCtaDur{
  border-color: rgba(255,255,255,0.16);
  background: rgba(255,255,255,0.06);
}

.home.theme-dark .audioCtaDur{
  border-color: rgba(255,255,255,0.16);
  background: rgba(255,255,255,0.06);
}

  /* =========================================================
     Mobile
  ========================================================= */
  @media (max-width: 560px){
  .row{ grid-template-columns: 1fr !important; }
}

  @media (max-width: 420px) {
  .title { font-size: calc(34px * var(--mk-fontScale)); }
  .row { grid-template-columns: 1fr; }
}
.shareable{
  position: relative; /* needed for absolute share button */
}

.sectionShareBtn{
  position: absolute;
  z-index: 5;
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: #fff;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 0 10px 22px rgba(0,0,0,0.10);
  color: var(--mk-text);
  opacity: 0.95;
  left: 40px;
  bottom: 20px;
  color: #061018;
}
.home.lang-ar .sectionShareBtn{
  left: 40px;
  right: auto;
}

.home.lang-en .sectionShareBtn{
  right: 20px;
  left: auto;
}

.home.theme-dark .sectionShareBtn{
  background: rgba(0,0,0,0.30);
  box-shadow: 0 10px 22px rgba(0,0,0,0.45);
  color: #fff;
}
/* ✅ ShareShot (painted, invisible) for native section share */
.shareShotWrap{
  position: fixed;
  top: 0;
  left: 0;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
  z-index: -1;
}

.shareShot{
  width: 900px;
  padding: 22px;
  border-radius: 22px;
  background: #ffffff;
  color: #0b1f33;
  border: 1px solid rgba(0,0,0,0.10);
  box-shadow: 0 18px 48px rgba(0,0,0,0.18);
  font-family: "Noto Kufi Arabic", system-ui, sans-serif;
}

.shotTop{
  display:flex;
  justify-content:space-between;
  align-items:flex-start;
  gap:12px;
  margin-bottom: 14px;
}
.shotTitle{ font-size: 20px; font-weight: 1000; }
.shotDate{
  font-size: 13px;
  font-weight: 900;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(0,0,0,0.04);
  border: 1px solid rgba(0,0,0,0.08);
}

.shotHeading{
  font-weight: 1000;
  margin: 6px 0 10px;
  font-size: 18px;
}

.shotVerse{
  font-family: "Amiri", serif;
  font-size: 28px;
  line-height: 1.9;
  font-weight: 700;
  text-align: center;
}
.shotVerseRef{
  margin-top: 8px;
  text-align: center;
  font-weight: 900;
}

.shotTraining{
  font-size: 22px;
  font-weight: 900;
  line-height: 1.9;
}

.shotFooter{
  margin-top: 16px;
  display:flex;
  justify-content:space-between;
  gap:10px;
  font-weight: 1000;
  font-size: 14px;
  opacity: 0.9;
}
.shotSmall{ opacity: 0.75; font-weight: 900; }
.bible2026Btn{
  position: absolute;
  top: 4px;
  left: 37px; /* جنب زر الشير */
  z-index: 3;
  border-radius: 12px;
  backdrop-filter: blur(8px);
}

.home.theme-dark .bible2026Btn{
  background: rgba(0,0,0,0.30);
}

.bibleIcon{
  font-size: 20px;
  line-height: 1;
}
/* =========================
   Bottom Mini Player (Daily Audio)
========================= */
.mkMiniPlayer{
  position: fixed;
  left: 10px;
  right: 10px;
  bottom: calc(env(safe-area-inset-bottom) + 10px);
  z-index: 9999;

  transform: translateY(120%);
  opacity: 0;
  pointer-events: none;
  transition: transform .22s ease, opacity .22s ease;
}

.mkMiniPlayer.open{
  transform: translateY(0);
  opacity: 1;
  pointer-events: auto;
}

.mkMiniInner{
  border-radius: 22px;
  border: 1px solid var(--mk-border);
  background:
    radial-gradient(700px 250px at 15% 0%, rgba(31,182,170,0.16), transparent 62%),
    linear-gradient(135deg, rgba(255,255,255,0.94), rgba(255,255,255,0.70));
  box-shadow: var(--mk-shadow-strong);
  backdrop-filter: blur(10px);
  overflow: hidden;
  padding: 12px 12px 10px;
}

.home.theme-dark .mkMiniInner{
  background:
    radial-gradient(700px 250px at 15% 0%, rgba(31,182,170,0.14), transparent 62%),
    linear-gradient(135deg, rgba(12,18,26,0.92), rgba(12,18,26,0.78));
  border-color: rgba(255,255,255,0.14);
}

.mkMiniHead{
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap: 10px;
  margin-bottom: 8px;
}

.mkMiniMeta{ min-width: 0; }

.mkMiniTitle{
  font-weight: 1000;
  color: var(--mk-text);
  font-family: "Noto Kufi Arabic", system-ui, sans-serif;
  font-size: 15px;
}

.mkMiniSub{
  margin-top: 2px;
  font-size: 12px;
  font-weight: 900;
  color: var(--mk-text);
  opacity: 0.8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mkMiniClose{
  width: 38px;
  height: 38px;
  border-radius: 14px;
  border: 1px solid var(--mk-border);
  background: rgba(0,0,0,0.03);
  color: var(--mk-text);
  font-weight: 1000;
  cursor: pointer;
}

.home.theme-dark .mkMiniClose{
  background: rgba(255,255,255,0.08);
  border-color: rgba(255,255,255,0.16);
}

/* Native audio controls */
.mkAudioPlayer{
  width: 100%;
  height: 44px;
  border-radius: 14px;
  overflow: hidden;
  outline: none;
}

.mkAudioErr{
  margin-top: 8px;
  font-weight: 900;
  color: var(--mk-danger, #e23b3b);
  font-size: 13px;
}

/* Spacer */
.mkPlayerSpacer{
  height: 0px;
  transition: height .2s ease;
}

  </style>
  