<template>
    <ion-page :dir="dir" :lang="lang">
      <ion-header>
        <ion-toolbar>
          <ion-buttons slot="start">
            <ion-back-button default-href="/" />
          </ion-buttons>
  
          <ion-title>{{ ui.title }}</ion-title>
  
          <ion-buttons slot="end">
            <ion-button fill="clear" class="mkNoCapture" @click="downloadStatsImage" :title="ui.downloadImage">
              <span class="iconBtn">⬇︎</span>
            </ion-button>
  
            <ion-button fill="clear" class="mkNoCapture" @click="shareStatsText" :title="ui.shareText">
              <span class="iconBtn">⤴︎</span>
            </ion-button>
  
            <ion-button fill="clear" class="mkNoCapture" @click="refresh" :title="ui.refresh">
              <span class="iconBtn">⟳</span>
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
  
      <ion-content class="ion-padding">
        <!-- ✅ ShareShot (painted but invisible) to avoid empty images -->
        <div class="shareShotWrap mkNoCapture" aria-hidden="true">
          <div class="shareShot" ref="shotRef">
            <div class="shotTop">
              <div class="shotTitle">{{ ui.statsTitle }}</div>
              <div class="shotDate">{{ formatISO(effectiveTodayISO) }}</div>
            </div>
  
            <div class="shotGrid">
              <div class="shotBox shotBox--morn">
                <div class="shotBoxTitle">{{ ui.morningTitle }}</div>
                <div class="shotRow"><span>{{ ui.last7 }}</span><b>{{ morningLast7 }}</b></div>
                <div class="shotRow"><span>{{ ui.thisMonth }}</span><b>{{ morningThisMonth }}</b></div>
                <div class="shotRow"><span>{{ ui.thisYear }}</span><b>{{ morningThisYear }}</b></div>
              </div>
  
              <div class="shotBox shotBox--bible">
                <div class="shotBoxTitle">{{ ui.bibleTitle }}</div>
                <div class="shotRow"><span>{{ ui.last7 }}</span><b>{{ bibleLast7 }}</b></div>
                <div class="shotRow"><span>{{ ui.thisMonth }}</span><b>{{ bibleThisMonth }}</b></div>
                <div class="shotRow"><span>{{ ui.thisYear }}</span><b>{{ bibleThisYear }}</b></div>
              </div>
  
              <div class="shotBox shotBox--sleep">
                <div class="shotBoxTitle">{{ ui.sleepTitle }}</div>
                <div class="shotRow"><span>{{ ui.last7 }}</span><b>{{ sleepLast7 }}</b></div>
                <div class="shotRow"><span>{{ ui.thisMonth }}</span><b>{{ sleepThisMonth }}</b></div>
                <div class="shotRow"><span>{{ ui.thisYear }}</span><b>{{ sleepThisYear }}</b></div>
              </div>
  
              <div class="shotBox shotBox--comm">
                <div class="shotBoxTitle">{{ ui.communionTitle }}</div>
                <div class="shotRow"><span>{{ ui.last }}</span><b>{{ lastCommunionLabel }}</b></div>
                <div class="shotRow"><span>{{ ui.thisMonth }}</span><b>{{ communionThisMonth }}</b></div>
                <div class="shotRow"><span>{{ ui.thisYear }}</span><b>{{ communionThisYear }}</b></div>
              </div>
  
              <div class="shotBox shotBox--conf">
                <div class="shotBoxTitle">{{ ui.confessionTitle }}</div>
                <div class="shotRow"><span>{{ ui.last }}</span><b>{{ lastConfessionLabel }}</b></div>
                <div class="shotRow"><span>{{ ui.thisMonth }}</span><b>{{ confessionThisMonth }}</b></div>
                <div class="shotRow"><span>{{ ui.thisYear }}</span><b>{{ confessionThisYear }}</b></div>
              </div>
            </div>
  
            <div class="shotFooter">
              <span>{{ isArabic ? "معًا كل يوم" : "Together Every Day" }}</span>
              <span class="shotSmall">{{ isArabic ? "ملخص النوتة الروحية" : "Spiritual Notes Summary" }}</span>
            </div>
          </div>
        </div>
  
        <!-- Debug Notes: ?debugNote=1 -->
        <div v-if="isDebugNote" class="dbgCard">
          <div class="dbgTop">
            <div class="dbgTitle">⚙️ {{ ui.debugTitle }}</div>
            <div class="dbgValue">
              {{ effectiveTodayISO }}
              <span v-if="fakeToday" class="dbgHint">{{ ui.debugFake }}</span>
            </div>
          </div>
  
          <div class="dbgBtns">
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
  
        <!-- SUMMARY / STATS (visible) -->
        <div class="card">
          <div class="cardHead">
            <div>
              <div class="hTitle">{{ ui.statsTitle }}</div>
              <div class="hSub">{{ ui.statsHint }}</div>
            </div>
            <div class="chip">{{ formatISO(effectiveTodayISO) }}</div>
          </div>
  
          <div class="statsGrid">
            <div class="statBox statBox--morn">
              <div class="statTitle">{{ ui.morningTitle }}</div>
              <div class="statRow"><span class="k">{{ ui.last7 }}</span><span class="v">{{ morningLast7 }}</span></div>
              <div class="statRow"><span class="k">{{ ui.thisMonth }}</span><span class="v">{{ morningThisMonth }}</span></div>
              <div class="statRow"><span class="k">{{ ui.thisYear }}</span><span class="v">{{ morningThisYear }}</span></div>
            </div>
  
            <div class="statBox statBox--bible">
              <div class="statTitle">{{ ui.bibleTitle }}</div>
              <div class="statRow"><span class="k">{{ ui.last7 }}</span><span class="v">{{ bibleLast7 }}</span></div>
              <div class="statRow"><span class="k">{{ ui.thisMonth }}</span><span class="v">{{ bibleThisMonth }}</span></div>
              <div class="statRow"><span class="k">{{ ui.thisYear }}</span><span class="v">{{ bibleThisYear }}</span></div>
            </div>
  
            <div class="statBox statBox--sleep">
              <div class="statTitle">{{ ui.sleepTitle }}</div>
              <div class="statRow"><span class="k">{{ ui.last7 }}</span><span class="v">{{ sleepLast7 }}</span></div>
              <div class="statRow"><span class="k">{{ ui.thisMonth }}</span><span class="v">{{ sleepThisMonth }}</span></div>
              <div class="statRow"><span class="k">{{ ui.thisYear }}</span><span class="v">{{ sleepThisYear }}</span></div>
            </div>
  
            <div class="statBox statBox--comm">
              <div class="statTitle">{{ ui.communionTitle }}</div>
              <div class="statRow"><span class="k">{{ ui.last }}</span><span class="v">{{ lastCommunionLabel }}</span></div>
              <div class="statRow"><span class="k">{{ ui.thisMonth }}</span><span class="v">{{ communionThisMonth }}</span></div>
              <div class="statRow"><span class="k">{{ ui.thisYear }}</span><span class="v">{{ communionThisYear }}</span></div>
            </div>
  
            <div class="statBox statBox--conf">
              <div class="statTitle">{{ ui.confessionTitle }}</div>
              <div class="statRow"><span class="k">{{ ui.last }}</span><span class="v">{{ lastConfessionLabel }}</span></div>
              <div class="statRow"><span class="k">{{ ui.thisMonth }}</span><span class="v">{{ confessionThisMonth }}</span></div>
              <div class="statRow"><span class="k">{{ ui.thisYear }}</span><span class="v">{{ confessionThisYear }}</span></div>
            </div>
          </div>
  
          <div class="shareHintRow mkNoCapture">
            <div class="miniNote">{{ ui.shareHint }}</div>
            <ion-button size="small" fill="clear" class="mkNoCapture" @click="downloadStatsImage" :title="ui.downloadImage">
              <span class="iconBtn">ᯓ➤</span>
            </ion-button>
          </div>
        </div>
  
        <!-- Today note -->
        <div class="card">
          <div class="cardHead">
            <div>
              <div class="hTitle">{{ ui.todayNote }}</div>
              <div class="hSub">{{ ui.todayNoteHint }}</div>
            </div>
            <div class="chip">{{ formatISO(effectiveTodayISO) }}</div>
          </div>
  
          <textarea class="ta" v-model="todayNote" :placeholder="ui.notePlaceholder" />
          <div class="saved" v-if="savedPulse">{{ ui.saved }}</div>
        </div>
  
        <!-- HABITS LOG -->
        <div class="card">
          <div class="cardHead">
            <div>
              <div class="hTitle">{{ ui.habitsTitle }}</div>
              <div class="hSub">{{ ui.habitsHint }}</div>
            </div>
          </div>
  
          <div class="tabs">
            <button
              v-for="t in tabs"
              :key="t.key"
              type="button"
              class="tab"
              :class="{ on: activeTab === t.key }"
              @click="activeTab = t.key"
            >
              <span class="tabIcon">✦</span>
              <span class="tabText">{{ t.label }}</span>
              <span class="tabCount">{{ (habits[t.key] || []).length }}</span>
            </button>
          </div>
  
          <div class="list">
            <div v-if="!sortedDays(activeTab).length" class="empty">
              {{ ui.empty }}
            </div>
  
            <div v-for="d in sortedDays(activeTab)" :key="activeTab + d" class="row readOnly">
              <div class="rowLeft">
                <div class="dot on">✓</div>
                <div class="rowText">
                  <div class="rowMain">{{ formatISO(d) }}</div>
                  <div class="rowSub">{{ relativeToToday(d) }}</div>
                </div>
              </div>
  
              <div class="rowRight">
                <span class="rowBadge">{{ ui.recorded }}</span>
              </div>
            </div>
  
            <div class="miniNote" style="margin-top: 10px">
              {{ ui.readOnlyNote }}
            </div>
          </div>
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
    IonButton,
  } from "@ionic/vue";
  import { computed, onMounted, ref, watch } from "vue";
  import { useRoute } from "vue-router";
  import html2canvas from "html2canvas";
  import { Capacitor } from "@capacitor/core";
  import { Filesystem, Directory } from "@capacitor/filesystem";
  import { Share } from "@capacitor/share";
  
  import {
    getHabitDays,
    getDailyNote,
    setDailyNote,
    clearAllNotesStorage,
    type HabitKey,
  } from "@/utils/spiritualNotesStore";
  
  import { addDaysISO, diffDaysISO, lastDoneISO } from "@/utils/spiritualNotesLogic";
  
  /** today */
  function localTodayISO() {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
  }
  
  const route = useRoute();
  const isDebugNote = computed(() => route.query.debugNote === "1");
  
  const fakeToday = ref<string | null>(null);
  const baseTodayISO = ref<string>(localTodayISO());
  
  const effectiveTodayISO = computed(() =>
    isDebugNote.value ? (fakeToday.value ?? baseTodayISO.value) : baseTodayISO.value
  );
  
  function shiftFakeDay(delta: number) {
    const base = fakeToday.value ?? baseTodayISO.value;
    fakeToday.value = addDaysISO(base, delta);
  }
  function resetFakeToday() {
    fakeToday.value = null;
  }
  
  /** ✅ LANG FIX (query overrides once, otherwise storage) */
  type Lang = "ar" | "en";
  function getStoredLang(): Lang {
    return localStorage.getItem("mk_lang") === "en" ? "en" : "ar";
  }
  const lang = ref<Lang>("ar");
  
  function applyLangFromQueryOrStorage() {
    const q = typeof route.query.lang === "string" ? route.query.lang : "";
    if (q === "en" || q === "ar") {
      lang.value = q as Lang;
      localStorage.setItem("mk_lang", lang.value);
    } else {
      lang.value = getStoredLang();
    }
  }
  
  onMounted(() => {
    applyLangFromQueryOrStorage();
  });
  
  watch(
    () => route.query.lang,
    () => applyLangFromQueryOrStorage()
  );
  
  const isArabic = computed(() => lang.value !== "en");
  const dir = computed(() => (isArabic.value ? "rtl" : "ltr"));
  
  /** UI */
  const ui = computed(() => {
    if (!isArabic.value) {
      return {
        title: "Notes Details",
        refresh: "Refresh",
        shareText: "Share summary",
        downloadImage: "Download image",
  
        statsTitle: "Stats",
        statsHint: "Weekly / Monthly / Yearly summary",
        shareHint: "Download the image, then share it with your father of confession.",
  
        morningTitle: "Morning prayer",
        bibleTitle: "Bible",
        sleepTitle: "Night prayer",
        communionTitle: "Communion",
        confessionTitle: "Confession",
  
        last: "Last:",
        last7: "Last 7 days",
        thisMonth: "This month",
        thisYear: "This year",
  
        todayNote: "Today’s note",
        todayNoteHint: "Write something short",
        notePlaceholder: "Write a short note…",
        saved: "Saved ✓",
  
        habitsTitle: "Habits log",
        habitsHint: "Read-only view",
        readOnlyNote: "This page is read-only. Add marks from the main card on Home.",
        recorded: "Recorded",
  
        empty: "No days recorded yet",
  
        debugTitle: "Debug Notes",
        debugFake: "(fake)",
        debugRealToday: "Real today",
        debugYesterday: "Today = yesterday",
        debugTomorrow: "Today = tomorrow",
        debugMinus7: "-7 days",
        debugPlus7: "+7 days",
        debugResetAll: "Clear notes",
  
        downloaded: "Image downloaded ✅",
        downloadFail: "Couldn't download image",
        copied: "Copied ✅",
      };
    }
  
    return {
      title: "التفاصيل",
      refresh: "تحديث",
      shareText: "مشاركة الملخص",
      downloadImage: "تحميل الصورة",
  
      statsTitle: "إحصائيات",
      statsHint: "ملخص أسبوعي / شهري / سنوي",
      shareHint: "حمّل الصورة ثم شاركها مع أب الاعتراف أو المرشد الروحي.",
  
      morningTitle: "صلاة باكر",
      bibleTitle: "الكتاب المقدس",
      sleepTitle: "صلاة النوم",
      communionTitle: "التناول",
      confessionTitle: "الاعتراف",
  
      last: "آخر مرة:",
      last7: "آخر 7 أيام",
      thisMonth: "هذا الشهر",
      thisYear: "هذه السنة",
  
      todayNote: "نوتة اليوم",
      todayNoteHint: "اكتب/ي ملاحظة قصيرة",
      notePlaceholder: "اكتب ملاحظة…",
      saved: "تم الحفظ ✓",
  
      habitsTitle: "سجل العادات",
      habitsHint: "عرض فقط",
      readOnlyNote: "هذه الصفحة للعرض فقط. التعليم من كارت النوتة في الهوم.",
      recorded: "مسجل",
  
      empty: "لا توجد أيام مسجلة بعد",
  
      debugTitle: "اختبار النوتة",
      debugFake: "(وهمي)",
      debugRealToday: "اليوم الحقيقي",
      debugYesterday: "اليوم = أمس",
      debugTomorrow: "اليوم = بكرة",
      debugMinus7: "-7 أيام",
      debugPlus7: "+7 أيام",
      debugResetAll: "مسح النوتة",
  
      downloaded: "تم تحميل الصورة ✅",
      downloadFail: "لم يتم تحميل الصورة",
      copied: "تم النسخ ✅",
    };
  });
  
  /** state */
  const habits = ref<Record<HabitKey, string[]>>({
    morning: [],
    bible: [],
    sleep: [],
    communion: [],
    confession: [],
  });
  
  const tabs = computed(() => [
    { key: "morning" as HabitKey, label: isArabic.value ? "باكر" : "Morning" },
    { key: "bible" as HabitKey, label: isArabic.value ? "الكتاب المقدس" : "Bible" },
    { key: "sleep" as HabitKey, label: isArabic.value ? "نوم" : "Night" },
    { key: "communion" as HabitKey, label: isArabic.value ? "تناول" : "Communion" },
    { key: "confession" as HabitKey, label: isArabic.value ? "اعتراف" : "Confession" },
  ]);
  
  const activeTab = ref<HabitKey>("morning");
  
  /** note */
  const todayNote = ref("");
  const savedPulse = ref(false);
  
  async function load() {
    habits.value.morning = await getHabitDays("morning");
    habits.value.bible = await getHabitDays("bible");
    habits.value.sleep = await getHabitDays("sleep");
    habits.value.communion = await getHabitDays("communion");
    habits.value.confession = await getHabitDays("confession");
  
    todayNote.value = await getDailyNote(effectiveTodayISO.value);
    habits.value = { ...habits.value };
  }
  
  function refresh() {
    load();
  }
  
  onMounted(load);
  watch(effectiveTodayISO, load);
  
  /** helpers */
  function safeISO(iso: string) {
    return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : localTodayISO();
  }
  function formatISO(iso: string) {
    const s = safeISO(iso);
    const [y, m, d] = s.split("-").map(Number);
    if (!y || !m || !d) return "—";
    return isArabic.value ? `${d}/${m}/${y}` : `${m}/${d}/${y}`;
  }
  function sortedDays(key: HabitKey) {
    return [...(habits.value[key] || [])].filter(Boolean).sort().reverse().slice(0, 90);
  }
  function relativeToToday(iso: string) {
    const t = effectiveTodayISO.value;
    const daysAgo = diffDaysISO(iso, t);
    if (daysAgo === 0) return isArabic.value ? "اليوم" : "Today";
    if (daysAgo === 1) return isArabic.value ? "أمس" : "Yesterday";
    if (daysAgo === -1) return isArabic.value ? "بكرة" : "Tomorrow";
    if (daysAgo > 1) return isArabic.value ? `من ${daysAgo} يوم` : `${daysAgo} days ago`;
    return isArabic.value ? `بعد ${Math.abs(daysAgo)} يوم` : `in ${Math.abs(daysAgo)} days`;
  }
  
  /** -------- STATS -------- */
  function startOfMonthISO(iso: string) {
    const [y, m] = safeISO(iso).split("-").map(Number);
    return `${y}-${String(m).padStart(2, "0")}-01`;
  }
  function startOfYearISO(iso: string) {
    const [y] = safeISO(iso).split("-").map(Number);
    return `${y}-01-01`;
  }
  function countInRange(days: string[], fromISO: string, toISO: string) {
    return days.filter((d) => d >= fromISO && d <= toISO).length;
  }
  function countLastNDays(days: string[], todayISO: string, n: number) {
    const from = addDaysISO(todayISO, -(n - 1));
    return countInRange(days, from, todayISO);
  }
  
  const lastCommunionLabel = computed(() => {
    const last = lastDoneISO(habits.value.communion);
    return last ? formatISO(last) : isArabic.value ? "غير مسجل" : "Not recorded";
  });
  const lastConfessionLabel = computed(() => {
    const last = lastDoneISO(habits.value.confession);
    return last ? formatISO(last) : isArabic.value ? "غير مسجل" : "Not recorded";
  });
  
  const communionThisMonth = computed(() =>
    countInRange(habits.value.communion, startOfMonthISO(effectiveTodayISO.value), effectiveTodayISO.value)
  );
  const communionThisYear = computed(() =>
    countInRange(habits.value.communion, startOfYearISO(effectiveTodayISO.value), effectiveTodayISO.value)
  );
  const confessionThisMonth = computed(() =>
    countInRange(habits.value.confession, startOfMonthISO(effectiveTodayISO.value), effectiveTodayISO.value)
  );
  const confessionThisYear = computed(() =>
    countInRange(habits.value.confession, startOfYearISO(effectiveTodayISO.value), effectiveTodayISO.value)
  );
  
  const morningLast7 = computed(() => countLastNDays(habits.value.morning || [], effectiveTodayISO.value, 7));
  const morningThisMonth = computed(() =>
    countInRange(habits.value.morning || [], startOfMonthISO(effectiveTodayISO.value), effectiveTodayISO.value)
  );
  const morningThisYear = computed(() =>
    countInRange(habits.value.morning || [], startOfYearISO(effectiveTodayISO.value), effectiveTodayISO.value)
  );
  
  const bibleLast7 = computed(() => countLastNDays(habits.value.bible || [], effectiveTodayISO.value, 7));
  const bibleThisMonth = computed(() =>
    countInRange(habits.value.bible || [], startOfMonthISO(effectiveTodayISO.value), effectiveTodayISO.value)
  );
  const bibleThisYear = computed(() =>
    countInRange(habits.value.bible || [], startOfYearISO(effectiveTodayISO.value), effectiveTodayISO.value)
  );
  
  const sleepLast7 = computed(() => countLastNDays(habits.value.sleep || [], effectiveTodayISO.value, 7));
  const sleepThisMonth = computed(() =>
    countInRange(habits.value.sleep || [], startOfMonthISO(effectiveTodayISO.value), effectiveTodayISO.value)
  );
  const sleepThisYear = computed(() =>
    countInRange(habits.value.sleep || [], startOfYearISO(effectiveTodayISO.value), effectiveTodayISO.value)
  );
  
  /** autosave note */
  let noteTimer: any = null;
  watch(todayNote, () => {
    window.clearTimeout(noteTimer);
    noteTimer = window.setTimeout(async () => {
      await setDailyNote(effectiveTodayISO.value, todayNote.value);
      savedPulse.value = true;
      window.setTimeout(() => (savedPulse.value = false), 650);
    }, 450);
  });
  
  /** share text */
  async function shareStatsText() {
    const lines = [
      isArabic.value ? "📌 ملخص النوتة الروحية" : "📌 Spiritual Notes Summary",
      `${isArabic.value ? "📅 التاريخ" : "📅 Date"}: ${formatISO(effectiveTodayISO.value)}`,
      "",
      `${isArabic.value ? "🕊️ باكر" : "🕊️ Morning"}:`,
      `- ${ui.value.last7}: ${morningLast7.value}`,
      `- ${ui.value.thisMonth}: ${morningThisMonth.value}`,
      `- ${ui.value.thisYear}: ${morningThisYear.value}`,
      "",
      `${isArabic.value ? "📖 الكتاب المقدس" : "📖 Bible"}:`,
      `- ${ui.value.last7}: ${bibleLast7.value}`,
      `- ${ui.value.thisMonth}: ${bibleThisMonth.value}`,
      `- ${ui.value.thisYear}: ${bibleThisYear.value}`,
      "",
      `${isArabic.value ? "🌙 النوم" : "🌙 Night"}:`,
      `- ${ui.value.last7}: ${sleepLast7.value}`,
      `- ${ui.value.thisMonth}: ${sleepThisMonth.value}`,
      `- ${ui.value.thisYear}: ${sleepThisYear.value}`,
      "",
      `${isArabic.value ? "🍞 التناول" : "🍞 Communion"}:`,
      `- ${ui.value.last} ${lastCommunionLabel.value}`,
      `- ${ui.value.thisMonth}: ${communionThisMonth.value}`,
      `- ${ui.value.thisYear}: ${communionThisYear.value}`,
      "",
      `${isArabic.value ? "🙏 الاعتراف" : "🙏 Confession"}:`,
      `- ${ui.value.last} ${lastConfessionLabel.value}`,
      `- ${ui.value.thisMonth}: ${confessionThisMonth.value}`,
      `- ${ui.value.thisYear}: ${confessionThisYear.value}`,
    ];
  
    const text = lines.join("\n");
    const nav: any = navigator;
  
    if (nav && typeof nav.share === "function") {
      await nav.share({ title: ui.value.title, text });
      return;
    }
  
    try {
      await navigator.clipboard.writeText(text);
      alert(ui.value.copied);
    } catch {
      prompt(isArabic.value ? "انسخي الملخص:" : "Copy:", text);
    }
  }
  
  /** ✅ capture using shotRef (painted) */
  const shotRef = ref<HTMLElement | null>(null);
  
  function sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
  }
  
  async function downloadStatsImage() {
    const el = shotRef.value;
    if (!el) return;
  
    try {
      // ensure fonts ready + painted frame
      await (document as any).fonts?.ready?.catch(() => {});
      await sleep(50);
  
      const canvas = await html2canvas(el, {
        backgroundColor: "#ffffff",
        useCORS: true,
        scale: Math.min(3, window.devicePixelRatio * 2),
        scrollX: 0,
        scrollY: 0,
      });
  
      const dataUrl = canvas.toDataURL("image/png", 1);
      const base64 = dataUrl.split(",")[1];
      const filename = `notes-stats-${effectiveTodayISO.value}.png`;
  
      // Web download
      if (Capacitor.getPlatform() === "web") {
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        alert(ui.value.downloaded);
        return;
      }
  
      // Native: write + share
      const saved = await Filesystem.writeFile({
        path: filename,
        data: base64,
        directory: Directory.Cache,
        recursive: true,
      });
  
      await Share.share({
        title: ui.value.title,
        text: ui.value.statsTitle,
        url: saved.uri,
        dialogTitle: ui.value.downloadImage,
      });
  
      alert(ui.value.downloaded);
    } catch (e) {
      console.error("downloadStatsImage error:", e);
      alert(ui.value.downloadFail);
    }
  }
  
  /** hard reset */
  async function hardResetNotes() {
    await clearAllNotesStorage();
    fakeToday.value = null;
    await load();
  }
  </script>
  
  <style scoped>
  .card {
    padding: 14px;
    border-radius: 18px;
    border: 1px solid rgba(0, 0, 0, 0.08);
    background: rgba(255, 255, 255, 0.86);
    box-shadow: 0 10px 22px rgba(0, 0, 0, 0.06);
    margin-bottom: 12px;
    font-family: "Noto Kufi Arabic", system-ui, sans-serif;
    overflow: hidden;
  }
  :global(.dark) .card {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(255, 255, 255, 0.12);
    box-shadow: 0 18px 46px rgba(0, 0, 0, 0.55);
    color: rgba(241, 245, 249, 0.94);
  }
  
  .cardHead {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 10px;
    margin-bottom: 10px;
  }
  .hTitle { font-weight: 1000; font-size: 16px; }
  .hSub { font-weight: 900; font-size: 12px; opacity: 0.75; margin-top: 2px; }
  
  .chip {
    border-radius: 999px;
    padding: 6px 10px;
    font-weight: 1000;
    font-size: 12px;
    border: 1px solid rgba(0, 0, 0, 0.08);
    background: rgba(0, 0, 0, 0.03);
  }
  :global(.dark) .chip {
    border-color: rgba(255, 255, 255, 0.14);
    background: rgba(255, 255, 255, 0.06);
  }
  
  .ta {
    width: 100%;
    min-height: 92px;
    border-radius: 14px;
    padding: 10px 12px;
    border: 1px solid rgba(0, 0, 0, 0.08);
    background: rgba(255, 255, 255, 0.92);
    font-weight: 900;
    resize: vertical;
    outline: none;
  }
  :global(.dark) .ta {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(255, 255, 255, 0.14);
    color: rgba(241, 245, 249, 0.94);
  }
  
  .saved { margin-top: 8px; font-weight: 900; font-size: 12px; opacity: 0.85; }
  
  .statsGrid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 10px;
  }
  @media (max-width: 860px) {
    .statsGrid { grid-template-columns: 1fr; }
  }
  
  .statBox {
    border-radius: 16px;
    padding: 10px;
    border: 1px solid rgba(0, 0, 0, 0.08);
    background: rgba(255, 255, 255, 0.70);
  }
  :global(.dark) .statBox {
    border-color: rgba(255, 255, 255, 0.12);
    background: rgba(255, 255, 255, 0.06);
  }
  
  .statBox--morn { background: linear-gradient(135deg, rgba(110, 231, 183, 0.22), rgba(255, 255, 255, 0.72)); }
  .statBox--bible { background: linear-gradient(135deg, rgba(59, 130, 246, 0.18), rgba(255, 255, 255, 0.72)); }
  .statBox--sleep { background: linear-gradient(135deg, rgba(244, 114, 182, 0.16), rgba(255, 255, 255, 0.72)); }
  .statBox--comm { background: linear-gradient(135deg, rgba(250, 204, 21, 0.16), rgba(255, 255, 255, 0.72)); }
  .statBox--conf { background: linear-gradient(135deg, rgba(167, 139, 250, 0.16), rgba(255, 255, 255, 0.72)); }
  
  .statTitle { font-weight: 1000; margin-bottom: 8px; }
  .statRow { display: flex; justify-content: space-between; gap: 10px; padding: 6px 0; }
  .k { font-weight: 900; opacity: 0.75; }
  .v { font-weight: 1000; }
  
  .shareHintRow {
    margin-top: 10px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }
  .miniNote { font-weight: 900; font-size: 12px; opacity: 0.75; }
  .iconBtn { font-weight: 1000; font-size: 18px; line-height: 1; }
  
  /* Tabs */
  .tabs { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 6px; }
  .tab {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    border-radius: 999px;
    padding: 8px 10px;
    border: 1px solid rgba(0, 0, 0, 0.08);
    background: rgba(0, 0, 0, 0.03);
    font-weight: 1000;
    color:#000;
  }
  :global(.dark) .tab {
    border-color: rgba(255, 255, 255, 0.14);
    background: rgba(255, 255, 255, 0.06);
  }
  .tab.on { border-color: rgba(45, 212, 191, 0.55); background: rgba(45, 212, 191, 0.12); }
  .tabCount {
    min-width: 26px;
    height: 22px;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    border: 1px solid rgba(0, 0, 0, 0.08);
    background: rgba(255, 255, 255, 0.75);
  }
  :global(.dark) .tabCount {
    border-color: rgba(255, 255, 255, 0.14);
    background: rgba(255, 255, 255, 0.06);
  }
  
  /* List */
  .list { margin-top: 10px; display: flex; flex-direction: column; gap: 8px; }
  .empty { font-weight: 900; opacity: 0.75; padding: 10px; }
  .row {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    padding: 10px;
    border-radius: 14px;
    border: 1px solid rgba(0, 0, 0, 0.08);
    background: rgba(255, 255, 255, 0.78);
    text-align: start;
  }
  :global(.dark) .row {
    border-color: rgba(255, 255, 255, 0.14);
    background: rgba(255, 255, 255, 0.06);
    color: inherit;
  }
  .row.readOnly { cursor: default; user-select: text; }
  
  .rowLeft { display: flex; gap: 10px; align-items: center; }
  .dot {
    width: 26px;
    height: 26px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 1000;
    border: 1px solid rgba(0, 0, 0, 0.1);
  }
  .dot.on { background: rgba(45, 212, 191, 0.16); border-color: rgba(45, 212, 191, 0.55); }
  .rowMain { font-weight: 1000; }
  .rowSub { font-weight: 900; font-size: 12px; opacity: 0.75; margin-top: 2px; }
  .rowBadge {
    font-weight: 1000;
    font-size: 12px;
    padding: 6px 10px;
    border-radius: 999px;
    border: 1px solid rgba(45, 212, 191, 0.35);
    background: rgba(45, 212, 191, 0.12);
  }
  
  /* Debug */
  .dbgCard {
    padding: 12px;
    border-radius: 16px;
    border: 1px dashed rgba(0, 0, 0, 0.18);
    background: rgba(255, 255, 255, 0.70);
    margin-bottom: 12px;
  }
  :global(.dark) .dbgCard {
    border-color: rgba(255, 255, 255, 0.14);
    background: rgba(255, 255, 255, 0.05);
  }
  .dbgTop { display: flex; justify-content: space-between; gap: 10px; margin-bottom: 10px; }
  .dbgTitle { font-weight: 1000; }
  .dbgValue { font-weight: 900; opacity: 0.85; }
  .dbgHint { margin-inline-start: 8px; font-size: 12px; opacity: 0.75; }
  .dbgBtns { display: flex; flex-wrap: wrap; gap: 8px; justify-content: flex-end; }
  
  /* ===== ShareShot (painted, invisible) ===== */
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
  .shotTitle{ font-size: 22px; font-weight: 1000; }
  .shotDate{
    font-size: 14px;
    font-weight: 900;
    padding: 6px 10px;
    border-radius: 999px;
    background: rgba(0,0,0,0.04);
    border: 1px solid rgba(0,0,0,0.08);
  }
  .shotGrid{
    display:grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 12px;
  }
  .shotBox{
    border-radius: 18px;
    padding: 14px;
    border: 1px solid rgba(0,0,0,0.08);
    background: rgba(0,0,0,0.02);
  }
  .shotBoxTitle{ font-weight: 1000; margin-bottom: 10px; }
  .shotRow{ display:flex; justify-content:space-between; gap:10px; padding: 6px 0; }
  .shotBox--morn{ background: linear-gradient(135deg, rgba(110, 231, 183, 0.22), rgba(255,255,255,0.9)); }
  .shotBox--bible{ background: linear-gradient(135deg, rgba(59, 130, 246, 0.18), rgba(255,255,255,0.9)); }
  .shotBox--sleep{ background: linear-gradient(135deg, rgba(244, 114, 182, 0.16), rgba(255,255,255,0.9)); }
  .shotBox--comm{ background: linear-gradient(135deg, rgba(250, 204, 21, 0.16), rgba(255,255,255,0.9)); }
  .shotBox--conf{ background: linear-gradient(135deg, rgba(167, 139, 250, 0.16), rgba(255,255,255,0.9)); }
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
  </style>
  