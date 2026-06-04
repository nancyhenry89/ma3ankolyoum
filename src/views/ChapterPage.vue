<!-- src/views/ChapterPage.vue (FULL FIXED FILE) -->
<template>
  <ion-page dir="rtl" class="chapter" :style="chapterVars">
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button fill="clear" @click="goHome">
            <IonIcon class="toolbarHomeIcon" :icon="homeOutline" />
</ion-button>
        </ion-buttons>
        <ion-title>{{ headerTitle }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content ref="contentRef" :fullscreen="true">
      <div class="wrap">
        <!-- مقدمة السفر -->
        <div v-if="introAvailable" class="introBox">
          <div class="introTitle">{{ introAvailable.title }}</div>

          <div class="videoWrap">
            <button v-if="isIOSNative" class="iosVideoBtn" type="button" @click="openIntroVideo">
              ▶ تشغيل الفيديو
            </button>

            <iframe
              v-else
              :src="`https://www.youtube.com/embed/${introAvailable.youtubeId}`"
              :title="introAvailable.title"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen
            />
          </div>
        </div>

        <div class="videoNote">💡 اضغط على الآية لعرض التفسير</div>

        <div class="chapterTitle">{{ chapterTitle }}</div>

        <!-- Saved open (old functionality stays) -->
        <button class="savedOpenBtn" type="button" @click="openSavedSheet">
          🕊 صوت الله
          <span class="savedCount">{{ savedAll.length }}</span>
        </button>

        <button class="topCtaBtn" type="button" @click="openTopModal">
          🔥 الآيات الأكثر حفظًا في هذا الأصحاح
          <span class="topCtaHint">اضغط للعرض</span>
        </button>

        <!-- ✅ SETTINGS (keep) -->
<!-- ✅ SETTINGS ACCORDION -->
<div class="chapterSettingsAcc">
  <button
    class="chapterSettingsHead"
    type="button"
    @click="settingsOpen = !settingsOpen"
  >
    <span>⚙️ إعدادات الصفحة</span>
    <IonIcon
  class="settingsChevron"
  :class="{ open: settingsOpen }"
  :icon="chevronDownOutline"
/>  </button>

  <div v-if="settingsOpen" class="chapterSettingsBody">
    <ChapterSettingsBox v-model="chapterSettings" :fonts="verseFonts" />
  </div>
</div>
        <!-- ✅ AUDIO (keep) -->
        <ChapterAudioCta :book-slug="bookSlug" :chapter="chapterNum" :book-label="data?.bookName || bookKey" />
        <div class="chapterNav chapterNavTop">
  <button
    class="chapterNavBtn prev"
    type="button"
    :disabled="!prevChapter"
    @click="goToChapter(prevChapter)"
  >
  <IonIcon :icon="arrowForwardOutline" />
    <span>الأصحاح السابق</span>
  </button>

  <button
    class="chapterNavBtn next"
    type="button"
    :disabled="!nextChapter"
    @click="goToChapter(nextChapter)"
  >
    <span>الأصحاح التالي</span>
    <IonIcon :icon="arrowBackOutline" />
  </button>
</div>
<div ref="chapterTitleRef" class="chapterPageTitle">
  {{ headerTitle }}
</div>
        <div id="versesAnchor" class="verses">
          <div
            v-for="v in verses"
            :key="v.n"
            class="verseBlock"
            :class="{
    flashVerse: flashVerse === v.n,
    hasVideo: verseHasVideo(v.n),
    isBookmarked: isVerseBookmarked(v.n)
  }"
            :id="`v-${v.n}`"
          >
            <!-- Section title -->
            <div v-if="sectionTitleAt(v.n)" class="sectionInline">
              {{ sectionTitleAt(v.n) }}
            </div>

            <!-- Row -->
            <div class="verseRow">
              <button class="verseMain" type="button" @click="toggleVerse(v.n)">
                <div class="num">{{ v.n }}</div>
                <div class="txt">{{ v.t }}</div>

                <div class="chev">
                  <IonIcon :icon="chevronForwardOutline" :class="{ open: isOpen(v.n) }" />
                </div>
              </button>

              <!-- Firebase bookmark button -->
              <div class="bmWrap">
                <button
                  class="saveBtn"
                  :class="{ isSaved: isVerseBookmarked(v.n) }"
                  type="button"
                  :disabled="!!bmBusy[v.n]"
                  @click.stop="toggleFirebaseBookmark(v.n, v.t)"
                >
                  <IonIcon :icon="savedIconFirebase(v.n)" />
                </button>

                <!-- Count badge -->
                <button
                  v-if="bmCounts[v.n] != null && bmCounts[v.n] > 0"
                  class="bmCount"
                  type="button"
                  @click.stop="openBmTooltip($event, v.n)"
                  aria-label="Bookmark count"
                >
                  {{ bmCounts[v.n] }}
                </button>
              </div>
            </div>

            <!-- Tafsir -->
            <div v-if="isOpen(v.n)" class="tafsirBox">
              <!-- ✅ Verse Video (if available) -->
<VerseVideo
  v-if="getVideoForVerse(v.n)"
  :type="getVideoForVerse(v.n)!.type"
  :vid="getVideoForVerse(v.n)!.vid"
/>

<!-- ✅ Image (if available) -->
<img
  v-if="getImageForVerse(v.n)"
  class="tafsirImage"
  :src="getImageForVerse(v.n)!"
  alt=""
  loading="lazy"
/>
              <!-- Refs -->
              <div v-if="getRefs(v.n).length" class="refsInline">
                <button
                  v-for="r in getRefs(v.n)"
                  :key="`${r.toBookUsfm}-${r.toChapter}-${r.toVerse}`"
                  class="refChip"
                  type="button"
                  @click.stop="openVerseRefsModal(v.n)"
                >
                  🔗 {{ r.labelAr }}
                </button>
              </div>

              <div v-if="tafsirLoading" class="tafsirHint">جاري تحميل التفسير…</div>

              <div v-else>
                <div v-if="getTafsirForVerse(v.n)" class="tafsirText">
                  {{ getTafsirForVerse(v.n) }}
                </div>
                <div v-else class="tafsirHint">لا يوجد تفسير لهذه الآية حاليًا.</div>
              </div>
            </div>
          </div>
        </div>
        <div class="chapterNav chapterNavBottom">
  <button
    class="chapterNavBtn prev"
    type="button"
    :disabled="!prevChapter"
    @click="goToChapter(prevChapter)"
  >
  <IonIcon :icon="arrowForwardOutline" />
    <span>الأصحاح السابق</span>
  </button>

  <button
    class="chapterNavBtn next"
    type="button"
    :disabled="!nextChapter"
    @click="goToChapter(nextChapter)"
  >
    <span>الأصحاح التالي</span>
    <IonIcon :icon="arrowBackOutline" />
  </button>
