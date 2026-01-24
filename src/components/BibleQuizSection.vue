<!-- src/components/BibleQuizSection.vue -->
<template>
  <section class="bqWrap" dir="rtl" lang="ar">
    <div class="bqHeader">
      <div class="bqTitle">{{ quizTitle }}</div>
      <div class="bqDate" v-if="dateIso">📅 {{ dateIso }}</div>
    </div>

    <div v-if="loading" class="bqHint">جاري تحميل الأسئلة…</div>
    <div v-else-if="error" class="bqHint bqError">تعذر تحميل الأسئلة.</div>

    <template v-else>
      <!-- ===== MCQ Section ===== -->
      <div v-if="mcqList.length" class="bqCard">
        <div class="bqCardTitle">🧠 {{ quizTitle }}</div>

        <!-- ===== Start Gate (hidden questions before start) ===== -->
        <div v-if="!submitted && !quizStarted" class="startGate">
          <div class="startCopy">
            عندك <b> سؤال{{ mcqList.length === 1 ? "" : "ين" }}</b>
            وقدامك <b>{{ totalSeconds }}</b> ثانية.
          </div>

          <button class="startBtn" type="button" @click="startQuiz">
            🚀 ابدأ الاختبار
          </button>

          <div class="startHint">
            * بعد ما يبدأ العداد، لو الوقت خلص هتظهر النتيجة تلقائيًا.
          </div>
        </div>

        <!-- ===== Timer Bar (only after start and before submit) ===== -->
        <div v-if="quizStarted && !submitted" class="timerWrap" aria-live="polite">
          <div class="timerTop">
            <span class="timerLabel">⏳ الوقت المتبقي</span>
            <span class="timerNum">{{ timeLeft }}ث</span>
          </div>

          <div class="timerBar" role="progressbar"
               :aria-valuemin="0"
               :aria-valuemax="totalSeconds"
               :aria-valuenow="timeLeft">
            <div class="timerFill" :style="timerFillStyle"></div>
            <div class="timerGlow" :style="timerFillStyle"></div>
          </div>

          <div v-if="timeLeft <= 10" class="timerWarn">
            ⚠️ باقي {{ timeLeft }} ثانية
          </div>
        </div>

        <!-- ===== Questions (shown after start OR after submit) ===== -->
        <div v-if="quizStarted || submitted" class="mcqBody">
          <div v-for="q in mcqList" :key="q.id" class="mcqBlock">
            <div class="mcqQ">
              <span class="mcqNum">س{{ q.questionNumber }}</span>
              <span class="mcqTxt">{{ q.question }}</span>
            </div>

            <div class="mcqAns">
              <label
                v-for="a in q.answers"
                :key="a.key"
                class="mcqOpt"
                :class="{
                  isChosen: mcqSelected[q.id] === a.key,
                  isRight: submitted && a.key === q.correctKey,
                  isWrong:
                    submitted &&
                    mcqSelected[q.id] === a.key &&
                    a.key !== q.correctKey
                }"
              >
                <input
                  type="radio"
                  :name="`mcq-${q.id}`"
                  :value="a.key"
                  v-model="mcqSelected[q.id]"
                  :disabled="submitted || timeLeft === 0"
                />
                <span class="mcqOptTxt">{{ a.text }}</span>

                <span v-if="submitted" class="mcqMark">
                  <template v-if="a.key === q.correctKey">✅</template>
                  <template v-else-if="mcqSelected[q.id] === a.key">❌</template>
                </span>
              </label>
            </div>

            <div v-if="submitted" class="mcqAfter">
              <div v-if="isMcqCorrect(q)" class="mcqExplain ok">✅ إجابة صحيحة</div>
              <div v-else class="mcqExplain bad">❌ إجابة خاطئة</div>

              <div
                v-if="showCorrectAnswers && !isMcqCorrect(q)"
                class="mcqCorrectReveal"
              >
                الإجابة الصحيحة: <b>{{ correctTextFor(q) }}</b>
              </div>
            </div>
          </div>

          <button
            class="bqBtn"
            type="button"
            :disabled="submitted || !canSubmit || timeLeft === 0"
            @click="submit('manual')"
          >
            ✅ تأكيد الإجابات
          </button>
        </div>

        <div v-if="submitted" class="bqResult" :class="resultClass">
          <div v-if="score === mcqList.length" class="confetti" aria-hidden="true">
            <span v-for="n in 24" :key="n" class="confettiPiece"></span>
          </div>

          <template v-if="score === mcqList.length">
            👏 ممتاز! كل الإجابات صح
          </template>
          <template v-else-if="score === 1">
            🙂 50% — إجابة واحدة صح
          </template>
          <template v-else>
            😅 ولا يهمك… جرّب بكرة
          </template>

          <div v-if="submitReason === 'timeout'" class="timeoutNote">
            ⏱️ انتهى الوقت — تم حساب النتيجة تلقائيًا.
          </div>
        </div>
      </div>

      <!-- ===== Ta2amol Section ===== -->
      <div v-if="ta2amol" class="bqCard">
        <div class="bqCardTitle">✍️ {{ ta2amolTitle }}</div>

        <div class="essayQ">{{ ta2amol.question }}</div>

        <textarea
          class="essayBox"
          v-model="essayText"
          placeholder="اكتب إجابتك/تأملك هنا… (سيتم الحفظ تلقائيًا على الجهاز)"
          @input="saveEssay"
        />

        <div class="essaySaved" v-if="essaySavedTick">✓ تم الحفظ</div>
      </div>

      <div v-if="!mcqList.length && !ta2amol" class="bqHint">
        لا توجد أسئلة لهذا اليوم.
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, watch } from "vue"
import Papa from "papaparse"

type QuestionType = "mcq" | "ta2amol"
type SubmitReason = "manual" | "timeout" | "restore"

