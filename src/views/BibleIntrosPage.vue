<template>
    <ion-page dir="rtl" lang="ar">
      <ion-header>
        <ion-toolbar>
          <ion-buttons slot="start">
            <ion-back-button default-href="/" />
          </ion-buttons>
  
          <ion-title>مقدمات أسفار الكتاب المقدس</ion-title>
  
          <ion-buttons slot="end">
            <ion-button fill="clear" @click="refresh">
              <ion-icon :icon="refreshOutline" />
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
  
      <ion-content class="ion-padding">
        <ion-card v-if="loading">
          <ion-card-content>تحميل…</ion-card-content>
        </ion-card>
  
        <ion-card v-else-if="!items.length">
          <ion-card-content>لا توجد بيانات</ion-card-content>
        </ion-card>
  
        <div v-else>
  <ion-searchbar
    v-model="searchQuery"
    class="introSearch"
    placeholder="ابحث باسم السفر..."
    inputmode="search"
    :debounce="120"
  />

  <ion-accordion-group v-model="openedAccordions" :multiple="true" class="introAccGroup">
    <ion-accordion value="old">
      <ion-item slot="header" class="introAccHead">
        <ion-label>
          عهد قديم
          <span class="accCount">{{ oldItems.length }}</span>
        </ion-label>
      </ion-item>

      <div slot="content" class="video-list">
        <div v-if="!oldItems.length" class="emptyMsg">
          لا توجد نتائج في العهد القديم.
        </div>

        <div class="video-card" v-for="it in oldItems" :key="it.youtubeId">
          <div class="title">{{ it.name }}</div>

          <div class="frame">
            <button
              v-if="isIOS"
              class="iosVideoBtn"
              type="button"
              @click="openVideo(it.youtubeId)"
            >
              <span class="playIcon">▶</span>
              تشغيل الفيديو
            </button>

            <iframe
              v-else
              :src="youtubeEmbed(it.youtubeId)"
              :title="it.name"
              loading="lazy"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowfullscreen
            />
          </div>
        </div>
      </div>
    </ion-accordion>

    <ion-accordion value="new">
      <ion-item slot="header" class="introAccHead">
        <ion-label>
          عهد جديد
          <span class="accCount">{{ newItems.length }}</span>
        </ion-label>
      </ion-item>

      <div slot="content" class="video-list">
        <div v-if="!newItems.length" class="emptyMsg">
          لا توجد نتائج في العهد الجديد.
        </div>

        <div class="video-card" v-for="it in newItems" :key="it.youtubeId">
          <div class="title">{{ it.name }}</div>

          <div class="frame">
            <button
              v-if="isIOS"
              class="iosVideoBtn"
              type="button"
              @click="openVideo(it.youtubeId)"
            >
              <span class="playIcon">▶</span>
              تشغيل الفيديو
            </button>

            <iframe
              v-else
              :src="youtubeEmbed(it.youtubeId)"
              :title="it.name"
              loading="lazy"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowfullscreen
            />
          </div>
        </div>
      </div>
    </ion-accordion>
  </ion-accordion-group>