</div>
        <div class="space"></div>

        <BibleQuizSection :book="bookKey" :chapter="chapterNum" :mcq-count="2" :seconds="90" />
      </div>
    </ion-content>

    <!-- ✅ Saved Sheet (old functionality stays) -->
    <ion-modal
      dir="rtl"
      :is-open="showSaved"
      @didDismiss="showSaved = false"
      :backdrop-dismiss="false"
      class="savedSheet"
    >
      <ion-toast
        :is-open="showSavedToast"
        message="✓ تم الحفظ"
        duration="1000"
        position="bottom"
        css-class="savedToast"
        @didDismiss="showSavedToast = false"
      />

      <ion-header class="savedHeader">
        <ion-toolbar>
          <ion-title> 🕊 صوت الله ⛪</ion-title>
          <ion-buttons slot="end">
            <ion-button fill="clear" @click="showSaved = false">إغلاق</ion-button>
          </ion-buttons>
        </ion-toolbar>

        <div class="savedSearchWrap">
          <input
            class="savedSearch"
            type="search"
            v-model="savedQuery"
            inputmode="search"
            placeholder="🔎 ابحث في الآيات أو اسم السفر…"
            @click.stop
            @mousedown.stop
            @touchstart.stop
          />
          <button v-if="savedQuery" class="savedClear" type="button" @click.stop="savedQuery = ''" aria-label="Clear search">
            ✕
          </button>
        </div>
      </ion-header>

      <ion-content class="savedBody" :scroll-y="true" :scroll-events="true">
        <div v-if="!filteredSaved.length" class="savedEmpty">لا توجد آيات محفوظة.</div>

        <div v-else class="savedList">
          <div v-for="item in filteredSaved" :key="`${item.bookKey}-${item.chapter}-${item.verse}`" class="savedCard">
            <div class="savedTopRow">
              <button class="savedOpen" type="button" @click="openSavedVerse(item)">
                <div class="savedRef">
                  <span class="savedBook">{{ item.bookName }}</span>
                  <span class="savedLoc">{{ item.chapter }} • {{ item.verse }}</span>
                </div>
              </button>

              <button class="savedRemove" type="button" @click="removeSaved(item)" aria-label="Remove saved verse">✕</button>
            </div>

            <div class="savedText">{{ item.text }}</div>

            <textarea
              class="savedNote"
              :value="item.note || ''"
              @input="onNoteInput(item, $event)"
              placeholder="✍️ اكتب ملاحظتك أو تأملك على هذه الآية…"
              @click.stop
              @mousedown.stop
              @touchstart.stop
            />

            <button class="saveNoteBtn" type="button" @click.stop="saveNoteManual(item)">💾 حفظ</button>
          </div>
        </div>
      </ion-content>
    </ion-modal>

    <!-- ✅ Top modal -->
    <ion-modal dir="rtl" :is-open="showTopModal" @didDismiss="closeTopModal" class="topModal">
      <ion-header>
        <ion-toolbar>
          <ion-title>🔥 الآيات الأكثر حفظًا</ion-title>
          <ion-buttons slot="end">
            <ion-button fill="clear" @click="showTopModal = false">إغلاق</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>

      <ion-content class="ion-padding">
        <div v-if="!topBookmarkedWithText.length" class="topEmpty">لا توجد بيانات حاليًا.</div>

        <div v-else class="topModalList">
          <div v-for="x in topBookmarkedWithText" :key="x.verse" class="topModalCard">
            <div class="topModalHead">
              <div class="topModalMeta">
                <span class="topModalVerse">آية {{ x.verse }}</span>
                <button class="topModalCount" type="button" @click.stop="openBmTooltip($event, x.verse)">⭐ {{ x.count }}</button>
              </div>

              <button
                class="topModalSave"
                :class="{ isSaved: isVerseBookmarked(x.verse) }"
                type="button"
                @click.stop="toggleFirebaseBookmark(x.verse, x.text)"
                aria-label="Bookmark"
              >
                <IonIcon :icon="savedIconFirebase(x.verse)" />
              </button>
            </div>

            <button class="topModalOpen" type="button" @click="toggleVerse(x.verse)">{{ x.text }}</button>
          </div>
        </div>
      </ion-content>
    </ion-modal>

    <!-- ✅ Bookmark tooltip -->
    <ion-popover
      :is-open="bmPopoverOpen"
      :event="bmPopoverEvent"
      @didDismiss="bmPopoverOpen = false"
      class="bmPopover"
      translucent
      side="top"
      alignment="center"
    >
      <div class="bmTip">{{ bmPopoverText }}</div>
    </ion-popover>

    <!-- ✅ Refs modal -->
    <ion-modal dir="rtl" :is-open="showRefsModal" @didDismiss="showRefsModal = false" class="refModal">
      <ion-header>
        <ion-toolbar>
          <ion-title>الشواهد</ion-title>
          <ion-buttons slot="end">
            <ion-button fill="clear" @click="showRefsModal = false">إغلاق</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>

      <ion-content class="ion-padding">
        <div v-if="refsModalLoading" class="tafsirHint">جاري التحميل…</div>

        <div v-else-if="!refsModalItems.length" class="tafsirHint">لا توجد شواهد لهذه الآية.</div>

        <div v-else class="refsPopupList">
          <button
            v-for="it in refsModalItems"
            :key="`${it.toBookUsfm}-${it.toChapter}-${it.toVerse}`"
            class="refsPopupItem"
            type="button"
            @click="goToRef(it)"
          >
            <div class="refsPopupLabel">ᯓ➤ {{ it.labelAr }}</div>
            <div class="refsPopupText">{{ it.previewText }}</div>
          </button>
        </div>
      </ion-content>
    </ion-modal>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonModal,
  IonButton,
  IonIcon,
  IonPopover,
  IonToast
} from "@ionic/vue"
import { BOOKS } from '@/data/bibleBooks'
import { computed, onMounted, ref, nextTick, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import Papa from "papaparse"
import {   arrowForwardOutline,
  arrowBackOutline,
  homeOutline,chevronForwardOutline, chevronDownOutline, bookmarkOutline, bookmark } from "ionicons/icons"
import { Capacitor } from "@capacitor/core"
import { Browser } from "@capacitor/browser"
import { onIonViewWillLeave, onIonViewDidEnter } from "@ionic/vue"
import { getBibleChapter } from '@/services/bibleOffline'
import { loadRefsIndex, getRefsFor, type RefLink } from "@/services/verseRefs"
import { readChapterCache, writeChapterCache, readTafsirCache, writeTafsirCache } from "@/utils/chapterCache"
import { listSavedVerses, toggleVerseSaved, type SavedVerse, upsertVerseNote } from "@/services/verseSaves"
import { listenChapterBookmarkCounts, listenTopBookmarkedVerses, toggleVerseBookmark, peopleText } from "@/services/verseBookmarks"

import BibleQuizSection from "@/components/BibleQuizSection.vue"
import ChapterSettingsBox, { type ChapterSettingsStateV2 } from "@/components/ChapterSettingsBox.vue"
import ChapterAudioCta from "@/components/ChapterAudioCta.vue"
import VerseVideo from "@/components/VerseVideo.vue"
/* =========================
   SETTINGS (ONE STATE ONLY)
========================= */
const verseFonts = [
  { label: "Scheherazade New", value: `"Scheherazade New", serif` },
  { label: "Amiri", value: `"Amiri", serif` },
  { label: "Noto Naskh Arabic", value: `"Noto Naskh Arabic", system-ui, sans-serif` },
  { label: "Noto Kufi Arabic", value: `"Noto Kufi Arabic", system-ui, sans-serif` }
]

const chapterSettings = ref<ChapterSettingsStateV2>({
  fontScale: 1,
  verseFont: verseFonts[0].value
})

const chapterVars = computed(() => ({
  "--mk-font-scale": String(chapterSettings.value.fontScale || 1),
  "--mk-verse-font": String(chapterSettings.value.verseFont || verseFonts[0].value)
}))

/* =========================
   ROUTE + BASIC
========================= */
const route = useRoute()
const router = useRouter()

const isIOSNative = computed(() => Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios")

// Your current URL is like: /tabs/chapter/mark/11?d=2026-02-16
const bookKey = computed(() => String(route.params.bookKey || "mark"))
const chapterNum = computed(() => Number(route.params.chapter || 1))

// ✅ Audio slug must follow URL (mark/11 => mark/11.mp3)
const bookSlug = computed(() => String(bookKey.value || "").toLowerCase())
async function goHome() {
  await router.replace('/tabs/home')
}
type ChapterJSON = {
  bookKey: string
  bookName: string
  chapter: number
  chapterTitle: string
  intro?: { title: string; youtubeId: string }
  sections: { title: string; fromVerse: number; toVerse: number }[]
  verses: { n: number; t: string }[]
}

type TafsirRow = {
  bookKey: string
  chapter: number
  fromVerse: number
  toVerse: number
  tafsir: string

  // ✅ new optional columns
  verse_num?: number
  vid?: string
  type?: "youtube" | "r2" | string
  image?: string
}

const data = ref<ChapterJSON | null>(null)

const introAvailable = computed(() => {
  const i = data.value?.intro
  if (!i) return null
  const id = String(i.youtubeId || "").trim()
  if (!id) return null
  return { ...i, youtubeId: id }
})

const sections = computed(() => data.value?.sections || [])
const verses = computed(() => data.value?.verses || [])
const chapterTitle = computed(() => data.value?.chapterTitle || "")

const headerTitle = computed(() => {
  const name = data.value?.bookName || bookKey.value
  const ch = data.value?.chapter || chapterNum.value
  return `${name} ${ch}`
})

/* =========================
   CONTENT BASE
========================= */
const CONTENT_BASE = Capacitor.isNativePlatform()
  ? "https://nancyhenry89.github.io/ma3ankolyoum/content"
  : `${import.meta.env.BASE_URL}content`.replace(/\/$/, "")

async function fetchChapterJson(routeBookKey: string, ch: number) {
  const slug = String(routeBookKey || "").toLowerCase()
  const url = `${CONTENT_BASE}/bible/${slug}/${ch}.json`
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) throw new Error("Chapter not found")
  return await res.json()
}
async function scrollToChapterTitle() {
  await nextTick()
  await new Promise(resolve => setTimeout(resolve, 350))

  const ion = contentRef.value
  const titleEl = chapterTitleRef.value

  if (!ion || !titleEl) return

  const y = titleEl.offsetTop - 12

  if (ion.scrollToPoint) {
    await ion.scrollToPoint(0, Math.max(0, y), 350)
    return
  }

  const ionEl = ion.$el ?? ion
  if (ionEl?.scrollToPoint) {
    await ionEl.scrollToPoint(0, Math.max(0, y), 350)
  }
}
async function goToChapter(ch: number | null) {
  if (!ch) return

  shouldScrollToChapterTitle.value = true

  openVerse.value = null
  bmPopoverOpen.value = false
  showRefsModal.value = false

  await router.push({
    path: `/tabs/chapter/${currentBookDef.value?.slug || bookSlug.value}/${ch}`,
    query: { d: String(route.query.d || '') || undefined }
  })
}
const currentBookDef = computed(() => {
  const key = String(bookKey.value).toLowerCase()
  return BOOKS.find(
    b =>
      b.key.toLowerCase() === key ||
      b.slug.toLowerCase() === key
  ) || null
})

const prevChapter = computed(() => {
  return chapterNum.value > 1 ? chapterNum.value - 1 : null
})

const nextChapter = computed(() => {
  const max = currentBookDef.value?.maxChapters || 1
  return chapterNum.value < max ? chapterNum.value + 1 : null
})
/* =========================
   SCROLL SAVE/RESTORE (kept)
========================= */
const contentRef = ref<any>(null)
  const chapterTitleRef = ref<HTMLElement | null>(null)
let restoreScroll = false
let lastScrollTop = 0

async function getIonScrollEl() {
  const ion = contentRef.value?.$el ?? contentRef.value
  if (!ion?.getScrollElement) return null
  return await ion.getScrollElement()
}

async function saveScrollPos() {
  const el = await getIonScrollEl()
  if (!el) return
  lastScrollTop = el.scrollTop || 0
  restoreScroll = true
}

async function restoreScrollPos() {
  if (!restoreScroll) return
  const ion = contentRef.value?.$el ?? contentRef.value
  if (ion?.scrollToPoint) {
    await ion.scrollToPoint(0, lastScrollTop, 0)
  } else {
    const el = await getIonScrollEl()
    el?.scrollTo({ top: lastScrollTop, behavior: "auto" })
  }
  restoreScroll = false
}

async function scrollToVerse(verseNum: number) {
  await nextTick()
  const contentEl = contentRef.value?.$el
  const scrollEl: HTMLElement | null = contentEl?.getScrollElement ? await contentEl.getScrollElement() : null
  if (!scrollEl) return

  const target = document.getElementById(`v-${verseNum}`)
  if (!target) return

  const y = target.offsetTop - 16

  if (contentEl?.scrollToPoint) {
    await contentEl.scrollToPoint(0, y, 350)
  } else {
    scrollEl.scrollTo({ top: y, behavior: "smooth" })
  }
}

//onIonViewDidEnter(async () => {
  //await nextTick()
 // await restoreScrollPos()
//})

onIonViewWillLeave(() => {
  openVerse.value = null
  bmPopoverOpen.value = false
  showRefsModal.value = false
  refsModalVerse.value = null
})

/* =========================
   REFS (kept + fixed route)
========================= */
const REFS_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQjzkvPhVlUkLK8r6Wgw__Xsz_axf1a5KNfLEYKylE5nAg5Totczxl_2Z-rTRKpjsLCiu2n2C15G2--/pub?gid=0&single=true&output=csv"

type RefPreviewItem = RefLink & { previewText: string }

const showRefsModal = ref(false)
const refsModalLoading = ref(false)
const refsModalItems = ref<RefPreviewItem[]>([])
const refsModalVerse = ref<number | null>(null)
  const settingsOpen = ref(false)
function getRefs(n: number): RefLink[] {
  return getRefsFor(bookKey.value, chapterNum.value, n)
}

const chapterJsonCache = new Map<string, any>()
function chapterCacheKey(routeBookKey: string, ch: number) {
  return `${String(routeBookKey).toLowerCase()}|${ch}`
}
async function getChapterJsonCached(routeBookKey: string, ch: number) {
  const k = chapterCacheKey(routeBookKey, ch)
  if (chapterJsonCache.has(k)) return chapterJsonCache.get(k)
  const json = await fetchChapterJson(routeBookKey, ch)
  chapterJsonCache.set(k, json)
  return json
}

function verseTextByNum(n: number) {
  const vv = verses.value.find(x => Number(x.n) === n)
  return vv?.t || ""
}
async function loadTafsirOnce() {
  const b = String(bookKey.value).trim()
  const ch = Number(chapterNum.value)

  const cached = readTafsirCache(b, ch)
  if (cached && cached.length) {
    tafsirRows.value = cached
    return
  }

  tafsirLoading.value = true
  try {
    const res = await fetch(TAFSIR_CSV_URL, { cache: "no-store" })
    const csv = await res.text()

    const parsed = Papa.parse(csv, {
  header: true,
  skipEmptyLines: true,
  transformHeader: h =>
    String(h || "")
      .replace(/^\uFEFF/, "")     // BOM
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_")       // spaces -> _
})
    console.log("TAFSIR HEADERS:", Object.keys((parsed.data as any[])[0] || {}))
console.log("TAFSIR FIRST ROW:", (parsed.data as any[])[0])

const all = (parsed.data as any[])
  .filter(r => r.bookkey && r.chapter && r.fromverse && r.toverse)
  .map(r => ({
    bookKey: String(r.bookkey).trim(),
    chapter: Number(r.chapter),
    fromVerse: Number(r.fromverse),
    toVerse: Number(r.toverse),
    tafsir: String(r.tafsir || "").trim(),

    verse_num: r.verse_num != null && String(r.verse_num).trim() !== "" ? Number(r.verse_num) : undefined,
    vid: String(r.vid || "").trim() || undefined,
    type: String(r.type || "").trim().toLowerCase() || undefined,
    image: String(r.image || "").trim() || undefined
  }))
    const filtered = all.filter(
      r => String(r.bookKey).trim().toLowerCase() === b.toLowerCase() && Number(r.chapter) === ch
    )

    tafsirRows.value = filtered
    writeTafsirCache(b, ch, filtered)
  } catch (e) {
    console.error("Tafsir load failed", e)
  } finally {
    tafsirLoading.value = false
  }
}
async function getVerseText(routeBookKey: string, ch: number, v: number) {
  if (String(routeBookKey).toLowerCase() === String(bookKey.value).toLowerCase() && Number(ch) === Number(chapterNum.value)) {
    return verseTextByNum(v)
  }
  const chJson = await getChapterJsonCached(routeBookKey, ch)
  const vv = (chJson?.verses || []).find((x: any) => Number(x.n) === Number(v))
  return String(vv?.t || "").trim()
}

async function openVerseRefsModal(verseNum: number) {
  refsModalVerse.value = verseNum
  showRefsModal.value = true

  await loadRefsIndex(REFS_CSV_URL)
  const links = getRefsFor(bookKey.value, chapterNum.value, verseNum)

  if (!links.length) {
    refsModalItems.value = []
    refsModalLoading.value = false
    return
  }

  refsModalLoading.value = true
  refsModalItems.value = []

  try {
    const items: RefPreviewItem[] = []
    for (const r of links) {
      const txt = await getVerseText(r.toBookRoute, r.toChapter, r.toVerse)
      items.push({ ...r, previewText: txt || "—" })
    }
    refsModalItems.value = items
  } catch (e) {
    console.error(e)
    refsModalItems.value = links.map(r => ({ ...r, previewText: "تعذر تحميل النص." }))
  } finally {
    refsModalLoading.value = false
  }
}

async function goToRef(item: RefPreviewItem) {
  await saveScrollPos()
  showRefsModal.value = false

  // ✅ IMPORTANT: keep tabs route
  await router.push({
    path: `/tabs/chapter/${item.toBookRoute}/${item.toChapter}`,
    query: { v: String(item.toVerse), d: String(route.query.d || "") || undefined }
  })
}

/* =========================
   SAVED VERSES (kept)
========================= */
const showSavedToast = ref(false)
const showSaved = ref(false)
const savedAll = ref<SavedVerse[]>([])
const savedQuery = ref("")

function refreshSavedList() {
  savedAll.value = listSavedVerses()
}
function openSavedSheet() {
  refreshSavedList()
  showSaved.value = true
}

function normalizeArabic(s: string) {
  return String(s || "")
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g, "")
    .replace(/[إأآٱ]/g, "ا")
    .replace(/[ى]/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ـ/g, "")
    .replace(/\s+/g, " ")
    .trim()
}
function matchesQuery(haystack: string, q: string) {
  const hh = normalizeArabic(haystack).toLowerCase()
  const qq = normalizeArabic(q).toLowerCase()
  if (!qq) return true
  return hh.includes(qq)
}