type SheetRow = {
  date_iso: string
  book?: string
  chapter?: string | number
  quetion_type: QuestionType
  question_number: string | number
  question: string
  "correct answer"?: string
  distractor_b?: string
  distractor_c?: string
  distractor_d?: string
}

type Mcq = {
  id: string
  questionNumber: number
  question: string
  correctKey: "a" | "b" | "c" | "d"
  answers: { key: "a" | "b" | "c" | "d"; text: string }[]
}

const props = defineProps<{
  dateIso: string
  quizTitle?: string
  ta2amolTitle?: string
  mcqCount?: number
  seconds?: number // optional (default 60)
}>()

const quizTitle = computed(() => props.quizTitle || "مين فاكر؟")
const ta2amolTitle = computed(() => props.ta2amolTitle || "خلوة مع الكتاب المقدس")
const mcqCount = computed(() => Math.max(1, Number(props.mcqCount ?? 2) || 2))
const totalSeconds = computed(() => Math.max(10, Number(props.seconds ?? 90) || 90))

// ✅ Google Sheets CSV
const SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRfqSbb9J3DUYpOVRPXj8QjyLN603lzrsmp3tQsnUH4-vAnqKH6ijNDayAcjV9YIrrbvBTf4VPh6ip5/pub?gid=0&single=true&output=csv"

// sounds (put files in public/sfx/)
const SFX_CLAP = "/sfx/clap.mp3"
const SFX_SUCCESS = "/sfx/success.mp3"
const SFX_FAIL = "/sfx/fail.mp3"

const sfxClap = new Audio(SFX_CLAP)
const sfxSuccess = new Audio(SFX_SUCCESS)
const sfxFail = new Audio(SFX_FAIL)
;[sfxClap, sfxSuccess, sfxFail].forEach((a) => {
  a.preload = "auto"
  a.volume = 0.9
})

function playAudio(a: HTMLAudioElement) {
  try {
    a.pause()
    a.currentTime = 0
    const p = a.play()
    if (p && typeof (p as any).catch === "function") {
      ;(p as Promise<void>).catch((err) => {
        console.warn("[SFX] play failed:", a.src, err)
      })
    }
  } catch (err) {
    console.warn("[SFX] play threw:", a.src, err)
  }
}
const loading = ref(false)
const error = ref(false)

const rows = ref<SheetRow[]>([])
const mcqList = ref<Mcq[]>([])
const ta2amol = ref<{ questionNumber: number; question: string } | null>(null)

// mcq state
const mcqSelected = ref<Record<string, "a" | "b" | "c" | "d" | undefined>>({})
const submitted = ref(false)
const score = ref(0)
const submitReason = ref<SubmitReason>("manual")

// quiz gate + timer
const quizStarted = ref(false)
const timeLeft = ref<number>(totalSeconds.value)
let tickTimer: any = null

const canSubmit = computed(() => {
  if (!mcqList.value.length) return false
  return mcqList.value.every((q) => !!mcqSelected.value[q.id])
})

const resultClass = computed(() => {
  if (!submitted.value) return ""
  if (score.value === mcqList.value.length) return "isPerfect"
  if (score.value >= 1) return "isHalf"
  return "isFail"
})

// ✅ show correct answer if 50% or 0%
const showCorrectAnswers = computed(
  () => submitted.value && score.value < mcqList.value.length
)

// ===== timer UI =====
const timerFillStyle = computed(() => {
  const pct =
    totalSeconds.value > 0 ? Math.max(0, Math.min(1, timeLeft.value / totalSeconds.value)) : 0
  return { transform: `scaleX(${pct})` }
})

function clearTick() {
  if (tickTimer) {
    clearInterval(tickTimer)
    tickTimer = null
  }
}

function startQuiz() {
  if (submitted.value) return
  if (quizStarted.value) return
  quizStarted.value = true
  timeLeft.value = totalSeconds.value

  // start interval
  clearTick()
  tickTimer = setInterval(() => {
    if (submitted.value) {
      clearTick()
      return
    }
    timeLeft.value = Math.max(0, timeLeft.value - 1)
    if (timeLeft.value === 0) {
      clearTick()
      submit("timeout")
    }
  }, 1000)
}

// essay state (local)
const essayText = ref("")
const essaySavedTick = ref(false)

// ===== keys =====
function essayKey() {
  return `mk_ta2amol_${props.dateIso}`
}
function quizAttemptKey() {
  return `mk_quiz_attempt_${props.dateIso}`
}

// ===== attempt persistence =====
type QuizAttempt = {
  submitted: boolean
  selected: Record<string, "a" | "b" | "c" | "d">
  score: number
  reason?: SubmitReason
}

function loadQuizAttempt() {
  try {
    const raw = localStorage.getItem(quizAttemptKey())
    if (!raw) return null
    const obj = JSON.parse(raw) as QuizAttempt
    if (!obj?.submitted || !obj?.selected) return null
    return obj
  } catch {
    return null
  }
}

function saveQuizAttempt(attempt: QuizAttempt) {
  try {
    localStorage.setItem(quizAttemptKey(), JSON.stringify(attempt))
  } catch {}
}

// ===== essay persistence =====
function loadEssay() {
  try {
    essayText.value = localStorage.getItem(essayKey()) || ""
  } catch {}
}

let essaySaveTimer: any = null
function saveEssay() {
  clearTimeout(essaySaveTimer)
  essaySaveTimer = setTimeout(() => {
    try {
      localStorage.setItem(essayKey(), essayText.value || "")
      essaySavedTick.value = true
      setTimeout(() => (essaySavedTick.value = false), 900)
    } catch {}
  }, 250)
}

// ===== helpers =====
function normalizeType(v: any): QuestionType | null {
  const t = String(v || "").trim().toLowerCase()
  if (t === "mcq") return "mcq"
  if (t === "ta2amol" || t === "ta2mol" || t === "ta2amoul") return "ta2amol"
  return null
}

