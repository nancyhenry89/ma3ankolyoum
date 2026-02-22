<template>
    <div class="vvWrap">
      <!-- ✅ iOS native: open externally (most reliable) -->
      <button v-if="isIOSNative && type === 'youtube'" class="vvOpenBtn" type="button" @click="openExternal">
  ▶ تشغيل الفيديو
</button>

<div v-else class="vvFrame">
  <!-- YouTube -->
  <iframe
    v-if="type === 'youtube'"
    :src="youtubeEmbedUrl"
    title="Verse video"
    frameborder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    allowfullscreen
  />

  <!-- R2 -->
  <video
    v-else-if="type === 'r2'"
    class="vvVideo"
    :src="r2Url"
    controls
    playsinline
    webkit-playsinline
    preload="metadata"
  />

  <div v-else class="vvHint">نوع فيديو غير مدعوم.</div>
</div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { computed } from "vue"
  import { Capacitor } from "@capacitor/core"
  import { Browser } from "@capacitor/browser"
  
  const props = defineProps<{
    type: "youtube" | "r2"
    vid: string
  }>()
  
  const isIOSNative = computed(() => Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios")
  
  const youtubeEmbedUrl = computed(() => `https://www.youtube.com/embed/${props.vid}`)
  const youtubeWatchUrl = computed(() => `https://www.youtube.com/watch?v=${props.vid}`)
  const r2Url = computed(() => props.vid)
  
  async function openExternal() {
    const url = props.type === "youtube" ? youtubeWatchUrl.value : r2Url.value
    await Browser.open({ url })
  }
  </script>
  
  <style scoped>
  .vvWrap {
    margin: 0 8px 12px;
  }
  
  .vvOpenBtn {
    width: 100%;
    height: 44px;
    border-radius: 14px;
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(0,0,0,0.08);
    font-weight: 900;
    cursor: pointer;
  }
  
  .vvFrame {
    position: relative;
    width: 100%;
    padding-top: 56.25%;
    border-radius: 14px;
    overflow: hidden;
    border: 1px solid rgba(0,0,0,0.08);
  }
  
  .vvFrame iframe,
  .vvFrame .vvVideo {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    border: 0;
  }
  
  .vvHint {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    font-weight: 900;
  }
  </style>