const filteredSaved = computed(() => {
  const q = savedQuery.value.trim()
  if (!q) return savedAll.value

  return savedAll.value.filter(x => {
    const ref = `${x.bookName} ${x.chapter}:${x.verse}`
    return matchesQuery(x.text || "", q) || matchesQuery(x.bookName || "", q) || matchesQuery(ref, q) || matchesQuery(x.note || "", q)
  })
})

function saveNoteManual(item: SavedVerse) {
  const idx = savedAll.value.findIndex(
    x => x.bookKey === item.bookKey && x.chapter === item.chapter && x.verse === item.verse
  )
  const note = idx >= 0 ? savedAll.value[idx].note || "" : item.note || ""

  upsertVerseNote({
    bookKey: item.bookKey,
    bookName: item.bookName,
    chapter: item.chapter,
    verse: item.verse,
    text: item.text,
    note
  })
  showSavedToast.value = true
}

function removeSaved(item: SavedVerse) {
  toggleVerseSaved({
    bookKey: item.bookKey,
    bookName: item.bookName,
    chapter: item.chapter,
    verse: item.verse,
    text: item.text
  })
  refreshSavedList()
}

async function openSavedVerse(item: SavedVerse) {
  showSaved.value = false
  await router.push({
    path: `/tabs/chapter/${String(item.bookKey).toLowerCase()}/${item.chapter}`,
    query: { v: String(item.verse), d: String(route.query.d || "") || undefined }
  })
}

