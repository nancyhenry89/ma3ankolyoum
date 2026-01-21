<!-- src/components/HomePopup.vue -->
<template>
    <div v-if="isOpen" class="hpOverlay" @click.self="close('backdrop')">
      <div class="hpCard" dir="rtl" lang="ar" @click="onCardClick">
        <!-- Header -->
        <div class="hpHeader">
          <div class="hpTitle">{{ popup?.title || "إعلان" }}</div>
  
          <button class="hpClose" type="button" aria-label="Close" @click="close('x')">
            ✕
          </button>
        </div>
  
        <!-- Body -->
        <div class="hpBody">
          <div v-if="safeHtml" class="hpHtml md" v-html="safeHtml"></div>
  
          <!-- YouTube -->
          <div v-if="popup?.youtubeId" class="hpVideoWrap">
            <!-- Web + Android: iframe -->
            <div v-if="shouldEmbedIframe" class="hpVideo">
              <iframe
                :src="youtubeEmbedUrl"
                title="YouTube video"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowfullscreen
              />
            </div>
  
            <!-- iOS native: thumbnail -> Browser.open -->
            <button
              v-else
              class="hpYtThumbBtn"
              type="button"
              @click.stop="openYoutube(popup.youtubeId)"
              aria-label="Play video"
            >
              <img class="hpYtThumb" :src="ytThumb(popup.youtubeId)" alt="Video thumbnail" />
              <span class="hpYtPlay">▶</span>
              <span class="hpYtHint">افتح الفيديو</span>
            </button>
          </div>
  
          <!-- Debug hint -->
          <div v-if="debugHint" class="hpDebug">{{ debugHint }}</div>
        </div>
  
        <!-- CTAs -->
        <div class="hpActions">
          <ion-button
            v-if="popup?.secondaryCta?.label"
            fill="outline"
            class="hpBtn"
            @click="onCta(popup.secondaryCta)"
          >
            {{ popup.secondaryCta.label }}
          </ion-button>
  
          <ion-button v-if="popup?.primaryCta?.label" class="hpBtn" @click="onCta(popup.primaryCta)">
            {{ popup.primaryCta.label }}
          </ion-button>
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { IonButton } from "@ionic/vue"
  import { computed, onMounted, ref } from "vue"
  import { useRouter } from "vue-router"
  import DOMPurify from "dompurify"
  
  import { Capacitor } from "@capacitor/core"
  import { CapacitorHttp } from "@capacitor/core"
  import { Browser } from "@capacitor/browser"
  import { AppLauncher } from "@capacitor/app-launcher"
  
  type PopupCta =
    | { label: string; action: "update" }
    | { label: string; action: "deeplink"; url: string } // mky://notes , mky://chapter/Matthew/21
    | { label: string; action: "url"; url: string }
  
  type PopupJson = {
    id: string
    activeFrom: string // YYYY-MM-DD
    activeTo: string // YYYY-MM-DD
    title: string
    html?: string
    youtubeId?: string
    primaryCta?: PopupCta
    secondaryCta?: PopupCta
  }
  
  const props = defineProps<{
    enabled: boolean
    url?: string
    debug?: boolean
  }>()
  
  const router = useRouter()
  
  const isNative = computed(() => Capacitor.isNativePlatform())
  const platform = computed(() => Capacitor.getPlatform()) // 'ios' | 'android' | 'web'
  
  const isOpen = ref(false)
  const popup = ref<PopupJson | null>(null)
  const debugHint = ref("")
  
  function logDebug(...args: any[]) {
    if (props.debug) console.log("[MKY_POPUP]", ...args)
  }
  
  /** iframe is OK on web + android; iOS native is flaky -> open externally */
  const shouldEmbedIframe = computed(() => platform.value === "web" || platform.value === "android")
  
  const youtubeEmbedUrl = computed(() => {
    const id = String(popup.value?.youtubeId || "").trim()
    if (!id) return ""
    return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?rel=0&modestbranding=1&playsinline=1`
  })
  
  function ytThumb(id: string) {
    return `https://i.ytimg.com/vi/${encodeURIComponent(id)}/hqdefault.jpg`
  }
  
  async function openYoutube(id: string) {
    const url = `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`
    await Browser.open({ url })
  }
  
  function todayISO(): string {
    const d = new Date()
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    return `${y}-${m}-${day}`
  }
  
  function inRange(today: string, from: string, to: string) {
    return today >= from && today <= to
  }
  
  /** max 4 times/day */
  function dailyKey() {
    return `mky_popup_daily_${todayISO()}`
  }
  function getDailyCount(): number {
    try {
      return Number(localStorage.getItem(dailyKey()) || "0") || 0
    } catch {
      return 0
    }
  }
  function incDailyCount() {
    try {
      localStorage.setItem(dailyKey(), String(getDailyCount() + 1))
    } catch {}
  }
  
  /** once per session/app open */
  function sessionKey(id: string) {
    return `mky_popup_session_shown_${id}`
  }
  function wasShownThisSession(id: string) {
    try {
      return sessionStorage.getItem(sessionKey(id)) === "1"
    } catch {
      return false
    }
  }
  function markShownThisSession(id: string) {
    try {
      sessionStorage.setItem(sessionKey(id), "1")
    } catch {}
  }
  
  const safeHtml = computed(() => {
    const raw = popup.value?.html || ""
    if (!raw) return ""
    return DOMPurify.sanitize(String(raw), {
      USE_PROFILES: { html: true },
      ADD_TAGS: ["span"],
      ADD_ATTR: ["class", "href", "target", "rel"],
    })
  })
  
  /**
   * WEB candidates (no Vite proxy required):
   * 1) /popup.json   -> put it in public/popup.json during local dev (or in your host)
   * 2) props.url     -> optional
   * 3) remote url    -> works only if server allows CORS
   */
  const WEB_CANDIDATES = computed(() => {
    const list: string[] = []
    list.push("/popup.json")
    if (props.url) list.push(props.url)
    list.push("https://popup.ma3ankolyoum.org/popup.json")
    return list
  })
  
  async function parseJsonFromText(text: string) {
    const t = (text || "").trim()
    if (!t) throw new Error("Empty response")
    if (t.startsWith("<")) throw new Error("HTML returned (not JSON)")
    return JSON.parse(t)
  }
  
  async function fetchPopupNative(url: string) {
    const r = await CapacitorHttp.get({
      url,
      headers: { "Cache-Control": "no-store" },
    })
    return typeof r.data === "string" ? JSON.parse(r.data) : r.data
  }
  
  async function fetchPopupWeb(url: string) {
    const res = await fetch(url, { cache: "no-store" })
    const text = await res.text().catch(() => "")
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 120)}`)
    return await parseJsonFromText(text)
  }
  
  async function fetchPopup(): Promise<PopupJson | null> {
    try {
      if (isNative.value) {
        const url = props.url || "https://popup.ma3ankolyoum.org/popup.json"
        logDebug("native url:", url)
        return await fetchPopupNative(url)
      }
  
      for (const url of WEB_CANDIDATES.value) {
        try {
          logDebug("web try:", url)
          const data = await fetchPopupWeb(url)
          debugHint.value = props.debug ? `✅ loaded from: ${url}` : ""
          return data
        } catch (e: any) {
          logDebug("web failed:", url, e?.message || e)
          debugHint.value = props.debug ? `❌ failed: ${url} (${e?.message || e})` : ""
        }
      }
      return null
    } catch (e: any) {
      console.error("[MKY_POPUP] fetch failed:", e?.message || e, e)
      return null
    }
  }
  
  async function maybeOpen() {
    logDebug("enabled:", props.enabled)
    if (!props.enabled) return
  
    const data = await fetchPopup()
    logDebug("fetched:", data)
  
    if (!data?.id) return
    if (!data.activeFrom || !data.activeTo) return
  
    const today = todayISO()
    if (!inRange(today, data.activeFrom, data.activeTo)) return
  
    if (getDailyCount() >= 200) return
    if (wasShownThisSession(data.id)) return
  
    popup.value = data
    isOpen.value = true
    markShownThisSession(data.id)
  
    logDebug("OPENED ✅")
  }
  
  function close(_reason: "x" | "backdrop" | "cta") {
    if (!isOpen.value) return
    isOpen.value = false
    incDailyCount()
  }
  
  /** mky://notes -> /notes , mky://chapter/Matthew/21 -> /chapter/Matthew/21 */
  function parseMkyDeeplink(url: string) {
    const u = String(url || "").trim()
    if (!u.startsWith("mky://")) return null
    const path = u.replace("mky://", "/")
    return path.startsWith("/") ? path : `/${path}`
  }
  
  async function openExternal(url: string) {
    if (!url) return
    if (isNative.value) {
      await Browser.open({ url })
    } else {
      window.open(url, "_blank", "noopener")
    }
  }
  


async function goUpdate() {
  const android = "https://play.google.com/store/apps/details?id=com.nancyhenry.ma3ankolyoum"

  // Try multiple iOS deep links (some devices prefer one over the other)
  const iosItmsCandidates = [
    "itms-apps://apps.apple.com/app/id6756967997",
    "itms-apps://itunes.apple.com/app/id6756967997",
  ]
  const iosHttps = "https://apps.apple.com/app/id6756967997"

  const p = Capacitor.getPlatform()
  console.log("[MKY_POPUP] goUpdate platform:", p)

  if (p === "ios") {
    // NOTE: simulator often won't do anything here (no App Store app)
    for (const url of iosItmsCandidates) {
      try {
        console.log("[MKY_POPUP] trying AppLauncher.openUrl:", url)
        await AppLauncher.openUrl({ url })
        console.log("[MKY_POPUP] openUrl success:", url)
        return
      } catch (e) {
        console.log("[MKY_POPUP] openUrl failed:", url, e)
      }
    }

    // Fallback: open HTTPS in in-app browser (will work even on simulator)
    console.log("[MKY_POPUP] fallback Browser.open:", iosHttps)
    await Browser.open({ url: iosHttps })
    return
  }

  if (p === "android") {
    await Browser.open({ url: android })
    return
  }

  // web
  const isIOSWeb = /iPhone|iPad|iPod/i.test(navigator.userAgent || "")
  window.open(isIOSWeb ? iosHttps : android, "_blank", "noopener")
}

  
  async function onCta(cta?: PopupCta) {
    if (!cta) return
    try {
      if (cta.action === "update") {
        await goUpdate()
        close("cta")
        return
      }
  
      if (cta.action === "deeplink" && "url" in cta) {
        const routePath = parseMkyDeeplink(cta.url)
        if (routePath) {
          close("cta")
          await router.push(routePath)
          return
        }
        await openExternal(cta.url)
        close("cta")
        return
      }
  
      if (cta.action === "url" && "url" in cta) {
        await openExternal(cta.url)
        close("cta")
        return
      }
    } catch (e) {
      console.error(e)
    }
  }
  
  /** make <a href="mky://..."> inside html work */
  function onCardClick(e: MouseEvent) {
    const el = e.target as HTMLElement | null
    if (!el) return
    const a = el.closest("a") as HTMLAnchorElement | null
    if (!a) return
    const href = a.getAttribute("href") || ""
    if (href.startsWith("mky://")) {
      e.preventDefault()
      void onCta({ label: "open", action: "deeplink", url: href })
    }
  }
  
  onMounted(() => {
    void maybeOpen()
  })
  </script>
  
  <style scoped>
  /* Uses CSS vars so it works in light/dark */
  .hpOverlay {
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: rgba(0, 0, 0, 0.45);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 18px;
  }
  
  .hpCard {
    width: min(560px, 100%);
    max-height: 85vh;
    overflow: auto;
    border-radius: 22px;
    background: var(--ion-background-color, #fff);
    color: var(--ion-text-color, #0b1f33);
    border: 1px solid rgba(255, 255, 255, 0.12);
    box-shadow: 0 24px 70px rgba(0, 0, 0, 0.28);
    padding: 16px 16px 14px;
  }
  
  .hpHeader {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 10px;
  }
  
  .hpTitle {
    font-weight: 1000;
    font-size: 18px;
    line-height: 1.3;
  }
  
  .hpClose {
    appearance: none;
    border: 0;
    background: rgba(255, 255, 255, 0.12);
    color: inherit;
    width: 38px;
    height: 38px;
    border-radius: 14px;
    cursor: pointer;
    font-weight: 1000;
    line-height: 1;
  }
  
  .hpBody {
    padding: 6px 2px 10px;
  }
  
  .hpHtml {
    font-weight: 800;
    line-height: 1.9;
  }
  
  .hpVideoWrap {
    margin-top: 12px;
  }
  
  .hpVideo {
    border-radius: 18px;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.12);
  }
  
  .hpVideo iframe {
    width: 100%;
    aspect-ratio: 16 / 9;
    display: block;
  }
  
  /* iOS native thumbnail */
  .hpYtThumbBtn {
    position: relative;
    width: 100%;
    border: 0;
    padding: 0;
    background: transparent;
    border-radius: 18px;
    overflow: hidden;
    cursor: pointer;
    border: 1px solid rgba(255, 255, 255, 0.12);
  }
  
  .hpYtThumb {
    width: 100%;
    display: block;
  }
  
  .hpYtPlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 54px;
    color: #fff;
    text-shadow: 0 10px 26px rgba(0, 0, 0, 0.55);
    background: linear-gradient(to bottom, rgba(0, 0, 0, 0.04), rgba(0, 0, 0, 0.35));
  }
  
  .hpYtHint {
    position: absolute;
    bottom: 10px;
    right: 10px;
    font-weight: 1000;
    font-size: 12px;
    color: #fff;
    padding: 6px 10px;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.35);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }
  
  .hpActions {
    display: flex;
    gap: 10px;
    justify-content: flex-start;
    flex-wrap: wrap;
    margin-top: 10px;
  }
  
  .hpBtn {
    --border-radius: 14px;
    font-weight: 900;
  }
  
  .hpDebug {
    margin-top: 10px;
    font-size: 12px;
    font-weight: 800;
    opacity: 0.65;
    direction: ltr;
    text-align: left;
    white-space: pre-wrap;
  }
  </style>
  