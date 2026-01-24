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
                :disabled="submitted"
              />
              <span class="mcqOptTxt">{{ a.text }}</span>

              <!-- ✅/❌ marker -->
              <span v-if="submitted" class="mcqMark">
                <template v-if="a.key === q.correctKey">✅</template>
                <template v-else-if="mcqSelected[q.id] === a.key">❌</template>
              </span>
            </label>
          </div>

          <div v-if="submitted" class="mcqAfter">
            <div v-if="isMcqCorrect(q)" class="mcqExplain ok">✅ إجابة صحيحة</div>
            <div v-else class="mcqExplain bad">❌ إجابة خاطئة</div>

            <!-- ✅ show correct answer if 50% or 0% -->
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
          :disabled="submitted || !canSubmit"
          @click="submit"
        >
          ✅ تأكيد الإجابات
        </button>

        <div v-if="submitted" class="bqResult" :class="resultClass">
          <!-- Confetti only on 100% -->
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
import { computed, onMounted, ref, watch } from "vue"
import Papa from "papaparse"

type QuestionType = "mcq" | "ta2amol"

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
}>()

const quizTitle = computed(() => props.quizTitle || "مين فاكر؟")
const ta2amolTitle = computed(() => props.ta2amolTitle || "خلوة مع الكتاب المقدس")
const mcqCount = computed(() => Math.max(1, Number(props.mcqCount ?? 2) || 2))

// ✅ Google Sheets CSV
const SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRfqSbb9J3DUYpOVRPXj8QjyLN603lzrsmp3tQsnUH4-vAnqKH6ijNDayAcjV9YIrrbvBTf4VPh6ip5/pub?gid=0&single=true&output=csv"

// sounds (put files in public/sfx/)
const SFX_CLAP = "/sfx/clap.mp3"
const SFX_SUCCESS = "/sfx/success.mp3"
const SFX_FAIL = "/sfx/fail.mp3"

const loading = ref(false)
const error = ref(false)

const rows = ref<SheetRow[]>([])
const mcqList = ref<Mcq[]>([])
const ta2amol = ref<{ questionNumber: number; question: string } | null>(null)

// mcq state
const mcqSelected = ref<Record<string, "a" | "b" | "c" | "d" | undefined>>({})
const submitted = ref(false)
const score = ref(0)

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

  // ✅ all answers, de-duplicate
  const unique = Array.from(new Set([correctText, bText, cText, dText].map((s) => s.trim())))
  if (unique.length !== 4) return null

  // ✅ alphabetical sort to avoid guessing by position
  unique.sort(localeCompareSmart)

  const keyByIndex = ["a", "b", "c", "d"] as const
  const answers = unique.map((text, idx) => ({ key: keyByIndex[idx], text }))

  const correctIndex = unique.findIndex((x) => x === correctText.trim())
  const correctKey = keyByIndex[Math.max(0, correctIndex)]

  return {
    // ✅ stable id so attempts persist correctly
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

// ===== load sheet =====
async function loadFromSheet() {
  loading.value = true
  error.value = false

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

      // recompute score based on current correct keys
      let s = 0
      for (const q of mcqList.value) {
        if (mcqSelected.value[q.id] === q.correctKey) s++
      }
      score.value = s
      submitted.value = true
    } else {
      // no attempt yet => allow answering
      submitted.value = false
      score.value = 0
      mcqSelected.value = {}
    }
  } catch (e) {
    console.error(e)
    error.value = true
  } finally {
    loading.value = false
  }
}