function onNoteInput(item: SavedVerse, ev: any) {
  const v = String(ev?.target?.value ?? "")
  const idx = savedAll.value.findIndex(
    x => x.bookKey === item.bookKey && x.chapter === item.chapter && x.verse === item.verse
  )
  if (idx >= 0) savedAll.value[idx].note = v
  ;(item as any).note = v
}

watch(showSaved, v => {
  if (v) refreshSavedList()
})

/* =========================
   TOP BOOKMARKED (kept)
========================= */
const showTopModal = ref(false)
const topBookmarked = ref<{ verse: number; count: number }[]>([])
let unsubTop: any = null

const topBookmarkedWithText = computed(() => {
  return topBookmarked.value.map(x => ({ ...x, text: verseTextByNum(x.verse) }))
})

async function openTopModal() {
  showTopModal.value = true
  unsubTop?.()
  unsubTop = listenTopBookmarkedVerses(bookKey.value, chapterNum.value, 5, items => {
    topBookmarked.value = items
  })
}
function closeTopModal() {
  showTopModal.value = false
  unsubTop?.()
  unsubTop = null
}

/* =========================
   TAFSIR (kept)
========================= */
const TAFSIR_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQUoB2kNCIAvyniIzgd0mm8gmkTJRMTOu_KqELNFCuOexpimx4C12-J4zyenmRmjmXm50T1O1t-fGw2/pub?gid=0&single=true&output=csv"

const tafsirRows = ref<TafsirRow[]>([])
const tafsirLoading = ref(false)
const openVerse = ref<number | null>(null)

function isOpen(n: number) {
  return openVerse.value === n
}

async function toggleVerse(n: number) {
  if (openVerse.value === n) {
    openVerse.value = null
    return
  }
  openVerse.value = n
  if (!tafsirRows.value.length) await loadTafsirOnce()
}

function getTafsirForVerse(n: number): string | null {
  const b = String(bookKey.value || "").trim().toLowerCase()
  const ch = Number(chapterNum.value || 1)

  const row = tafsirRows.value.find(r => {
    return (
      String(r.bookKey || "").trim().toLowerCase() === b &&
      Number(r.chapter) === ch &&
      n >= Number(r.fromVerse) &&
      n <= Number(r.toVerse)
    )
  })

  return row?.tafsir || null
}
function getVideoForVerse(n: number): { type: "youtube" | "r2"; vid: string } | null {
  const b = String(bookKey.value || "").trim().toLowerCase()
  const ch = Number(chapterNum.value || 1)

  const row = tafsirRows.value.find(r => {
    return (
      String(r.bookKey || "").trim().toLowerCase() === b &&
      Number(r.chapter) === ch &&
      Number(r.verse_num) === n &&
      !!r.vid &&
      (String(r.type || "").toLowerCase() === "youtube" || String(r.type || "").toLowerCase() === "r2")
    )
  })

  if (!row?.vid) return null
  const t = String(row.type).toLowerCase() as "youtube" | "r2"
  return { type: t, vid: String(row.vid) }
}

