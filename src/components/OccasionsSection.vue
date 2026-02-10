<template>
    <section v-if="isArabic && hasAny" class="ocWrap" dir="rtl" lang="ar">
      <div class="ocCard" :style="cardStyle">
        <!-- header -->
        <div class="ocTop">
  
          <div class="ocTitle" v-if="title">{{ title }}</div>
          <div class="ocSub" v-if="subTitle">{{ subTitle }}</div>
        </div>
  
        <!-- video -->
<!-- video -->
<div v-if="hasVideo" class="ocVideo">
  <!-- ✅ iOS Native: لا iframe -->
  <button
    v-if="isIOSNative"
    type="button"
    class="ocPlayBtn"
    @click="openYoutube"
    aria-label="تشغيل فيديو المناسبة"
  >
    <span class="ocPlayIcon">▶</span>
    <span class="ocPlayTxt">تشغيل الفيديو</span>
  </button>

  <!-- ✅ Android/Web: inline iframe -->
  <iframe
    v-else
    class="ocFrame"
    :src="embedUrl"
    :title="title || 'Occasion video'"
    frameborder="0"
    allow="autoplay; encrypted-media; picture-in-picture"
    allowfullscreen
    playsinline
  />
</div>

  
        <!-- bottom expand -->
        <button
          v-if="hasDrawer"
          type="button"
          class="ocExpand"
          :class="{ open: open }"
          @click="toggle"
          aria-label="عرض التفاصيل"
        >
          <span class="ocExpandText">{{ open ? "إخفاء التفاصيل" : "عرض التفاصيل" }}</span>
          <span class="ocArrow" aria-hidden="true">⤦</span>
        </button>
  
        <!-- drawer -->
        <div v-if="hasDrawer" class="ocDrawer" :class="{ open }">
          <div class="ocDrawerInner">
            <!-- content -->
            <div v-if="contentHtml" class="ocContent md" v-html="contentHtml"></div>
  
            <!-- media -->
            <div v-if="hasMedia" class="ocMedia">
              <div class="ocMediaTitle">🎧 </div>
  
              <audio class="ocAudio" controls preload="none">
                <source :src="mediaUrl" type="audio/mpeg" />
              </audio>
  

            </div>
          </div>
        </div>
      </div>
    </section>
  </template>
  
  <script setup lang="ts">
  import { computed, ref } from "vue"
  import { Capacitor } from "@capacitor/core"
import { Browser } from "@capacitor/browser"