function submit() {
  if (submitted.value) return
  if (!canSubmit.value) return

  let s = 0
  for (const q of mcqList.value) {
    if (mcqSelected.value[q.id] === q.correctKey) s++
  }

  score.value = s
  submitted.value = true

  // ✅ persist attempt
  const selectedClean: Record<string, "a" | "b" | "c" | "d"> = {}
  for (const q of mcqList.value) {
    const v = mcqSelected.value[q.id]
    if (v) selectedClean[q.id] = v
  }
  saveQuizAttempt({
    submitted: true,
    selected: selectedClean,
    score: s
  })

  // sounds
  if (s === mcqList.value.length) {
    playSfx(SFX_CLAP)
    setTimeout(() => playSfx(SFX_SUCCESS), 250)
  } else if (s >= 1) {
    playSfx(SFX_SUCCESS)
  } else {
    playSfx(SFX_FAIL)
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
  loadEssay()
  loadFromSheet()
})
</script>

<style scoped>
/* ===== Premium Quiz Section (Glass + Glow) ===== */

.bqWrap{
  --bq-accent: #1fb6aa;
  --bq-accent2: #38f9e4;
  --bq-ink: rgba(11, 43, 64, 0.95);
  --bq-sub: rgba(11, 43, 64, 0.72);
  --bq-border: rgba(11, 43, 64, 0.10);
  --bq-softBorder: rgba(11, 43, 64, 0.08);
  --bq-shadow: 0 14px 30px rgba(0,0,0,0.10);
  --bq-shadow-strong: 0 22px 50px rgba(0,0,0,0.18);
  --bq-radius: 22px;

  margin-top: 14px;
  display:flex;
  flex-direction:column;
  gap: 12px;

  color: var(--bq-ink);
  border-radius: var(--bq-radius);

  position: relative;
  overflow: visible;

}
.bqWrap *{
font-family:"Noto Kufi Arabic", system-ui, sans-serif;
}
.bqWrap::before{
  content:"";
  position:absolute;
  inset:-8px;
  z-index:-1;
  border-radius: calc(var(--bq-radius) + 10px);
  background:
    radial-gradient(900px 300px at 20% 0%, rgba(31,182,170,0.22), transparent 60%),
    radial-gradient(900px 320px at 80% 15%, rgba(56,249,228,0.18), transparent 62%),
    radial-gradient(900px 320px at 50% 120%, rgba(31,182,170,0.12), transparent 58%);
  filter: blur(2px);
  opacity: 0.95;
  animation: bqGlow 10s ease-in-out infinite alternate;
}
@keyframes bqGlow{
  from{ transform: translateY(0px); opacity: .85; }
  to{ transform: translateY(-3px); opacity: 1; }
}

.bqHeader{
  display:flex;
  align-items:center;
  justify-content: space-between;
  gap: 10px;
  padding: 0 4px;
}

.bqTitle{
  font-weight: 1000;
  font-size: 18px;
  letter-spacing: 0.1px;
  text-shadow: 0 1px 0 rgba(255,255,255,0.45);
}

.bqDate{
  font-weight: 1000;
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid var(--bq-border);
  background:
    radial-gradient(600px 180px at 20% 0%, rgba(31,182,170,0.16), transparent 60%),
    rgba(255,255,255,0.55);
  box-shadow: 0 10px 18px rgba(0,0,0,0.06);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  color: var(--bq-sub);
}

.bqHint{
  text-align:center;
  font-weight: 900;
  opacity: 0.80;
  padding: 10px 0;
  color: var(--bq-sub);
}
.bqError{
  opacity: 0.95;
  color: rgba(190, 40, 40, 0.95);
}

.bqCard{
  border: 1px solid var(--bq-border);
  border-radius: var(--bq-radius);
  padding: 14px;
  background:
    radial-gradient(900px 280px at 12% 0%, rgba(31,182,170,0.14), transparent 60%),
    linear-gradient(180deg, rgba(255,255,255,0.82), rgba(255,255,255,0.60));
  box-shadow: var(--bq-shadow);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  position: relative;
  overflow:hidden;
}

.bqCard::after{
  content:"";
  position:absolute;
  inset: 0;
  pointer-events:none;
  background: linear-gradient(135deg, rgba(255,255,255,0.55), transparent 35%, transparent 65%, rgba(255,255,255,0.35));
  opacity: 0.7;
}

