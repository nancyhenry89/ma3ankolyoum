<template>
  <section
    class="srCard mkNoCapture"
    :class="{ srDonePulse: justToggled }"
    :dir="dir"
    :lang="lang"
  >
    <!-- Header -->
    <header class="srHeader">
      <div class="srTitleWrap">
        <div class="srTitle">{{ ui.title }}</div>
        <div class="srSubtitle">{{ ui.subtitle }}</div>
      </div>

      <div class="srHeaderBtns">
        <ion-button
          v-if="canSoftReset"
          size="small"
          fill="clear"
          class="srRecoverBtn"
          @click="softResetToPrevMilestone"
        >
          <span class="srRecoverInner">
            <span class="srRecoverIcon">♻️</span>
            <span class="srRecoverText">{{ ui.recover }}</span>
          </span>
        </ion-button>

        <ion-button
          size="small"
          class="srTodayBtn"
          :class="{ on: readToday }"
          :fill="readToday ? 'clear' : 'solid'"
          @click="toggleReadToday"
        >
          <span class="btnInner">
            <span class="btnIcon">{{ readToday ? "✓" : "♰" }}</span>
            <span class="btnText">
              {{ readToday ? ui.unmarkToday : ui.markToday }}
            </span>
          </span>
        </ion-button>
      </div>
    </header>

    <!-- Hero -->
    <div class="srHero" :class="{ on: displayedStreak > 0 }">
      <div class="srHeroIcon">{{ displayedStreak === 0 ? "✨" : "🔥" }}</div>

      <div class="srHeroText">
        <div class="srHeroMain">
          <span class="srHeroTitle">{{ spiritualMessage.title }}</span>

          <span class="srHeroLabel">{{ ui.streakLabel }}</span>
          <span class="srHeroNum">{{ displayedStreak }}</span>
          <span class="srHeroUnit">{{ ui.dayUnit }}</span>
        </div>

        <div class="srHeroSub">{{ spiritualMessage.text }}</div>
      </div>
    </div>

    <!-- Week -->
    <div class="srSection">
      <div class="srSectionHead">
        <div class="srSectionTitle">{{ ui.weekTitle }}</div>
        <div class="srSectionHint">{{ ui.weekHint }}</div>
      </div>

      <div class="srWeekGrid" :class="{ pop: weekPop }">
        <button
          v-for="i in 7"
          :key="i"
          type="button"
          class="srDay"
          :class="{ on: i <= crossesShown }"
          :aria-label="ui.weekDayAria"
        >
          <span class="srDayIcon">♰</span>
        </button>
      </div>
    </div>

    <!-- Counters -->
    <div class="srSection">
      <div class="srRows">
        <div class="srRow">
          <div class="srRowTop">
            <div class="srRowLabel">{{ ui.weeklyRewards }}</div>
            <div class="srCountChip">
              <span class="srChipNum">{{ weeksLabel }}</span>
              <span class="srChipIcon">👑</span>
            </div>
          </div>

          <div class="srIconsScroll" :class="{ pop: rewardsPop }" :aria-label="ui.crownsAria">
            <span v-for="i in weeksShown" :key="'w' + i" class="srRewardIcon">👑</span>
            <span v-if="weeks === 0" class="srMuted">—</span>
            <span v-if="weeks > 12" class="srMore">+{{ weeks - 12 }}</span>
          </div>
        </div>

        <div class="srRow">
          <div class="srRowTop">
            <div class="srRowLabel">
              {{ ui.monthlyRewards }}
              <span class="srMiniNote">{{ ui.monthlyNote }}</span>
            </div>
            <div class="srCountChip soft">
              <span class="srChipNum">{{ monthsLabel }}</span>
              <span class="srChipIcon">⭐</span>
            </div>
          </div>

          <div class="srIconsScroll" :class="{ pop: rewardsPop }" :aria-label="ui.starsAria">
            <span v-for="i in monthsShown" :key="'m' + i" class="srRewardIcon">⭐</span>
            <span v-if="months === 0" class="srMuted">—</span>
            <span v-if="months > 12" class="srMore">+{{ months - 12 }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Milestones -->
    <div class="srSection">
      <div class="srSectionHead">
        <div class="srSectionTitle">{{ ui.milestonesTitle }}</div>
        <div class="srSectionHint">{{ ui.milestonesHint }}</div>
      </div>

      <div class="srMilestones">
        <div class="srMilestone" :class="{ achieved: rewards.threeMonths }">
          <div class="srMilIcon">🕯️</div>
          <div class="srMilText">{{ ui.threeMonths }}</div>
          <div class="srMilState">
            <span v-if="rewards.threeMonths">{{ ui.achieved }}</span><span v-else>{{ ui.locked }}</span>
          </div>
        </div>

        <div class="srMilestone" :class="{ achieved: rewards.sixMonths }">
          <div class="srMilIcon">✨</div>
          <div class="srMilText">{{ ui.sixMonths }}</div>
          <div class="srMilState">
            <span v-if="rewards.sixMonths">{{ ui.achieved }}</span><span v-else>{{ ui.locked }}</span>
          </div>
        </div>

        <div class="srMilestone" :class="{ achieved: rewards.year }">
          <div class="srMilIcon">⛪</div>
          <div class="srMilText">{{ ui.oneYear }}</div>
          <div class="srMilState">
            <span v-if="rewards.year">{{ ui.achieved }}</span><span v-else>{{ ui.locked }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Days list -->
    <div class="srSection">
      <div class="srSectionHead">
        <div class="srSectionTitle">{{ ui.daysLogTitle }}</div>
        <div class="srSectionHint">{{ ui.daysLogHint }}</div>
      </div>

      <div class="srChips">
        <span v-for="d in recentDays" :key="d" class="srChip" :class="{ on: d === effectiveTodayISO }">
          {{ formatDay(d) }}
        </span>
        <span v-if="recentDays.length === 0" class="srMuted">{{ ui.noDaysYet }}</span>
      </div>
    </div>

    <!-- Debug -->
    <div v-if="isDebug" class="srDebug">
      <div class="srDebugTitle">⚙️ Debug</div>

      <div class="srDebugRow">
        <div class="srDebugLabel">{{ ui.debugTodayLabel }}</div>
        <div class="srDebugValue">
          {{ effectiveTodayISO }}
          <span v-if="fakeToday" class="srDebugHint">{{ ui.debugFake }}</span>
        </div>
      </div>

      <div class="srDebugBtns">
        <ion-button size="small" fill="outline" @click="resetFakeToday">{{ ui.debugRealToday }}</ion-button>
        <ion-button size="small" fill="outline" @click="shiftFakeDay(-1)">{{ ui.debugYesterday }}</ion-button>
        <ion-button size="small" fill="outline" @click="shiftFakeDay(1)">{{ ui.debugTomorrow }}</ion-button>
        <ion-button size="small" fill="outline" @click="shiftFakeDay(-7)">{{ ui.debugMinus7 }}</ion-button>
        <ion-button size="small" fill="outline" @click="shiftFakeDay(7)">{{ ui.debugPlus7 }}</ion-button>
      </div>

      <div class="srDebugBtns" style="margin-top:10px">
        <ion-button size="small" fill="outline" @click="seedStreak(7)">7</ion-button>
        <ion-button size="small" fill="outline" @click="seedStreak(14)">14</ion-button>
        <ion-button size="small" fill="outline" @click="seedStreak(21)">21</ion-button>
        <ion-button size="small" fill="outline" @click="seedStreak(28)">28 (⭐)</ion-button>
        <ion-button size="small" fill="outline" @click="seedStreak(90)">90</ion-button>
        <ion-button size="small" fill="outline" @click="seedStreak(180)">180</ion-button>
        <ion-button size="small" fill="outline" @click="seedStreak(365)">365</ion-button>
        <ion-button size="small" color="danger" @click="resetAll">{{ ui.debugResetAll }}</ion-button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { IonButton } from "@ionic/vue";
import { ref, onMounted, computed, watch } from "vue";
import { useRoute } from "vue-router";

import {
  getReadDays,
  addReadDay,
  removeReadDay,
  clearReadDays,
} from "@/utils/streakStore";

import { computeStreak, computeRewards } from "@/utils/streakLogic";
import { getStreakMeta, setStreakMeta, type StreakMeta } from "@/utils/streakMetaStore";

const props = defineProps<{ todayISO: string; lang: "ar" | "en" }>();

const isArabic = computed(() => props.lang !== "en");
const dir = computed(() => (isArabic.value ? "rtl" : "ltr"));
const lang = computed(() => (isArabic.value ? "ar" : "en"));

const ui = computed(() => {
  if (!isArabic.value) {
    return {
      title: "Reading Streak",
      subtitle: "Mark after you finish reading today's message",
      recover: "Return to last milestone",
      markToday: "Mark that you read today",
      unmarkToday: "Remove today's mark",

      streakLabel: "Streak days:",
      dayUnit: "day",
      weekTitle: "Week days",
      weekHint: "Every 7 days = 👑",
      weekDayAria: "A day in the week",

      weeklyRewards: "Weekly rewards",
      monthlyRewards: "Monthly rewards",
      monthlyNote: "⭐ every 4 weeks",
      crownsAria: "Crowns",
      starsAria: "Stars",

      milestonesTitle: "Big milestones",
      milestonesHint: "Long-term goals…",
      threeMonths: "3 months",
      sixMonths: "6 months",
      oneYear: "1 year",
      achieved: "Achieved ✅",
      locked: "Locked 🔒",

      daysLogTitle: "Days log",
      daysLogHint: "Recent marks",
      noDaysYet: "No days recorded yet",

      debugTodayLabel: "Effective today:",
      debugFake: "(fake)",
      debugRealToday: "Real today",
      debugYesterday: "Today = yesterday",
      debugTomorrow: "Today = tomorrow",
      debugMinus7: "-7 days",
      debugPlus7: "+7 days",
      debugResetAll: "Clear all",
    };
  }

  return {
    title: "سلسلة القراءة",
    subtitle: "علّم اليوم بعد ما تخلص قراءة رسالة اليوم",
    recover: "ارجع لآخر محطة",
    markToday: "علّم إنك قرأت اليوم",
    unmarkToday: "شيل علامة اليوم",

    streakLabel: "سلسلة الأيام:",
    dayUnit: "يوم",
    weekTitle: "أيام الأسبوع",
    weekHint: "كل 7 أيام = 👑",
    weekDayAria: "يوم من الأسبوع",

    weeklyRewards: "مكافآت أسبوعية",
    monthlyRewards: "مكافآت شهرية",
    monthlyNote: "⭐ كل 4 أسابيع",
    crownsAria: "أكاليل",
    starsAria: "نجوم",

    milestonesTitle: "إنجازات كبيرة",
    milestonesHint: "أهداف بعيدة…",
    threeMonths: "3 شهور",
    sixMonths: "6 شهور",
    oneYear: "سنة",
    achieved: "اتحقق ✅",
    locked: "لسه 🔒",

    daysLogTitle: "سجل الأيام",
    daysLogHint: "آخر علامات",
    noDaysYet: "مفيش أيام متسجلة لسه",

    debugTodayLabel: "اليوم المستخدم:",
    debugFake: "(وهمي)",
    debugRealToday: "اليوم الحقيقي",
    debugYesterday: "اليوم = أمس",
    debugTomorrow: "اليوم = بكرة",
    debugMinus7: "-7 أيام",
    debugPlus7: "+7 أيام",
    debugResetAll: "مسح الكل",
  };
});

const route = useRoute();
const isDebug = computed(() => route.query.debug === "1");

/** Fake today (debug) */
const fakeToday = ref<string | null>(null);
const effectiveTodayISO = computed(() => fakeToday.value ?? props.todayISO);

/** helpers */
function pad(n: number) { return String(n).padStart(2, "0"); }
function addDaysISO(iso: string, n: number) {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function diffDaysISO(aISO: string, bISO: string) {
  const a = new Date(`${aISO}T00:00:00`).getTime();
  const b = new Date(`${bISO}T00:00:00`).getTime();
  return Math.round((a - b) / (1000 * 60 * 60 * 24));
}

function shiftFakeDay(delta: number) {
  const base = fakeToday.value ?? props.todayISO;
  fakeToday.value = addDaysISO(base, delta);
}
function resetFakeToday() { fakeToday.value = null; }

/** Milestones */
const MILESTONES = [7, 14, 21, 28, 90, 180, 365];
function nearestMilestoneBelow(n: number) {
  const eligible = MILESTONES.filter(m => m <= n);
  return eligible.length ? eligible[eligible.length - 1] : 0;
}

/** state */
const readDays = ref<string[]>([]);
const readToday = computed(() => readDays.value.includes(effectiveTodayISO.value));

const baseStreak = ref(0);
const displayedStreak = ref(0);
const rewards = ref(computeRewards(0));

const recentDays = computed(() => [...readDays.value].sort().reverse().slice(0, 14));
function formatDay(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  // EN: mm/dd , AR: dd/mm
  if (!isArabic.value) return `${d.getMonth() + 1}/${d.getDate()}`;
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

type LocalMeta = StreakMeta & {
  bankMilestone?: number;
  softResetBase?: number;
  softResetState?: "armed" | "running";
  softResetUntilISO?: string;
};

const meta = ref<LocalMeta>({});

async function persistMeta() {
  await setStreakMeta(meta.value);
}

const softResetActive = computed(() => {
  const base = meta.value.softResetBase ?? 0;
  const state = meta.value.softResetState;
  if (!base || !state) return false;

  if (state === "armed") {
    const until = meta.value.softResetUntilISO;
    if (!until) return false;
    return diffDaysISO(until, effectiveTodayISO.value) >= 0;
  }
  return true;
});

/** Animations */
const justToggled = ref(false);
const weekPop = ref(false);
const rewardsPop = ref(false);
function pulseFlag(flag: { value: boolean }, ms = 420) {
  flag.value = true;
  window.setTimeout(() => (flag.value = false), ms);
}

/** recompute */
function recompute() {
  const s = computeStreak(readDays.value, effectiveTodayISO.value);
  baseStreak.value = s.streak;

  const bank = meta.value.bankMilestone ?? 0;
  const earned = nearestMilestoneBelow(baseStreak.value);
  if (earned > bank) {
    meta.value.bankMilestone = earned;
    setStreakMeta(meta.value);
  }

  if (meta.value.softResetState === "armed") {
    const until = meta.value.softResetUntilISO;
    const expired = !until || diffDaysISO(until, effectiveTodayISO.value) < 0;
    if (expired && baseStreak.value === 0) {
      delete meta.value.softResetBase;
      delete meta.value.softResetState;
      delete meta.value.softResetUntilISO;
      setStreakMeta(meta.value);
    }
  }

  if (meta.value.softResetState === "running" && baseStreak.value === 0) {
    delete meta.value.softResetBase;
    delete meta.value.softResetState;
    delete meta.value.softResetUntilISO;
    setStreakMeta(meta.value);
  }

  const state = meta.value.softResetState;
  const softBase = meta.value.softResetBase ?? 0;

  if (state === "armed") {
    const until = meta.value.softResetUntilISO;
    const ok = !!until && diffDaysISO(until, effectiveTodayISO.value) >= 0;
    displayedStreak.value = (ok && baseStreak.value === 0) ? softBase : baseStreak.value;
  } else if (state === "running") {
    displayedStreak.value = baseStreak.value > 0 ? (softBase + baseStreak.value) : 0;
  } else {
    displayedStreak.value = baseStreak.value;
  }

  rewards.value = computeRewards(displayedStreak.value);
}

/** hero message bilingual */
const spiritualMessage = computed(() => {
  if (!isArabic.value) {
    if (displayedStreak.value === 0 && !canSoftReset.value) {
      return { title: "✨ Start today", text: "Every new day is a step forward." };
    }
    if (displayedStreak.value === 0 && canSoftReset.value) {
      return { title: "✨ Don't give up", text: "Coming back matters more than falling." };
    }
    if ((meta.value.softResetBase ?? 0) > 0 && baseStreak.value === 0) {
      return { title: "🕯️ Coming back matters", text: "What you built isn't lost… keep going." };
    }
    if ((meta.value.softResetBase ?? 0) > 0 && baseStreak.value === 1) {
      return { title: "🌿 God welcomes your return", text: "Not the start—it's the staying." };
    }
    return { title: "Reading Streak", text: "Keep going—one step with God each day." };
  }

  if (displayedStreak.value === 0 && !canSoftReset.value) {
    return { title: "✨ ابدأ النهارده", text: "كل يوم جديد هو خطوة لقدام." };
  }
  if (displayedStreak.value === 0 && canSoftReset.value) {
    return { title: "✨ لا تيأس", text: "رجوعك اهم من سقوتك" };
  }
  if ((meta.value.softResetBase ?? 0) > 0 && baseStreak.value === 0) {
    return { title: "🕯️رجوعك النهاردة اهم خطوة", text: "اللي بنيته ما ضاعش… كمّل وربنا هيساعدك." };
  }
  if ((meta.value.softResetBase ?? 0) > 0 && baseStreak.value === 1) {
    return { title: "🌿 ربنا قبل رجوعك", text: "مش مهم البداية… المهم الاستمرار." };
  }
  return { title: "سلسلة القراءة", text: "استمر كل يوم خطوة جديدة مع ربنا" };
});

/** UI derived */
const crossesShown = computed(() => {
  const c = Number((rewards.value as any).crossesThisWeek ?? 0);
  if (displayedStreak.value > 0 && c === 0) return 7;
  return c;
});
const weeks = computed(() => Number((rewards.value as any).fullWeeks ?? 0));
const months = computed(() => Number((rewards.value as any).fullMonths ?? 0));
const weeksLabel = computed(() => (weeks.value >= 50 ? "50+" : String(weeks.value)));
const monthsLabel = computed(() => (months.value >= 50 ? "50+" : String(months.value)));
const weeksShown = computed(() => Math.min(weeks.value, 12));
const monthsShown = computed(() => Math.min(months.value, 12));

const canSoftReset = computed(() => {
  if (readToday.value) return false;
  if (!readDays.value.length) return false;

  const sToday = computeStreak(readDays.value, effectiveTodayISO.value).streak;
  if (sToday > 0) return false;

  if (softResetActive.value) return false;
  return (meta.value.bankMilestone ?? 0) > 0;
});

async function softResetToPrevMilestone() {
  const bank = meta.value.bankMilestone ?? 0;
  if (bank <= 0) return;

  meta.value.softResetBase = bank;
  meta.value.softResetState = "armed";
  meta.value.softResetUntilISO = addDaysISO(effectiveTodayISO.value, 1);

  await persistMeta();
  recompute();
  pulseFlag(rewardsPop, 520);
  pulseFlag(weekPop, 520);
}

/** load */
async function load() {
  readDays.value = await getReadDays();
  meta.value = (await getStreakMeta()) || {};
  recompute();
}

async function toggleReadToday() {
  const beforeWeeks = weeks.value;
  const beforeMonths = months.value;
  const beforeCrosses = crossesShown.value;

  if (readToday.value) {
    readDays.value = await removeReadDay(effectiveTodayISO.value);
  } else {
    readDays.value = await addReadDay(effectiveTodayISO.value);
  }

  recompute();
  pulseFlag(justToggled);

  if (crossesShown.value !== beforeCrosses) pulseFlag(weekPop);
  if (weeks.value > beforeWeeks || months.value > beforeMonths) pulseFlag(rewardsPop, 520);

  if (meta.value.softResetState === "armed" && (meta.value.softResetBase ?? 0) > 0 && baseStreak.value > 0) {
    meta.value.softResetState = "running";
    delete meta.value.softResetUntilISO;
    await persistMeta();
    recompute();
  }
}

/** debug seed */
async function seedStreak(n: number) {
  await clearReadDays();
  for (let i = 0; i < n; i++) {
    await addReadDay(addDaysISO(effectiveTodayISO.value, -i));
  }
  meta.value = {};
  await persistMeta();
  readDays.value = await getReadDays();
  recompute();
  pulseFlag(rewardsPop, 520);
  pulseFlag(weekPop, 520);
}

async function resetAll() {
  readDays.value = await clearReadDays();
  meta.value = {};
  await persistMeta();
  recompute();
}

onMounted(load);
watch(() => props.todayISO, load);
watch(effectiveTodayISO, recompute);
</script>

  
  
<style scoped>
  /* =====================================================
     THEME TOKENS (Light as default)  ✅ KEEP LIGHT SAME
  ===================================================== */
  .srCard{
    --sr-card-bg: rgba(255, 255, 255, 0.72);
    --sr-card-border: rgba(0,0,0,0.08);

    --sr-soft-bg: rgba(0,0,0,0.02);
    --sr-soft-border: rgba(0,0,0,0.06);

    --sr-text: #0f172a;
    --sr-muted: rgba(15,23,42,0.70);

    --sr-chip-bg: rgba(0,0,0,0.03);
    --sr-chip-border: rgba(0,0,0,0.06);

    --sr-whiteish: rgba(255,255,255,0.78);
    --sr-whiteish-border: rgba(0,0,0,0.08);

    --sr-accent: rgba(40,214,204,1);
    --sr-accent-soft: rgba(40,214,204,0.18);
    --sr-accent-border: rgba(40,214,204,0.55);

    --sr-shadow-1: 0 10px 22px rgba(0,0,0,0.08);
    --sr-shadow-2: 0 10px 18px rgba(0,0,0,0.06);
    --sr-shadow-accent: 0 8px 18px rgba(40,214,204,0.18);
  }

  /* =====================================================
     CARD SHELL
  ===================================================== */
  .srCard{
    padding: 16px;
    border-radius: 20px;
    border: 1px solid var(--sr-card-border);
    background: var(--sr-card-bg);
    color: var(--sr-text);
    backdrop-filter: blur(10px);
    box-shadow: var(--sr-shadow-1);
    font-family: Amiri, serif;
  }

  /* =====================================================
     HEADER
  ===================================================== */
  .srHeader{
    display:flex;
    align-items:flex-start;
    justify-content:space-between;
    gap:12px;
    margin-bottom: 12px;
  }
  .srTitleWrap{ display:flex; flex-direction:column; gap:2px; }
  .srTitle{ font-weight: 1000; font-size: 18px; color: var(--sr-text); }
  .srSubtitle{ font-weight: 800; font-size: 13px; color: var(--sr-muted); }

  .srHeaderBtns{
    display:flex;
    flex-direction:column;
    gap:8px;
    align-items:flex-end;
  }

  /* =====================================================
     TODAY BUTTON
  ===================================================== */
  .srTodayBtn{
    border-radius: 14px;
    font-weight: 1000;
    overflow: hidden;
    --padding-start: 12px;
    --padding-end: 12px;
    --padding-top: 10px;
    --padding-bottom: 10px;
    --box-shadow: 0 10px 18px rgba(0,0,0,0.10);
    transform: translateZ(0);
    font-family:"Noto Kufi Arabic", system-ui, sans-serif;
    font-size:12px;
  }
  .srTodayBtn .btnInner{ display:inline-flex; align-items:center; gap:8px; }
  .srTodayBtn .btnIcon{
    width: 22px; height: 22px;
    display:inline-flex; align-items:center; justify-content:center;
    border-radius: 10px;
    font-weight: 1000;
    font-size: 18px;
  }
  .srTodayBtn .btnText{ font-weight: 1000; }

  .srTodayBtn:not(.on){
    --background: linear-gradient(135deg, rgba(40,214,204,0.95), rgba(32,178,170,0.85));
    --color: #061018;
    border: 1px solid rgba(40,214,204,0.45);
  }

  .srTodayBtn.on{
    --background: var(--sr-soft-bg);
    --color: var(--sr-text);
    border: 1px solid var(--sr-soft-border);
    --box-shadow: 0 8px 14px rgba(0,0,0,0.08);
  }

  .srTodayBtn:active{
    transform: translateY(1px);
    filter: brightness(0.98);
  }

/* =========================
   RECOVER / SOFT RESET BTN
========================= */

.srRecoverBtn{
  --background: transparent;
  --color: var(--sr-text);
  --padding-start: 10px;
  --padding-end: 10px;
  --padding-top: 8px;
  --padding-bottom: 8px;

  border-radius: 14px;
  border: 1px dashed rgba(255, 160, 60, 0.55);
  background: linear-gradient(135deg, rgb(255 200 120), rgba(255, 255, 255, 0.55));
  box-shadow: 0 8px 16px rgba(255, 170, 80, 0.18);
  font-family: "Noto Kufi Arabic", system-ui, sans-serif;
  font-weight: 900;
}

.srRecoverInner{
  display:inline-flex;
  align-items:center;
  gap:8px;
}

.srRecoverIcon{
  font-size: 18px;
  line-height: 1;
}

.srRecoverText{
  font-size: 12px;
  white-space: nowrap;
}

/* hover / active */
.srRecoverBtn:hover{
  filter: brightness(1.02);
}

.srRecoverBtn:active{
  transform: translateY(1px);
}

  /* =====================================================
     HERO
  ===================================================== */
  .srHero{
    display:flex;
    align-items:center;
    gap:12px;
    padding: 12px 14px;
    border-radius: 16px;
    border: 1px solid var(--sr-soft-border);
    background: linear-gradient(135deg, var(--sr-accent-soft), rgba(255,255,255,0.86));
    box-shadow: var(--sr-shadow-2);
    margin-bottom: 14px;
  }

  .srHeroIcon{ font-size: 22px; }
  .srHeroMain{ font-weight: 1000; font-size: 16px; color: var(--sr-text); }
  .srHeroNum{ font-size: 20px; }
  .srHeroSub{ margin-top:2px; font-weight: 900; font-size: 13px; color: var(--sr-muted); }

  /* =====================================================
     SECTIONS HEADER
  ===================================================== */
  .srSection{ margin-top: 12px; }
  .srSectionHead{
    display:flex;
    align-items:baseline;
    justify-content:space-between;
    gap:10px;
    margin-bottom: 8px;
  }
  .srSectionTitle{ font-weight: 1000; color: var(--sr-text); }
  .srSectionHint{ font-weight: 900; font-size: 12px; color: var(--sr-muted); }

  /* =====================================================
     WEEK GRID
  ===================================================== */
  .srWeekGrid{
    display:grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 8px;
    padding: 10px;
    border-radius: 18px;
    border: 1px solid var(--sr-soft-border);
    background: var(--sr-soft-bg);
  }

  .srDay{
    height: 44px;
    border-radius: 14px;
    border: 1px solid var(--sr-whiteish-border);
    background: var(--sr-whiteish);
    display:flex;
    align-items:center;
    justify-content:center;
    transition: transform .16s ease, box-shadow .16s ease, background .16s ease, border-color .16s ease;
  }

  .srDayIcon{ font-size: 18px; opacity: .45; color: var(--sr-text); }

  .srDay.on{
    background: var(--sr-accent-soft);
    border-color: var(--sr-accent-border);
    box-shadow: var(--sr-shadow-accent);
  }
  .srDay.on .srDayIcon{ opacity: 1; }

  /* =====================================================
     ROWS (weekly/monthly)
  ===================================================== */
  .srRows{ display:flex; flex-direction:column; gap:12px; }

  .srRow{
    padding: 10px;
    border-radius: 18px;
    border: 1px solid var(--sr-soft-border);
    background: var(--sr-soft-bg);
  }

  .srRowTop{
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:10px;
    margin-bottom: 10px;
  }
  .srRowLabel{ font-weight: 1000; color: var(--sr-text); }
  .srMiniNote{ font-size:12px; font-weight:900; color: var(--sr-muted); margin-right:6px; }

  .srCountChip{
    display:inline-flex;
    align-items:center;
    gap:8px;
    padding: 8px 10px;
    border-radius: 999px;
    background: rgba(255,255,255,0.86);
    border: 1px solid var(--sr-soft-border);
    font-weight: 1000;
    min-width: 74px;
    justify-content:center;
    color: var(--sr-text);
  }
  .srCountChip.soft{ background: rgba(255,255,255,0.78); }

  .srChipNum{ font-size:14px; }
  .srChipIcon{ font-size:16px; }

  .srIconsScroll{
    display:flex;
    align-items:center;
    gap:8px;
    overflow-x:auto;
    padding: 2px 0 2px 2px;
    scrollbar-width: none;
  }
  .srIconsScroll::-webkit-scrollbar{ display:none; }

  .srRewardIcon{
    width: 34px;
    height: 34px;
    border-radius: 12px;
    display:flex;
    align-items:center;
    justify-content:center;
    background: rgba(255,255,255,0.80);
    border: 1px solid var(--sr-soft-border);
    flex: 0 0 auto;
  }

  .srMore{ font-weight: 1000; color: var(--sr-muted); padding: 0 4px; }

  /* =====================================================
     MILESTONES
  ===================================================== */
  .srMilestones{
    display:grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }
  .srMilestone{
    border-radius: 18px;
    padding: 12px 10px;
    text-align:center;
    border: 1px solid var(--sr-soft-border);
    background: var(--sr-soft-bg);
    opacity: .60;
    transition: transform .18s ease, box-shadow .18s ease, opacity .18s ease;
    color: var(--sr-text);
  }

  .srMilIcon{ font-size: 18px; }
  .srMilText{ margin-top: 6px; font-weight: 1000; }
  .srMilState{ margin-top: 4px; font-weight: 900; font-size: 12px; color: var(--sr-muted); }

  .srMilestone.achieved{
    opacity: 1;
    background: linear-gradient(135deg, var(--sr-accent-soft), rgba(255,255,255,0.88));
    box-shadow: 0 14px 22px rgba(40,214,204,0.16);
    border-color: rgba(40,214,204,0.35);
  }
  .srMilestone.achieved:hover{ transform: translateY(-1px); }
  .srHeroText{
  flex: 1;
  min-width: 0;
}

.srHeroMain{
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;          /* يسمح بالسطر التاني لو الشاشة ضيقة */
  line-height: 1.25;
}

.srHeroTitle{
  font-weight: 1000;
  display: block;
  width:100%;
  font-size:20px
}

.srHeroDot{
  opacity: .5;
}

.srHeroLabel{
  font-weight: 1000;
}

.srHeroNum{
  font-size: 22px;
  font-weight: 1000;
  direction: ltr;           /* مهم للأرقام مع RTL */
  unicode-bidi: plaintext;  /* يمنع تقليب ترتيب الأرقام */
}

.srHeroSub{
  margin-top: 6px;
  font-weight: 900;
  font-size: 13px;
  color: var(--sr-muted);
  line-height: 1.6;
}

  /* =====================================================
     DAYS CHIPS
  ===================================================== */
  .srChips{
    display:flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content:flex-end;
  }

  .srChip{
    padding: 8px 10px;
    border-radius: 999px;
    font-weight: 1000;
    font-size: 13px;
    background: var(--sr-chip-bg);
    border: 1px solid var(--sr-chip-border);
    color: var(--sr-text);
    opacity: 0.90;
  }
  .srChip.on{
    background: var(--sr-accent-soft);
    border-color: var(--sr-accent-border);
    box-shadow: 0 10px 18px rgba(40,214,204,0.12);
    opacity: 1;
  }

  /* =====================================================
     DEBUG
  ===================================================== */
  .srDebug{
    margin-top: 14px;
    padding: 12px;
    border-radius: 16px;
    border: 1px dashed var(--sr-soft-border);
    background: var(--sr-soft-bg);
  }

  .srDebugTitle{ font-weight: 1000; margin-bottom: 10px; color: var(--sr-text); }
  .srDebugBtns{ display:flex; flex-wrap:wrap; gap:8px; justify-content:flex-end; }

  .srDebugRow{
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:8px;
    margin-bottom: 8px;
  }
  .srDebugLabel{ font-weight: 900; color: var(--sr-text); }
  .srDebugValue{ font-weight: 900; color: var(--sr-muted); }
  .srDebugHint{ margin-right: 6px; font-size: 12px; color: var(--sr-muted); }

  .srMuted{ color: var(--sr-muted); font-weight: 900; }

  /* Animations */
  @keyframes pop{ 0%{transform:scale(.985)} 50%{transform:scale(1.02)} 100%{transform:scale(1)} }
  @keyframes pulseGlow{
    0%{ box-shadow: 0 0 0 rgba(56,242,229,0) }
    50%{ box-shadow: 0 0 0 8px rgba(56,242,229,0.12) }
    100%{ box-shadow: 0 0 0 rgba(56,242,229,0) }
  }

  /* =====================================================
     DARK MODE (ROBUST SELECTORS FOR IONIC)
  ===================================================== */

  :global(body.dark) .srCard,
  :global(html.dark) .srCard,
  :global(.dark) .srCard,
  :global(ion-app.dark) .srCard,
  :global(ion-app.ion-color-scheme-dark) .srCard{
    --sr-card-bg: rgba(12, 16, 20, 0.92);
    --sr-card-border: rgba(255,255,255,0.06);

    --sr-soft-bg: rgba(255,255,255,0.055);
    --sr-soft-border: rgba(255,255,255,0.10);

    --sr-text: rgba(241,245,249,0.94);
    --sr-muted: rgba(241,245,249,0.64);

    --sr-chip-bg: rgba(255,255,255,0.06);
    --sr-chip-border: rgba(255,255,255,0.10);

    --sr-whiteish: rgba(255,255,255,0.040);
    --sr-whiteish-border: rgba(255,255,255,0.10);

    --sr-accent: rgba(56,242,229,0.92);
    --sr-accent-soft: rgba(56,242,229,0.11);
    --sr-accent-border: rgba(56,242,229,0.22);

    --sr-shadow-1: 0 18px 46px rgba(0,0,0,0.58);
    --sr-shadow-2: 0 14px 34px rgba(0,0,0,0.48);
    --sr-shadow-accent: 0 14px 34px rgba(56,242,229,0.12);

    border-color: rgba(255,255,255,0.07);
  }

  :global(body.dark) .srTodayBtn:not(.on),
  :global(html.dark) .srTodayBtn:not(.on),
  :global(.dark) .srTodayBtn:not(.on),
  :global(ion-app.dark) .srTodayBtn:not(.on),
  :global(ion-app.ion-color-scheme-dark) .srTodayBtn:not(.on){
    --background: linear-gradient(135deg, rgba(56,242,229,0.52), rgba(18,110,106,0.78));
    --color: rgba(0,0,0,0.88);
    border-color: rgba(255,255,255,0.10);
  }
  :global(body.dark) .srTodayBtn.on,
  :global(html.dark) .srTodayBtn.on,
  :global(.dark) .srTodayBtn.on,
  :global(ion-app.dark) .srTodayBtn.on,
  :global(ion-app.ion-color-scheme-dark) .srTodayBtn.on{
    border-color: rgba(255,255,255,0.10);
  }
  :global(body.dark) .srTodayBtn.on .btnIcon,
  :global(html.dark) .srTodayBtn.on .btnIcon,
  :global(.dark) .srTodayBtn.on .btnIcon,
  :global(ion-app.dark) .srTodayBtn.on .btnIcon,
  :global(ion-app.ion-color-scheme-dark) .srTodayBtn.on .btnIcon{
    background: rgba(56,242,229,0.14);
  }

  :global(body.dark) .srHero,
  :global(body.dark) .srWeekGrid,
  :global(body.dark) .srRow,
  :global(body.dark) .srMilestone,
  :global(body.dark) .srDebug,
  :global(html.dark) .srHero,
  :global(html.dark) .srWeekGrid,
  :global(html.dark) .srRow,
  :global(html.dark) .srMilestone,
  :global(html.dark) .srDebug,
  :global(.dark) .srHero,
  :global(.dark) .srWeekGrid,
  :global(.dark) .srRow,
  :global(.dark) .srMilestone,
  :global(.dark) .srDebug{
    border-color: transparent !important;
    background: rgba(255,255,255,0.055) !important;
    box-shadow:
      0 12px 28px rgba(0,0,0,0.38),
      inset 0 1px 0 rgba(255,255,255,0.04);
  }

  :global(body.dark) .srHero,
  :global(html.dark) .srHero,
  :global(.dark) .srHero{
    background: linear-gradient(135deg, rgba(56,242,229,0.10), rgba(255,255,255,0.02)) !important;
    box-shadow:
      0 16px 40px rgba(0,0,0,0.50),
      inset 0 1px 0 rgba(255,255,255,0.04);
  }

  :global(body.dark) .srDay,
  :global(body.dark) .srRewardIcon,
  :global(body.dark) .srCountChip,
  :global(body.dark) .srChip,
  :global(html.dark) .srDay,
  :global(html.dark) .srRewardIcon,
  :global(html.dark) .srCountChip,
  :global(html.dark) .srChip,
  :global(.dark) .srDay,
  :global(.dark) .srRewardIcon,
  :global(.dark) .srCountChip,
  :global(.dark) .srChip{
    border-color: transparent !important;
    background: rgba(255,255,255,0.045) !important;
    box-shadow:
      0 10px 22px rgba(0,0,0,0.30),
      inset 0 1px 0 rgba(255,255,255,0.03);
  }

  :global(body.dark) .srDayIcon,
  :global(html.dark) .srDayIcon,
  :global(.dark) .srDayIcon{ opacity: .72; }
  :global(body.dark) .srDay.on .srDayIcon,
  :global(html.dark) .srDay.on .srDayIcon,
  :global(.dark) .srDay.on .srDayIcon{ opacity: 1; }

  :global(body.dark) .srDay.on,
  :global(html.dark) .srDay.on,
  :global(.dark) .srDay.on{
    background: rgba(56,242,229,0.12) !important;
    box-shadow:
      0 14px 34px rgba(56,242,229,0.10),
      0 12px 26px rgba(0,0,0,0.40),
      inset 0 1px 0 rgba(255,255,255,0.04);
  }
  :global(body.dark) .srChip.on,
  :global(html.dark) .srChip.on,
  :global(.dark) .srChip.on{
    background: rgba(56,242,229,0.12) !important;
    box-shadow:
      0 14px 34px rgba(56,242,229,0.10),
      0 10px 22px rgba(0,0,0,0.32),
      inset 0 1px 0 rgba(255,255,255,0.04);
  }

  :global(body.dark) .srMilestone.achieved,
  :global(html.dark) .srMilestone.achieved,
  :global(.dark) .srMilestone.achieved{
    background: linear-gradient(135deg, rgba(56,242,229,0.14), rgba(255,255,255,0.04)) !important;
    box-shadow:
      0 16px 34px rgba(0,0,0,0.45),
      0 14px 34px rgba(56,242,229,0.10),
      inset 0 1px 0 rgba(255,255,255,0.04);
  }

  :global(body.dark) .srCard.srDonePulse,
  :global(html.dark) .srCard.srDonePulse,
  :global(.dark) .srCard.srDonePulse{
    animation: pulseGlow 0.42s ease;
  }

  @media (max-width: 420px){
    .srMilestones{ grid-template-columns: 1fr; }
  }
</style>
