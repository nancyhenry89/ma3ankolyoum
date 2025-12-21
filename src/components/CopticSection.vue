<template>
  <section class="coptic" v-if="!isLoading">
    <!-- Empty message -->
    <div v-if="!items.length" class="coptic-empty">
      لا توجد كلمات قبطية لهذا اليوم.
    </div>

    <!-- List -->
    <div v-else v-show="isOpen" class="coptic-body">
      <div class="coptic-title">لغتنا القبطية</div>

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
              class="volume-icon"
              :class="{ dimIcon: !it.audioUrl }"
            />

            <span class="coptic-word">{{ it.coptic }}</span>
            <span class="eq">=</span>
            <span class="arabic-word">{{ it.arabic }}</span>
          </div>


        </button>
      </div>
    </div>
  </section>

  <!-- Loading skeleton (اختياري لو تحبي) -->
  <section v-else class="coptic">
    <div class="coptic-body">
      <div class="coptic-title skeleton-box"></div>
      <div class="skeleton-line"></div>
      <div class="skeleton-line short"></div>
    </div>
  </section>
</template>

  <script setup lang="ts">
  import { ref, watch } from 'vue'
  import { volumeHighOutline } from 'ionicons/icons'

  type CopticItem = {
    coptic: string
    arabic: string
    audioUrl: string
  }
  
  const props = defineProps<{
    dateISO: string
    contentBase: string // نفس CONTENT_BASE عندك
  }>()
  
  /** ✅ شيت القبطي (CSV published) */
  const COPTIC_SHEET_CSV_URL =
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vTljfbjiBccVFJpqzxoOfOe4f_zjS0MVztleuJJ0GZtNfL7aqEnDJ3gI-a5PP0x8vhMRtiQYdQYsb3E/pub?gid=0&single=true&output=csv'
  
  /** لو الصوت متخزن على GitHub بنفس content structure */
  const COPTIC_AUDIO_BASE = `${props.contentBase}/audio/coptic`
  
  const isLoading = ref(false)
  const items = ref<CopticItem[]>([])
    import { onBeforeUnmount } from 'vue'

const audioEl = new Audio()
audioEl.preload = 'none'

const currentSrc = ref('')
const isPlaying = ref(false)

audioEl.addEventListener('ended', () => {
  isPlaying.value = false
})

audioEl.addEventListener('pause', () => {
  isPlaying.value = false
})

audioEl.addEventListener('play', () => {
  isPlaying.value = true
})

async function play(it: CopticItem) {
  if (!it.audioUrl) return

  try {
    if (currentSrc.value !== it.audioUrl) {
      audioEl.pause()
      audioEl.currentTime = 0
      audioEl.src = it.audioUrl
      currentSrc.value = it.audioUrl
    } else {
      // نفس الصوت → نعيده من الأول
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

  const isOpen = ref(true)

  
  function toggleOpen() {
    isOpen.value = !isOpen.value
  }
  
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
      if (row[kk] !== undefined && row[kk] !== null && String(row[kk]).trim() !== '') {
        return row[kk]
      }
    }
    return ''
  }
  
  function resolveAudioUrl(v: string) {
    const val = String(v || '').trim()
    if (!val) return ''
    if (/^https?:\/\//i.test(val)) return val
    // لو في الشيت بتكتبي اسم الملف بس: example.mp3
    return `${COPTIC_AUDIO_BASE}/${encodeURIComponent(val)}`
  }
  
  async function fetchCopticByDate(targetISO: string) {
    isLoading.value = true
    items.value = []
  
    try {
      const res = await fetch(COPTIC_SHEET_CSV_URL, { cache: 'no-store' })
      const csv = await res.text()
  
      // PapaParse موجود عندك بالفعل في المشروع، بس عشان الكمبوننت مستقل:
      // لو مش عايزة تعملي import تاني، تقدري تمرري البيانات من الهوم.
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
  
      /**
       * دعم حالتين:
       * 1) صف واحد فيه قوائم مفصولة بـ |
       *    coptic_word: "ⲁ|ⲃ"
       *    arabic_word: "ا|ب"
       *    audio: "a.mp3|b.mp3"
       *
       * 2) صف واحد لكلمة واحدة فقط (اختياري)
       */
      const copticRaw = pick(row, 'coptic_word', 'coptic', 'coptic_words')
      const arabicRaw = pick(row, 'arabic_word', 'arabic', 'arabic_words')
      const audioRaw  = pick(row, 'audio', 'audio_file', 'audio_name', 'coptic_audio')
  
      const copticList = String(copticRaw || '').split('|').map(s => s.trim()).filter(Boolean)
      const arabicList = String(arabicRaw || '').split('|').map(s => s.trim()).filter(Boolean)
      const audioList  = String(audioRaw || '').split('|').map(s => s.trim()).filter(Boolean)
  
      // لو كلمة واحدة بس ومفيش |
      const maxLen = Math.max(copticList.length, arabicList.length, audioList.length)
  
      const out: CopticItem[] = []
      for (let i = 0; i < maxLen; i++) {
        const coptic = copticList[i] || ''
        const arabic = arabicList[i] || ''
        const audioUrl = resolveAudioUrl(audioList[i] || '')
  
        if (!coptic && !arabic) continue
        out.push({ coptic, arabic, audioUrl })
      }
  
      items.value = out
    } finally {
      isLoading.value = false
    }
  }
  
  
  watch(
    () => props.dateISO,
    (iso) => {
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
  
  .arabic-word{
    font-size: 20px;
    font-weight: 900;
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
}

.home.theme-dark .coptic-empty{
  background: rgba(255,255,255,0.06);
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
  