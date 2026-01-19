<!-- SpiritualNotesCard.vue -->
<template>
  <section class="nrCard mkNoCapture" :dir="dir" :lang="lang">
    <!-- Header -->
    <header class="nrHeader">
      <div class="nrTitleWrap">
        <div class="nrTitle">{{ ui.title }}</div>
        <div class="nrSubtitle">{{ ui.subtitle }}</div>
      </div>

      <ion-button size="small" fill="clear" class="nrDetailsBtn" @click="goDetails">
        {{ ui.openDetails }}
      </ion-button>
    </header>

    <!-- Debug Note (only when ?debugNote=1) -->
    <div v-if="isDebugNote" class="nrDebug">
      <div class="nrDebugTitle">⚙️ Debug Note</div>

      <div class="nrDebugRow">
        <div class="nrDebugLabel">{{ ui.debugTodayLabel }}</div>
        <div class="nrDebugValue">
          {{ effectiveTodayISO }}
          <span v-if="fakeToday" class="nrDebugHint">{{ ui.debugFake }}</span>
        </div>
      </div>

      <div class="nrDebugBtns">
        <ion-button size="small" fill="outline" @click="resetFakeToday">{{ ui.debugRealToday }}</ion-button>
        <ion-button size="small" fill="outline" @click="shiftFakeDay(-1)">{{ ui.debugYesterday }}</ion-button>
        <ion-button size="small" fill="outline" @click="shiftFakeDay(1)">{{ ui.debugTomorrow }}</ion-button>
        <ion-button size="small" fill="outline" @click="shiftFakeDay(-7)">{{ ui.debugMinus7 }}</ion-button>
        <ion-button size="small" fill="outline" @click="shiftFakeDay(7)">{{ ui.debugPlus7 }}</ion-button>

        <ion-button size="small" color="danger" fill="outline" @click="hardResetNotes">
          {{ ui.debugResetAll }}
        </ion-button>
      </div>
    </div>

    <!-- Reminder banner -->
    <div v-if="hasAnyReminder" class="nrBanner">
      <div class="nrBannerTop">
        <div class="nrBannerTitle">
          <span class="nrWarnIcon">✨</span>
          <span>{{ ui.reminders }}</span>
        </div>
        <div class="nrBannerCount">{{ reminders.length }}</div>
      </div>

      <div class="nrBannerGrid">
        <div v-for="r in reminders" :key="r.key" class="nrBannerItem">
          <span class="nrCross">♰</span>
          <span class="nrBannerText">{{ r.text }}</span>
        </div>
      </div>
    </div>

    <!-- Daily prayers -->
    <div class="nrSection">
      <div class="nrSectionHead">
        <div class="nrSectionTitle">{{ ui.daily }}</div>
        <div class="nrSectionHint">{{ ui.dailyHint }}</div>
      </div>

      <div class="nrGrid3">
        <!-- Morning -->
        <div class="nrBtnWrap">
          <button type="button" class="nrBtn" :class="{ on: doneToday.morning }" @click="toggle('morning')">
            <span class="nrBtnIcon">♰</span>
            <span class="nrBtnText">{{ ui.morning }}</span>
          </button>
          <span
  v-if="habitCountsToday.morning > 0"
  class="nrBadge"
  role="button"
  tabindex="0"
  @click.stop="openHabitPopover($event, 'morning')"
  @keydown.enter.stop="openHabitPopover($event, 'morning')"
>
  {{ habitCountsToday.morning }}