function numify(v: any) {
  const n = Number(String(v ?? "").trim())
  return Number.isFinite(n) ? n : 0
}

function safeText(v: any) {
  return String(v ?? "").trim()
}

// ✅ play sound (safe)
function playSfx(src: string) {
  try {
    const a = new Audio(src)
    a.volume = 0.9
    a.play().catch(() => {})
  } catch {}
}

function localeCompareSmart(a: string, b: string) {
  return a.localeCompare(b, "ar", { sensitivity: "base", numeric: true })
}

function buildMcqFromRow(r: SheetRow): Mcq | null {
  const q = safeText(r.question)
  if (!q) return null

  const correctText = safeText((r as any)["correct answer"])
  const bText = safeText((r as any)["distractor_b"])
  const cText = safeText((r as any)["distractor_c"])
  const dText = safeText((r as any)["distractor_d"])

  if (!correctText || !bText || !cText || !dText) return null

  const unique = Array.from(new Set([correctText, bText, cText, dText].map((s) => s.trim())))
  if (unique.length !== 4) return null

  unique.sort(localeCompareSmart)

  const keyByIndex = ["a", "b", "c", "d"] as const
  const answers = unique.map((text, idx) => ({ key: keyByIndex[idx], text }))

  const correctIndex = unique.findIndex((x) => x === correctText.trim())
  const correctKey = keyByIndex[Math.max(0, correctIndex)]

  return {
    id: `${props.dateIso}-${numify(r.question_number)}`,
    questionNumber: numify(r.question_number),
    question: q,
    correctKey,
    answers
  }
}

function isMcqCorrect(q: Mcq) {
  return mcqSelected.value[q.id] === q.correctKey
}

function correctTextFor(q: Mcq) {
  return q.answers.find((a) => a.key === q.correctKey)?.text || ""
}

function computeScore() {
  let s = 0
  for (const q of mcqList.value) {
    if (mcqSelected.value[q.id] === q.correctKey) s++
  }
  return s
}

// ===== load sheet =====
async function loadFromSheet() {
  loading.value = true
  error.value = false

  // reset gate/timer state for new day load (will be overridden by restore)
  clearTick()
  quizStarted.value = false
  timeLeft.value = totalSeconds.value

  try {
    const res = await fetch(SHEET_CSV_URL, { cache: "no-store" })
    const csv = await res.text()

    const parsed = Papa.parse(csv, {
      header: true,
      skipEmptyLines: true
    })

    const raw = (parsed.data as any[]) || []

    const cleaned: SheetRow[] = raw
      .map((x) => {
        const qt = normalizeType(x.quetion_type)
        return {
          date_iso: safeText(x.date_iso),
          quetion_type: (qt || "mcq") as any,
          question_number: x.question_number,
          question: safeText(x.question),
          "correct answer": safeText(x["correct answer"]),
          distractor_b: safeText(x.distractor_b),
          distractor_c: safeText(x.distractor_c),
          distractor_d: safeText(x.distractor_d),
          book: safeText(x.book),
          chapter: safeText(x.chapter)
        } as SheetRow
      })
      .filter((r) => !!r.date_iso && !!r.question && !!normalizeType(r.quetion_type))
      .filter((r) => r.date_iso === props.dateIso)
      .sort((a, b) => numify(a.question_number) - numify(b.question_number))

    rows.value = cleaned

    const mcqRows = cleaned.filter((r) => normalizeType(r.quetion_type) === "mcq")
    const ta2 = cleaned.find((r) => normalizeType(r.quetion_type) === "ta2amol")

    mcqList.value = mcqRows
      .map(buildMcqFromRow)
      .filter(Boolean)
      .slice(0, mcqCount.value) as Mcq[]

    ta2amol.value = ta2
      ? { questionNumber: numify(ta2.question_number), question: safeText(ta2.question) }
      : null

    // ✅ restore attempt (ONE TIME per day)
    const attempt = loadQuizAttempt()
    if (attempt) {
      mcqSelected.value = { ...attempt.selected }
      score.value = computeScore()
      submitted.value = true
      submitReason.value = (attempt.reason || "restore") as SubmitReason

      // show questions (since already answered)
      quizStarted.value = true
      timeLeft.value = 0
      clearTick()
    } else {
      submitted.value = false
      score.value = 0
      submitReason.value = "manual"
      mcqSelected.value = {}
      // keep quizStarted = false (hidden questions)
    }
  } catch (e) {
    console.error(e)
    error.value = true
  } finally {
    loading.value = false
  }
}

function submit(reason: SubmitReason) {
  if (submitted.value) return
  if (reason === "manual" && !canSubmit.value) return

  clearTick()
  timeLeft.value = 0
  quizStarted.value = true

  const s = computeScore()
  score.value = s
  submitted.value = true
  submitReason.value = reason

  // persist attempt
  const selectedClean: Record<string, "a" | "b" | "c" | "d"> = {}
  for (const q of mcqList.value) {
    const v = mcqSelected.value[q.id]
    if (v) selectedClean[q.id] = v
  }

  saveQuizAttempt({
    submitted: true,
    selected: selectedClean,
    score: s,
    reason
  })

  // ✅ 3 cases
  if (s === mcqList.value.length && mcqList.value.length > 0) {
    // both correct (perfect)
    playAudio(sfxClap)
  } else if (s === 1) {
    // one correct
    playAudio(sfxSuccess)
  } else {
    // two wrong (0 correct)
    playAudio(sfxFail)
  }
}


watch(
  () => props.dateIso,
  () => {
    loadEssay()
    loadFromSheet()
  }
)