</div>
      </ion-content>
    </ion-page>
  </template>
  
  <script setup lang="ts">
  import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonBackButton,
  IonCard,
  IonCardContent,
  IonSearchbar,
  IonAccordionGroup,
  IonAccordion,
  IonItem,
  IonLabel
} from '@ionic/vue'
import { ref, onMounted, computed, watch } from 'vue'
  import { refreshOutline } from 'ionicons/icons'
  import { Capacitor } from '@capacitor/core'
  import { Browser } from '@capacitor/browser'
  
  import { fetchBibleVideos, type BibleVideoRow } from '@/services/sheets'
  
  const loading = ref(true)
  const items = ref<BibleVideoRow[]>([])
    const searchQuery = ref('')
    const openedAccordions = ref(['old'])
  /**
   * ✅ Use ONE iOS detection:
   * - works on iOS native
   * - works on iOS simulator
   * - works on Safari web
   */
  const isIOS = computed(() => {
    const p = Capacitor.getPlatform()
    return p === 'ios' || /iPad|iPhone|iPod/.test(navigator.userAgent)
  })
  
  function youtubeEmbed(id: string) {
    const clean = String(id || '').trim()
    // nocookie + playsinline better for webview
    return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(clean)}?rel=0&modestbranding=1&playsinline=1`
  }
  function normalizeText(s: string) {
  return String(s || '')
    .toLowerCase()
    .trim()
    .replace(/[إأآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
}

const filteredItems = computed(() => {
  const q = normalizeText(searchQuery.value)

  return items.value.filter(it => {
    const isIntro = String(it.type || '').toLowerCase().trim() === 'intro'
    const matchesName = !q || normalizeText(it.name).includes(q)

    return isIntro && matchesName
  })
})

const oldItems = computed(() =>
  filteredItems.value.filter(it =>
    String((it as any).testement || '').toLowerCase().trim() === 'old'
  )
)

const newItems = computed(() =>
  filteredItems.value.filter(it =>
    String((it as any).testement || '').toLowerCase().trim() === 'new'
  )
)
  async function openVideo(id: string) {
    const clean = String(id || '').trim()
    if (!clean) return
    await Browser.open({
      url: `https://www.youtube.com/watch?v=${encodeURIComponent(clean)}`
    })
  }
  
  async function load(force = false) {
    loading.value = true
    try {
      const all = await fetchBibleVideos(force)
      items.value = all
        } catch (e) {
      console.error(e)
      items.value = []
    } finally {
      loading.value = false
    }
  }
  
  async function refresh() {
    await load(true)
  }
  
  onMounted(() => {
    load(false).catch(console.error)
  })
  watch(searchQuery, () => {
  const open: string[] = []

  if (oldItems.value.length) open.push('old')
  if (newItems.value.length) open.push('new')

  openedAccordions.value = open.length ? open : ['old']
})
  </script>
  
  <style scoped>
  .video-list{
    display: grid;
    gap: 14px;
    padding-bottom: 12px;
  }
  
  .video-card{
    position: relative;
    border-radius: 18px;
    padding: 12px 12px 14px;
    background: color-mix(in srgb, var(--ion-background-color) 70%, #ffffff 30%);
    border: 1px solid color-mix(in srgb, var(--ion-text-color) 10%, transparent);
    box-shadow:
      0 10px 24px rgba(0,0,0,0.08),
      0 2px 6px rgba(0,0,0,0.05);
    overflow: hidden;
    transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
  }
  
  /* subtle top glow */
  .video-card::before{
    content: "";
    position: absolute;
    inset: -40% -20% auto -20%;
    height: 120px;
    background: radial-gradient(closest-side, rgba(0, 200, 190, 0.18), transparent 70%);
    pointer-events: none;
    filter: blur(2px);
  }
  
  @media (hover:hover){
    .video-card:hover{
      transform: translateY(-1px);
      box-shadow:
        0 14px 30px rgba(0,0,0,0.10),
        0 4px 10px rgba(0,0,0,0.06);
      border-color: color-mix(in srgb, var(--ion-color-primary) 35%, transparent);
    }
  }
  
  .title{
    font-weight: 900;
    font-size: 15px;
    line-height: 1.5;
    margin: 2px 4px 10px;
    color: var(--ion-text-color);
    letter-spacing: 0.1px;
  
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  /* ✅ ONE fixed 16:9 frame (works everywhere) */
  .frame{
    position: relative;
    width: 100%;
    padding-top: 56.25%; /* 16:9 */
    border-radius: 16px;
    overflow: hidden;
    background: rgba(0,0,0,0.06);
    border: 1px solid color-mix(in srgb, var(--ion-text-color) 10%, transparent);
  }
  
  /* iframe fills the frame */
  .frame iframe{
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    border: 0;
    display: block;
  }
  
  /* iOS button overlay fills the same frame */
  .iosVideoBtn{
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    border: 0;
    cursor: pointer;
  
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
  
    font-weight: 1000;
    font-size: 16px;
    color: var(--ion-text-color);
  
    background:
      radial-gradient(520px 160px at 20% 0%, rgba(40,214,204,0.20), transparent 62%),
      rgba(255,255,255,0.80);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }
  
  .playIcon{
    font-size: 18px;
    transform: translateY(-1px);
  }
  
  /* Small screens */
  @media (max-width: 360px){
    .video-card{
      padding: 10px 10px 12px;
      border-radius: 16px;
    }
    .frame{
      border-radius: 14px;
    }
    .title{
      font-size: 14px;
      margin-bottom: 8px;
    }
  }
  
  /* Dark theme tweaks */
  :global(body.theme-dark) .video-card{
    background: color-mix(in srgb, var(--ion-background-color) 88%, #0b1f22 12%);
    border-color: rgba(255,255,255,0.08);
    box-shadow:
      0 14px 30px rgba(0,0,0,0.35),
      0 4px 10px rgba(0,0,0,0.22);
  }
  
  :global(body.theme-dark) .frame{
    background: rgba(255,255,255,0.04);
    border-color: rgba(255,255,255,0.08);
  }
  
  :global(body.theme-dark) .iosVideoBtn{
    background:
      radial-gradient(520px 160px at 20% 0%, rgba(40,214,204,0.18), transparent 62%),
      rgba(0,0,0,0.35);
    color: #fff;
  }
  .introSearch {
  --border-radius: 16px;
  --box-shadow: 0 8px 20px rgba(0,0,0,0.06);
  --background: color-mix(in srgb, var(--ion-background-color) 76%, #ffffff 24%);
  --placeholder-color: color-mix(in srgb, var(--ion-text-color) 55%, transparent);
  --color: var(--ion-text-color);
  padding: 0;
  margin-bottom: 14px;
  direction: rtl;
}

.introAccGroup {
  display: grid;
  gap: 14px;
}

ion-accordion {
  border-radius: 18px;
  overflow: hidden;
  background: color-mix(in srgb, var(--ion-background-color) 76%, #ffffff 24%);
  border: 1px solid color-mix(in srgb, var(--ion-text-color) 10%, transparent);
  box-shadow:
    0 10px 24px rgba(0,0,0,0.08),
    0 2px 6px rgba(0,0,0,0.05);
}

.introAccHead {
  --background:
    radial-gradient(500px 160px at 20% 0%, rgba(40,214,204,0.18), transparent 62%),
    color-mix(in srgb, var(--ion-background-color) 78%, #ffffff 22%);
  --color: var(--ion-text-color);
  font-weight: 1000;
  font-family: "Noto Kufi Arabic", system-ui, sans-serif;
}

.introAccHead ion-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 16px;
  font-weight: 1000;
}

.accCount {
  min-width: 30px;
  height: 26px;
  padding: 0 9px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(40,214,204,0.14);
  border: 1px solid rgba(40,214,204,0.24);
  font-size: 13px;
}

.emptyMsg {
  padding: 14px;
  text-align: center;
  font-weight: 900;
  opacity: .7;
}

ion-accordion .video-list {
  padding: 12px;
}
  </style>
  