.bqCardTitle{
  font-weight: 1000;
  text-align:center;
  margin-bottom: 10px;
  font-size: 16px;
  color: var(--bq-ink);
  position: relative;
  z-index: 1;
}

.mcqBlock{
  border-top: 1px solid var(--bq-softBorder);
  padding-top: 12px;
  margin-top: 12px;
  position: relative;
  z-index: 1;
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
  font-weight: 950;
  line-height: 1.9;
  margin-bottom: 10px;
}

.mcqNum{
  flex: 0 0 auto;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid var(--bq-border);
  background: rgba(0,0,0,0.03);
  font-size: 12px;
  font-weight: 1000;
}

.mcqTxt{
  flex:1;
  font-size: 15px;
  color: var(--bq-ink);
}

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
  border-radius: 16px;
  border: 1px solid var(--bq-border);
  background:
    radial-gradient(800px 260px at 10% 0%, rgba(31,182,170,0.10), transparent 55%),
    rgba(255,255,255,0.55);
  cursor:pointer;
  user-select:none;
  position: relative;
  transition: transform .14s ease, box-shadow .14s ease, border-color .14s ease, background .14s ease;
  box-shadow: 0 10px 18px rgba(0,0,0,0.06);
}

.mcqOpt:hover{
  transform: translateY(-1px);
  box-shadow: 0 16px 26px rgba(0,0,0,0.10);
}

.mcqOpt:active{
  transform: translateY(0px);
  box-shadow: 0 12px 20px rgba(0,0,0,0.08);
}

.mcqOpt input{
  width: 18px;
  height: 18px;
  accent-color: var(--bq-accent);
  transform: translateY(1px);
}

.mcqOptTxt{
  font-weight: 900;
  line-height: 1.8;
  flex: 1;
  color: var(--bq-ink);
}

.mcqMark{
  font-weight: 1000;
  font-size: 16px;
  filter: drop-shadow(0 6px 12px rgba(0,0,0,0.10));
}

.mcqOpt.isChosen{
  border-color: rgba(31,182,170,0.35);
  background:
    radial-gradient(900px 280px at 10% 0%, rgba(31,182,170,0.16), transparent 55%),
    rgba(255,255,255,0.75);
}

.mcqOpt.isRight{
  border-color: rgba(46, 204, 113, 0.55);
  background:
    radial-gradient(900px 280px at 10% 0%, rgba(46,204,113,0.18), transparent 58%),
    rgba(255,255,255,0.78);
  box-shadow: 0 18px 32px rgba(46,204,113,0.12);
}
.mcqOpt.isWrong{
  border-color: rgba(231, 76, 60, 0.55);
  background:
    radial-gradient(900px 280px at 10% 0%, rgba(231,76,60,0.18), transparent 58%),
    rgba(255,255,255,0.78);
  box-shadow: 0 18px 32px rgba(231,76,60,0.12);
}

.mcqAfter{
  margin-top: 10px;
  padding: 12px 12px;
  border-radius: 16px;
  border: 1px solid var(--bq-border);
  background: rgba(255,255,255,0.55);
  box-shadow: 0 14px 22px rgba(0,0,0,0.08);
}

.mcqExplain{
  font-weight: 1000;
  text-align:center;
  letter-spacing: 0.1px;
}
.mcqExplain.ok{
  color: rgba(18, 132, 77, 0.95);
}
.mcqExplain.bad{
  color: rgba(175, 44, 44, 0.95);
}

.mcqCorrectReveal{
  margin-top: 8px;
  text-align: center;
  font-weight: 950;
  color: var(--bq-ink);
  padding: 8px 10px;
  border-radius: 14px;
  border: 1px dashed rgba(31,182,170,0.35);
  background:
    radial-gradient(900px 280px at 20% 0%, rgba(31,182,170,0.10), transparent 60%),
    rgba(255,255,255,0.55);
}

