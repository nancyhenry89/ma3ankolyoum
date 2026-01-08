<!-- CopticSection.vue -->
<template>
  <section class="coptic" :dir="sectionDir" :lang="sectionLang">
    <!-- Hidden audio element (reliable on iOS/Android WebView) -->
    <audio ref="audioRef" preload="none" playsinline></audio>

    <!-- Loading -->
    <div v-if="isLoading" class="coptic-body">
      <div class="coptic-title skeleton-box"></div>
      <div class="skeleton-line"></div>
      <div class="skeleton-line short"></div>
    </div>

    <!-- Empty -->
    <div v-else-if="!items.length" class="coptic-empty">
      {{ ui.empty }}
    </div>

    <!-- List -->
    <div v-else v-show="isOpen" class="coptic-body">
      <div class="coptic-title">{{ ui.title }}</div>

      <div class="coptic-list">
        <button
          v-for="(it, idx) in items"
          :key="idx"
          type="button"
          class="coptic-item"
          :disabled="!it.audioUrl"
          @click="it.audioUrl && play(it)"
          :class="{ noAudio: !it.audioUrl }"
          :aria-disabled="!it.audioUrl"
        >
          <div class="coptic-row">
            <IonIcon
              :icon="volumeHighOutline"
              class="volume-icon mkNoCapture"
              :class="{ dimIcon: !it.audioUrl }"
            />

            <span class="coptic-word">{{ it.coptic }}</span>
            <span class="eq">=</span>
            <span class="meaning-word">{{ it.meaning }}</span>
          </div>
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, watch, computed, onBeforeUnmount } from 'vue'
import { volumeHighOutline } from 'ionicons/icons'
import { Capacitor } from '@capacitor/core'
import { IonIcon } from '@ionic/vue'

type CopticItem = {
  coptic: string
  meaning: string
  audioUrl: string
  audioAltUrl?: string
}

const props = defineProps<{
  dateISO: string
  contentBase: string
  lang: 'ar' | 'en'
}>()

const isArabic = computed(() => props.lang !== 'en')

const ui = computed(() => {
  return isArabic.value
    ? { title: 'لغتنا القبطية', empty: 'لا توجد كلمات قبطية لهذا اليوم.' }
    : { title: 'Our Coptic Language', empty: 'No Coptic words for today.' }
})

const sectionDir = computed(() => (isArabic.value ? 'rtl' : 'ltr'))
const sectionLang = computed(() => (isArabic.value ? 'ar' : 'en'))

/** ✅ Coptic sheet columns:
 * date_iso, coptic_word, arabic_word, english_word, coptic_audio
 */
const COPTIC_SHEET_CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vTljfbjiBccVFJpqzxoOfOe4f_zjS0MVztleuJJ0GZtNfL7aqEnDJ3gI-a5PP0x8vhMRtiQYdQYsb3E/pub?gid=0&single=true&output=csv'

/**
 * IMPORTANT:
 * - On web, props.contentBase is correct (it already ends with /content).
 * - On native (Capacitor), we force GitHub Pages /content base.
 */
const GITHUB_CONTENT_BASE = 'https://nancyhenry89.github.io/ma3ankolyoum/content'

const COPTIC_AUDIO_BASE = computed(() => {
  const base = Capacitor.isNativePlatform() ? GITHUB_CONTENT_BASE : props.contentBase
  return `${String(base).replace(/\/$/, '')}/audio/coptic`
})

const isLoading = ref(false)
const items = ref<CopticItem[]>([])
const isOpen = ref(true)

/* =========================
   AUDIO (DOM element)
========================= */
const audioRef = ref<HTMLAudioElement | null>(null)
const currentSrc = ref('')
const isPlaying = ref(false)

function bindAudioEvents(a: HTMLAudioElement) {
  a.addEventListener('ended', () => (isPlaying.value = false))
  a.addEventListener('pause', () => (isPlaying.value = false))
  a.addEventListener('play', () => (isPlaying.value = true))
}

watch(
  audioRef,
  a => {
    if (!a) return
    bindAudioEvents(a)
  },
  { immediate: true }
)

async function tryPlayUrl(a: HTMLAudioElement, url: string) {
  if (!url) return false
  try {
    if (currentSrc.value !== url) {
      a.pause()
      a.currentTime = 0
      a.src = url
      a.load()
      currentSrc.value = url
    } else {
      a.currentTime = 0
    }
    await a.play()
    return true
  } catch {
    return false
  }
}

async function play(it: CopticItem) {
  const a = audioRef.value
  if (!a) return
  if (!it.audioUrl) return

  // ✅ try primary, then fallback
  const ok1 = await tryPlayUrl(a, it.audioUrl)
  if (ok1) return

  const ok2 = it.audioAltUrl ? await tryPlayUrl(a, it.audioAltUrl) : false
  if (!ok2) {
    isPlaying.value = false
    console.warn('Coptic audio play failed', {
      primary: it.audioUrl,
      alt: it.audioAltUrl
    })
  }
}