onMounted(() => {
  try { sfxClap.load(); sfxSuccess.load(); sfxFail.load(); } catch {}
  loadEssay()
  loadFromSheet()
})

onBeforeUnmount(() => {
  clearTick()
})
</script>

<style scoped>
/* =========================================================
   BIBLE QUIZ – COMPETITION THEME (Colorful + Animated)
   Full replacement for your current styles.
   Works with the classes in your updated template:
   .startGate .startCopy .startBtn .startHint
   .timerWrap .timerTop .timerLabel .timerNum
   .timerBar .timerFill .timerGlow .timerWarn
   .mcqBody .timeoutNote
========================================================= */

/* ===== Root ===== */
.bqWrap{
  /* Palette */
  --p1: #7c3aed; /* purple */
  --p2: #06b6d4; /* cyan */
  --p3: #22c55e; /* green */
  --p4: #f59e0b; /* amber */
  --p5: #ef4444; /* red */
  --ink: rgba(8, 16, 32, 0.92);
  --sub: rgba(8, 16, 32, 0.70);

  /* Surfaces */
  --card: rgba(255,255,255,0.62);
  --card2: rgba(255,255,255,0.48);
  --border: rgba(255,255,255,0.50);
  --border2: rgba(8,16,32,0.10);

  /* Shadows */
  --sh1: 0 10px 20px rgba(0,0,0,0.10);
  --sh2: 0 18px 42px rgba(0,0,0,0.16);
  --sh3: 0 28px 72px rgba(0,0,0,0.22);

  --radius: 24px;

  margin-top: 14px;
  display:flex;
  flex-direction:column;
  gap: 12px;

  color: var(--ink);
  border-radius: var(--radius);
  position: relative;
  overflow: visible;
  isolation: isolate;
}

.bqWrap *{
  font-family:"Noto Kufi Arabic", system-ui, sans-serif;
}

/* ===== Animated Aura Background ===== */
.bqWrap::before{
  content:"";
  position:absolute;
  inset:-16px;
  z-index:-2;
  border-radius: calc(var(--radius) + 18px);
  background:
    radial-gradient(900px 420px at 12% 10%, rgba(124,58,237,0.30), transparent 62%),
    radial-gradient(900px 420px at 88% 18%, rgba(6,182,212,0.26), transparent 60%),
    radial-gradient(900px 420px at 45% 115%, rgba(34,197,94,0.18), transparent 58%),
    linear-gradient(135deg, rgba(255,255,255,0.25), rgba(255,255,255,0.08));
  filter: blur(8px) saturate(1.15);
  opacity: 0.95;
  animation: mkAura 10s ease-in-out infinite alternate;
}

@keyframes mkAura{
  0%{ transform: translateY(0px) scale(1); }
  50%{ transform: translateY(-5px) scale(1.01); }
  100%{ transform: translateY(-2px) scale(1.02); }
}

/* Sparkly grain */
.bqWrap::after{
  content:"";
  position:absolute;
  inset:-10px;
  z-index:-1;
  border-radius: calc(var(--radius) + 14px);
  background:
    radial-gradient(circle at 18% 22%, rgba(255,255,255,0.35) 0 2px, transparent 3px),
    radial-gradient(circle at 72% 18%, rgba(255,255,255,0.30) 0 2px, transparent 3px),
    radial-gradient(circle at 44% 66%, rgba(255,255,255,0.24) 0 2px, transparent 3px),
    radial-gradient(circle at 84% 72%, rgba(255,255,255,0.20) 0 2px, transparent 3px);
  opacity: .55;
  filter: blur(.2px);
  animation: mkSparkle 7s linear infinite;
  pointer-events:none;
}

@keyframes mkSparkle{
  from{ transform: translateY(0px); }
  to{ transform: translateY(-12px); }
}

/* ===== Header ===== */
.bqHeader{
  display:flex;
  align-items:center;
  justify-content: space-between;
  gap: 10px;
  padding: 0 6px;
}

.bqTitle{
  font-weight: 1100;
  font-size: 18px;
  letter-spacing: 0.2px;
  text-shadow: 0 1px 0 rgba(255,255,255,0.65);
}

.bqDate{
  font-weight: 1000;
  font-size: 12px;
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.65);
  background:
    linear-gradient(135deg, rgba(124,58,237,0.18), rgba(6,182,212,0.14)),
    rgba(255,255,255,0.58);
  box-shadow: var(--sh1);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  color: var(--sub);
}

/* ===== Loading / Error ===== */
.bqHint{
  text-align:center;
  font-weight: 1000;
  opacity: 0.90;
  padding: 10px 0;
  color: var(--sub);
}

.bqError{
  color: rgba(220, 38, 38, 0.95);
}

/* ===== Card ===== */
.bqCard{
  border-radius: var(--radius);
  padding: 14px;
  border: 1px solid rgba(255,255,255,0.55);
  background:
    linear-gradient(180deg, var(--card), var(--card2));
  box-shadow: var(--sh2);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  position: relative;
  overflow:hidden;
}

/* Shimmer + top highlight */
.bqCard::before{
  content:"";
  position:absolute;
  inset:-40px;
  background:
    radial-gradient(600px 220px at 20% 10%, rgba(124,58,237,0.18), transparent 60%),
    radial-gradient(600px 220px at 90% 0%, rgba(6,182,212,0.16), transparent 60%),
    linear-gradient(135deg, rgba(255,255,255,0.55), transparent 35%, transparent 60%, rgba(255,255,255,0.30));
  opacity: 0.80;
  transform: translateX(-18%);
  animation: mkShimmer 7.5s ease-in-out infinite alternate;
  pointer-events:none;
}

@keyframes mkShimmer{
  0%{ transform: translateX(-20%) translateY(0px); }
  100%{ transform: translateX(0%) translateY(-6px); }
}