const isIOSNative = computed(() => Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios")

async function openYoutube() {
  const id = String(props.youtubeId || "").trim()
  if (!id) return

  const url = `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`

  // ✅ يفتح داخل التطبيق (Safari View Controller) — مضمون على iOS
  await Browser.open({
    url,
    presentationStyle: "popover", // iPhone هيتعامل معها كويس
  })
}

  type Props = {
    youtubeId?: string
    title?: string
    subTitle?: string
    /** oc_content */
    content?: string
    /** oc_media (mp3 url) */
    mediaUrl?: string
    /** oc_bg (any css color) e.g. "#20b2aa" or "rgba(...)" */
    bgColor?: string
    /** from Home */
    lang?: "ar" | "en"
  }
  
  const props = withDefaults(defineProps<Props>(), {
    youtubeId: "",
    title: "",
    subTitle: "",
    content: "",
    mediaUrl: "",
    bgColor: "",
    lang: "ar",
  })
  
  const open = ref(false)
  
  const isArabic = computed(() => props.lang === "ar")
  const hasVideo = computed(() => !!String(props.youtubeId || "").trim())
  const hasContent = computed(() => !!String(props.content || "").trim())
  const hasMedia = computed(() => !!String(props.mediaUrl || "").trim())
  const hasDrawer = computed(() => hasContent.value || hasMedia.value)
  const hasAny = computed(() => hasVideo.value || hasDrawer.value)
  
  function toggle() {
    open.value = !open.value
  }
  
  /**
   * ✅ YouTube inline:
   * - playsinline=1 مهم للـ iPhone
   */
   const embedUrl = computed(() => {
  const id = String(props.youtubeId || "").trim()
  if (!id) return ""
  return `https://www.youtube.com/embed/${id}?playsinline=1&rel=0&modestbranding=1&iv_load_policy=3&controls=1`
})

  /**
   * oc_content formatting:
   * **text** => <strong>
   * ##text## => <u>
   * new lines => <br>
   */
  function escapeHtml(s: string) {
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;")
  }
  
  function formatOcContent(raw: string) {
    const safe = escapeHtml(String(raw || ""))
  
    // underline first (so it doesn't conflict)
    let out = safe.replace(/##(.+?)##/g, (_m, inner) => `<u>${inner}</u>`)
  
    // bold
    out = out.replace(/\*\*(.+?)\*\*/g, (_m, inner) => `<strong>${inner}</strong>`)
  
    // new lines
    out = out.replace(/\r\n|\r|\n/g, "<br>")
  
    return out.trim()
  }
  
  const contentHtml = computed(() => {
    if (!hasContent.value) return ""
    return formatOcContent(props.content || "")
  })
  
  /**
   * Background color variable from sheet:
   * if bgColor provided => use it in glow
   */
  const cardStyle = computed(() => {
    const c = String(props.bgColor || "").trim()
    if (!c) return {}
    // نستخدمه كـ accent في gradients
    return {
      "--oc-accent": c,
    } as Record<string, string>
  })
  </script>
  
  <style scoped>
  .ocWrap{
    margin: 12px 0 10px;
  }
  
  /* ✅ New style: premium card */
  .ocCard{
    --oc-accent: #28d6cc; /* fallback */
    border-radius: 22px;
    overflow: hidden;
    border: 1px solid rgba(255,255,255,0.14);
    box-shadow: 0 18px 42px rgba(0,0,0,0.12);
  
    background:
      radial-gradient(1100px 380px at 10% 0%, color-mix(in srgb, var(--oc-accent) 30%, transparent), transparent 60%),
      radial-gradient(900px 320px at 90% 10%, rgba(255,209,102,0.16), transparent 60%),
      linear-gradient(135deg, rgba(24,42,68,0.10), rgba(255,255,255,0.70));
  
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }
  
  /* Top */
  .ocTop{
    padding: 16px 16px 12px;
    text-align: center;
  }
  
  .ocBadge{
    display: inline-flex;
    align-items:center;
    justify-content:center;
    gap:8px;
    padding: 6px 12px;
    border-radius: 999px;
    font-weight: 1000;
    font-size: 13px;
  
    background: rgba(255,255,255,0.55);
    border: 1px solid rgba(0,0,0,0.06);
  }
  
  .ocTitle{
    margin-top: 10px;
    font-size: 22px;
    font-weight: 1000;
    line-height: 1.35;
    color: var(--mk-text);
    font-family: "Noto Kufi Arabic", system-ui, sans-serif;
  }
  
  .ocSub{
    margin-top: 6px;
    font-size: 15px;
    font-weight: 900;
    opacity: 0.92;
    color: var(--mk-text);
    font-family: "Noto Kufi Arabic", system-ui, sans-serif;
  }
  
  /* Video */
  .ocVideo{
    margin: 0 14px 12px;
    border-radius: 18px;
    overflow: hidden;
    border: 1px solid rgba(0,0,0,0.10);
    box-shadow: 0 14px 28px rgba(0,0,0,0.12);
    background: rgba(0,0,0,0.06);
  }
  
  .ocFrame{
    width: 100%;
    aspect-ratio: 16 / 9;
    display: block;
  }
  
  /* Expand button */
  .ocExpand{
    width: 100%;
    border: 0;
    background: transparent;
    padding: 12px 14px 14px;
    cursor: pointer;
  
    display:flex;
    align-items:center;
    justify-content:center;
    gap:10px;
  
    font-weight: 1000;
    font-size: 14px;
    color: var(--mk-text);
    opacity: 0.95;
  }
  
  .ocExpandText{
    padding: 8px 14px;
    border-radius: 999px;
    border: 1px solid rgba(0,0,0,0.08);
    background: rgba(255,255,255,0.55);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }
  
  .ocArrow{
    font-size: 18px;
    transform: translateY(1px);
    transition: transform .25s ease;
    opacity: 0.75;
  }
  .ocExpand.open .ocArrow{
    transform: rotate(180deg);
  }
  
  /* Drawer */
  .ocDrawer{
    max-height: 0;
    overflow: hidden;
    transition: max-height .35s ease;
  }
  .ocDrawer.open{
    max-height: max-content;
  }
  
  .ocDrawerInner{
    padding: 0 16px 16px;
  }
  
  /* content formatting area */
  .ocContent{
    margin-top: 10px;
    padding: 14px 14px;
    border-radius: 16px;
    border: 1px solid rgba(0,0,0,0.08);
    background: rgba(255,255,255,0.58);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  
    font-family: "Noto Kufi Arabic", system-ui, sans-serif;
    font-size: 16px;
    font-weight: 800;
    line-height: 2;
    color: var(--mk-text);
  }
  
  .ocContent :deep(strong){
    font-weight: 1000;
  }
  .ocContent :deep(u){
    text-decoration-thickness: 2px;
    text-underline-offset: 5px;
  }
  
  /* media */
  .ocMedia{
    margin-top: 12px;
    padding: 14px;
    border-radius: 16px;
    border: 1px solid rgba(0,0,0,0.08);
    background:
      radial-gradient(700px 220px at 10% 0%, color-mix(in srgb, var(--oc-accent) 20%, transparent), transparent 60%),
      rgba(255,255,255,0.58);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }
  
  .ocMediaTitle{
    font-weight: 1000;
    font-size: 35px;
    margin-bottom: 10px;
    font-family: "Noto Kufi Arabic", system-ui, sans-serif;
  }
  
  .ocAudio{
    width: 100%;
  }
  
  .ocMediaLink{
    display: inline-flex;
    align-items:center;
    gap:8px;
    margin-top: 10px;
    font-weight: 1000;
    color: var(--mk-text);
    text-decoration: underline;
  }
  
  .ocLinkArrow{ opacity: 0.75; }
  
  /* Dark mode */
  :global([data-mk-theme="dark"]) .ocCard{
    background:
      radial-gradient(1100px 380px at 10% 0%, color-mix(in srgb, var(--oc-accent) 22%, transparent), transparent 60%),
      radial-gradient(900px 320px at 90% 10%, rgba(255,209,102,0.10), transparent 60%),
      linear-gradient(135deg, rgba(255,255,255,0.06), rgba(0,0,0,0.24));
    border-color: rgba(255,255,255,0.14);
    box-shadow: 0 18px 42px rgba(0,0,0,0.50);
  }
  
  :global([data-mk-theme="dark"]) .ocBadge,
  :global([data-mk-theme="dark"]) .ocExpandText,
  :global([data-mk-theme="dark"]) .ocContent,
  :global([data-mk-theme="dark"]) .ocMedia{
    background: rgba(0,0,0,0.22);
    border-color: rgba(255,255,255,0.14);
  }
  .ocPlayBtn{
  width: 100%;
  border: 0;
  background: rgba(0,0,0,0.06);
  padding: 18px 14px;
  display:flex;
  align-items:center;
  justify-content:center;
  gap:10px;
  font-weight: 1000;
  border-radius: 18px;
  cursor:pointer;
}

.ocPlayIcon{
  width: 42px;
  height: 42px;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  border-radius: 999px;
  background: var(--oc-accent);
  color: #fff;
  font-size: 18px;
  box-shadow: 0 12px 26px rgba(0,0,0,0.18);
}

.ocPlayTxt{
  font-family: "Noto Kufi Arabic", system-ui, sans-serif;
  font-size: 15px;
}

  </style>
  