onBeforeUnmount(() => {
  const a = audioRef.value
  if (!a) return
  a.pause()
  a.removeAttribute('src')
  a.load()
})
async function urlExists(url: string) {
  if (!url) return false
  try {
    const res = await fetch(url, { method: 'HEAD', cache: 'no-store' })
    return res.ok
  } catch {
    return false
  }
}

/** يرجّع رابط واحد صحيح (primary لو شغال وإلا alt) */
async function pickWorkingAudioUrl(primary: string, alt?: string) {
  if (await urlExists(primary)) return primary
  if (alt && (await urlExists(alt))) return alt
  return '' // ولا واحد شغال
}

/* =========================
   CSV helpers
========================= */
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
    const v = row?.[kk]
    if (v !== undefined && v !== null && String(v).trim() !== '') return v
  }
  return ''
}

function normalizeAudioNameKeep(val: string) {
  let v = String(val || '').trim()
  if (!v) return ''
  // remove spaces
  v = v.replace(/\s+/g, '')
  return v
}

/**
 * ✅ Build BOTH candidates:
 * - primary: whatever sheet says (but we encode)
 * - alt: if ends with .mp3 => try .mp3.mp3 (fix your current repo mistake)
 *        if ends with .mp3.mp3 => try single .mp3
 */
function resolveAudioUrls(nameRaw: string) {
  const name = normalizeAudioNameKeep(nameRaw)
  if (!name) return { primary: '', alt: '' }

  // absolute URL
  if (/^https?:\/\//i.test(name)) {
    return { primary: name, alt: '' }
  }

  const primary = `${COPTIC_AUDIO_BASE.value}/${encodeURIComponent(name)}`
  let alt = ''

  if (/\.mp3$/i.test(name) && !/\.mp3\.mp3$/i.test(name)) {
    alt = `${COPTIC_AUDIO_BASE.value}/${encodeURIComponent(name + '.mp3')}`
  } else if (/\.mp3\.mp3$/i.test(name)) {
    const fixed = name.replace(/\.mp3\.mp3$/i, '.mp3')
    alt = `${COPTIC_AUDIO_BASE.value}/${encodeURIComponent(fixed)}`
  }

  return { primary, alt }
}

function splitPipe(v: any) {
  return String(v || '')
    .split('|')
    .map(s => s.trim())
    .filter(Boolean)
}
// ✅ Greek -> Coptic Unicode (for display so Avva font renders)
const GREEK_TO_COPTIC: Record<string, string> = {
  'α': 'ⲁ','β': 'ⲃ','γ': 'ⲅ','δ': 'ⲇ','ε': 'ⲉ','ζ': 'ⲍ','η': 'ⲏ','θ': 'ⲑ',
  'ι': 'ⲓ','κ': 'ⲕ','λ': 'ⲗ','μ': 'ⲙ','ν': 'ⲛ','ξ': 'ⲝ','ο': 'ⲟ','π': 'ⲡ',
  'ρ': 'ⲣ','σ': 'ⲥ','ς': 'ⲥ','τ': 'ⲧ','υ': 'ⲩ','φ': 'ⲫ','χ': 'ⲭ','ψ': 'ⲯ','ω': 'ⲱ',
  'Α': 'Ⲁ','Β': 'Ⲃ','Γ': 'Ⲅ','Δ': 'Ⲇ','Ε': 'Ⲉ','Ζ': 'Ⲍ','Η': 'Ⲏ','Θ': 'Ⲑ',
  'Ι': 'Ⲓ','Κ': 'Ⲕ','Λ': 'Ⲗ','Μ': 'Ⲙ','Ν': 'Ⲛ','Ξ': 'Ⲝ','Ο': 'Ⲟ','Π': 'Ⲡ',
  'Ρ': 'Ⲣ','Σ': 'Ⲥ','Τ': 'Ⲧ','Υ': 'Ⲩ','Φ': 'Ⲫ','Χ': 'Ⲭ','Ψ': 'Ⲯ','Ω': 'Ⲱ'
}

function toCopticUnicode(input: string) {
  return String(input || '').replace(/[Α-Ωα-ως]/g, ch => GREEK_TO_COPTIC[ch] || ch)
}

async function fetchCopticByDate(targetISO: string) {
  isLoading.value = true
  items.value = []

  try {
    const res = await fetch(COPTIC_SHEET_CSV_URL, { cache: 'no-store' })
    const csv = await res.text()

    const Papa = (await import('papaparse')).default
    const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true })

    const rows = (parsed.data as any[])
      .map(r => normalizeKeys(r))
      .filter(r => r.date_iso)

    const row = rows.find(r => String(r.date_iso).trim().substring(0, 10) === targetISO)

    if (!row) {
      items.value = []
      return
    }

    const copticRaw = pick(row, 'coptic_word')
    const arabicRaw = pick(row, 'arabic_word')
    const englishRaw = pick(row, 'english_word')
    const audioRaw = pick(row, 'coptic_audio')

    const copticList = splitPipe(copticRaw)
    const meaningList = splitPipe(isArabic.value ? arabicRaw : englishRaw)
    const audioList = splitPipe(audioRaw)

    const maxLen = Math.max(copticList.length, meaningList.length, audioList.length)

    const out: CopticItem[] = []
    for (let i = 0; i < maxLen; i++) {
      const coptic = toCopticUnicode(copticList[i] || '')
      const meaning = meaningList[i] || ''

      const { primary, alt } = resolveAudioUrls(audioList[i] || '')

const working = await pickWorkingAudioUrl(primary, alt)
out.push({
  coptic,
  meaning,
  audioUrl: working,       // ✅ رابط واحد مضمون
  audioAltUrl: undefined
})

    }

    items.value = out
  } finally {
    isLoading.value = false
  }
}

