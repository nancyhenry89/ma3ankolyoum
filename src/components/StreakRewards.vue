<!-- src/components/StreakRewards.vue -->
<template>
  <section class="srCard" :class="{ srDonePulse: justToggled }" dir="rtl">
    <!-- Header -->
    <header class="srHeader">
      <div class="srTitleWrap">
        <div class="srTitle">سلسلة القراءة</div>
        <div class="srSubtitle">علّم اليوم بعد ما تخلص قراءة رسالة اليوم</div>
      </div>

      <div class="srHeaderBtns">
        <ion-button
          v-if="canRecover"
          size="small"
          fill="outline"
          color="warning"
          class="srRecoverBtn"
          @click="recoverStreak"
        >
          تعويض يوم (مقابل يومين)
        </ion-button>

        <ion-button
          size="small"
          class="srTodayBtn"
          :class="{ on: readToday }"
          :fill="readToday ? 'clear' : 'solid'"
          @click="toggleReadToday"
        >
          <span class="btnInner">
            <span class="btnIcon">{{ readToday ? "✓" : "✚" }}</span>
            <span class="btnText">{{ readToday ? "شيل علامة اليوم" : "علّم إنك قرأت اليوم" }}</span>
          </span>
        </ion-button>
      </div>
    </header>

    <!-- Hero streak -->
    <div class="srHero" :class="{ on: streak > 0 }">
      <div class="srHeroIcon">{{ streak === 0 ? "✨" : "🔥" }}</div>
      <div class="srHeroText">
        <div class="srHeroMain">
          سلسلة الأيام: <span class="srHeroNum">{{ streak }}</span> يوم
        </div>
        <div class="srHeroSub">
          {{ streak === 0 ? "ابدأ النهارده… علامة واحدة كل يوم ✨" : "كمّل النهارده علشان السلسلة ما تقفش 💛" }}
        </div>
      </div>
    </div>

    <!-- Week -->
    <div class="srSection">
      <div class="srSectionHead">
        <div class="srSectionTitle">أيام الأسبوع</div>
        <div class="srSectionHint">كل 7 أيام = 👑</div>
      </div>

      <div class="srWeekGrid" :class="{ pop: weekPop }">
        <button
          v-for="i in 7"
          :key="i"
          type="button"
          class="srDay"
          :class="{ on: i <= crossesShown }"
          aria-label="يوم من الأسبوع"
        >
          <span class="srDayIcon">✝︎</span>
        </button>
      </div>
    </div>

    <!-- Counters -->
    <div class="srSection">
      <div class="srRows">
        <!-- Weekly crowns -->
        <div class="srRow">
          <div class="srRowTop">
            <div class="srRowLabel">مكافآت أسبوعية</div>
            <div class="srCountChip">
              <span class="srChipNum">{{ weeksLabel }}</span>
              <span class="srChipIcon">👑</span>
            </div>
          </div>

          <div class="srIconsScroll" :class="{ pop: rewardsPop }" aria-label="أكاليل">
            <span v-for="i in weeksShown" :key="'w' + i" class="srRewardIcon">👑</span>
            <span v-if="weeks === 0" class="srMuted">—</span>
            <span v-if="weeks > 12" class="srMore">+{{ weeks - 12 }}</span>
          </div>
        </div>

        <!-- Monthly stars -->
        <div class="srRow">
          <div class="srRowTop">
            <div class="srRowLabel">
              مكافآت شهرية
              <span class="srMiniNote">⭐ كل 4 أسابيع</span>
            </div>
            <div class="srCountChip soft">
              <span class="srChipNum">{{ monthsLabel }}</span>
              <span class="srChipIcon">⭐</span>
            </div>
          </div>

          <div class="srIconsScroll" :class="{ pop: rewardsPop }" aria-label="نجوم">
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
        <div class="srSectionTitle">إنجازات كبيرة</div>
        <div class="srSectionHint">أهداف بعيدة…</div>
      </div>

      <div class="srMilestones">
        <div class="srMilestone" :class="{ achieved: rewards.threeMonths }">
          <div class="srMilIcon">🕯️</div>
          <div class="srMilText">3 شهور</div>
          <div class="srMilState">
            <span v-if="rewards.threeMonths">اتحقق ✅</span>
            <span v-else>لسه 🔒</span>
          </div>
        </div>

        <div class="srMilestone" :class="{ achieved: rewards.sixMonths }">
          <div class="srMilIcon">✨</div>
          <div class="srMilText">6 شهور</div>
          <div class="srMilState">
            <span v-if="rewards.sixMonths">اتحقق ✅</span>
            <span v-else>لسه 🔒</span>
          </div>
        </div>

        <div class="srMilestone" :class="{ achieved: rewards.year }">
          <div class="srMilIcon">⛪</div>
          <div class="srMilText">سنة</div>
          <div class="srMilState">
            <span v-if="rewards.year">اتحقق ✅</span>
            <span v-else>لسه 🔒</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Days list -->
    <div class="srSection">
      <div class="srSectionHead">
        <div class="srSectionTitle">سجل الأيام</div>
        <div class="srSectionHint">آخر علامات</div>
      </div>

      <div class="srChips">
        <span v-for="d in recentDays" :key="d" class="srChip" :class="{ on: d === effectiveTodayISO }">
          {{ formatDay(d) }}
        </span>

        <span v-if="recentDays.length === 0" class="srMuted">مفيش أيام متسجلة لسه</span>
      </div>
    </div>

    <!-- Debug -->
    <div v-if="isDebug" class="srDebug">
      <div class="srDebugTitle">⚙️ Debug</div>

      <div class="srDebugRow">
        <div class="srDebugLabel">اليوم المستخدم:</div>
        <div class="srDebugValue">
          {{ effectiveTodayISO }}
          <span v-if="fakeToday" class="srDebugHint">(وهمي)</span>
        </div>
      </div>

      <div class="srDebugBtns">
        <ion-button size="small" fill="outline" @click="resetFakeToday">اليوم الحقيقي</ion-button>
        <ion-button size="small" fill="outline" @click="shiftFakeDay(-1)">اليوم = أمس</ion-button>
        <ion-button size="small" fill="outline" @click="shiftFakeDay(1)">اليوم = بكرة</ion-button>
        <ion-button size="small" fill="outline" @click="shiftFakeDay(-7)">-7 أيام</ion-button>
        <ion-button size="small" fill="outline" @click="shiftFakeDay(7)">+7 أيام</ion-button>
      </div>

      <div class="srDebugBtns" style="margin-top: 10px">
        <ion-button size="small" fill="outline" @click="seedStreak(6)">6 أيام</ion-button>
        <ion-button size="small" fill="outline" @click="seedStreak(7)">7 (👑)</ion-button>
        <ion-button size="small" fill="outline" @click="seedStreak(14)">14 (👑👑)</ion-button>
        <ion-button size="small" fill="outline" @click="seedStreak(28)">28 (⭐)</ion-button>
        <ion-button size="small" fill="outline" @click="seedStreak(56)">56 (⭐⭐)</ion-button>
        <ion-button size="small" fill="outline" @click="seedStreak(90)">90 (3 شهور)</ion-button>
        <ion-button size="small" fill="outline" @click="seedStreak(180)">180 (6 شهور)</ion-button>
        <ion-button size="small" fill="outline" @click="seedStreak(365)">365 (سنة)</ion-button>
        <ion-button size="small" color="danger" @click="resetAll">مسح الكل</ion-button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { IonButton } from "@ionic/vue";
