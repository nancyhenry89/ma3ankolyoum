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
          <!-- ✅ ALWAYS visible selected label -->
          <div class="mkValue">{{ selectedFontLabel }}</div>
        </div>
  
        <ion-select
          interface="popover"
          :value="state.verseFont"
          @ionChange="onFont"
          class="mkSelect"
          placeholder="اختر خط"
        >
          <ion-select-option
            v-for="f in resolvedFonts"
            :key="f.value"
            :value="f.value"
          >
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
  
  /** Normalize font-family string to avoid invisible select (value mismatch) */
  function normalizeFontValue(v: any) {
    return String(v || "")
      .trim()
      .replace(/\s+/g, " ")     // collapse spaces
      .replace(/,\s+/g, ", ")   // normalize comma spacing
  }
  
  /** Default fonts */
  const defaultFonts = [
    { label: "Playpen Sans Arabic", value: `"Playpen Sans Arabic", system-ui, sans-serif` },
    { label: "Cairo", value: `"Cairo", system-ui, sans-serif` },
    { label: "Tajawal", value: `"Tajawal", system-ui, sans-serif` },
    { label: "Scheherazade New", value: `"Scheherazade New", serif` },
    { label: "Amiri", value: `"Amiri", serif` },
    { label: "Noto Naskh Arabic", value: `"Noto Naskh Arabic", system-ui, sans-serif` },
    { label: "Noto Kufi Arabic", value: `"Noto Kufi Arabic", system-ui, sans-serif` },
  ].map(f => ({ ...f, value: normalizeFontValue(f.value) }))
  
  const resolvedFonts = computed(() => {
    const incoming = (props.fonts?.length ? props.fonts : defaultFonts)
      .map(f => ({ label: f.label, value: normalizeFontValue(f.value) }))
  
    // must-have fonts
    const must = [
      { label: "Playpen Sans Arabic", value: normalizeFontValue(`"Playpen Sans Arabic", system-ui, sans-serif`) },
      { label: "Cairo", value: normalizeFontValue(`"Cairo", system-ui, sans-serif`) },
      { label: "Tajawal", value: normalizeFontValue(`"Tajawal", system-ui, sans-serif`) },
    ]
  
    const map = new Map<string, { label: string; value: string }>()
    for (const f of incoming) map.set(f.value, f)
    for (const m of must) if (!map.has(m.value)) map.set(m.value, m)
  
    return Array.from(map.values())
  })
  
  function ensureValidFontValue(v: string) {
    const norm = normalizeFontValue(v)
    const ok = resolvedFonts.value.some(f => f.value === norm)
    return ok ? norm : resolvedFonts.value[0].value
  }
  
  const state = reactive<ChapterSettingsStateV2>({
    fontScale: props.modelValue?.fontScale ?? 1,
    verseFont: ensureValidFontValue(props.modelValue?.verseFont ?? resolvedFonts.value[0].value),
  })
  
  const scaleLabel = computed(() => {
    const pct = Math.round(Number(state.fontScale || 1) * 100)
    return `${pct}%`
  })
  
  const selectedFontLabel = computed(() => {
    const v = ensureValidFontValue(state.verseFont)
    return resolvedFonts.value.find(f => f.value === v)?.label || "—"
  })
  
  function push() {
    const v: ChapterSettingsStateV2 = {
      fontScale: Number(state.fontScale || 1),
      verseFont: ensureValidFontValue(state.verseFont),
    }
    emit("update:modelValue", v)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(v))
    } catch {}
  }
  
  function onScaleInput() { push() }
  function onScaleCommit() { push() }
  
  function onFont(e: CustomEvent) {
    const raw = String((e as any)?.detail?.value || "")
    state.verseFont = ensureValidFontValue(raw)
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
  
        const vf = ensureValidFontValue(saved.verseFont || "")
        state.verseFont = vf
  
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
      if (v.verseFont) state.verseFont = ensureValidFontValue(v.verseFont)
    },
    { deep: true }
  )
  </script>
  
  <style scoped>
  .mkSettingsBox{
    margin: 10px 0 12px;
    padding: 14px;
    border-radius: 20px;
    border: 1px solid var(--mk-border, rgba(0,0,0,0.10));
    background:
      radial-gradient(700px 260px at 20% 0%, rgba(31,182,170,0.16), transparent 60%),
      linear-gradient(135deg, rgba(255,255,255,0.88), rgba(255,255,255,0.60));
    box-shadow: var(--mk-shadow, 0 8px 18px rgba(0,0,0,0.08));
    backdrop-filter: blur(8px);
  }
  
  /* ✅ define safe local vars for dark mode even if page doesn't provide mk vars */
  :global(html[data-mk-theme="dark"]) .mkSettingsBox{
    --mk-text-local: #f5f7fa;
    --mk-border-local: rgba(255,255,255,0.14);
  
    background:
      radial-gradient(700px 260px at 20% 0%, rgba(31,182,170,0.14), transparent 62%),
      linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04));
    border-color: var(--mk-border, var(--mk-border-local));
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
    color: var(--mk-text, #0b1f33);
    font-family: "Noto Kufi Arabic", system-ui, sans-serif;
    font-size: 16px;
  }
  
  :global(html[data-mk-theme="dark"]) .mkSettingsTitle{
    color: var(--mk-text, var(--mk-text-local));
  }
  
  .mkSettingsReset{
    border: 1px solid var(--mk-border, rgba(0,0,0,0.10));
    background: rgba(0,0,0,0.04);
    color: var(--mk-text, #0b1f33);
    font-weight: 900;
    padding: 7px 11px;
    border-radius: 999px;
    cursor: pointer;
  }
  :global(html[data-mk-theme="dark"]) .mkSettingsReset{
    background: rgba(255,255,255,0.08);
    border-color: var(--mk-border, var(--mk-border-local));
    color: var(--mk-text, var(--mk-text-local));
  }
  
  .mkSettingCard{
    margin-top: 10px;
    padding: 12px 12px 10px;
    border-radius: 16px;
    border: 1px solid var(--mk-border, rgba(0,0,0,0.10));
    background: rgba(0,0,0,0.02);
  }
  :global(html[data-mk-theme="dark"]) .mkSettingCard{
    background: rgba(255,255,255,0.06);
    border-color: var(--mk-border, var(--mk-border-local));
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
    color: var(--mk-text, #0b1f33);
    font-family: "Noto Kufi Arabic", system-ui, sans-serif;
  }
  :global(html[data-mk-theme="dark"]) .mkLbl{
    color: var(--mk-text, var(--mk-text-local));
  }
  
  .mkValue{
    font-weight: 1000;
    color: var(--mk-text, #0b1f33);
    opacity: 0.95;
    font-variant-numeric: tabular-nums;
    padding: 3px 10px;
    border-radius: 999px;
    border: 1px solid var(--mk-border, rgba(0,0,0,0.10));
    background: rgba(31,182,170,0.10);
    max-width: 55%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  :global(html[data-mk-theme="dark"]) .mkValue{
    color: var(--mk-text, var(--mk-text-local));
    background: rgba(31,182,170,0.12);
    border-color: var(--mk-border, var(--mk-border-local));
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
  
  /* ================================
     ✅ ion-select: REAL FIX (value + dark colors)
  ================================ */
  .mkSelect{
    width: 100%;
    margin-top: 2px;
    border-radius: 14px;
    border: 1px solid var(--mk-border, rgba(0,0,0,0.10));
    background: rgba(255,255,255,0.70);
    padding: 8px 10px;
  
    /* Ionic variables that drive text rendering */
    --color: #0b1f33;
    --placeholder-color: rgba(11,31,51,0.70);
    --placeholder-opacity: 1;
  }
  
  :global(html[data-mk-theme="dark"]) ion-select.mkSelect{
    border-color: var(--mk-border, var(--mk-border-local)) !important;
  
    /* important Ionic vars */
    --color: #f5f7fa !important;
    --placeholder-color: rgba(245,247,250,0.80) !important;
    --placeholder-opacity: 1 !important;
  
    background: rgba(12,18,26,0.70) !important;
    color: #f5f7fa !important;
    opacity: 1 !important;
  }
  
  /* shadow parts */
  :global(html[data-mk-theme="dark"]) ion-select.mkSelect::part(text),
  :global(html[data-mk-theme="dark"]) ion-select.mkSelect::part(placeholder),
  :global(html[data-mk-theme="dark"]) ion-select.mkSelect::part(icon){
    color: #f5f7fa !important;
    opacity: 1 !important;
  }
  
  /* older internals fallback */
  .mkSelect :deep(.select-text){
    font-weight: 900;
    color: #0b1f33;
    font-family: "Noto Kufi Arabic", system-ui, sans-serif;
  }
  .mkSelect :deep(.select-icon){
    color: #0b1f33;
    opacity: 0.9;
  }
  :global(html[data-mk-theme="dark"]) ion-select.mkSelect :deep(.select-text),
  :global(html[data-mk-theme="dark"]) ion-select.mkSelect :deep(.select-placeholder),
  :global(html[data-mk-theme="dark"]) ion-select.mkSelect :deep(.select-icon){
    color: #f5f7fa !important;
    opacity: 1 !important;
  }
  </style>
  