.bqBtn{
  width:100%;
  margin-top: 14px;
  padding: 12px 14px;
  border-radius: 18px;
  border: 1px solid rgba(31,182,170,0.35);
  background:
    radial-gradient(900px 280px at 20% 0%, rgba(56,249,228,0.20), transparent 55%),
    linear-gradient(135deg, rgba(24,42,68,0.95), rgba(16,27,47,0.90));
  color: #fff;
  font-weight: 1000;
  cursor:pointer;
  box-shadow: var(--bq-shadow-strong);
  transition: transform .14s ease, box-shadow .14s ease, opacity .14s ease;
  position: relative;
  overflow:hidden;
}

.bqBtn::before{
  content:"";
  position:absolute;
  inset:-40px;
  background: radial-gradient(circle at 20% 20%, rgba(255,255,255,0.35), transparent 45%);
  transform: translateX(-20%);
  opacity: 0;
  transition: opacity .18s ease, transform .25s ease;
}

.bqBtn:hover{
  transform: translateY(-1px);
  box-shadow: 0 26px 54px rgba(0,0,0,0.20);
}

.bqBtn:hover::before{
  opacity: 1;
  transform: translateX(0%);
}

.bqBtn:active{
  transform: translateY(0px);
  box-shadow: 0 18px 40px rgba(0,0,0,0.18);
}

.bqBtn:disabled{
  opacity: 0.55;
  cursor: not-allowed;
  transform: none;
  box-shadow: var(--bq-shadow);
}

.bqResult{
  margin-top: 12px;
  border-radius: 18px;
  padding: 14px 12px;
  text-align:center;
  font-weight: 1000;
  border: 1px solid var(--bq-border);
  background: rgba(255,255,255,0.60);
  box-shadow: 0 18px 34px rgba(0,0,0,0.10);
  position: relative;
  overflow: hidden;
}

.bqResult.isPerfect{
  border-color: rgba(46,204,113,0.45);
  background:
    radial-gradient(900px 280px at 20% 0%, rgba(46,204,113,0.18), transparent 60%),
    rgba(255,255,255,0.70);
}
.bqResult.isHalf{
  border-color: rgba(241,196,15,0.50);
  background:
    radial-gradient(900px 280px at 20% 0%, rgba(241,196,15,0.20), transparent 60%),
    rgba(255,255,255,0.70);
}
.bqResult.isFail{
  border-color: rgba(231,76,60,0.50);
  background:
    radial-gradient(900px 280px at 20% 0%, rgba(231,76,60,0.18), transparent 60%),
    rgba(255,255,255,0.70);
}

.essayQ{
  font-weight: 1000;
  line-height: 1.9;
  margin-bottom: 10px;
  text-align: right;
  color: var(--bq-ink);
}

.essayBox{
  width:100%;
  min-height: 120px;
  resize: vertical;
  padding: 12px 12px;
  border-radius: 18px;
  border: 1px dashed rgba(31,182,170,0.35);
  background:
    radial-gradient(900px 280px at 15% 0%, rgba(31,182,170,0.10), transparent 62%),
    rgba(255,255,255,0.55);
  outline: none;
  font-weight: 850;
  line-height: 1.9;
  color: var(--bq-ink);
  box-shadow: 0 14px 22px rgba(0,0,0,0.08);
  transition: border-color .14s ease, box-shadow .14s ease, transform .14s ease;
}

.essayBox:focus{
  border-color: rgba(31,182,170,0.55);
  box-shadow: 0 18px 34px rgba(31,182,170,0.14);
  transform: translateY(-1px);
}

.essaySaved{
  margin-top: 10px;
  font-weight: 1000;
  opacity: 0.85;
  text-align: center;
  color: rgba(18, 132, 77, 0.95);
}