import { ref, onMounted, computed, watch } from "vue";
import { useRoute } from "vue-router";

import { getReadDays, addReadDay, removeReadDay, setDebugReadDays, clearReadDays } from "@/utils/streakStore";
import { computeStreak, computeRewards } from "@/utils/streakLogic";

const props = defineProps<{ todayISO: string }>();
const route = useRoute();
const isDebug = computed(() => route.query.debug === "1");

/** Debug fake today */
const fakeToday = ref<string | null>(null);
const effectiveTodayISO = computed(() => fakeToday.value ?? props.todayISO);

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function addDaysISO(iso: string, n: number) {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function shiftFakeDay(delta: number) {
  const base = fakeToday.value ?? props.todayISO;
  fakeToday.value = addDaysISO(base, delta);
}
function resetFakeToday() {
  fakeToday.value = null;
}

/** state */
const readDays = ref<string[]>([]);
const readToday = computed(() => readDays.value.includes(effectiveTodayISO.value));

const streak = ref(0);
const rewards = ref(computeRewards(0));

const recentDays = computed(() => [...readDays.value].sort().reverse().slice(0, 14));

function formatDay(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

function recompute() {
  const s = computeStreak(readDays.value, effectiveTodayISO.value);
  streak.value = s.streak;
  rewards.value = computeRewards(s.streak);
}

/** UI derived */
const crossesShown = computed(() => {
  const c = Number((rewards.value as any).crossesThisWeek ?? 0);
  if (streak.value > 0 && c === 0) return 7;
  return c;
});
const weeks = computed(() => Number((rewards.value as any).fullWeeks ?? 0));
const months = computed(() => Number((rewards.value as any).fullMonths ?? 0));

const weeksLabel = computed(() => (weeks.value >= 50 ? "50+" : String(weeks.value)));
const monthsLabel = computed(() => (months.value >= 50 ? "50+" : String(months.value)));

const weeksShown = computed(() => Math.min(weeks.value, 12));
const monthsShown = computed(() => Math.min(months.value, 12));

/** Recover rule */
const canRecover = computed(() => {
  if (readToday.value) return false;
  const set = new Set(readDays.value);
  const y = addDaysISO(effectiveTodayISO.value, -1);
  return !set.has(y) && readDays.value.length >= 2;
});

async function recoverStreak() {
  const sorted = [...new Set(readDays.value)].sort(); // asc
  if (sorted.length < 2) return;

  sorted.splice(0, 2); // remove oldest 2
  const y = addDaysISO(effectiveTodayISO.value, -1);
  if (!sorted.includes(y)) sorted.push(y);
  sorted.sort();

  readDays.value = await setDebugReadDays(sorted);
  recompute();
  pulseFlag(rewardsPop, 520);
  pulseFlag(weekPop, 520);
}

/** Animations */
const justToggled = ref(false);
const weekPop = ref(false);
const rewardsPop = ref(false);

function pulseFlag(flag: { value: boolean }, ms = 420) {
  flag.value = true;
  window.setTimeout(() => (flag.value = false), ms);
}

/** Data load */
async function load() {
  readDays.value = await getReadDays();
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
}

async function seedStreak(n: number) {
  const days: string[] = [];
  for (let i = 0; i < n; i++) days.push(addDaysISO(effectiveTodayISO.value, -i));
  readDays.value = await setDebugReadDays(days);
  recompute();
  pulseFlag(rewardsPop, 520);
  pulseFlag(weekPop, 520);
}
async function resetAll() {
  readDays.value = await clearReadDays();
  recompute();
}

onMounted(load);
watch(() => props.todayISO, load);
watch(effectiveTodayISO, () => recompute());
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
  }
  .srTodayBtn .btnInner{ display:inline-flex; align-items:center; gap:8px; }
  .srTodayBtn .btnIcon{
    width: 22px; height: 22px;
    display:inline-flex; align-items:center; justify-content:center;
    border-radius: 10px;
    font-weight: 1000;
    background: rgba(255,255,255,0.22);
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
  
  /* Recover button */
  .srRecoverBtn{ border-radius: 12px; font-weight: 900; }
  
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
     We target ANY dark ancestor: body.dark, html.dark, ion-app.dark, .dark
  ===================================================== */
  
  :global(body.dark) .srCard,
  :global(html.dark) .srCard,
  :global(.dark) .srCard,
  :global(ion-app.dark) .srCard,
  :global(ion-app.ion-color-scheme-dark) .srCard{
    /* tokens */
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
  
    /* soften outer card border */
    border-color: rgba(255,255,255,0.07);
  }
  
  /* Today button (dark) */
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
  
  /* Remove "bad borders" everywhere in dark + add depth like screenshot */
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
  
  /* Hero special gradient */
  :global(body.dark) .srHero,
  :global(html.dark) .srHero,
  :global(.dark) .srHero{
    background: linear-gradient(135deg, rgba(56,242,229,0.10), rgba(255,255,255,0.02)) !important;
    box-shadow:
      0 16px 40px rgba(0,0,0,0.50),
      inset 0 1px 0 rgba(255,255,255,0.04);
  }
  
  /* Small items in dark: no borders, pill/surface depth */
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
  
  /* Day icons opacity in dark */
  :global(body.dark) .srDayIcon,
  :global(html.dark) .srDayIcon,
  :global(.dark) .srDayIcon{ opacity: .72; }
  :global(body.dark) .srDay.on .srDayIcon,
  :global(html.dark) .srDay.on .srDayIcon,
  :global(.dark) .srDay.on .srDayIcon{ opacity: 1; }
  
  /* ON states glow (day + chip) */
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
  
  /* Milestone achieved in dark */
  :global(body.dark) .srMilestone.achieved,
  :global(html.dark) .srMilestone.achieved,
  :global(.dark) .srMilestone.achieved{
    background: linear-gradient(135deg, rgba(56,242,229,0.14), rgba(255,255,255,0.04)) !important;
    box-shadow:
      0 16px 34px rgba(0,0,0,0.45),
      0 14px 34px rgba(56,242,229,0.10),
      inset 0 1px 0 rgba(255,255,255,0.04);
  }
  
  /* Pulse selector (when toggled) */
  :global(body.dark) .srCard.srDonePulse,
  :global(html.dark) .srCard.srDonePulse,
  :global(.dark) .srCard.srDonePulse{
    animation: pulseGlow 0.42s ease;
  }
  
  /* Mobile */
  @media (max-width: 420px){
    .srMilestones{ grid-template-columns: 1fr; }
  }
  </style>
  