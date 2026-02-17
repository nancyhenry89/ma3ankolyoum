<!-- src/components/ChapterSettingsBox.vue -->
<template>
    <div class="mkSettingsBox" dir="rtl" lang="ar">
      <div class="mkSettingsHead">
        <div class="mkSettingsTitle">⚙️ إعدادات الصفحة</div>
        <button class="mkSettingsReset" type="button" @click="resetAll">إعادة ضبط</button>
      </div>
  
      <!-- ===== Font size (slider) ===== -->
      <div class="mkSettingCard">
        <div class="mkRowTop">
          <div class="mkLbl">حجم الخط</div>
          <div class="mkValue">{{ scaleLabel }}</div>
        </div>
  
        <!-- ✅ Force LTR for proper knob movement -->
        <ion-range
          v-model="state.fontScale"
          :min="0.85"
          :max="1.75"
          :step="0.01"
          :snaps="false"
          :pin="true"
          :ticks="false"
          @ionInput="onScaleInput"
          @ionChange="onScaleCommit"
          dir="ltr"
          class="mkRange"
        />
      </div>
  
      <!-- ===== Verse font ===== -->
      <div class="mkSettingCard">
        <div class="mkRowTop">
          <div class="mkLbl">خط الآيات</div>
        </div>
  
        <ion-select
          interface="popover"
          :value="state.verseFont"
          @ionChange="onFont"
          class="mkSelect"
        >
          <ion-select-option v-for="f in resolvedFonts" :key="f.value" :value="f.value">
            {{ f.label }}
          </ion-select-option>
        </ion-select>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { reactive, computed, onMounted, watch } from "vue"
  import { IonRange, IonSelect, IonSelectOption } from "@ionic/vue"
  
  export type ChapterSettingsStateV2 = {
    fontScale: number
    verseFont: string
  }
  
  const props = defineProps<{
    modelValue: ChapterSettingsStateV2
    storageKey?: string
    fonts?: { label: string; value: string }[]
  }>()
  
  const emit = defineEmits<{
    (e: "update:modelValue", v: ChapterSettingsStateV2): void
  }>()
  
  const STORAGE_KEY = props.storageKey || "mk_chapter_settings_v2"
  
  const defaultFonts = [
    { label: "Playpen Sans Arabic", value: `"Playpen Sans Arabic", system-ui, sans-serif` },
    { label: "Cairo", value: `"Cairo", system-ui, sans-serif` },
    { label: "Tajawal", value: `"Tajawal", system-ui, sans-serif` },
    { label: "Scheherazade New", value: `"Scheherazade New", serif` },
    { label: "Amiri", value: `"Amiri", serif` },
    { label: "Noto Naskh Arabic", value: `"Noto Naskh Arabic", system-ui, sans-serif` },
    { label: "Noto Kufi Arabic", value: `"Noto Kufi Arabic", system-ui, sans-serif` },
  ]
  
  const resolvedFonts = computed(() => {
    const incoming = props.fonts?.length ? props.fonts : defaultFonts
  
    const must = [
      { label: "Playpen Sans Arabic", value: `"Playpen Sans Arabic", system-ui, sans-serif` },
      { label: "Cairo", value: `"Cairo", system-ui, sans-serif` },
      { label: "Tajawal", value: `"Tajawal", system-ui, sans-serif` },
    ]
  
    const map = new Map<string, { label: string; value: string }>()
    for (const f of incoming) map.set(f.value, f)
    for (const m of must) if (!map.has(m.value)) map.set(m.value, m)
  
    return Array.from(map.values())
  })
  
  const state = reactive<ChapterSettingsStateV2>({
    fontScale: props.modelValue?.fontScale ?? 1,
    verseFont: props.modelValue?.verseFont ?? resolvedFonts.value[0].value,
  })
  
  const scaleLabel = computed(() => {
    const pct = Math.round(Number(state.fontScale || 1) * 100)
    return `${pct}%`
  })
  
  function push() {
    const v: ChapterSettingsStateV2 = {
      fontScale: Number(state.fontScale || 1),
      verseFont: String(state.verseFont || resolvedFonts.value[0].value),
    }
    emit("update:modelValue", v)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(v))
    } catch {}
  }
  
  function onScaleInput() {
    push()
  }
  function onScaleCommit() {
    push()
  }
  
  function onFont(e: CustomEvent) {
    state.verseFont = String((e as any)?.detail?.value || resolvedFonts.value[0].value)
    push()
  }
  
  function resetAll() {
    state.fontScale = 1
    state.verseFont = resolvedFonts.value[0].value
    push()
  }
  
  onMounted(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const saved = JSON.parse(raw)
      if (saved) {
        const fs = Number(saved.fontScale)
        state.fontScale = Number.isFinite(fs) ? fs : 1
        const vf = String(saved.verseFont || "")
        state.verseFont = vf || state.verseFont
        push()
      }
    } catch {}
  })
  
  watch(
    () => props.modelValue,
    (v) => {
      if (!v) return
      const fs = Number(v.fontScale)
      if (Number.isFinite(fs)) state.fontScale = fs
      if (v.verseFont) state.verseFont = String(v.verseFont)
    },
    { deep: true }
  )
  </script>
  
  <style scoped>
  .mkSettingsBox{
    margin: 10px 0 12px;
    padding: 14px;
    border-radius: 20px;
    border: 1px solid var(--mk-border);
    background:
      radial-gradient(700px 260px at 20% 0%, rgba(31,182,170,0.16), transparent 60%),
      linear-gradient(135deg, rgba(255,255,255,0.88), rgba(255,255,255,0.60));
    box-shadow: var(--mk-shadow);
    backdrop-filter: blur(8px);
  }
  
  :global(html[data-mk-theme="dark"]) .mkSettingsBox{
    background:
      radial-gradient(700px 260px at 20% 0%, rgba(31,182,170,0.14), transparent 62%),
      linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04));
    border-color: rgba(255,255,255,0.14);
  }
  
  .mkSettingsHead{
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:10px;
    margin-bottom: 12px;
  }
  
  .mkSettingsTitle{
    font-weight: 1000;
    color: var(--mk-text);
    font-family: "Noto Kufi Arabic", system-ui, sans-serif;
    font-size: 16px;
  }
  
  .mkSettingsReset{
    border: 1px solid var(--mk-border);
    background: rgba(0,0,0,0.04);
    color: var(--mk-text);
    font-weight: 900;
    padding: 7px 11px;
    border-radius: 999px;
    cursor: pointer;
  }
  :global(html[data-mk-theme="dark"]) .mkSettingsReset{
    background: rgba(255,255,255,0.08);
    border-color: rgba(255,255,255,0.16);
  }
  
  .mkSettingCard{
    margin-top: 10px;
    padding: 12px 12px 10px;
    border-radius: 16px;
    border: 1px solid var(--mk-border);
    background: rgba(0,0,0,0.02);
  }
  :global(html[data-mk-theme="dark"]) .mkSettingCard{
    background: rgba(255,255,255,0.06);
    border-color: rgba(255,255,255,0.14);
  }
  
  .mkRowTop{
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:10px;
    margin-bottom: 8px;
  }
  
  .mkLbl{
    font-weight: 1000;
    color: var(--mk-text);
    font-family: "Noto Kufi Arabic", system-ui, sans-serif;
  }
  
  .mkValue{
    font-weight: 1000;
    color: var(--mk-text);
    opacity: 0.9;
    font-variant-numeric: tabular-nums;
    padding: 3px 10px;
    border-radius: 999px;
    border: 1px solid var(--mk-border);
    background: rgba(31,182,170,0.10);
  }
  :global(html[data-mk-theme="dark"]) .mkValue{
    background: rgba(31,182,170,0.12);
    border-color: rgba(255,255,255,0.16);
  }
  
  /* ✅ Ensure the range truly behaves LTR even inside RTL containers */
  .mkRange{
    direction: ltr;
    unicode-bidi: isolate;
    padding:0;
  }
  
  /* ✅ nicer ion-range look */
  ion-range{
    --bar-height: 8px;
    --knob-size: 24px;
    --pin-background: rgba(0,0,0,0.85);
    --pin-color: #fff;
    --knob-box-shadow: 0 10px 20px rgba(0,0,0,0.18);
    --bar-background: rgba(31,182,170,0.18);
    --bar-background-active: rgb(37 63 79);
    padding-inline: 2px;
  }
  
  /* ion-select styling */
  .mkSelect{
    width: 100%;
    margin-top: 2px;
    border-radius: 14px;
    border: 1px solid var(--mk-border);
    background: rgba(255,255,255,0.70);
    padding: 8px 10px;
  }
  :global(html[data-mk-theme="dark"]) .mkSelect{
    background: rgba(0,0,0,0.25);
    border-color: rgba(255,255,255,0.16);
  }
  
  .mkSelect :deep(.select-text){
    font-weight: 900;
    color: var(--mk-text);
    font-family: "Noto Kufi Arabic", system-ui, sans-serif;
  }
  .mkSelect :deep(.select-icon){
    color: var(--mk-text);
    opacity: 0.85;
  }