/* =========================
   Watchers: date + lang
========================= */
watch(
  () => [props.dateISO, props.lang] as const,
  ([iso]) => {
    const target = String(iso || '').substring(0, 10)
    if (!target) return
    fetchCopticByDate(target).catch(console.error)
  },
  { immediate: true }
)
</script>

<style scoped>
/* نفس جراديانت الـ clickable اللي بتحبيه */
.clickableHead{
  width: 100%;
  border: 0;
  border-radius: 16px;
  padding: 14px 14px;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:10px;
  cursor:pointer;
  color:#fff;
  font-family: "Noto Kufi Arabic", system-ui, sans-serif;
  font-size: 20px;
  font-weight: 900;

  background:
    radial-gradient(600px 200px at 20% 0%, rgba(32,178,170,0.35), transparent 60%),
    linear-gradient(135deg, var(--mk-dark), rgba(16,27,47,0.90));
  box-shadow: var(--mk-shadow-strong);
  border: 1px solid rgba(255,255,255,0.16);
}
.coptic-title{
  color: #20b2aa;
  font-weight: 900;
  border-radius: 14px;
  padding: 8px 18px;
  font-size: 20px;
  display: inline-block;
  margin-bottom: 12px;
  font-family:"Noto Kufi Arabic", system-ui, sans-serif;
  text-align:center;
  width:100%
}
.chev.open{ transform: rotate(180deg); }

.coptic{
  margin-top: 14px;
}
.volume-icon {
  font-size: 24px;
}
.coptic-body{
  margin-top: 10px;
  background: radial-gradient(600px 200px at 20% 0%, rgba(32,178,170,0.35), transparent 60%),
    linear-gradient(135deg, var(--mk-dark), rgba(16,27,47,0.90));
  border-radius: 18px;
  border: 1px solid var(--mk-border);
  box-shadow: var(--mk-shadow);
  padding: 14px;
  position:relative
}

.home.theme-dark .coptic-body{
  background: rgba(255,255,255,0.06);
}

.coptic-hint{
  margin: 0 0 10px;
  font-weight: 800;
  opacity: .85;
  text-align: center;
}

.coptic-list{
  display: grid;
  gap: 10px;
}

.coptic-item{
  width: 100%;
  text-align: center;
  border-radius: 16px;
  background: transparent;
  cursor: pointer;
}

.coptic-row{
  display:flex;
  align-items:center;
  justify-content:center;
  gap: 10px;
  flex-wrap: wrap;
  color:#fff
}
.coptic-body:before {
  content: "ⲁ";
  position: absolute;
  top: 12px;
  right: 14px;
  font-size: 90px;
  opacity: 0.10;
  color: rgb(255 255 255 / 85%);
  font-family: "Amiri", serif;
}
.coptic-word{
  font-size: 22px;
  font-weight: 900;
}

.eq{
  font-weight: 900;
  opacity:.7;
}

.meaning-word{
  font-size: 20px;
  font-weight: 900;
  font-family: "Amiri", serif;
}

.sub{
  margin-top: 6px;
  font-weight: 900;
  color: var(--mk-danger);
}
.coptic-empty{
  margin-top: 14px;
  padding: 16px;
  border-radius: 18px;
  border: 1px dashed var(--mk-border);
  text-align: center;
  font-weight: 900;
  opacity: 0.75;
  background: rgba(255,255,255,0.35);
  color:black;
}

.home.theme-dark .coptic-empty{
  background: rgba(255,255,255,0.06);
  color:#a29b9b
}

.dimIcon{
  opacity: 0.35;
}

.coptic-item.noAudio{
  cursor: default;
  opacity: 0.75;
}

.coptic-item:disabled{
  pointer-events: none;
}

/* optional skeleton helpers لو بتستخدميهم */
.skeleton-box{
  height: 28px;
  width: 60%;
  margin: 0 auto 10px;
  border-radius: 12px;
  background: linear-gradient(90deg, rgba(0,0,0,0.06), rgba(0,0,0,0.10), rgba(0,0,0,0.06));
}
/* ✅ Load Avva font (GitHub Pages base is /ma3ankolyoum/) */
@font-face{
  font-family: "AvvaShenouda";
  src: url("/ma3ankolyoum/fonts/Avva_Shenouda.ttf") format("truetype");
  font-display: swap;
}

.coptic-word{
  font-family: "Antinoou", serif !important;
  font-size: 24px;     /* عدّلي حسب ذوقك */
  font-weight: 400;   /* Antinoou شكله أحلى regular */
  letter-spacing: 0.02em;
}

</style>