function verseHasVideo(n: number): boolean {
  return !!getVideoForVerse(n)
}

function getImageForVerse(n: number): string | null {
  const b = String(bookKey.value || "").trim().toLowerCase()
  const ch = Number(chapterNum.value || 1)

  const row = tafsirRows.value.find(r => {
    return (
      String(r.bookKey || "").trim().toLowerCase() === b &&
      Number(r.chapter) === ch &&
      Number(r.verse_num) === n &&
      !!r.image
    )
  })

  return row?.image ? String(row.image) : null
}
/* =========================
   INTRO VIDEO (kept)
========================= */
async function openIntroVideo() {
  const id = introAvailable.value?.youtubeId
  if (!id) return
  await Browser.open({ url: `https://www.youtube.com/watch?v=${id}` })
}

/* =========================
   CHAPTER LOAD (kept)
========================= */
async function refreshChapterFromNetwork(bk: string, ch: number) {
  const slug = String(bk || "").toLowerCase()
  const url = `${CONTENT_BASE}/bible/${slug}/${ch}.json`
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) return
  const json = await res.json()
  data.value = json
  writeChapterCache(bk, ch, json)
}

async function loadChapter() {
  const b = bookKey.value
  const ch = chapterNum.value

  data.value = await getBibleChapter(b, ch)
}

/* =========================
   JUMP TO VERSE FROM QUERY (kept)
========================= */
const flashVerse = ref<number | null>(null)
function flashVerseOnce(n: number) {
  flashVerse.value = n
  window.setTimeout(() => {
    if (flashVerse.value === n) flashVerse.value = null
  }, 1200)
}

async function jumpToVerseFromQuery() {
  const qv = typeof route.query.v === "string" ? Number(route.query.v) : NaN
  if (!Number.isFinite(qv)) return

  openVerse.value = qv
  if (!tafsirRows.value.length) await loadTafsirOnce()

  await nextTick()
  await nextTick()
  await scrollToVerse(qv)
  flashVerseOnce(qv)
}
const shouldScrollToChapterTitle = ref(false)
watch(
  () => [route.query.v, verses.value.length],
  async () => {
    if (!verses.value.length) return
    await jumpToVerseFromQuery()
  },
  { immediate: true }
)
watch(
  () => [route.params.bookKey, route.params.chapter],
  async () => {
    const shouldScroll = shouldScrollToChapterTitle.value
    try {
      data.value = null
      tafsirRows.value = []
      openVerse.value = null
      bmCounts.value = {}
      bmMe.value = {}

      await loadChapter()
      await loadTafsirOnce()
      attachBmListeners()

      await nextTick()

      if (shouldScroll) {
        shouldScrollToChapterTitle.value = false
        await scrollToChapterTitle()
}
    } catch (e) {
      console.error(e)
    }
  }
)
/* =========================
   SECTIONS (kept)
========================= */
function sectionTitleAt(verseNum: number): string | null {
  const s = sections.value.find(x => Number(x.fromVerse) === verseNum)
  return s ? s.title : null
}

/* =========================
   FIREBASE BOOKMARKS (kept)
========================= */
const bmCounts = ref<Record<number, number>>({})
const bmMe = ref<Record<number, boolean>>({})
const bmBusy = ref<Record<number, boolean>>({})
let unsubBm: any = null

const bmPopoverOpen = ref(false)
const bmPopoverText = ref("")
const bmPopoverEvent = ref<any>(null)

function isVerseBookmarked(n: number) {
  return !!bmMe.value[n]
}
function savedIconFirebase(n: number) {
  return isVerseBookmarked(n) ? bookmark : bookmarkOutline
}

function openBmTooltip(ev: any, verseNum: number) {
  const c = Number(bmCounts.value[verseNum] || 0)
  bmPopoverText.value = peopleText(c)
  bmPopoverEvent.value = ev
  bmPopoverOpen.value = true
}

async function toggleFirebaseBookmark(n: number, text: string) {
  if (!data.value) return
  if (bmBusy.value[n]) return
  bmBusy.value = { ...bmBusy.value, [n]: true }

  const was = !!bmMe.value[n]
  const prevCount = Number(bmCounts.value[n] || 0)

  bmMe.value = { ...bmMe.value, [n]: !was }
  bmCounts.value = { ...bmCounts.value, [n]: Math.max(0, prevCount + (was ? -1 : 1)) }

  // local save
  toggleVerseSaved({
    bookKey: bookKey.value,
    bookName: data.value.bookName,
    chapter: chapterNum.value,
    verse: n,
    text
  })
  refreshSavedList()
  showSavedToast.value = true

  try {
    await toggleVerseBookmark({
      bookKey: bookKey.value,
      bookName: data.value.bookName,
      chapter: chapterNum.value,
      verse: n,
      text
    })
  } catch (e) {
    bmMe.value = { ...bmMe.value, [n]: was }
    bmCounts.value = { ...bmCounts.value, [n]: prevCount }

    // rollback local
    toggleVerseSaved({
      bookKey: bookKey.value,
      bookName: data.value.bookName,
      chapter: chapterNum.value,
      verse: n,
      text
    })
    refreshSavedList()

    console.error(e)
  } finally {
    bmBusy.value = { ...bmBusy.value, [n]: false }
  }
}

function attachBmListeners() {
  unsubBm?.()
  unsubBm = listenChapterBookmarkCounts(bookKey.value, chapterNum.value, ({ countsByVerse, meByVerse }) => {
    bmCounts.value = countsByVerse
    bmMe.value = meByVerse
  })
}

watch([bookKey, chapterNum], () => {
  attachBmListeners()
})

/* =========================
   MOUNT
========================= */
onMounted(async () => {
  try {
    await loadChapter()
    await loadTafsirOnce()
    refreshSavedList()
    attachBmListeners()
    loadRefsIndex(REFS_CSV_URL).catch(console.error)
    await nextTick()
    await jumpToVerseFromQuery()

  } catch (e) {
    console.error(e)
  }
})
</script>

<style scoped>
.chapter {
  --mk-bg1: #eef4f8;
  --mk-bg2: #ffffff;
  --mk-text: #0b2b40;
  --mk-card: #ffffff;
  --mk-accent: #1fb6aa;
  --mk-danger: #e23b3b;

  --mk-border: rgba(11, 43, 64, 0.08);
  --mk-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);
  --mk-shadow-strong: 0 16px 34px rgba(0, 0, 0, 0.1);

  font-family: "Noto Naskh Arabic", "Noto Kufi Arabic", system-ui, sans-serif;
  color: var(--mk-text);

  /* ✅ settings defaults */
  --mk-font-scale: 1;
  --mk-verse-font: "Scheherazade New", serif;
}

/* Ionic dark mode selectors */
:global(html.ion-palette-dark) .chapter,
:global(html.dark) .chapter,
:global(body.dark) .chapter,
:global(ion-app.ion-palette-dark) .chapter,
:global(ion-app.dark) .chapter {
  --mk-bg1: #0b1620;
  --mk-bg2: #0a0f14;
  --mk-text: #ffffff;
  --mk-card: rgba(255, 255, 255, 0.07);
  --mk-accent: #1fb6aa;
  --mk-danger: #ff6b6b;

  --mk-border: rgba(255, 255, 255, 0.12);
  --mk-shadow: 0 16px 30px rgba(0, 0, 0, 0.35);
  --mk-shadow-strong: 0 22px 40px rgba(0, 0, 0, 0.55);
}

