<template>
  <ion-page class="dpPage" dir="rtl" lang="ar">
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/" text="" />
        </ion-buttons>
        <ion-title>{{ pageTitle }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="dpContent">
      <div class="dpWrap" :style="{ '--dp-fontScale': String(settings.fontScale) }">
        <section class="dpHero">
          <div class="dpHeroIcon">🙏</div>
          <h1 class="dpHeroTitle">{{ pageTitle }}</h1>

          <div class="dpSubTitle">
            <div>من كتاب السبع صلوات الأسبوعية</div>
            <div>إعداد وتقديم نيافة الحبر الجليل</div>
            <div>الأنبا متاؤس أسقف ورئيس دير السريان العامر</div>
          </div>
        </section>

        <div class="mkSettingsBox" dir="rtl" lang="ar">
          <div class="mkSettingsHead">
            <div class="mkSettingsTitle">⚙️ إعدادات الصفحة</div>
            <button class="mkSettingsReset" type="button" @click="resetFont">
              إعادة ضبط
            </button>
          </div>

          <div class="mkSettingCard">
            <div class="mkRowTop">
              <div class="mkLbl">حجم الخط</div>
              <div class="mkValue">{{ scaleLabel }}</div>
            </div>

            <ion-range
              v-model="settings.fontScale"
              :min="0.85"
              :max="2"
              :step="0.01"
              :snaps="false"
              :pin="true"
              :ticks="false"
              @ionInput="saveSettings"
              @ionChange="saveSettings"
              dir="ltr"
              class="mkRange"
            />
          </div>
        </div>

        <div v-if="loading" class="dpState">جاري تحميل الصلاة...</div>
        <div v-else-if="error" class="dpState">{{ error }}</div>

        <section v-else-if="sections.length" class="dpAccList">
          <article
            v-for="(item, i) in sections"
            :key="`${item.section_order}-${i}`"
            class="dpAccItem"
          >
            <button
              type="button"
              class="dpAccHead"
              @click="toggle(i)"
              :aria-expanded="openIndex === i ? 'true' : 'false'"
            >
              <span class="dpAccTitle">{{ item.section_title }}</span>
              <span class="dpAccChevron" :class="{ open: openIndex === i }">⌄</span>
            </button>

            <div v-if="openIndex === i" class="dpAccBody">
              <div class="dpPrayerText" v-html="formatPrayerText(item.prayer_text)"></div>
            </div>
          </article>
        </section>

        <div v-else class="dpState">لا توجد صلاة متاحة لهذا اليوم حالياً.</div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue"
import { useRoute } from "vue-router"
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonRange,
} from "@ionic/vue"
import {
  fetchPrayerForWeekdayNew,
  getDefaultPageTitle,
  getWeekdayKeyFromISO,
  type PrayerRow,
  type WeekdayKey,
} from "@/utils/dailyPrayerNew"

type PrayerSettings = {
  fontScale: number
}

const STORAGE_KEY = "mk_daily_prayer_settings_v1"

const route = useRoute()

const loading = ref(true)
const error = ref("")
const pageTitle = ref("")
const sections = ref<PrayerRow[]>([])
const openIndex = ref<number>(0)

const settings = reactive<PrayerSettings>({
  fontScale: 1,
})

const selectedDateIso = computed(() => {
  const q = route.query.date
  return typeof q === "string" ? q.substring(0, 10) : undefined
})

const weekdayKey = computed<WeekdayKey>(() => {
  return getWeekdayKeyFromISO(selectedDateIso.value)
})

const scaleLabel = computed(() => `${Math.round((settings.fontScale || 1) * 100)}%`)

function saveSettings() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        fontScale: Number(settings.fontScale || 1),
      })
    )
  } catch {}
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const saved = JSON.parse(raw)
    const fs = Number(saved?.fontScale)
    settings.fontScale = Number.isFinite(fs) ? fs : 1
  } catch {}
}

function resetFont() {
  settings.fontScale = 1
  saveSettings()
}

function toggle(i: number) {
  openIndex.value = openIndex.value === i ? -1 : i
}