</span>

        </div>

        <!-- Bible -->
        <div class="nrBtnWrap">
          <button type="button" class="nrBtn" :class="{ on: doneToday.bible }" @click="toggle('bible')">
            <span class="nrBtnIcon">♰</span>
            <span class="nrBtnText">{{ ui.bible }}</span>
          </button>

          <span
            v-if="habitCountsToday.bible > 0"
            class="nrBadge"
            role="button"
            tabindex="0"
            @click.stop="openHabitPopover($event, 'bible')"
            @keydown.enter.stop="openHabitPopover($event, 'bible')"
            aria-label="Bible count"
          >
            {{ habitCountsToday.bible }}
          </span>
        </div>

        <!-- Sleep -->
        <div class="nrBtnWrap">
          <button type="button" class="nrBtn" :class="{ on: doneToday.sleep }" @click="toggle('sleep')">
            <span class="nrBtnIcon">♰</span>
            <span class="nrBtnText">{{ ui.sleep }}</span>
          </button>

          <span
            v-if="habitCountsToday.sleep > 0"
            class="nrBadge"
            role="button"
            tabindex="0"
            @click.stop="openHabitPopover($event, 'sleep')"
            @keydown.enter.stop="openHabitPopover($event, 'sleep')"
            aria-label="Sleep count"
          >
            {{ habitCountsToday.sleep }}
          </span>
        </div>
      </div>
    </div>

    <!-- Weekly / Monthly (side-by-side) -->
    <div class="nrSection">
      <div class="nrRows2">
        <!-- Communion -->
        <div class="nrRow">
          <div class="nrRowTop">
            <div class="nrRowLabel">{{ ui.communion }}</div>
            <div class="nrMeta">{{ ui.last }} {{ lastCommunionLabel }}</div>
          </div>

          <div class="nrWideWrap">
            <button
              type="button"
              class="nrBtnWide"
              :class="{ on: communionDoneToday, danger: communionOverdue }"
              @click="toggle('communion')"
            >
              <span class="nrBtnWideIcon">♰</span>
              <span class="nrBtnWideText">{{ ui.communionBtn }}</span>
              <span class="nrBtnWideState" v-if="communionDoneToday">{{ ui.done }}</span>
            </button>

            <span
              v-if="habitCountsToday.communion > 0"
              class="nrBadgeWide"
              role="button"
              tabindex="0"
              @click.stop="openHabitPopover($event, 'communion')"
              @keydown.enter.stop="openHabitPopover($event, 'communion')"
              aria-label="Communion count"
            >
              {{ habitCountsToday.communion }}
            </span>
          </div>
        </div>

        <!-- Confession -->
        <div class="nrRow">
          <div class="nrRowTop">
            <div class="nrRowLabel">{{ ui.confession }}</div>
            <div class="nrMeta">{{ ui.last }} {{ lastConfessionLabel }}</div>
          </div>

          <div class="nrWideWrap">
            <button
              type="button"
              class="nrBtnWide"
              :class="{ on: confessionDoneToday, danger: confessionOverdue }"
              @click="toggle('confession')"
            >
              <span class="nrBtnWideIcon">♰</span>
              <span class="nrBtnWideText">{{ ui.confessionBtn }}</span>
              <span class="nrBtnWideState" v-if="confessionDoneToday">{{ ui.done }}</span>
            </button>

            <span
              v-if="habitCountsToday.confession > 0"
              class="nrBadgeWide"
              role="button"
              tabindex="0"
              @click.stop="openHabitPopover($event, 'confession')"
              @keydown.enter.stop="openHabitPopover($event, 'confession')"
              aria-label="Confession count"
            >
              {{ habitCountsToday.confession }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Today note -->
    <div class="nrSection today-note">
      <div class="nrSectionHead">
        <div class="nrSectionTitle">{{ ui.noteTitle }}</div>
      </div>

      <textarea class="nrTextarea" v-model="todayNote" :placeholder="ui.notePlaceholder" />
      <div class="nrSaved" v-if="savedPulse">{{ ui.saved }}</div>
    </div>

    <!-- ✅ Popover for counts -->
    <ion-popover
      :is-open="countPopoverOpen"
      :event="countPopoverEvent"
      @didDismiss="countPopoverOpen = false"
      class="nrCountPopover"
      translucent
      side="top"
      alignment="center"
    >
    <div
  class="nrCountPopInner"
  :dir="isArabic ? 'rtl' : 'ltr'"
  :style="{ textAlign: isArabic ? 'right' : 'left' }"
>
  {{ countPopoverText }}
</div>
    </ion-popover>
  </section>
</template>

<script setup lang="ts">
import { IonButton, IonPopover } from "@ionic/vue";
import { computed, onMounted, onBeforeUnmount, ref, watch } from "vue";
import { useRouter, useRoute } from "vue-router";

import {
  getHabitDays,
  addHabitDay,
  removeHabitDay,
  getDailyNote,
  setDailyNote,
  clearAllNotesStorage,
  type HabitKey,
} from "@/utils/spiritualNotesStore";

import {
  addDaysISO,
  lastDoneISO,
  isWeeklyOverdue,
  isMonthlyOverdue,
} from "@/utils/spiritualNotesLogic";

/** ✅ NEW: Firebase today counts */
import {
  listenTodayHabitCounts,
  setTodayHabitState,
  peopleTextHabit,
  type HabitCountKey,
} from "@/services/habitCounts";

const props = defineProps<{ todayISO: string; lang: "ar" | "en" }>();

const isArabic = computed(() => props.lang !== "en");
const dir = computed(() => (isArabic.value ? "rtl" : "ltr"));
const lang = computed(() => (isArabic.value ? "ar" : "en"));

const ui = computed(() => {
  if (!isArabic.value) {
    return {
      title: "Spiritual Notes",
      subtitle: "Daily prayers, Bible, communion, confession",
      openDetails: "Details",
      reminders: "God is calling you 🤍",
      daily: "Daily",
      dailyHint: "Tap ♰ when completed",
      morning: "Morning",
      bible: "Bible",
      sleep: "Night",
      communion: "Communion (Weekly)",
      confession: "Confession (Monthly)",
      communionBtn: "Communion",
      confessionBtn: "Confession",
      done: "Done ✓",
      last: "Last:",
      never: "Not recorded",
      noteTitle: "Today’s note",
      notePlaceholder: "Write a short note…",
      saved: "Saved ✓",
      reminderMorningOne: "🌅 I’m waiting to hear your voice in the morning",
      reminderMorningMany: (n: number) =>
        `🌅 Morning prayer was missed for ${n} day${n === 1 ? "" : "s"}… I’m waiting to hear you today`,
      reminderSleepOne: "🌙 Don’t forget to talk to Me at night",
      reminderSleepMany: (n: number) =>
        `🌙 Night prayer was missed for ${n} day${n === 1 ? "" : "s"}… don’t forget Me today`,
      reminderBibleOne: "📖 A gentle reminder to listen to My word today",
      reminderBibleMany: (n: number) =>
        `📖 Bible reading was missed for ${n} day${n === 1 ? "" : "s"}… I’m waiting to speak with you today`,
      reminderCommunion: "🍞 A week has passed — I want to give you My Body and Blood",
      reminderConfession: "🙏 A month has passed — I want to forgive your sins… go to your father of confession soon",
      debugTodayLabel: "Effective today:",
      debugFake: "(fake)",
      debugRealToday: "Real today",
      debugYesterday: "Today = yesterday",
      debugTomorrow: "Today = tomorrow",
      debugMinus7: "-7 days",
      debugPlus7: "+7 days",
      debugResetAll: "Clear notes",
    };
  }

  return {
    title: "النوتة الروحية",
    subtitle: "باكر + الكتاب المقدس + نوم + تناول + اعتراف ",
    openDetails: "التفاصيل",
    reminders: "ربنا بينادي عليك 🤍",
    daily: "يومي",
    dailyHint: "اضغط ♰ بعد الانتهاء",
    morning: "باكر",
    bible: "الكتاب المقدس",
    sleep: "نوم",
    communion: "تناول (أسبوعي)",
    confession: "اعتراف (شهري)",
    communionBtn: "تناول",
    confessionBtn: "اعتراف",
    done: "تم ✓",
    last: "آخر مرة:",
    never: "غير مسجل",
    noteTitle: "نوتة اليوم",
    notePlaceholder: "اكتب ملاحظة قصيرة…",
    saved: "تم الحفظ ✓",
    reminderMorningOne: "🌅 أنا مستني أسمع صوتك الصبح",
    reminderMorningMany: (n: number) =>
      `🌅 باكر فاتت من ${n} ${n === 1 ? "يوم" : "أيام"}… أنا مستني أسمع صوتك النهارده`,
    reminderSleepOne: "🌙 متنساش تكلّمني بالليل",
    reminderSleepMany: (n: number) =>
      `🌙 صلاة النوم فاتت من ${n} ${n === 1 ? "يوم" : "أيام"}… متنساش تكلّمني النهارده`,
    reminderBibleOne: "📖 بفكّرك تسمعني النهارده",
    reminderBibleMany: (n: number) =>
      `📖 الكتاب المقدس فات منك ${n} ${n === 1 ? "يوم" : "أيام"}… أنا مشتاق أكلّمك النهارده`,
    reminderCommunion: "🍞 فات أسبوع وأنا عايز أديك جسدي ودمي",
    reminderConfession: "🙏 فات شهر وأنا عايز أغفرلك خطاياك… روح لأبونا في أقرب وقت",
    debugTodayLabel: "اليوم المستخدم:",
    debugFake: "(وهمي)",
    debugRealToday: "اليوم الحقيقي",
    debugYesterday: "اليوم = أمس",
    debugTomorrow: "اليوم = بكرة",
    debugMinus7: "-7 أيام",
    debugPlus7: "+7 أيام",
    debugResetAll: "مسح النوتة",
  };
});

const router = useRouter();
const route = useRoute();

function goDetails() {
  router.push({ path: "/notes", query: { lang: props.lang, date: props.todayISO } });
}

/** debug */
const isDebugNote = computed(() => route.query.debugNote === "1");
const fakeToday = ref<string | null>(null);
const effectiveTodayISO = computed(() =>
  isDebugNote.value ? (fakeToday.value ?? props.todayISO) : props.todayISO
);

function shiftFakeDay(delta: number) {
  const base = fakeToday.value ?? props.todayISO;
  fakeToday.value = addDaysISO(base, delta);
}
function resetFakeToday() {
  fakeToday.value = null;
}

/** state */
const habits = ref<Record<HabitKey, string[]>>({
  morning: [],
  bible: [],
  sleep: [],
  communion: [],
  confession: [],
});

const todayNote = ref("");
const savedPulse = ref(false);

/** global first day ever in notes (any habit) */
const notesStartISO = computed(() => {
  const all = [
    ...habits.value.morning,
    ...habits.value.bible,
    ...habits.value.sleep,
    ...habits.value.communion,
    ...habits.value.confession,
  ]
    .filter(Boolean)
    .sort();
  return all.length ? all[0] : null;
});

const hasAnyHistory = computed(() => !!notesStartISO.value);

async function loadNotes() {
  habits.value.morning = await getHabitDays("morning");
  habits.value.bible = await getHabitDays("bible");
  habits.value.sleep = await getHabitDays("sleep");
  habits.value.communion = await getHabitDays("communion");
  habits.value.confession = await getHabitDays("confession");

  todayNote.value = await getDailyNote(effectiveTodayISO.value);
  habits.value = { ...habits.value };
}

onMounted(loadNotes);

watch(
  () => props.todayISO,
  () => {
    if (!isDebugNote.value) fakeToday.value = null;
    loadNotes();
  }
);

watch(effectiveTodayISO, loadNotes);

const doneToday = computed(() => {
  const t = effectiveTodayISO.value;
  return {
    morning: habits.value.morning.includes(t),
    bible: habits.value.bible.includes(t),
    sleep: habits.value.sleep.includes(t),
  };
});

const communionDoneToday = computed(() => habits.value.communion.includes(effectiveTodayISO.value));
const confessionDoneToday = computed(() => habits.value.confession.includes(effectiveTodayISO.value));

async function toggle(key: HabitKey) {
  const iso = effectiveTodayISO.value;
  const arr = habits.value[key] || [];

  if (arr.includes(iso)) habits.value[key] = await removeHabitDay(key, iso);
  else habits.value[key] = await addHabitDay(key, iso);

  habits.value[key] = [...habits.value[key]];
  habits.value = { ...habits.value };

  // ✅ NEW: sync Firebase "today count" (doesn't touch old functionality)
  const nowDone = habits.value[key].includes(iso);
  syncHabitCount(key, nowDone).catch(console.error);
}

/** overdue */
const communionOverdue = computed(
  () => isWeeklyOverdue(habits.value.communion, effectiveTodayISO.value).overdue
);
const confessionOverdue = computed(
  () => isMonthlyOverdue(habits.value.confession, effectiveTodayISO.value).overdue
);

const lastCommunionLabel = computed(() => lastDoneISO(habits.value.communion) || ui.value.never);
const lastConfessionLabel = computed(() => lastDoneISO(habits.value.confession) || ui.value.never);

/** Missed streak */
function missedStreakEndingYesterday(days: string[], todayISO: string) {
  const start = notesStartISO.value;
  if (!start) return 0;
  if (todayISO <= start) return 0;

  let count = 0;
  let cur = addDaysISO(todayISO, -1);

  while (cur >= start) {
    if (days.includes(cur)) break;
    count++;
    cur = addDaysISO(cur, -1);
  }
  return count;
}

const reminders = computed(() => {
  const list: Array<{ key: string; text: string }> = [];
  const t = effectiveTodayISO.value;

  if (!hasAnyHistory.value) return list;

  const mMorning = missedStreakEndingYesterday(habits.value.morning, t);
  if (mMorning === 1) list.push({ key: "morn1", text: ui.value.reminderMorningOne });
  else if (mMorning > 1) list.push({ key: "mornN", text: ui.value.reminderMorningMany(mMorning) });

  const mSleep = missedStreakEndingYesterday(habits.value.sleep, t);
  if (mSleep === 1) list.push({ key: "sleep1", text: ui.value.reminderSleepOne });
  else if (mSleep > 1) list.push({ key: "sleepN", text: ui.value.reminderSleepMany(mSleep) });

  const mBible = missedStreakEndingYesterday(habits.value.bible, t);
  if (mBible === 1) list.push({ key: "bible1", text: ui.value.reminderBibleOne });
  else if (mBible > 1) list.push({ key: "bibleN", text: ui.value.reminderBibleMany(mBible) });

  if (communionOverdue.value) list.push({ key: "com", text: ui.value.reminderCommunion });
  if (confessionOverdue.value) list.push({ key: "conf", text: ui.value.reminderConfession });

  return list;
});

const hasAnyReminder = computed(() => reminders.value.length > 0);

/** Note autosave */
let noteTimer: any = null;
watch(todayNote, () => {
  window.clearTimeout(noteTimer);
  noteTimer = window.setTimeout(async () => {
    await setDailyNote(effectiveTodayISO.value, todayNote.value);
    savedPulse.value = true;
    window.setTimeout(() => (savedPulse.value = false), 650);
  }, 450);
});

/** hard reset */
async function hardResetNotes() {
  await clearAllNotesStorage();
  fakeToday.value = null;
  await loadNotes();
}

/* =========================================================
   ✅ Firebase Today Counters (counts only)
========================================================= */

type Keys = HabitCountKey; // 'morning'|'bible'|'sleep'|'communion'|'confession'

const habitCountsToday = ref<Record<Keys, number>>({
  morning: 0,
  bible: 0,
  sleep: 0,
  communion: 0,
  confession: 0,
});

const habitBusy = ref<Record<Keys, boolean>>({
  morning: false,
  bible: false,
  sleep: false,
  communion: false,
  confession: false,
});

let unsubHabitCounts: any = null;

function attachHabitCountsListener() {
  unsubHabitCounts?.();

  const dateISO = effectiveTodayISO.value;
  const keys: Keys[] = ["morning", "bible", "sleep", "communion", "confession"];

  unsubHabitCounts = listenTodayHabitCounts(dateISO, keys, (counts) => {
    habitCountsToday.value = { ...habitCountsToday.value, ...counts };
  });
}

onMounted(() => {
  attachHabitCountsListener();
});

watch(effectiveTodayISO, () => {
  attachHabitCountsListener();
});

onBeforeUnmount(() => {
  unsubHabitCounts?.();
  unsubHabitCounts = null;
});

async function syncHabitCount(key: HabitKey, done: boolean) {
  if (!["morning", "bible", "sleep", "communion", "confession"].includes(key)) return;

  const k = key as Keys;
  if (habitBusy.value[k]) return;

  habitBusy.value = { ...habitBusy.value, [k]: true };

  // ✅ optimistic
  const prev = Number(habitCountsToday.value[k] || 0);
  const next = Math.max(0, prev + (done ? 1 : -1));
  habitCountsToday.value = { ...habitCountsToday.value, [k]: next };

  try {
    await setTodayHabitState(effectiveTodayISO.value, k, done);
  } catch (e) {
    // rollback
    habitCountsToday.value = { ...habitCountsToday.value, [k]: prev };
    console.error(e);
  } finally {
    habitBusy.value = { ...habitBusy.value, [k]: false };
  }
}

/* =========================================================
   ✅ Popover text + open
========================================================= */

const countPopoverOpen = ref(false);
const countPopoverEvent = ref<any>(null);
const countPopoverText = ref("");

function openHabitPopover(ev: any, key: Keys) {
  const n = Number(habitCountsToday.value[key] || 0);
  countPopoverText.value = peopleTextHabit(key, n, isArabic.value ? 'ar' : 'en');
  countPopoverEvent.value = ev;
  countPopoverOpen.value = true;
}
</script>

  
<style scoped>
  /* =========================
     Debug
  ========================= */
  .nrDebug {
    margin: 0 0 14px 0;
    padding: 12px;
    border-radius: 16px;
    border: 1px dashed rgba(255, 170, 80, 0.35);
    background: rgba(255, 255, 255, 0.06);
  }
  :global(.home.theme-light) .nrDebug {
    background: rgba(255, 255, 255, 0.75);
    border-color: rgba(24, 42, 68, 0.10);
  }
  .nrDebugTitle { font-weight: 1000; margin-bottom: 10px; }
  .nrDebugRow { display: flex; justify-content: space-between; gap: 8px; margin-bottom: 10px; }
  .nrDebugLabel { font-weight: 900; opacity: .85; }
  .nrDebugValue { font-weight: 900; opacity: .85; }
  .nrDebugHint { margin-inline-start: 6px; font-size: 12px; opacity: .7; }
  .nrDebugBtns { display: flex; flex-wrap: wrap; gap: 8px; justify-content: flex-end; }
  
  /* =========================
     Card
  ========================= */
  .nrCard{
    padding: 12px 12px;
    border-radius: 18px;
  
    border: 1px solid rgba(40,214,204,0.22);
    background:
      radial-gradient(720px 220px at 18% 0%, rgba(40,214,204,0.18), transparent 62%),
      rgba(255,255,255,0.08);
  
    color: var(--mk-text, #f5f7fa);
    box-shadow:
      0 18px 42px rgba(0,0,0,0.30),
      0 0 0 2px rgba(40,214,204,0.06);
  
    backdrop-filter: blur(10px);
    font-family: "Noto Kufi Arabic", system-ui, sans-serif;
  }
  .today-note{display: none;}
  :global(.home.theme-light) .nrCard{
    background:
      radial-gradient(720px 220px at 18% 0%, rgba(40,214,204,0.14), transparent 62%),
      rgba(255,255,255,0.78);
    border-color: rgba(24,42,68,0.10);
    color: var(--mk-text, #0b1f33);
    box-shadow:
      0 14px 30px rgba(0,0,0,0.08),
      0 0 0 2px rgba(40,214,204,0.07);
  }
  
  /* =========================
     Header
  ========================= */
  .nrHeader{
    display:flex;
    justify-content:space-between;
    align-items:flex-start;
    gap:12px;
    margin-bottom: 8px;
  }
  .nrTitle{ font-weight: 1000; font-size: 16px; }
  .nrSubtitle{ font-weight: 800; font-size: 12px; opacity: .75; margin-top:2px; }
  
  /* Details button */
  .nrDetailsBtn{
    --padding-start: 0;
    --padding-end: 0;
  
    font-weight: 1000;
    font-size: 12px;
    letter-spacing: 0;
  
    display: inline-flex;
    align-items: center;
    gap: 6px;
  
    padding: 6px 12px;
    border-radius: 999px;
  
    color: #fff;
    background: #253045;
  
    border: 1px solid rgba(40,214,204,0.35);
    box-shadow:
      0 8px 18px rgba(40,214,204,0.18),
      inset 0 0 0 1px rgba(255,255,255,0.35);
  
    transition: transform 0.15s ease, box-shadow 0.2s ease, background 0.2s ease;
    font-family: "Noto Kufi Arabic", system-ui, sans-serif;
  }
  :global(.home.theme-dark) .nrDetailsBtn{
    color: #eafffd;
    background:
      radial-gradient(320px 120px at 20% 0%, rgba(40,214,204,0.18), transparent 60%),
      rgba(0,0,0,0.28);
    border-color: rgba(40,214,204,0.45);
    box-shadow:
      0 10px 22px rgba(0,0,0,0.45),
      0 0 0 1px rgba(40,214,204,0.20);
  }
  .nrDetailsBtn:hover{
    box-shadow:
      0 12px 26px rgba(40,214,204,0.28),
      inset 0 0 0 1px rgba(255,255,255,0.45);
  }
  .nrDetailsBtn:active{ transform: scale(0.96); }
  .nrDetailsBtn::after{
    content: "›";
    font-size: 16px;
    line-height: 1;
    opacity: 0.7;
    margin-inline-start: 2px;
  }
  
  /* =========================
     Banner (Reminders)
  ========================= */
  .nrBanner{
    border-radius: 16px;
    padding: 10px 10px;
    border: 1px dashed rgba(40,214,204,0.40);
    background: linear-gradient(135deg, rgb(214 77 40 / 14%), rgba(255, 255, 255, 0.06));
    box-shadow: 0 14px 26px rgba(0,0,0,0.10);
    margin-bottom: 10px;
  }
  :global(.home.theme-light) .nrBanner{
    background: linear-gradient(135deg, rgba(40,214,204,0.14), rgba(255,255,255,0.78));
    box-shadow: 0 10px 20px rgba(0,0,0,0.07);
  }
  .nrBannerTop{
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:10px;
    margin-bottom: 8px;
  }
  .nrBannerTitle{
    display:flex;
    align-items:center;
    gap:10px;
    font-weight: 1000;
    font-size: 14px;
  }
  .nrWarnIcon{ font-size: 16px; }
  .nrBannerCount{
    min-width: 30px;
    height: 26px;
    border-radius: 999px;
    display:flex;
    align-items:center;
    justify-content:center;
    font-weight: 1000;
    border: 1px solid rgba(40,214,204,0.28);
    background: rgba(40,214,204,0.12);
  }
  .nrBannerGrid{
    display:grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  @media (max-width: 520px){
    .nrBannerGrid{ grid-template-columns: 1fr; }
  }
  .nrBannerItem{
    display:flex;
    align-items:center;
    gap:10px;
    padding: 9px 9px;
    border-radius: 14px;
    border: 1px solid rgba(255,255,255,0.10);
    background: rgba(255,255,255,0.06);
  }
  :global(.home.theme-light) .nrBannerItem{
    background: rgba(255,255,255,0.72);
    border-color: rgba(24,42,68,0.10);
  }
  .nrCross{
    width: 26px;
    height: 26px;
    border-radius: 12px;
    display:flex;
    align-items:center;
    justify-content:center;
    font-size: 15px;
    background: rgba(40,214,204,0.14);
    border: 1px solid rgba(40,214,204,0.28);
  }
  .nrBannerText{
    font-weight: 900;
    opacity: .92;
    line-height: 1.35;
    font-size: 13px;
  }
  
  /* =========================
     Sections
  ========================= */
  .nrSection{ margin-top: 30px; }
  .nrSectionHead{
    display:flex;
    justify-content:space-between;
    align-items:baseline;
    gap:10px;
    margin-bottom: 8px;
  }
  .nrSectionTitle{ font-weight: 1000; font-size: 14px; }
  .nrSectionHint{ font-weight: 900; font-size: 12px; opacity:.7; }
  
  /* =========================
     Daily (3 buttons)
  ========================= */
  .nrGrid3{
    display:grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }
  @media (max-width: 420px){
    .nrGrid3{ grid-template-columns: 1fr; }
  }
  
  /* wrapper ensures badge doesn't affect layout */
  .nrBtnWrap{
    position: relative;
    display: block;
  }
  .nrBtnWrap .nrBtn{
    width: 100%;
  }
  
  .nrBtn{
    height: 42px;
    border-radius: 16px;
    border: 1px solid rgba(255,255,255,0.10);
    background: rgba(255,255,255,0.06);
    display:flex;
    align-items:center;
    justify-content:center;
    gap:8px;
    color: inherit;
    font-weight: 1000;
    font-size: 13px;
    box-shadow: 0px 1px 22px 4px rgb(139 139 139 / 18%);
    transition: transform .16s ease, box-shadow .16s ease, background .16s ease, border-color .16s ease;
  }
  :global(.home.theme-light) .nrBtn{
    background: rgba(0,0,0,0.03);
    border-color: rgba(24,42,68,0.10);
    box-shadow: 0 10px 22px rgba(0,0,0,0.08);
  }
  .nrBtnIcon{ opacity: .55; font-size: 16px; }
  .nrBtn.on{
    background: rgba(40,214,204,0.16);
    border-color: rgba(40,214,204,0.40);
  }
  .nrBtn.on .nrBtnIcon{ opacity: 1; }
  
  /* =========================
     Weekly/Monthly layout
  ========================= */
  .nrRows2{
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  @media (max-width: 520px){
    .nrRows2{ grid-template-columns: 1fr; }
  }
  .nrRow{
    border-radius: 16px;
    padding: 10px 10px;
    border: 1px solid rgba(255,255,255,0.10);
    background: rgba(255,255,255,0.06);
  }
  :global(.home.theme-light) .nrRow{
    background: rgba(0,0,0,0.03);
    border-color: rgba(24,42,68,0.10);
  }
  
  .nrRowTop{
    display:flex;
    justify-content:space-between;
    align-items:baseline;
    gap:10px;
    margin-bottom: 10px;
  }
  .nrRowLabel{ font-weight: 1000; font-size: 13px; }
  .nrMeta{
    font-weight: 900;
    font-size: 12px;
    opacity:.75;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 48%;
  }
  
  /* wide wrap ensures badge doesn't affect layout */
  .nrWideWrap{
    position: relative;
    display: block;
  }
  .nrWideWrap .nrBtnWide{
    width: 100%;
  }
  
  .nrBtnWide{
    height: 44px;
    border-radius: 16px;
    border: 1px solid rgba(40,214,204,0.30);
    background: rgba(255,255,255,0.08);
    color: inherit;
    font-weight: 1000;
    display:flex;
    align-items:center;
    justify-content:center;
    gap:10px;
    box-shadow: 0 12px 26px rgba(0,0,0,0.18);
    transition: transform .16s ease, box-shadow .16s ease, border-color .16s ease;
  }
  :global(.home.theme-light) .nrBtnWide{
    background:
      radial-gradient(520px 160px at 20% 0%, rgba(40,214,204,0.14), transparent 62%),
      rgba(0,0,0,0.03);
    border-color: rgba(24,42,68,0.12);
    box-shadow: 0 10px 22px rgba(0,0,0,0.08);
  }
  .nrBtnWideIcon{ font-size: 18px; opacity: .85; }
  .nrBtnWideText{ font-size: 13px; }
  .nrBtnWideState{
    font-size: 12px;
    padding: 2px 10px;
    border-radius: 999px;
    border: 1px solid rgba(40,214,204,0.30);
    background: rgba(40,214,204,0.12);
  }
  .nrBtnWide.on{
    border-color: rgba(40,214,204,0.55);
    background: rgba(40,214,204,0.20);
    box-shadow: 0 14px 34px rgba(40,214,204,0.16);
  }
  .nrBtnWide.danger{
    border-color: rgba(255, 170, 80, 0.55);
    background:
      radial-gradient(520px 160px at 20% 0%, rgba(255,170,80,0.18), transparent 62%),
      rgba(255, 170, 80, 0.12);
  }
  .nrBtnWide:active{ transform: scale(0.98); }
  
  /* =========================
     Badges (NO duplicates)
  ========================= */
  .nrBadge,
  .nrBadgeWide{
    position: absolute;
    top: -10px;
    inset-inline-end: -10px;
    z-index: 5;
  
    min-width: 22px;
    height: 22px;
    padding: 0 6px;
    border-radius: 999px;
  
    border: 1px solid rgba(40,214,204,0.35);
    background: #0b1f33;
    color: #fff;
  
    font-size: 12px;
    font-weight: 1000;
  
    display: inline-flex;
    align-items: center;
    justify-content: center;
  
    cursor: pointer;
    user-select: none;
  }
  .nrBadgeWide{
    min-width: 24px;
    height: 24px;
    padding: 0 7px;
  }
  :global(.home.theme-light) .nrBadge,
  :global(.home.theme-light) .nrBadgeWide{
    background: rgba(255,255,255,0.95);
    color:#0b1f33;
    border-color: rgba(24,42,68,0.12);
  }
  
  /* =========================
     Note (keep, even if hidden)
  ========================= */
  .nrTextarea{
    width: 100%;
    min-height: 80px;
    border-radius: 16px;
    padding: 10px 12px;
    border: 1px solid #20b2aa75;
    background: rgba(255,255,255,0.06);
    color: inherit;
    font-weight: 900;
    outline: none;
    resize: vertical;
    font-size: 13px;
  }
  :global(.home.theme-light) .nrTextarea{
    background: rgba(255,255,255,0.85);
    border-color: rgba(24,42,68,0.10);
    color: var(--mk-text, #0b1f33);
  }
  .nrSaved{
    margin-top: 8px;
    font-weight: 900;
    font-size: 12px;
    opacity: .8;
  }
  
  /* =========================
     Popover
  ========================= */
  .nrCountPopover::part(content){
    border-radius: 14px;
    overflow: hidden;
    border: 1px solid rgba(255,255,255,0.14);
    background: rgba(12,18,26,0.92);
    box-shadow: 0 18px 42px rgba(0,0,0,0.45);
  }
  :global(.home.theme-light) .nrCountPopover::part(content){
    background: rgba(255,255,255,0.95);
    border-color: rgba(24,42,68,0.10);
    box-shadow: 0 14px 30px rgba(0,0,0,0.10);
  }
  .nrCountPopInner{
    padding: 10px 12px;
    font-weight: 1000;
    font-size: 15px;
    color: #fff;
    white-space: nowrap;

  }
  .nrCountPopInner{

  unicode-bidi: plaintext;
}

  :global(.home.theme-light) .nrCountPopInner{
    color: #0b1f33;

  }
  </style>
  
  