:global(ion-content) {
  --background: transparent;
}

.wrap {
  padding: 16px;
  padding-top: calc(env(safe-area-inset-top) + 10px);
  max-width: 760px;
  margin: 0 auto;
}

:global(body) .chapter {
  background: transparent;
}
.chapter::before {
  content: "";
  position: fixed;
  inset: 0;
  z-index: -1;
  background: linear-gradient(to bottom, var(--mk-bg1), var(--mk-bg2));
}

/* =========================
   TYPOGRAPHY (ONE SLIDER)
========================= */
.chapterTitle {
  font-size: calc(22px * var(--mk-font-scale));
  font-weight: 900;
  text-align: center;
  margin: 6px 0 10px;
  font-family: "Noto Kufi Arabic", system-ui, sans-serif;
  color: var(--mk-text);
}

.introTitle {
  font-size: calc(18px * var(--mk-font-scale));
  font-weight: 900;
  text-align: center;
  margin-bottom: 10px;
  color: var(--mk-text);
}

.videoNote {
  margin-top: 10px;
  padding: 10px 12px;
  border-radius: 14px;
  background: rgb(182 31 31 / 12%);
  border: 1px dashed rgb(174 19 19);
  font-size: calc(14px * var(--mk-font-scale));
  font-weight: 800;
  text-align: center;
}