function formatPrayerText(text: string) {
  return String(text || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter(Boolean)
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join("")
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

async function load() {
  loading.value = true
  error.value = ""

  console.log("PRAYER PAGE →", selectedDateIso.value, weekdayKey.value)

  try { 
    const data = await fetchPrayerForWeekdayNew(weekdayKey.value)    
    pageTitle.value = data.pageTitle || getDefaultPageTitle(weekdayKey.value)
    sections.value = data.sections || []
    openIndex.value = data.defaultOpenIndex >= 0 ? data.defaultOpenIndex : 0
  } catch (e) {
    console.error("Failed to load prayer page:", e)
    pageTitle.value = getDefaultPageTitle(weekdayKey.value)
    sections.value = []
    openIndex.value = 0
    error.value = "تعذر تحميل صلاة اليوم حالياً."
  } finally {
    loading.value = false
  }
}

loadSettings()

watch(
  weekdayKey,
  () => {
    load()
  },
  { immediate: true }
)
</script>

<style scoped>
.dpContent{
  --background: var(--ion-background-color, #f6f7fb);
}

.dpWrap{
  padding: 14px 14px 24px;
}
 
.dpHero{
  padding: 18px 16px;
  border-radius: 24px;
  margin-bottom: 12px;
  border: 1px solid rgba(0,0,0,0.08);
  background:
    radial-gradient(700px 260px at 20% 0%, rgba(31,182,170,0.16), transparent 60%),
    linear-gradient(135deg, rgba(255,255,255,0.92), rgba(255,255,255,0.70));
  box-shadow: 0 10px 24px rgba(0,0,0,0.08);
  text-align: center;
}

:global(html[data-mk-theme="dark"]) .dpHero{
  background:
    radial-gradient(700px 260px at 20% 0%, rgba(31,182,170,0.14), transparent 62%),
    linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04));
  border-color: rgba(255,255,255,0.12);
}

.dpHeroIcon{
  font-size: 34px;
  margin-bottom: 8px;
}

.dpHeroTitle{
  margin: 0 0 10px;
  font-family: "Noto Kufi Arabic", system-ui, sans-serif;
  font-size: 20px;
  font-weight: 1000;
  color: #0b1f33;
  line-height: 1.8;
}

:global(html[data-mk-theme="dark"]) .dpHeroTitle{
  color: #f5f7fa;
}

.dpSubTitle{
  color: #476074;
  line-height: 2;
  font-size: 13px;
  font-weight: 800;
}

:global(html[data-mk-theme="dark"]) .dpSubTitle{
  color: #d3dee7;
}

.mkSettingsBox{
  margin: 10px 0 12px;
  padding: 14px;
  border-radius: 20px;
  border: 1px solid var(--mk-border, rgba(0,0,0,0.10));
  background:
    radial-gradient(700px 260px at 20% 0%, rgba(31,182,170,0.16), transparent 60%),
    linear-gradient(135deg, rgba(255,255,255,0.88), rgba(255,255,255,0.60));
  box-shadow: var(--mk-shadow, 0 8px 18px rgba(0,0,0,0.08));
  backdrop-filter: blur(8px);
}

:global(html[data-mk-theme="dark"]) .mkSettingsBox{
  --mk-text-local: #f5f7fa;
  --mk-border-local: rgba(255,255,255,0.14);

  background:
    radial-gradient(700px 260px at 20% 0%, rgba(31,182,170,0.14), transparent 62%),
    linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04));
  border-color: var(--mk-border, var(--mk-border-local));
}

.mkSettingsHead{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:10px;
  margin-bottom: 12px;
}