/* Dark mode support */
:global(html[data-mk-theme="dark"]) .bqWrap,
:global(html.ion-palette-dark) .bqWrap,
:global(html.dark) .bqWrap,
:global(body.dark) .bqWrap,
:global(ion-app.dark) .bqWrap,
:global(ion-app.ion-palette-dark) .bqWrap{
  --bq-ink: rgba(255,255,255,0.95);
  --bq-sub: rgba(255,255,255,0.75);
  --bq-border: rgba(255,255,255,0.14);
  --bq-softBorder: rgba(255,255,255,0.10);
}

:global(html[data-mk-theme="dark"]) .bqDate,
:global(html.ion-palette-dark) .bqDate,
:global(html.dark) .bqDate,
:global(body.dark) .bqDate,
:global(ion-app.dark) .bqDate,
:global(ion-app.ion-palette-dark) .bqDate{
  background:
    radial-gradient(700px 220px at 20% 0%, rgba(31,182,170,0.14), transparent 60%),
    rgba(0,0,0,0.35);
  box-shadow: 0 14px 28px rgba(0,0,0,0.35);
}

:global(html[data-mk-theme="dark"]) .bqCard,
:global(html.ion-palette-dark) .bqCard,
:global(html.dark) .bqCard,
:global(body.dark) .bqCard,
:global(ion-app.dark) .bqCard,
:global(ion-app.ion-palette-dark) .bqCard{
  background:
    radial-gradient(900px 280px at 12% 0%, rgba(31,182,170,0.16), transparent 60%),
    linear-gradient(180deg, rgba(12,18,26,0.72), rgba(12,18,26,0.52));
  box-shadow: 0 22px 44px rgba(0,0,0,0.45);
}

:global(html[data-mk-theme="dark"]) .mcqOpt,
:global(html.ion-palette-dark) .mcqOpt,
:global(html.dark) .mcqOpt,
:global(body.dark) .mcqOpt,
:global(ion-app.dark) .mcqOpt,
:global(ion-app.ion-palette-dark) .mcqOpt{
  background:
    radial-gradient(900px 280px at 10% 0%, rgba(31,182,170,0.14), transparent 58%),
    rgba(0,0,0,0.35);
  box-shadow: 0 18px 34px rgba(0,0,0,0.45);
}

:global(html[data-mk-theme="dark"]) .mcqAfter,
:global(html.ion-palette-dark) .mcqAfter,
:global(html.dark) .mcqAfter,
:global(body.dark) .mcqAfter,
:global(ion-app.dark) .mcqAfter,
:global(ion-app.ion-palette-dark) .mcqAfter{
  background: rgba(0,0,0,0.32);
  box-shadow: 0 18px 34px rgba(0,0,0,0.45);
}

:global(html[data-mk-theme="dark"]) .essayBox,
:global(html.ion-palette-dark) .essayBox,
:global(html.dark) .essayBox,
:global(body.dark) .essayBox,
:global(ion-app.dark) .essayBox,
:global(ion-app.ion-palette-dark) .essayBox{
  background:
    radial-gradient(900px 280px at 15% 0%, rgba(31,182,170,0.14), transparent 62%),
    rgba(0,0,0,0.32);
  box-shadow: 0 18px 34px rgba(0,0,0,0.45);
}

/* Reduce motion */
@media (prefers-reduced-motion: reduce){
  .bqWrap::before{ animation: none; }
  .mcqOpt, .bqBtn, .essayBox{ transition: none; }
}

/* ===== Confetti ===== */
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
  background: linear-gradient(135deg, rgba(31,182,170,0.95), rgba(56,249,228,0.85));
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
  background: linear-gradient(135deg, rgba(241,196,15,0.95), rgba(255,255,255,0.55));
}
.confettiPiece:nth-child(4n){
  width: 12px;
  height: 8px;
  border-radius: 999px;
  background: linear-gradient(135deg, rgba(46,204,113,0.95), rgba(56,249,228,0.65));
}
.confettiPiece:nth-child(5n){
  width: 9px;
  height: 16px;
  background: linear-gradient(135deg, rgba(231,76,60,0.92), rgba(255,255,255,0.55));
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
</style>