.sectionInline {
  margin: 10px 8px 0;
  padding: 9px 12px;
  border-radius: 14px;
  font-weight: 900;
  text-align: center;
  font-size: calc(15px * var(--mk-font-scale));
  background: radial-gradient(700px 240px at 15% 0%, rgb(204 209 208 / 38%), rgba(255, 255, 255, 0) 62%),
    linear-gradient(135deg, #28d6cc30, #f0f0f0);
  color: #0b2b40;
  box-shadow: 0 10px 18px rgba(0, 0, 0, 0.08);
}
:global(html[data-mk-theme="dark"]) .sectionInline {
  background: radial-gradient(700px 240px at 15% 0%, rgba(40, 214, 204, 0.18), transparent 62%),
    linear-gradient(135deg, rgba(40, 214, 204, 0.14), rgba(255, 255, 255, 0.06));
  color: rgba(255, 255, 255, 0.92);
  box-shadow: 0 12px 22px rgba(0, 0, 0, 0.45);
}

/* Intro */
.introBox {
  margin-bottom: 16px;
  background: var(--mk-card);
  border-radius: 18px;
  padding: 12px;
  border: 1px solid var(--mk-border);
  box-shadow: var(--mk-shadow);
}
.videoWrap {
  position: relative;
  width: 100%;
  padding-top: 56.25%;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid var(--mk-border);
}
.videoWrap iframe {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
}
.iosVideoBtn {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
  background: rgba(0, 0, 0, 0.10);
  color: var(--mk-text);
  font-size: calc(18px * var(--mk-font-scale));
  font-weight: 900;
  cursor: pointer;
}

/* Saved open btn */
.savedOpenBtn {
  width: 100%;
  margin: 10px 0 12px;
  padding: 12px 14px;
  border-radius: 18px;
  border: 1px solid var(--mk-border);
  box-shadow: var(--mk-shadow);
  font-weight: 1000;
  cursor: pointer;
  font-family: "Noto Kufi Arabic", system-ui, sans-serif;
  background: radial-gradient(600px 200px at 20% 0%, rgba(32, 178, 170, 0.35), transparent 60%),
    linear-gradient(135deg, #182a44, rgba(16, 27, 47, 0.90));
  color: #fff;
}
.savedCount {
  display: inline-block;
  margin-inline-start: 8px;
  padding: 2px 10px;
  border-radius: 999px;
  border: 1px solid var(--mk-border);
  background: rgb(31 182 170 / 92%);
}
.verseBlock.isBookmarked .verseRow {
  border-radius: 16px;
  background:
    radial-gradient(700px 220px at 15% 0%, rgba(31, 182, 170, 0.14), transparent 60%),
    rgba(31, 182, 170, 0.08);
  box-shadow:
    0 0 0 1px rgba(31, 182, 170, 0.18) inset,
    0 10px 22px rgba(31, 182, 170, 0.08);
}
/* Top CTA */
.topCtaBtn {
  width: 100%;
  margin: 8px 0 10px;
  padding: 12px 8px;
  border-radius: 18px;
  border: 1px solid var(--mk-border);
  background: var(--mk-card);
  box-shadow: var(--mk-shadow);
  font-weight: 1000;
  cursor: pointer;
  color: var(--mk-text);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 5px;
  font-family: "Noto Kufi Arabic", "Noto Naskh Arabic", system-ui, sans-serif !important;
}
.topCtaBtn * {
  font-family: inherit !important;
}
.topCtaHint {
  font-size: calc(12px * var(--mk-font-scale));
  font-weight: 900;
  opacity: 0.75;
  padding: 2px 10px;
  border-radius: 999px;
  border: 1px solid var(--mk-border);
  background: rgba(31, 182, 170, 0.10);
}

/* Verses */
.verses {
  background: var(--mk-card);
  border-radius: 18px;
  padding: 10px;
  border: 1px solid var(--mk-border);
  box-shadow: var(--mk-shadow);
  color: var(--mk-text);
}
.verseBlock {
  border-bottom: 1px solid var(--mk-border);
}
.verseBlock:last-child {
  border-bottom: 0;
}

.verseRow {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 42px;
  gap: 5px;
  align-items: start;
  padding: 12px 8px;
}

.verseMain {
  width: 100%;
  display: grid;
  grid-template-columns: 32px 1fr 0px;
  gap: 10px;
  background: transparent;
  border: 0;
  text-align: right;
  cursor: pointer;
  padding: 0;
  color: var(--mk-text);
}

.num {
  background: rgba(31, 182, 170, 0.12);
  color: var(--mk-text);
  border: 1px solid rgba(31, 182, 170, 0.20);
  border-radius: 12px;
  text-align: center;
  font-weight: 900;
  padding: 6px 0;
  height: fit-content;
  margin-top: 8px;
}

.txt {
  font-family: var(--mk-verse-font) !important;
  font-size: calc(22px * var(--mk-font-scale));
  line-height: 1.95;
  white-space: pre-wrap;
  font-weight: 800;
  color: var(--mk-text);
}

.chev {
  display: none;
  color: var(--mk-text);
  font-weight: 900;
  padding-top: 6px;
  opacity: 0.9;
}

/* Firebase bookmark wrap */
.bmWrap {
  position: relative;
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.saveBtn {
  height: 44px;
  width: 44px;
  border-radius: 14px;
  border: 1px solid var(--mk-border);
  background: rgba(31, 182, 170, 0.10);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--mk-text);
}
.saveBtn :deep(ion-icon) {
  font-size: 20px;
  color: currentColor;
  opacity: 0.95;
}
.saveBtn.isSaved {
  color: var(--mk-accent);
}
.saveBtn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.bmCount {
  position: absolute;
  top: -6px;
  left: -6px;
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  border-radius: 999px;
  border: 1px solid var(--mk-border);
  background: var(--mk-card);
  color: var(--mk-text);
  font-size: calc(12px * var(--mk-font-scale));
  font-weight: 1000;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: var(--mk-shadow);
}

/* Tafsir */
.tafsirBox {
  margin: 0 8px 12px;
  padding: 12px;
  border-radius: 14px;
  background: rgba(31, 182, 170, 0.10);
  border: 1px solid rgba(31, 182, 170, 0.18);
  font-family: "Noto Kufi Arabic", system-ui, sans-serif;
}
.tafsirText {
  font-size: calc(16px * var(--mk-font-scale));
  line-height: 1.95;
  text-align: right;
  white-space: pre-wrap;
  opacity: 0.95;
  color: var(--mk-text);
}
.tafsirHint {
  font-size: calc(14px * var(--mk-font-scale));
  color: rgba(11, 43, 64, 0.70);
  text-align: center;
}
:global(html[data-mk-theme="dark"]) .tafsirHint {
  color: rgba(255, 255, 255, 0.85);
}

.space {
  height: 20px;
}

/* Refs inline chips */
.refsInline {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 0 8px 12px;
}
.refChip {
  border: 1px solid var(--mk-border);
  background: radial-gradient(600px 200px at 20% 0%, rgba(32, 178, 170, 0.35), transparent 60%),
    linear-gradient(135deg, #182a44, rgba(16, 27, 47, 0.90));
  color: #fff;
  font-weight: 1000;
  padding: 7px 10px;
  border-radius: 999px;
  cursor: pointer;
  font-family: "Noto Kufi Arabic", system-ui, sans-serif;
  font-size: calc(15px * var(--mk-font-scale));
}

/* Saved sheet */
.savedSheet::part(content) {
  height: 90vh;
  max-height: 90vh;
  border-radius: 22px 22px 0 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.savedSheet :deep(ion-content) {
  flex: 1;
  --overflow: auto;
}
.savedBody {
  --padding-top: 10px;
  --padding-bottom: 18px;
}
.savedHeader {
  --background: transparent;
}
.savedEmpty {
  padding: 18px;
  text-align: center;
  font-weight: 900;
  opacity: 0.75;
}
.savedSearchWrap {
  padding: 10px 12px 12px;
  display: flex;
  gap: 10px;
  align-items: center;
}
.savedSearch {
  flex: 1;
  height: 42px;
  border-radius: 14px;
  border: 1px solid var(--mk-border);
  padding: 0 12px;
  font-weight: 800;
  background: rgba(0, 0, 0, 0.03);
  color: var(--mk-text);
  outline: none;
}
.savedClear {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  border: 1px solid var(--mk-border);
  background: rgba(0, 0, 0, 0.06);
  color: var(--mk-text);
  font-weight: 1000;
  cursor: pointer;
}
.savedList {
  padding: 0 12px 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.savedCard {
  text-align: right;
  border: 1px solid var(--mk-border);
  border-radius: 18px;
  padding: 12px 12px 14px;
  background: var(--mk-card);
  box-shadow: var(--mk-shadow);
}
.savedTopRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
}
.savedOpen {
  border: 0;
  background: transparent;
  padding: 0;
  margin: 0;
  cursor: pointer;
  text-align: right;
}
.savedRef {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 1000;
  opacity: 0.95;
  color: var(--mk-text);
}
.savedBook {
  font-size: calc(15px * var(--mk-font-scale));
  opacity: 0.9;
}
.savedLoc {
  font-size: calc(13px * var(--mk-font-scale));
  padding: 2px 10px;
  border-radius: 999px;
  background: rgba(31, 182, 170, 0.14);
  border: 1px solid rgba(31, 182, 170, 0.28);
  font-weight: 900;
}
.savedRemove {
  border: 0;
  background: rgba(0, 0, 0, 0.06);
  width: 32px;
  height: 32px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 1000;
  color: var(--mk-text);
}
.savedText {
  white-space: pre-wrap;
  line-height: 1.95;
  font-weight: 800;
  opacity: 0.95;
  font-family: "Noto Kufi Arabic", system-ui, sans-serif;
  color: var(--mk-text);
  font-size: calc(16px * var(--mk-font-scale));
}
.savedNote {
  margin-top: 10px;
  width: 100%;
  min-height: 64px;
  resize: vertical;
  border-radius: 14px;
  border: 1px dashed var(--mk-border);
  padding: 10px 12px;
  font-family: "Amiri", "Noto Naskh Arabic", serif;
  font-size: calc(14px * var(--mk-font-scale));
  line-height: 1.8;
  font-weight: 700;
  background: rgba(31, 182, 170, 0.06);
  color: var(--mk-text);
  outline: none;
}
.saveNoteBtn {
  margin-top: 8px;
  width: 100%;
  padding: 10px 12px;
  font-family: "Noto Kufi Arabic", system-ui, sans-serif;
  border-radius: 14px;
  border: 1px solid var(--mk-border);
  background: rgba(31, 182, 170, 0.14);
  font-size: calc(14px * var(--mk-font-scale));
  font-weight: 900;
  color: var(--mk-text);
  cursor: pointer;
}
:global(.savedToast) {
  --background: rgba(0, 0, 0, 0.75);
  --color: #fff;
  font-weight: 900;
  text-align: center;
}

/* Popover */
.bmPopover::part(content) {
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid var(--mk-border);
  background: var(--mk-card);
  box-shadow: var(--mk-shadow-strong);
}
.bmTip {
  padding: 10px 12px;
  font-weight: 1000;
  font-size: calc(16px * var(--mk-font-scale));
  white-space: nowrap;
  background: #000;
  color: #fff;
  direction: rtl;
  text-align: right;
  unicode-bidi: plaintext;
}

/* Refs modal cards */
.refModal::part(content) {
  height: 85vh;
  max-height: 85vh;
  border-radius: 22px 22px 0 0;
  overflow: hidden;
  background: #fff;
}
.refsPopupList {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-bottom: 14px;
}
.refsPopupItem {
  width: 100%;
  border: 1px solid var(--mk-border);
  background: var(--mk-card);
  border-radius: 16px;
  padding: 12px;
  text-align: right;
  cursor: pointer;
  box-shadow: var(--mk-shadow);
}
.refsPopupLabel {
  font-weight: 1000;
  margin-bottom: 8px;
  color: #214c5b;
  font-size:22px 
}
.refsPopupText {
  font-weight: 800;
  line-height: 2.05;
  opacity: 0.95;
  color: var(--mk-text);
  white-space: pre-wrap;
  font-size: 21px
}

/* Top modal */
.topModal::part(content) {
  height: 85vh;
  max-height: 85vh;
  border-radius: 22px 22px 0 0;
  overflow: hidden;
}
.topModalList {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-bottom: 18px;
}
.topModalCard {
  border: 1px solid var(--mk-border);
  border-radius: 18px;
  background: var(--mk-card);
  box-shadow: var(--mk-shadow);
  padding: 12px;
}
.topModalHead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
}
.topModalMeta {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 1000;
  color: var(--mk-text);
}
.topModalVerse {
  padding: 2px 10px;
  border-radius: 999px;
  border: 1px solid var(--mk-border);
  background: rgba(31, 182, 170, 0.10);
}
.topModalCount {
  border: 0;
  background: transparent;
  color: var(--mk-text);
  font-weight: 1000;
  cursor: pointer;
  opacity: 0.9;
}
.topModalSave {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  border: 1px solid var(--mk-border);
  background: rgba(31, 182, 170, 0.10);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--mk-text);
}
.topModalSave.isSaved {
  color: var(--mk-accent);
}
.topModalOpen {
  width: 100%;
  border: 1px solid var(--mk-border);
  background: rgba(0, 0, 0, 0.03);
  color: var(--mk-text);
  border-radius: 14px;
  padding: 10px 12px;
  text-align: right;
  cursor: pointer;
  font-weight: 900;
  line-height: 1.9;
  white-space: pre-wrap;
  font-size: 20px;
}
.topEmpty {
  text-align: center;
  font-weight: 900;
  opacity: 0.75;
  padding: 16px 0;
}

/* Flash verse */
.verseBlock.flashVerse {
  border-radius: 16px;
  background: rgba(255, 214, 0, 0.18);
  box-shadow: 0 0 0 2px rgba(255, 214, 0, 0.35) inset, var(--mk-shadow);
  animation: verseFlash 1.2s ease-out;
}
:global(html[data-mk-theme="dark"]) .verseBlock.flashVerse {
  background: rgba(255, 214, 0, 0.14);
  box-shadow: 0 0 0 2px rgba(255, 214, 0, 0.28) inset, var(--mk-shadow-strong);
}
@keyframes verseFlash {
  0% {
    transform: scale(1);
  }
  20% {
    transform: scale(1.01);
  }
  100% {
    transform: scale(1);
  }
}
.toolbar-container{background-color: #fff;}
/* ===== Verse has video (fancy) ===== */
.verseBlock.hasVideo .verseRow {
  position: relative;

  /* ✨ spacing أفضل */
  padding: 38px 16px 20px 20px;

  background: linear-gradient(
    135deg,
    rgba(31, 182, 170, 0.08),
    rgba(255, 215, 0, 0.05)
  );

  box-shadow:
    0 12px 22px rgba(0, 0, 0, 0.07),
    0 0 0 1px rgba(31, 182, 170, 0.14) inset;
}

.verseBlock.hasVideo .verseRow::before {
  content: "";
  position: absolute;
  top: 16px;
  bottom: 16px;
  left: 4px;
  width: 5px;
  border-radius: 999px;
  background: linear-gradient(
    180deg,
    rgba(31,182,170,0.95),
    rgba(255,215,0,0.85)
  );
}

/* small badge */
.verseBlock.hasVideo .verseRow::after {
  content: "🎬 فيديو";
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 1000;
  line-height: 1;
  letter-spacing: 0.2px;

  background: rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(11, 43, 64, 0.12);
  color: rgba(11, 43, 64, 0.86);
}

/* Dark mode */
:global(html[data-mk-theme="dark"]) .verseBlock.hasVideo .verseRow {
  background: linear-gradient(
    135deg,
    rgba(31, 182, 170, 0.14),
    rgba(255, 215, 0, 0.08)
  );
  box-shadow:
    0 14px 26px rgba(0, 0, 0, 0.38),
    0 0 0 1px rgba(255, 255, 255, 0.10) inset;
}

:global(html[data-mk-theme="dark"]) .verseBlock.hasVideo .verseRow::after {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.14);
  color: rgba(255, 255, 255, 0.92);
}
.tafsirImage {
  width: 100%;
  height: auto;
  display: block;
  border-radius: 14px;
  margin: 0 8px 12px;
  border: 1px solid rgba(0,0,0,0.08);
}
:global(html[data-mk-theme="dark"]) .tafsirImage {
  border-color: rgba(255,255,255,0.12);
}
.chapterSettingsAcc {
  margin: 10px 0 12px;
  border: 1px solid var(--mk-border);
  border-radius: 18px;
  background: var(--mk-card);
  box-shadow: var(--mk-shadow);
  overflow: hidden;
}

.chapterSettingsHead {
  width: 100%;
  border: 0;
  padding: 13px 14px;
  background:
    radial-gradient(600px 200px at 20% 0%, rgba(31, 182, 170, 0.18), transparent 60%),
    var(--mk-card);
  color: var(--mk-text);
  cursor: pointer;

  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;

  font-family: "Noto Kufi Arabic", system-ui, sans-serif;
  font-size: calc(14px * var(--mk-font-scale));
  font-weight: 1000;
}

.settingsChevron {
  display: inline-grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 999px;
  background: rgba(31, 182, 170, 0.12);
  border: 1px solid rgba(31, 182, 170, 0.20);
  transition: transform 0.2s ease;
}

.settingsChevron.open {
  transform: rotate(180deg);
}

.chapterSettingsBody {
  padding: 10px;
  border-top: 1px solid var(--mk-border);
}
.settingsChevron {
  width: 24px;
  height: 24px;
  padding: 7px;
  border-radius: 50%;
  background: rgba(31,182,170,.12);
  border: 1px solid rgba(31,182,170,.18);
  transition: transform .25s ease;
}
.chapterNav {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin: 12px 0;
}

.chapterNavTop {
  margin-top: 8px;
  margin-bottom: 12px;
}

.chapterNavBottom {
  margin-top: 18px;
  margin-bottom: 8px;
}

.chapterNavBtn {
  min-height: 50px;
  border: 1px solid rgba(31, 182, 170, 0.28);
  border-radius: 18px;
  padding: 10px 12px;

  background:
    radial-gradient(circle at 20% 0%, rgba(255, 209, 102, 0.16), transparent 34%),
    linear-gradient(135deg, rgba(31, 182, 170, 0.20), rgba(124, 219, 255, 0.12)),
    rgba(255, 255, 255, 0.94);

  color: #0b2b40;
  box-shadow:
    0 10px 24px rgba(15, 27, 47, 0.10),
    inset 0 1px 0 rgba(255,255,255,0.75);

  cursor: pointer;

  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;

  font-family: "Noto Kufi Arabic", system-ui, sans-serif;
  font-size: calc(13px * var(--mk-font-scale));
  font-weight: 1000;
}

.navIcon {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  display: inline-grid;
  place-items: center;

  background: rgba(31, 182, 170, 0.18);
  border: 1px solid rgba(31, 182, 170, 0.28);
  color: #1fb6aa;

  font-size: 24px;
  line-height: 1;
  font-weight: 1000;
  padding-bottom: 3px;
}

.chapterNavBtn.next {
  background:
    radial-gradient(circle at 20% 0%, rgba(255, 209, 102, 0.20), transparent 34%),
    linear-gradient(135deg, rgba(255, 209, 102, 0.18), rgba(31, 182, 170, 0.16)),
    rgba(255, 255, 255, 0.96);
}

.chapterNavBtn:disabled {
  opacity: 0.42;
  cursor: not-allowed;
  filter: grayscale(0.45);
}

.chapterNavBtn:active:not(:disabled) {
  transform: scale(0.98);
}

:global(html[data-mk-theme="dark"]) .chapterNavBtn {
  background:
    radial-gradient(circle at 20% 0%, rgba(255, 209, 102, 0.12), transparent 34%),
    linear-gradient(135deg, rgba(31, 182, 170, 0.16), rgba(124, 219, 255, 0.08)),
    rgba(255,255,255,0.07);
  color: #fff;
}

:global(html[data-mk-theme="dark"]) .navIcon {
  background: rgba(40, 214, 204, 0.14);
  border-color: rgba(40, 214, 204, 0.22);
  color: #28d6cc;
}


.chapterPageTitle {
  text-align: center;

  margin: 10px 0 14px;
  padding: 12px 16px;

  font-family: "Noto Kufi Arabic", system-ui, sans-serif;
  font-size: calc(22px * var(--mk-font-scale));
  font-weight: 1000;
  line-height: 1.4;

  color: var(--mk-text);

  border-radius: 18px;

  background:
    radial-gradient(circle at 20% 0%, rgba(255, 209, 102, 0.16), transparent 35%),
    linear-gradient(135deg, rgba(31, 182, 170, 0.14), rgba(124, 219, 255, 0.08)),
    var(--mk-card);

  border: 1px solid rgba(31, 182, 170, 0.18);

  box-shadow:
    0 10px 24px rgba(15, 27, 47, 0.08),
    inset 0 1px 0 rgba(255,255,255,0.7);
}
</style>