.bqCardTitle{
  font-weight: 1100;
  text-align:center;
  margin-bottom: 10px;
  font-size: 16px;
  color: var(--ink);
  position: relative;
  z-index: 1;
}

/* ===== Start Gate ===== */
.startGate{
  position: relative;
  z-index: 1;
  border-radius: 18px;
  padding: 14px;
  border: 1px solid rgba(255,255,255,0.55);
  background:
    radial-gradient(900px 280px at 10% 0%, rgba(124,58,237,0.14), transparent 58%),
    radial-gradient(900px 280px at 90% 10%, rgba(6,182,212,0.12), transparent 58%),
    rgba(255,255,255,0.50);
  box-shadow: 0 14px 34px rgba(0,0,0,0.10);
  display:flex;
  flex-direction:column;
  gap: 10px;
  text-align: center;
}

.startCopy{
  font-weight: 1000;
  line-height: 1.9;
  color: var(--ink);
}

.startCopy b{
  padding: 0 6px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.65);
  background: rgba(255,255,255,0.55);
  box-shadow: 0 10px 18px rgba(0,0,0,0.06);
}

.startBtn{
  width: 100%;
  padding: 12px 14px;
  border-radius: 18px;
  border: 1px solid rgba(255,255,255,0.55);
  background:
    linear-gradient(135deg, rgba(124,58,237,0.95), rgba(6,182,212,0.92));
  color: #fff;
  font-weight: 1100;
  cursor: pointer;
  box-shadow: var(--sh3);
  position: relative;
  overflow:hidden;
  transform: translateZ(0);
  transition: transform .16s ease, box-shadow .16s ease, filter .16s ease;
}

.startBtn::before{
  content:"";
  position:absolute;
  inset:-60px;
  background:
    radial-gradient(circle at 20% 20%, rgba(255,255,255,0.35), transparent 45%),
    radial-gradient(circle at 80% 40%, rgba(255,255,255,0.22), transparent 50%);
  opacity: 0.0;
  transform: translateX(-14%);
  transition: opacity .18s ease, transform .25s ease;
}

.startBtn:hover{
  transform: translateY(-1px);
  box-shadow: 0 34px 80px rgba(0,0,0,0.24);
  filter: saturate(1.12);
}

.startBtn:hover::before{
  opacity: 1;
  transform: translateX(0%);
}

.startBtn:active{
  transform: translateY(0px) scale(0.99);
}

.startHint{
  font-size: 12px;
  font-weight: 950;
  opacity: 0.85;
  color: var(--sub);
}

/* ===== Timer ===== */
.timerWrap{
  position: relative;
  z-index: 1;
  margin-top: 10px;
  border-radius: 18px;
  padding: 12px;
  border: 1px solid rgba(255,255,255,0.55);
  background:
    radial-gradient(900px 260px at 12% 0%, rgba(34,197,94,0.12), transparent 60%),
    rgba(255,255,255,0.50);
  box-shadow: 0 16px 40px rgba(0,0,0,0.12);
}

.timerTop{
  display:flex;
  align-items:center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.timerLabel{
  font-weight: 1100;
  color: var(--ink);
  opacity: 0.92;
}

.timerNum{
  font-weight: 1200;
  letter-spacing: 0.3px;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.70);
  background: rgba(255,255,255,0.60);
  box-shadow: 0 10px 18px rgba(0,0,0,0.08);
}

/* Progress bar */
.timerBar{
  height: 12px;
  border-radius: 999px;
  background: rgba(0,0,0,0.08);
  overflow:hidden;
  position: relative;
  border: 1px solid rgba(255,255,255,0.55);
  box-shadow: inset 0 2px 6px rgba(0,0,0,0.16);
}

.timerFill{
  position:absolute;
  inset: 0;
  transform-origin: right center; /* RTL look (shrinks from right) */
  background:
    linear-gradient(90deg, rgba(239,68,68,0.95), rgba(245,158,11,0.95), rgba(34,197,94,0.95), rgba(6,182,212,0.95), rgba(124,58,237,0.95));
  filter: saturate(1.12);
  animation: timerPulse 1.4s ease-in-out infinite;
  will-change: transform;
}

.timerGlow{
  position:absolute;
  inset:-6px;
  transform-origin: right center;
  background:
    radial-gradient(60px 18px at 92% 50%, rgba(255,255,255,0.45), transparent 60%),
    radial-gradient(120px 26px at 92% 50%, rgba(6,182,212,0.22), transparent 62%);
  filter: blur(5px);
  opacity: 0.9;
  pointer-events:none;
  will-change: transform;
}

@keyframes timerPulse{
  0%{ filter: saturate(1.05) brightness(1); }
  50%{ filter: saturate(1.25) brightness(1.05); }
  100%{ filter: saturate(1.05) brightness(1); }
}

.timerWarn{
  margin-top: 10px;
  text-align: center;
  font-weight: 1100;
  color: rgba(185, 28, 28, 0.95);
  background: rgba(255,255,255,0.55);
  border: 1px dashed rgba(239, 68, 68, 0.45);
  padding: 8px 10px;
  border-radius: 14px;
  animation: warnShake 1.1s ease-in-out infinite;
}

@keyframes warnShake{
  0%,100%{ transform: translateX(0); }
  20%{ transform: translateX(1px); }
  40%{ transform: translateX(-1px); }
  60%{ transform: translateX(1px); }
  80%{ transform: translateX(-1px); }
}

/* ===== Questions ===== */
.mcqBody{
  position: relative;
  z-index: 1;
  margin-top: 12px;
}

/* Each question block */
.mcqBlock{
  border-top: 1px solid rgba(255,255,255,0.55);
  padding-top: 12px;
  margin-top: 12px;
  position: relative;
}

.mcqBlock:first-of-type{
  border-top: 0;
  padding-top: 0;
  margin-top: 0;
}