.mkSettingsTitle{
  font-weight: 1000;
  color: var(--mk-text, #0b1f33);
  font-family: "Noto Kufi Arabic", system-ui, sans-serif;
  font-size: 16px;
}

:global(html[data-mk-theme="dark"]) .mkSettingsTitle{
  color: var(--mk-text, var(--mk-text-local));
}

.mkSettingsReset{
  border: 1px solid var(--mk-border, rgba(0,0,0,0.10));
  background: rgba(0,0,0,0.04);
  color: var(--mk-text, #0b1f33);
  font-weight: 900;
  padding: 7px 11px;
  border-radius: 999px;
  cursor: pointer;
}

:global(html[data-mk-theme="dark"]) .mkSettingsReset{
  background: rgba(255,255,255,0.08);
  border-color: var(--mk-border, var(--mk-border-local));
  color: var(--mk-text, var(--mk-text-local));
}

.mkSettingCard{
  margin-top: 10px;
  padding: 12px 12px 10px;
  border-radius: 16px;
  border: 1px solid var(--mk-border, rgba(0,0,0,0.10));
  background: rgba(0,0,0,0.02);
}

:global(html[data-mk-theme="dark"]) .mkSettingCard{
  background: rgba(255,255,255,0.06);
  border-color: var(--mk-border, var(--mk-border-local));
}

.mkRowTop{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:10px;
  margin-bottom: 8px;
}

.mkLbl{
  font-weight: 1000;
  color: var(--mk-text, #0b1f33);
  font-family: "Noto Kufi Arabic", system-ui, sans-serif;
}

:global(html[data-mk-theme="dark"]) .mkLbl{
  color: var(--mk-text, var(--mk-text-local));
}

.mkValue{
  font-weight: 1000;
  color: var(--mk-text, #0b1f33);
  opacity: 0.95;
  font-variant-numeric: tabular-nums;
  padding: 3px 10px;
  border-radius: 999px;
  border: 1px solid var(--mk-border, rgba(0,0,0,0.10));
  background: rgba(31,182,170,0.10);
}

:global(html[data-mk-theme="dark"]) .mkValue{
  color: var(--mk-text, var(--mk-text-local));
  background: rgba(31,182,170,0.12);
  border-color: var(--mk-border, var(--mk-border-local));
}

.mkRange{
  direction: ltr;
  unicode-bidi: isolate;
  padding:0;
}

ion-range{
  --bar-height: 8px;
  --knob-size: 24px;
  --pin-background: rgba(0,0,0,0.85);
  --pin-color: #fff;
  --knob-box-shadow: 0 10px 20px rgba(0,0,0,0.18);
  --bar-background: rgba(31,182,170,0.18);
  --bar-background-active: rgb(37 63 79);
  padding-inline: 2px;
}

.dpAccList{
  display:flex;
  flex-direction:column;
  gap:10px;
}

.dpAccItem{
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid rgba(0,0,0,0.08);
  background: rgba(255,255,255,0.82);
  box-shadow: 0 8px 18px rgba(0,0,0,0.05);
}

:global(html[data-mk-theme="dark"]) .dpAccItem{
  background: rgba(255,255,255,0.05);
  border-color: rgba(255,255,255,0.11);
}

.dpAccHead{
  width:100%;
  border:none;
  background: transparent;
  padding: 15px 16px;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:12px;
  cursor:pointer;
  text-align:right;
}

.dpAccTitle{
  font-family: "Noto Kufi Arabic", system-ui, sans-serif;
  font-size: 15px;
  font-weight: 900;
  color: #0b1f33;
  line-height: 1.9;
}

:global(html[data-mk-theme="dark"]) .dpAccTitle{
  color:#f5f7fa;
}

.dpAccChevron{
  font-size: 20px;
  line-height: 1;
  transition: transform .2s ease;
  color:#50697c;
}

.dpAccChevron.open{
  transform: rotate(180deg);
}

:global(html[data-mk-theme="dark"]) .dpAccChevron{
  color:#d6e0e8;
}

.dpAccBody{
  padding: 0 16px 16px;
}

.dpPrayerText{
  font-size: calc(18px * var(--dp-fontScale, 1));
  line-height: 2.15;
  color: #203446;
  white-space: normal;
  font-family:"Scheherazade New", serif;
  font-weight: bold;
}

:global(html[data-mk-theme="dark"]) .dpPrayerText{
  color:#ecf3f8;
}

.dpPrayerText :deep(p){
  margin: 0 0 12px;
}

.dpState{
  text-align:center;
  padding: 18px 14px;
  color:#587083;
  font-weight:800;
}

:global(html[data-mk-theme="dark"]) .dpState{
  color:#d9e4ec;
}
</style>