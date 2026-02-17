<!-- src/components/ChapterAudioCta.vue -->
<template>
    <div class="mkAudioWrap" dir="rtl" lang="ar">
      <!-- CTA -->
      <button class="mkAudioBtn" type="button" @click="openPlayer">
        <div class="mkAudioLeft">
          <div class="mkAudioIcon">🎧</div>
          <div class="mkAudioTxt">
            <div class="mkAudioTitle">الإصحاح مسموع</div>
            <div class="mkAudioSub">{{ bookLabel }} {{ chapter }}</div>
          </div>
        </div>
  
        <div class="mkAudioPill">
          اضغط للتشغيل
          <span class="mkAudioDot" aria-hidden="true"></span>
        </div>
      </button>
  
      <!-- Bottom mini player (no modal) -->
      <div class="mkMiniPlayer" :class="{ open }" aria-live="polite">
        <div class="mkMiniInner">
          <div class="mkMiniHead">
            <div class="mkMiniMeta">
              <div class="mkMiniTitle">🎧 الإصحاح مسموع</div>
              <div class="mkMiniSub">{{ bookLabel }} {{ chapter }}</div>
            </div>
  
            <button class="mkMiniClose" type="button" @click="closePlayer" aria-label="إغلاق المشغل">
              ✕
            </button>
          </div>
  
          <audio
            ref="audioEl"
            class="mkAudioPlayer"
            :src="audioUrl"
            controls
            preload="none"
            controlsList="nodownload"
            @error="onError"
          />
  
          <div v-if="error" class="mkAudioErr">
           تعذر تشغيل الملف
          </div>
        </div>
      </div>
  
      <!-- Spacer to push content up while player is open -->
      <div class="mkPlayerSpacer" :class="{ open }" />
    </div>
  </template>
  
  <script setup lang="ts">
  import { computed, ref, nextTick } from "vue"
  
  const props = defineProps<{
    bookSlug: string   // "mark"
    chapter: number    // 12
    baseUrl?: string   // default: https://audio.ma3ankolyoum.org
    bookLabel?: string // display label
  }>()
  
  const open = ref(false)
  const error = ref(false)
  const audioEl = ref<HTMLAudioElement | null>(null)
  
  const base = computed(() => (props.baseUrl || "https://audio.ma3ankolyoum.org").replace(/\/$/, ""))
  const audioUrl = computed(() => `${base.value}/bible/${props.bookSlug}/${props.chapter}.mp3`)
  const bookLabel = computed(() => props.bookLabel || props.bookSlug)
  
  function onError() {
    error.value = true
  }
  
  async function openPlayer() {
    error.value = false
    open.value = true
  
    // شغّل مباشرة بعد فتح اللاعب
    await nextTick()
    try {
      await audioEl.value?.play()
    } catch {
      // iOS ممكن يرفض autoplay أحيانًا — وقتها المستخدم يضغط play من controls
    }
  }
  
  function closePlayer() {
    open.value = false
    try {
      audioEl.value?.pause()
    } catch {}
  }
  </script>
  
  <style scoped>
  .mkAudioWrap{ margin: 10px 0 12px; }
  
  /* =========================
     CTA Button
  ========================= */
  .mkAudioBtn{
    width: 100%;
    padding: 12px 12px;
    border-radius: 20px;
    border: 1px solid var(--mk-border);
    box-shadow: var(--mk-shadow);
    cursor: pointer;
    color: #fff;
    display:flex;
    align-items:center;
    justify-content: space-between;
    gap: 10px;
    text-align: right;
    font-family: "Noto Kufi Arabic", system-ui, sans-serif;
  
    background:
      radial-gradient(700px 220px at 18% 0%, rgba(31,182,170,0.45), transparent 60%),
      linear-gradient(135deg, #182a44, rgba(16,27,47,0.92));
    transition: transform .12s ease, box-shadow .12s ease, filter .12s ease;
  }
  
  .mkAudioBtn:active{
    transform: translateY(1px);
    filter: brightness(0.98);
  }
  
  .mkAudioLeft{
    display:flex;
    align-items:center;
    gap: 10px;
    min-width: 0;
  }
  
  .mkAudioIcon{
    width: 42px;
    height: 42px;
    border-radius: 14px;
    display:flex;
    align-items:center;
    justify-content:center;
    background: rgba(255,255,255,0.12);
    border: 1px solid rgba(255,255,255,0.16);
    box-shadow: 0 10px 18px rgba(0,0,0,0.16);
    flex: 0 0 auto;
    font-size: 18px;
  }
  
  .mkAudioTxt{
    min-width: 0;
  }
  
  .mkAudioTitle{
    font-weight: 1000;
    font-size: 16px;
    line-height: 1.15;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .mkAudioSub{
    margin-top: 3px;
    font-size: 12px;
    font-weight: 900;
    opacity: 0.88;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .mkAudioPill{
    display:flex;
    align-items:center;
    gap: 8px;
    font-size: 12px;
    font-weight: 1000;
    padding: 6px 10px;
    border-radius: 999px;
    background: rgba(255,255,255,0.10);
    border: 1px solid rgba(255,255,255,0.16);
    white-space: nowrap;
  }
  
  .mkAudioDot{
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: rgba(47,230,216,0.95);
    box-shadow: 0 0 0 3px rgba(47,230,216,0.20);
  }
  
  /* Dark mode tweak */
  :global(html[data-mk-theme="dark"]) .mkAudioBtn{
    box-shadow: var(--mk-shadow-strong);
  }
  
  /* =========================
     Bottom Mini Player
  ========================= */
  .mkMiniPlayer{
    position: fixed;
    left: 10px;
    right: 10px;
    bottom: calc(env(safe-area-inset-bottom) + 10px);
    z-index: 9999;
  
    transform: translateY(120%);
    opacity: 0;
    pointer-events: none;
    transition: transform .22s ease, opacity .22s ease;
  }
  
  .mkMiniPlayer.open{
    transform: translateY(0);
    opacity: 1;
    pointer-events: auto;
  }
  
  .mkMiniInner{
    border-radius: 22px;
    border: 1px solid var(--mk-border);
    background:
      radial-gradient(700px 250px at 15% 0%, rgba(31,182,170,0.16), transparent 62%),
      linear-gradient(135deg, rgba(255,255,255,0.94), rgba(255,255,255,0.70));
    box-shadow: var(--mk-shadow-strong);
    backdrop-filter: blur(10px);
    overflow: hidden;
    padding: 12px 12px 10px;
  }
  
  :global(html[data-mk-theme="dark"]) .mkMiniInner{
    background:
      radial-gradient(700px 250px at 15% 0%, rgba(31,182,170,0.14), transparent 62%),
      linear-gradient(135deg, rgba(12,18,26,0.92), rgba(12,18,26,0.78));
    border-color: rgba(255,255,255,0.14);
  }
  
  .mkMiniHead{
    display:flex;
    align-items:flex-start;
    justify-content:space-between;
    gap: 10px;
    margin-bottom: 8px;
  }
  
  .mkMiniMeta{ min-width: 0; }
  
  .mkMiniTitle{
    font-weight: 1000;
    color: var(--mk-text);
    font-family: "Noto Kufi Arabic", system-ui, sans-serif;
    font-size: 15px;
  }
  
  .mkMiniSub{
    margin-top: 2px;
    font-size: 12px;
    font-weight: 900;
    color: var(--mk-text);
    opacity: 0.8;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .mkMiniClose{
    width: 38px;
    height: 38px;
    border-radius: 14px;
    border: 1px solid var(--mk-border);
    background: rgba(0,0,0,0.03);
    color: var(--mk-text);
    font-weight: 1000;
    cursor: pointer;
  }
  
  :global(html[data-mk-theme="dark"]) .mkMiniClose{
    background: rgba(255,255,255,0.08);
    border-color: rgba(255,255,255,0.16);
  }
  
  /* Native audio controls styling */
  .mkAudioPlayer{
    width: 100%;
    height: 44px;
    border-radius: 14px;
    overflow: hidden;
    outline: none;
  }
  
  /* Error */
  .mkAudioErr{
    margin-top: 8px;
    font-weight: 900;
    color: var(--mk-danger, #e23b3b);
    font-size: 13px;
  }
  
  /* =========================
     Spacer: pushes page content up
  ========================= */
  .mkPlayerSpacer{
    height: 0px;
    transition: height .2s ease;
  }
  .mkPlayerSpacer.open{
    height: 130px; /* space for mini player */
  }
  </style>
  