.mcqQ{
  display:flex;
  gap: 10px;
  align-items:flex-start;
  font-weight: 1100;
  line-height: 1.9;
  margin-bottom: 10px;
}

.mcqNum{
  flex: 0 0 auto;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.70);
  background:
    linear-gradient(135deg, rgba(124,58,237,0.20), rgba(6,182,212,0.12)),
    rgba(255,255,255,0.55);
  box-shadow: 0 10px 18px rgba(0,0,0,0.08);
  font-size: 12px;
  font-weight: 1200;
}

.mcqTxt{
  flex:1;
  font-size: 15px;
  color: var(--ink);
}

/* Options */
.mcqAns{
  display:flex;
  flex-direction:column;
  gap: 10px;
}

.mcqOpt{
  display:flex;
  gap: 12px;
  align-items:center;
  padding: 12px 12px;
  border-radius: 18px;
  border: 1px solid rgba(255,255,255,0.60);
  background:
    radial-gradient(900px 280px at 10% 0%, rgba(6,182,212,0.10), transparent 58%),
    rgba(255,255,255,0.56);
  cursor:pointer;
  user-select:none;
  position: relative;
  transition: transform .16s ease, box-shadow .16s ease, border-color .16s ease, filter .16s ease;
  box-shadow: 0 14px 26px rgba(0,0,0,0.10);
  overflow:hidden;
  transform: translateZ(0);
}

.mcqOpt::after{
  content:"";
  position:absolute;
  inset:-40px;
  background:
    radial-gradient(circle at 22% 22%, rgba(255,255,255,0.35), transparent 45%),
    radial-gradient(circle at 78% 46%, rgba(255,255,255,0.18), transparent 52%);
  opacity: 0.0;
  transform: translateX(-10%);
  transition: opacity .18s ease, transform .25s ease;
  pointer-events:none;
}

.mcqOpt:hover{
  transform: translateY(-1px);
  box-shadow: 0 22px 44px rgba(0,0,0,0.16);
  filter: saturate(1.08);
}

.mcqOpt:hover::after{
  opacity: 1;
  transform: translateX(0%);
}

.mcqOpt:active{
  transform: translateY(0px) scale(0.99);
}

.mcqOpt input{
  width: 18px;
  height: 18px;
  accent-color: var(--p2);
  transform: translateY(1px);
}

.mcqOptTxt{
  font-weight: 1000;
  line-height: 1.8;
  flex: 1;
  color: var(--ink);
}

.mcqMark{
  font-weight: 1200;
  font-size: 16px;
  filter: drop-shadow(0 10px 16px rgba(0,0,0,0.12));
}

/* Chosen (pre-submit) */
.mcqOpt.isChosen{
  border-color: rgba(6,182,212,0.55);
  background:
    linear-gradient(135deg, rgba(6,182,212,0.16), rgba(124,58,237,0.12)),
    rgba(255,255,255,0.60);
  box-shadow: 0 26px 60px rgba(6,182,212,0.16);
}

/* Right / Wrong (post-submit) */
.mcqOpt.isRight{
  border-color: rgba(34,197,94,0.65);
  background:
    linear-gradient(135deg, rgba(34,197,94,0.18), rgba(6,182,212,0.10)),
    rgba(255,255,255,0.60);
  box-shadow: 0 26px 60px rgba(34,197,94,0.14);
}

.mcqOpt.isWrong{
  border-color: rgba(239,68,68,0.60);
  background:
    linear-gradient(135deg, rgba(239,68,68,0.18), rgba(245,158,11,0.10)),
    rgba(255,255,255,0.60);
  box-shadow: 0 26px 60px rgba(239,68,68,0.14);
}

/* Explanation box */
.mcqAfter{
  margin-top: 10px;
  padding: 12px 12px;
  border-radius: 18px;
  border: 1px solid rgba(255,255,255,0.60);
  background: rgba(255,255,255,0.56);
  box-shadow: 0 16px 34px rgba(0,0,0,0.12);
}

.mcqExplain{
  font-weight: 1200;
  text-align:center;
  letter-spacing: 0.1px;
}

.mcqExplain.ok{
  color: rgba(16, 185, 129, 0.95);
}

.mcqExplain.bad{
  color: rgba(220, 38, 38, 0.95);
}

.mcqCorrectReveal{
  margin-top: 8px;
  text-align: center;
  font-weight: 1100;
  color: var(--ink);
  padding: 10px 10px;
  border-radius: 16px;
  border: 1px dashed rgba(6,182,212,0.55);
  background:
    radial-gradient(900px 280px at 20% 0%, rgba(6,182,212,0.12), transparent 60%),
    rgba(255,255,255,0.55);
}

/* Submit button */
.bqBtn{
  width:100%;
  margin-top: 14px;
  padding: 12px 14px;
  border-radius: 18px;
  border: 1px solid rgba(255,255,255,0.55);
  background:
    linear-gradient(135deg, rgba(34,197,94,0.95), rgba(6,182,212,0.92));
  color: #fff;
  font-weight: 1200;
  cursor:pointer;
  box-shadow: var(--sh3);
  transition: transform .16s ease, box-shadow .16s ease, opacity .16s ease, filter .16s ease;
  position: relative;
  overflow:hidden;
  transform: translateZ(0);
}

.bqBtn::before{
  content:"";
  position:absolute;
  inset:-60px;
  background:
    radial-gradient(circle at 20% 20%, rgba(255,255,255,0.35), transparent 45%),
    radial-gradient(circle at 80% 40%, rgba(255,255,255,0.22), transparent 50%);
  opacity: 0.0;
  transform: translateX(-14%);
  transition: opacity .18s ease, transform .25s ease;
}

.bqBtn:hover{
  transform: translateY(-1px);
  box-shadow: 0 34px 90px rgba(0,0,0,0.26);
  filter: saturate(1.12);
}

