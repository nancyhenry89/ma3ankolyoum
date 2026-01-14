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
            <span class="nrWarnIcon">⚠️</span>
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
          <button type="button" class="nrBtn" :class="{ on: doneToday.morning }" @click="toggle('morning')">
            <span class="nrBtnIcon">♰</span>
            <span class="nrBtnText">{{ ui.morning }}</span>
          </button>
  
          <button type="button" class="nrBtn" :class="{ on: doneToday.bible }" @click="toggle('bible')">
            <span class="nrBtnIcon">♰</span>
            <span class="nrBtnText">{{ ui.bible }}</span>
          </button>
  
          <button type="button" class="nrBtn" :class="{ on: doneToday.sleep }" @click="toggle('sleep')">
            <span class="nrBtnIcon">♰</span>
            <span class="nrBtnText">{{ ui.sleep }}</span>
          </button>
        </div>
      </div>
  
      <!-- Weekly / Monthly -->
      <div class="nrSection">
        <div class="nrRows">
          <!-- Communion -->
          <div class="nrRow">
            <div class="nrRowTop">
              <div class="nrRowLabel">{{ ui.communion }}</div>
              <div class="nrMeta">{{ ui.last }} {{ lastCommunionLabel }}</div>
            </div>
  
            <button
              type="button"
              class="nrAction"
              :class="{ danger: communionOverdue, on: communionDoneToday }"
              @click="toggle('communion')"
            >
              <span class="nrActionIcon">♰</span>
              <span class="nrActionText">{{ communionDoneToday ? ui.unmark : ui.markDone }}</span>
            </button>
          </div>
  
          <!-- Confession -->
          <div class="nrRow">
            <div class="nrRowTop">
              <div class="nrRowLabel">{{ ui.confession }}</div>
              <div class="nrMeta">{{ ui.last }} {{ lastConfessionLabel }}</div>
            </div>
  
            <button
              type="button"
              class="nrAction"
              :class="{ danger: confessionOverdue, on: confessionDoneToday }"
              @click="toggle('confession')"
            >
              <span class="nrActionIcon">♰</span>
              <span class="nrActionText">{{ confessionDoneToday ? ui.unmark : ui.markDone }}</span>
            </button>
          </div>
        </div>
      </div>
  
      <!-- Today note -->
      <div class="nrSection">
        <div class="nrSectionHead">
          <div class="nrSectionTitle">{{ ui.noteTitle }}</div>
          <div class="nrSectionHint">{{ ui.noteHint }}</div>
        </div>
  
        <textarea class="nrTextarea" v-model="todayNote" :placeholder="ui.notePlaceholder" />
        <div class="nrSaved" v-if="savedPulse">{{ ui.saved }}</div>
      </div>
    </section>
  </template>
  
  <script setup lang="ts">
    import { IonButton } from "@ionic/vue";
    import { computed, onMounted, ref, watch } from "vue";
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
    
    const props = defineProps<{ todayISO: string; lang: "ar" | "en" }>();
    
    const isArabic = computed(() => props.lang !== "en");
    const dir = computed(() => (isArabic.value ? "rtl" : "ltr"));
    const lang = computed(() => (isArabic.value ? "ar" : "en"));
    
    const ui = computed(() => {
      if (!isArabic.value) {
        return {
          title: "Spiritual Notes",
          subtitle: "Daily prayers,bible, communion, confession, and notes",
          openDetails: "Details",
          reminders: "Reminders",
    
          daily: "Daily",
          dailyHint: "Tap ♰ when completed",
          morning: "Morning",
          bible: "Bible",
          sleep: "Sleep",
    
          communion: "Communion (Weekly)",
          confession: "Confession (Monthly)",
          markDone: "Mark",
          unmark: "Undo",
    
          last: "Last:",
          never: "Not recorded",
    
          noteTitle: "Today’s note",
          noteHint: "Short and simple",
          notePlaceholder: "Write a short note…",
          saved: "Saved ✓",
    
          missedYesterday: "was missed yesterday",
          due: "is due",
    
          // debugNote
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
        subtitle: "باكر + الكتاب المقدس + نوم + تناول + اعتراف + نوتة اليوم",
        openDetails: "التفاصيل",
        reminders: "تذكير",
    
        daily: "يومي",
        dailyHint: "اضغط ♰ بعد الانتهاء",
        morning: "باكر",
        bible: "الكتاب المقدس",
        sleep: "نوم",
    
        communion: "تناول (أسبوعي)",
        confession: "اعتراف (شهري)",
        markDone: "تم",
        unmark: "تراجع",
    
        last: "آخر مرة:",
        never: "غير مسجل",
    
        noteTitle: "نوتة اليوم",
        noteHint: "مختصرة وبسيطة",
        notePlaceholder: "اكتب ملاحظة قصيرة…",
        saved: "تم الحفظ ✓",
    
        missedYesterday: "فاتت أمس",
        due: "مستحق",
    
        // debugNote
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
        router.push({ path: "/notes", query: { lang: props.lang, date: props.todayISO } })


    }
    
    /** ✅ independent debug just for Notes: ?debugNote=1 */
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
    
      // note must follow effective day
      todayNote.value = await getDailyNote(effectiveTodayISO.value);
    
      // reactive safety
      habits.value = { ...habits.value };
    }
    
    onMounted(loadNotes);
    
    // when real today changes (app day changes), reset fake unless debug is on
    watch(
      () => props.todayISO,
      () => {
        if (!isDebugNote.value) fakeToday.value = null;
        loadNotes();
      }
    );
    
    // when debug date changes, reload note for that date
    watch(effectiveTodayISO, loadNotes);
    
    const doneToday = computed(() => {
      const t = effectiveTodayISO.value;
      return {
        morning: habits.value.morning.includes(t),
        bible: habits.value.bible.includes(t),
        sleep: habits.value.sleep.includes(t),
      };
    });
    
    const communionDoneToday = computed(() =>
      habits.value.communion.includes(effectiveTodayISO.value)
    );
    const confessionDoneToday = computed(() =>
      habits.value.confession.includes(effectiveTodayISO.value)
    );
    
    async function toggle(key: HabitKey) {
      const iso = effectiveTodayISO.value;
      const arr = habits.value[key] || [];
    
      if (arr.includes(iso)) habits.value[key] = await removeHabitDay(key, iso);
      else habits.value[key] = await addHabitDay(key, iso);
    
      // force reactive update
      habits.value[key] = [...habits.value[key]];
      habits.value = { ...habits.value };
    }
    
    /** weekly/monthly overdue should respond to debug date */
    const communionOverdue = computed(
      () => isWeeklyOverdue(habits.value.communion, effectiveTodayISO.value).overdue
    );
    const confessionOverdue = computed(
      () => isMonthlyOverdue(habits.value.confession, effectiveTodayISO.value).overdue
    );
    
    const lastCommunionLabel = computed(
      () => lastDoneISO(habits.value.communion) || ui.value.never
    );
    const lastConfessionLabel = computed(
      () => lastDoneISO(habits.value.confession) || ui.value.never
    );
    
    /**
     * ✅ Fix “I marked today then it says missed yesterday”
     * Remind missed-yesterday ONLY when:
     * - user has started notes (notesStart exists)
     * - today is AFTER the start day (prevents day0)
     * - yesterday is on/after start day (prevents first-use false reminder)
     * - AND yesterday is not marked for that habit
     */
    function shouldRemindMissedYesterdayDaily(days: string[], todayISO: string) {
      const start = notesStartISO.value;
      if (!start) return false;
    
      // prevent "day 0" reminders
      if (todayISO <= start) return false;
    
      const y = addDaysISO(todayISO, -1);
    
      // if yesterday is before start, don't remind
      if (y < start) return false;
    
      return !days.includes(y);
    }
    
    const reminders = computed(() => {
      const list: Array<{ key: string; text: string }> = [];
      const t = effectiveTodayISO.value;
    
      if (!hasAnyHistory.value) return list;
    
      // daily reminders
      if (shouldRemindMissedYesterdayDaily(habits.value.morning, t)) {
        list.push({ key: "morn", text: `${ui.value.morning} ${ui.value.missedYesterday}` });
      }
      if (shouldRemindMissedYesterdayDaily(habits.value.bible, t)) {
        list.push({ key: "vesp", text: `${ui.value.bible} ${ui.value.missedYesterday}` });
      }
      if (shouldRemindMissedYesterdayDaily(habits.value.sleep, t)) {
        list.push({ key: "sleep", text: `${ui.value.sleep} ${ui.value.missedYesterday}` });
      }
    
      // weekly/monthly reminders
      if (communionOverdue.value) {
        list.push({ key: "com", text: `${ui.value.communion} ${ui.value.due}` });
      }
      if (confessionOverdue.value) {
        list.push({ key: "conf", text: `${ui.value.confession} ${ui.value.due}` });
      }
    
      return list;
    });
    
    const hasAnyReminder = computed(() => reminders.value.length > 0);
    
    /** Note autosave must save under effectiveTodayISO */
    let noteTimer: any = null;
    watch(todayNote, () => {
      window.clearTimeout(noteTimer);
      noteTimer = window.setTimeout(async () => {
        await setDailyNote(effectiveTodayISO.value, todayNote.value);
        savedPulse.value = true;
        window.setTimeout(() => (savedPulse.value = false), 650);
      }, 450);
    });
    
    /** hard reset for testing */
    async function hardResetNotes() {
      await clearAllNotesStorage();
      fakeToday.value = null;
      await loadNotes();
    }
    </script>
    
  
  <style scoped>
  /* (your existing CSS unchanged) */
  
  /* small debug box (only visible when debugNote=1) */
  .nrDebug{
    margin: 0 0 14px 0;
    padding: 12px;
    border-radius: 16px;
    border: 1px dashed rgba(255,170,80,0.35);
    background: rgba(255,255,255,0.06);
  }
  :global(.home.theme-light) .nrDebug{
    background: rgba(255,255,255,0.75);
    border-color: rgba(24,42,68,0.10);
  }
  .nrDebugTitle{ font-weight:1000; margin-bottom:10px; }
  .nrDebugRow{ display:flex; justify-content:space-between; gap:8px; margin-bottom:10px; }
  .nrDebugLabel{ font-weight:900; opacity:.85; }
  .nrDebugValue{ font-weight:900; opacity:.85; }
  .nrDebugHint{ margin-inline-start: 6px; font-size:12px; opacity:.7; }
  .nrDebugBtns{ display:flex; flex-wrap:wrap; gap:8px; justify-content:flex-end; }
  
  .nrCard{
    padding: 16px;
    border-radius: 20px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.08);
    color: var(--mk-text, #f5f7fa);
    box-shadow: 0 14px 34px rgba(0,0,0,0.35);
    backdrop-filter: blur(10px);
    font-family: "Noto Kufi Arabic", system-ui, sans-serif;
  }
  :global(.home.theme-light) .nrCard{
    background: rgba(255,255,255,0.72);
    border-color: rgba(24,42,68,0.10);
    color: var(--mk-text, #0b1f33);
    box-shadow: 0 10px 22px rgba(0,0,0,0.08);
  }
  .nrHeader{
    display:flex;
    justify-content:space-between;
    align-items:flex-start;
    gap:12px;
    margin-bottom: 10px;
  }
  .nrTitle{ font-weight: 1000; font-size: 18px; }
  .nrSubtitle{ font-weight: 800; font-size: 13px; opacity: .75; margin-top:2px; }
  .nrDetailsBtn{ font-weight: 1000; }
  
  .nrBanner{
    border-radius: 18px;
    padding: 12px 12px;
    border: 1px dashed rgba(255,170,80,0.55);
    background: linear-gradient(135deg, rgba(255,170,80,0.12), rgba(255,255,255,0.06));
    box-shadow: 0 14px 26px rgba(0,0,0,0.10);
    margin-bottom: 14px;
  }
  :global(.home.theme-light) .nrBanner{
    background: linear-gradient(135deg, rgba(255,170,80,0.14), rgba(255,255,255,0.75));
    box-shadow: 0 10px 20px rgba(0,0,0,0.07);
  }
  .nrBannerTop{
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:10px;
    margin-bottom: 10px;
  }
  .nrBannerTitle{
    display:flex;
    align-items:center;
    gap:10px;
    font-weight: 1000;
    font-size: 16px;
  }
  .nrWarnIcon{ font-size: 18px; }
  .nrBannerCount{
    min-width: 34px;
    height: 28px;
    border-radius: 999px;
    display:flex;
    align-items:center;
    justify-content:center;
    font-weight: 1000;
    border: 1px solid rgba(255,170,80,0.35);
    background: rgba(255,170,80,0.12);
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
    padding: 10px 10px;
    border-radius: 14px;
    border: 1px solid rgba(255,255,255,0.10);
    background: rgba(255,255,255,0.06);
  }
  :global(.home.theme-light) .nrBannerItem{
    background: rgba(255,255,255,0.72);
    border-color: rgba(24,42,68,0.10);
  }
  .nrCross{
    width: 28px;
    height: 28px;
    border-radius: 12px;
    display:flex;
    align-items:center;
    justify-content:center;
    font-size: 16px;
    background: rgba(255,170,80,0.14);
    border: 1px solid rgba(255,170,80,0.28);
  }
  .nrBannerText{
    font-weight: 900;
    opacity: .92;
    line-height: 1.35;
  }
  
  .nrSection{ margin-top: 12px; }
  .nrSectionHead{
    display:flex;
    justify-content:space-between;
    align-items:baseline;
    gap:10px;
    margin-bottom: 8px;
  }
  .nrSectionTitle{ font-weight: 1000; }
  .nrSectionHint{ font-weight: 900; font-size: 12px; opacity:.7; }
  
  .nrGrid3{
    display:grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }
  @media (max-width: 420px){
    .nrGrid3{ grid-template-columns: 1fr; }
  }
  .nrBtn{
    height: 46px;
    border-radius: 16px;
    border: 1px solid rgba(255,255,255,0.10);
    background: rgba(255,255,255,0.06);
    display:flex;
    align-items:center;
    justify-content:center;
    gap:8px;
    color: inherit;
    font-weight: 1000;
    box-shadow: 0 10px 22px rgba(0,0,0,0.25);
    transition: transform .16s ease, box-shadow .16s ease, background .16s ease, border-color .16s ease;
  }
  :global(.home.theme-light) .nrBtn{
    background: rgba(0,0,0,0.03);
    border-color: rgba(24,42,68,0.10);
    box-shadow: 0 10px 22px rgba(0,0,0,0.08);
  }
  .nrBtnIcon{ opacity: .55; font-size: 18px; }
  .nrBtn.on{
    background: rgba(40,214,204,0.14);
    border-color: rgba(40,214,204,0.35);
    box-shadow: 0 14px 34px rgba(40,214,204,0.14), 0 10px 22px rgba(0,0,0,0.25);
  }
  .nrBtn.on .nrBtnIcon{ opacity: 1; }
  
  .nrRows{ display:flex; flex-direction:column; gap: 10px; }
  .nrRow{
    border-radius: 18px;
    padding: 10px;
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
  .nrRowLabel{ font-weight: 1000; }
  .nrMeta{ font-weight: 900; font-size: 12px; opacity:.75; }
  
  .nrAction{
    width: 100%;
    height: 44px;
    border-radius: 14px;
    border: 1px solid rgba(40,214,204,0.30);
    background: rgba(40,214,204,0.14);
    color: inherit;
    font-weight: 1000;
    display:flex;
    align-items:center;
    justify-content:center;
    gap:8px;
  }
  .nrActionIcon{ font-size: 18px; opacity:.95; }
  .nrAction.on{
    border-color: rgba(40,214,204,0.55);
    background: rgba(40,214,204,0.22);
    box-shadow: 0 14px 34px rgba(40,214,204,0.16);
  }
  .nrAction.danger{
    border-color: rgba(255, 170, 80, 0.55);
    background: rgba(255, 170, 80, 0.16);
  }
  
  .nrTextarea{
    width: 100%;
    min-height: 90px;
    border-radius: 16px;
    padding: 10px 12px;
    border: 1px solid rgba(255,255,255,0.10);
    background: rgba(255,255,255,0.06);
    color: inherit;
    font-weight: 900;
    outline: none;
    resize: vertical;
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
  </style>
  