/* ✅ Fix ion-select text visibility in dark mode */
:global(html[data-mk-theme="dark"]) .mkSelect{
  color: var(--mk-text) !important;
  opacity: 1 !important;
}

/* select text + placeholder داخل ion-select */
:global(html[data-mk-theme="dark"]) .mkSelect :deep(.select-text),
:global(html[data-mk-theme="dark"]) .mkSelect :deep(.select-placeholder){
  color: var(--mk-text) !important;
  opacity: 1 !important;
  font-weight: 900;
}

/* أحيانًا الأيقونة كمان بتبقى باهتة */
:global(html[data-mk-theme="dark"]) .mkSelect :deep(.select-icon){
  color: var(--mk-text) !important;
  opacity: 0.95 !important;
}

/* لو نسخة Ionic بتستخدم part="text" */
:global(html[data-mk-theme="dark"]) .mkSelect::part(text){
  color: var(--mk-text) !important;
  opacity: 1 !important;
}
:global(html[data-mk-theme="dark"]) .mkSelect::part(placeholder){
  color: var(--mk-text) !important;
  opacity: 0.75 !important;
}
:global(html[data-mk-theme="dark"]) .mkSelect::part(icon){
  color: var(--mk-text) !important;
  opacity: 0.95 !important;
}
:global(html[data-mk-theme="dark"]) .mkSelect{
  background: rgba(12,18,26,0.55) !important;
}
/* ✅ Dark mode: selected value (after picking) becomes invisible */
:global(html[data-mk-theme="dark"]) ion-select.mkSelect{
  color: var(--mk-text) !important;
  opacity: 1 !important;
}

/* ✅ The real rendered text/placeholder/icon in Ionic (Shadow Parts) */
:global(html[data-mk-theme="dark"]) ion-select.mkSelect::part(text){
  color: var(--mk-text) !important;
  opacity: 1 !important;
  font-weight: 900;
}

:global(html[data-mk-theme="dark"]) ion-select.mkSelect::part(placeholder){
  color: var(--mk-text) !important;
  opacity: 0.75 !important;
}

:global(html[data-mk-theme="dark"]) ion-select.mkSelect::part(icon){
  color: var(--mk-text) !important;
  opacity: 0.95 !important;
}

/* ✅ Some Ionic versions still use these internal classes */
:global(html[data-mk-theme="dark"]) ion-select.mkSelect :deep(.select-text),
:global(html[data-mk-theme="dark"]) ion-select.mkSelect :deep(.select-placeholder){
  color: var(--mk-text) !important;
  opacity: 1 !important;
  font-weight: 900;
}

  </style>
  