.bqBtn:hover::before{
  opacity: 1;
  transform: translateX(0%);
}

.bqBtn:active{
  transform: translateY(0px) scale(0.99);
}

.bqBtn:disabled{
  opacity: 0.55;
  cursor: not-allowed;
  transform: none;
  filter: grayscale(0.2);
  box-shadow: var(--sh1);
}

/* ===== Result ===== */
.bqResult{
  margin-top: 12px;
  border-radius: 20px;
  padding: 14px 12px;
  text-align:center;
  font-weight: 1200;
  border: 1px solid rgba(255,255,255,0.60);
  background: rgba(255,255,255,0.62);
  box-shadow: var(--sh2);
  position: relative;
  overflow: hidden;
  transform: translateZ(0);
}

.bqResult.isPerfect{
  border-color: rgba(34,197,94,0.55);
  background:
    radial-gradient(900px 280px at 20% 0%, rgba(34,197,94,0.18), transparent 60%),
    rgba(255,255,255,0.65);
}

.bqResult.isHalf{
  border-color: rgba(245,158,11,0.60);
  background:
    radial-gradient(900px 280px at 20% 0%, rgba(245,158,11,0.20), transparent 60%),
    rgba(255,255,255,0.65);
}

.bqResult.isFail{
  border-color: rgba(239,68,68,0.60);
  background:
    radial-gradient(900px 280px at 20% 0%, rgba(239,68,68,0.18), transparent 60%),
    rgba(255,255,255,0.65);
}

.timeoutNote{
  margin-top: 10px;
  font-weight: 1100;
  font-size: 12px;
  opacity: 0.90;
  color: var(--sub);
}

/* ===== Essay ===== */
.essayQ{
  font-weight: 1100;
  line-height: 1.9;
  margin-bottom: 10px;
  text-align: right;
  color: var(--ink);
}

.essayBox{
  width:100%;
  min-height: 120px;
  resize: vertical;
  padding: 12px 12px;
  border-radius: 18px;
  border: 1px dashed rgba(124,58,237,0.45);
  background:
    radial-gradient(900px 280px at 15% 0%, rgba(124,58,237,0.12), transparent 62%),
    rgba(255,255,255,0.55);
  outline: none;
  font-weight: 1000;
  line-height: 1.9;
  color: var(--ink);
  box-shadow: 0 16px 34px rgba(0,0,0,0.12);
  transition: border-color .16s ease, box-shadow .16s ease, transform .16s ease, filter .16s ease;
}

.essayBox:focus{
  border-color: rgba(6,182,212,0.65);
  box-shadow: 0 26px 60px rgba(6,182,212,0.18);
  transform: translateY(-1px);
  filter: saturate(1.06);
}

.essaySaved{
  margin-top: 10px;
  font-weight: 1100;
  opacity: 0.85;
  text-align: center;
  color: rgba(16, 185, 129, 0.95);
}

/* ===== Confetti (kept) ===== */
.confetti{
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  border-radius: inherit;
  z-index: 0;
}

.confettiPiece{
  position: absolute;
  top: -18px;
  width: 10px;
  height: 14px;
  border-radius: 4px;
  opacity: 0.95;
  background: linear-gradient(135deg, rgba(124,58,237,0.95), rgba(6,182,212,0.90));
  animation: confettiFall 1.9s ease-in forwards;
  filter: drop-shadow(0 10px 16px rgba(0,0,0,0.12));
}

.confettiPiece:nth-child(1){ left: 6%;  animation-delay: 0.00s; transform: rotate(12deg); }
.confettiPiece:nth-child(2){ left: 12%; animation-delay: 0.05s; transform: rotate(-20deg); }
.confettiPiece:nth-child(3){ left: 18%; animation-delay: 0.10s; transform: rotate(32deg); }
.confettiPiece:nth-child(4){ left: 24%; animation-delay: 0.15s; transform: rotate(-10deg); }
.confettiPiece:nth-child(5){ left: 30%; animation-delay: 0.20s; transform: rotate(24deg); }
.confettiPiece:nth-child(6){ left: 36%; animation-delay: 0.25s; transform: rotate(-28deg); }
.confettiPiece:nth-child(7){ left: 42%; animation-delay: 0.30s; transform: rotate(14deg); }
.confettiPiece:nth-child(8){ left: 48%; animation-delay: 0.35s; transform: rotate(-16deg); }
.confettiPiece:nth-child(9){ left: 54%; animation-delay: 0.40s; transform: rotate(26deg); }
.confettiPiece:nth-child(10){ left: 60%; animation-delay: 0.45s; transform: rotate(-30deg); }
.confettiPiece:nth-child(11){ left: 66%; animation-delay: 0.50s; transform: rotate(18deg); }
.confettiPiece:nth-child(12){ left: 72%; animation-delay: 0.55s; transform: rotate(-14deg); }
.confettiPiece:nth-child(13){ left: 78%; animation-delay: 0.60s; transform: rotate(34deg); }
.confettiPiece:nth-child(14){ left: 84%; animation-delay: 0.65s; transform: rotate(-22deg); }
.confettiPiece:nth-child(15){ left: 90%; animation-delay: 0.70s; transform: rotate(10deg); }
.confettiPiece:nth-child(16){ left: 96%; animation-delay: 0.75s; transform: rotate(-12deg); }

