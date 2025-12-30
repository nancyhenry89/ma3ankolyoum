<template>
  <!-- MAIN -->
  <section class="coptic" :dir="sectionDir" :lang="sectionLang">
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
            <ion-icon
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

type CopticItem = {
  coptic: string
  meaning: string
  audioUrl: string
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

const COPTIC_AUDIO_BASE = `${props.contentBase}/audio/coptic`

const isLoading = ref(false)
const items = ref<CopticItem[]>([])
const isOpen = ref(true)

/* =========================
   AUDIO (single element)
========================= */
const audioEl = new Audio()
audioEl.preload = 'none'

const currentSrc = ref('')
const isPlaying = ref(false)

audioEl.addEventListener('ended', () => (isPlaying.value = false))
audioEl.addEventListener('pause', () => (isPlaying.value = false))
audioEl.addEventListener('play', () => (isPlaying.value = true))

async function play(it: CopticItem) {
  if (!it.audioUrl) return
  try {
    if (currentSrc.value !== it.audioUrl) {
      audioEl.pause()
      audioEl.currentTime = 0
      audioEl.src = it.audioUrl
      currentSrc.value = it.audioUrl
    } else {
      audioEl.currentTime = 0
    }
    await audioEl.play()
  } catch (e) {
    isPlaying.value = false
    console.warn('Audio play failed', e)
  }
}

onBeforeUnmount(() => {
  audioEl.pause()
  audioEl.src = ''
})

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

function resolveAudioUrl(v: string) {
  const val = String(v || '').trim()
  if (!val) return ''
  if (/^https?:\/\//i.test(val)) return val
  return `${COPTIC_AUDIO_BASE}/${encodeURIComponent(val)}`
}

function splitPipe(v: any) {
  return String(v || '')
    .split('|')
    .map(s => s.trim())
    .filter(Boolean)
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
      const coptic = copticList[i] || ''
      const meaning = meaningList[i] || ''
      const audioUrl = resolveAudioUrl(audioList[i] || '')

      if (!coptic && !meaning) continue
      out.push({ coptic, meaning, audioUrl })
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
.coptic-title{    color: #20b2aa;
    font-weight: 900;
    border-radius: 14px;
    padding: 8px 18px;
    font-size: 20px;
    display: inline-block;
    margin-bottom: 12px;
    font-family:"Noto Kufi Arabic", system-ui, sans-serif;

  text-align:center;
width:100%}
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

  </style>
  