.confettiPiece:nth-child(17){ left: 9%;  animation-delay: 0.08s; transform: rotate(28deg); }
.confettiPiece:nth-child(18){ left: 21%; animation-delay: 0.18s; transform: rotate(-26deg); }
.confettiPiece:nth-child(19){ left: 33%; animation-delay: 0.28s; transform: rotate(16deg); }
.confettiPiece:nth-child(20){ left: 45%; animation-delay: 0.38s; transform: rotate(-18deg); }
.confettiPiece:nth-child(21){ left: 57%; animation-delay: 0.48s; transform: rotate(30deg); }
.confettiPiece:nth-child(22){ left: 69%; animation-delay: 0.58s; transform: rotate(-12deg); }
.confettiPiece:nth-child(23){ left: 81%; animation-delay: 0.68s; transform: rotate(22deg); }
.confettiPiece:nth-child(24){ left: 93%; animation-delay: 0.78s; transform: rotate(-24deg); }

.confettiPiece:nth-child(3n){
  width: 8px;
  height: 12px;
  background: linear-gradient(135deg, rgba(245,158,11,0.95), rgba(255,255,255,0.55));
}
.confettiPiece:nth-child(4n){
  width: 12px;
  height: 8px;
  border-radius: 999px;
  background: linear-gradient(135deg, rgba(34,197,94,0.95), rgba(6,182,212,0.65));
}
.confettiPiece:nth-child(5n){
  width: 9px;
  height: 16px;
  background: linear-gradient(135deg, rgba(239,68,68,0.92), rgba(255,255,255,0.55));
}

@keyframes confettiFall{
  0%{ transform: translateY(-10px) rotate(0deg); opacity: 0.0; }
  12%{ opacity: 0.95; }
  100%{ transform: translateY(260px) rotate(360deg); opacity: 0; }
}

.bqResult > *{
  position: relative;
  z-index: 1;
}

.bqResult.isPerfect .confetti{
  animation: confettiFadeOut 2.0s ease-out forwards;
}

@keyframes confettiFadeOut{
  0%{ opacity: 1; }
  100%{ opacity: 0; }
}

/* ===== Dark Mode ===== */
:global(html[data-mk-theme="dark"]) .bqWrap,
:global(html.ion-palette-dark) .bqWrap,
:global(html.dark) .bqWrap,
:global(body.dark) .bqWrap,
:global(ion-app.dark) .bqWrap,
:global(ion-app.ion-palette-dark) .bqWrap{
  --ink: rgba(255,255,255,0.95);
  --sub: rgba(255,255,255,0.78);
  --card: rgba(10, 14, 22, 0.62);
  --card2: rgba(10, 14, 22, 0.46);
  --border: rgba(255,255,255,0.18);
  --border2: rgba(255,255,255,0.14);
}

:global(html[data-mk-theme="dark"]) .bqDate,
:global(html.ion-palette-dark) .bqDate,
:global(html.dark) .bqDate,
:global(body.dark) .bqDate,
:global(ion-app.dark) .bqDate,
:global(ion-app.ion-palette-dark) .bqDate{
  background:
    linear-gradient(135deg, rgba(124,58,237,0.22), rgba(6,182,212,0.18)),
    rgba(0,0,0,0.38);
  border-color: rgba(255,255,255,0.18);
  box-shadow: 0 18px 40px rgba(0,0,0,0.45);
}

:global(html[data-mk-theme="dark"]) .bqCard{
  border-color: rgba(255,255,255,0.16);
  box-shadow: 0 28px 70px rgba(0,0,0,0.50);
}

:global(html[data-mk-theme="dark"]) .startGate,
:global(html.ion-palette-dark) .startGate,
:global(html.dark) .startGate,
:global(body.dark) .startGate,
:global(ion-app.dark) .startGate,
:global(ion-app.ion-palette-dark) .startGate{
  background:
    radial-gradient(900px 280px at 10% 0%, rgba(124,58,237,0.20), transparent 60%),
    radial-gradient(900px 280px at 90% 10%, rgba(6,182,212,0.16), transparent 60%),
    rgba(0,0,0,0.34);
  border-color: rgba(255,255,255,0.16);
}

:global(html[data-mk-theme="dark"]) .mcqOpt,
:global(html.ion-palette-dark) .mcqOpt,
:global(html.dark) .mcqOpt,
:global(body.dark) .mcqOpt,
:global(ion-app.dark) .mcqOpt,
:global(ion-app.ion-palette-dark) .mcqOpt{
  background:
    radial-gradient(900px 280px at 10% 0%, rgba(6,182,212,0.16), transparent 60%),
    rgba(0,0,0,0.36);
  border-color: rgba(255,255,255,0.16);
  box-shadow: 0 22px 50px rgba(0,0,0,0.50);
}

:global(html[data-mk-theme="dark"]) .mcqAfter,
:global(html.ion-palette-dark) .mcqAfter,
:global(html.dark) .mcqAfter,
:global(body.dark) .mcqAfter,
:global(ion-app.dark) .mcqAfter,
:global(ion-app.ion-palette-dark) .mcqAfter{
  background: rgba(0,0,0,0.34);
  border-color: rgba(255,255,255,0.16);
  box-shadow: 0 22px 50px rgba(0,0,0,0.50);
}

:global(html[data-mk-theme="dark"]) .essayBox,
:global(html.ion-palette-dark) .essayBox,
:global(html.dark) .essayBox,
:global(body.dark) .essayBox,
:global(ion-app.dark) .essayBox,
:global(ion-app.ion-palette-dark) .essayBox{
  background:
    radial-gradient(900px 280px at 15% 0%, rgba(124,58,237,0.18), transparent 62%),
    rgba(0,0,0,0.36);
  border-color: rgba(255,255,255,0.18);
  box-shadow: 0 22px 50px rgba(0,0,0,0.50);
}

/* ===== Reduce Motion ===== */
@media (prefers-reduced-motion: reduce){
  .bqWrap::before,
  .bqWrap::after,
  .bqCard::before,
  .timerFill{
    animation: none !important;
  }
  .mcqOpt,
  .startBtn,
  .bqBtn,
  .essayBox{
    transition: none !important;
  }
  .timerWarn{
    animation: none !important;
  }
}

</style>

