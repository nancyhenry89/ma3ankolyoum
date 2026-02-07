<template>
    <ion-page dir="rtl" class="bible">
      <ion-header :translucent="true">
        <ion-toolbar>
          <ion-buttons slot="start">
            <ion-back-button default-href="/home" />
          </ion-buttons>
          <ion-title>{{ isArabic ? 'الكتاب المقدس' : 'Bible' }}</ion-title>
        </ion-toolbar>
  
        <div class="segWrap">
          <ion-segment v-model="testament" class="seg" @ionChange="onSegChange">
            <ion-segment-button value="nt">
              <ion-label>{{ isArabic ? 'العهد الجديد' : 'New Testament' }}</ion-label>
            </ion-segment-button>
            <ion-segment-button value="ot">
              <ion-label>{{ isArabic ? 'العهد القديم' : 'Old Testament' }}</ion-label>
            </ion-segment-button>
          </ion-segment>
        </div>
      </ion-header>
  
      <ion-content :fullscreen="true">
        <div class="wrap">
            <ion-accordion-group @ionChange="onGroupChange">
  <ion-accordion
    v-for="b in activeBooks"
    :key="b.key"
    :value="b.key"
  >
              <ion-item slot="header" class="bookHeader">
                <ion-label class="bookName">{{ b.nameAr }}</ion-label>
                <div class="bookMeta" v-if="availability[b.key]?.checking">
                  {{ isArabic ? 'جاري التحميل…' : 'Loading…' }}
                </div>
              </ion-item>
  
              <div slot="content" class="bookContent">
                <div class="chapGrid">
                    <button
  v-for="ch in b.maxChapters"
  :key="ch"
  class="chapBtn"
  :class="chapterClass(b, ch)"
  :disabled="chapterDisabled(b, ch)"
  @click="openChapter(b, ch)"
>
  {{ ch }}
</button>

                </div>
  
                <div class="hint">
                  {{ isArabic ? 'الأصحاح الرمادي غير متاح حاليًا.' : 'Grey chapters are not available yet.' }}
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
    IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
    IonContent, IonSegment, IonSegmentButton, IonLabel,
    IonAccordionGroup, IonAccordion, IonItem,
  } from '@ionic/vue'
  import { Capacitor } from '@capacitor/core'
  import { computed, onMounted, ref } from 'vue'
  import { useRouter } from 'vue-router'
  
  type Lang = 'ar' | 'en'
  type Testament = 'ot' | 'nt'
  
  type BookDef = {
    key: string        // bookKey used in route (ex: "Mark")
    slug: string       // folder name in /content/bible/<slug> (ex: "mark")
    nameAr: string
    maxChapters: number
    testament: Testament
  }
  
  const router = useRouter()
  
  // ===== lang (listens to your global event) =====
  const lang = ref<Lang>(((localStorage.getItem('mk_lang') as Lang) || 'ar') === 'en' ? 'en' : 'ar')
  const isArabic = computed(() => lang.value === 'ar')
  function syncLang() {
    const v = (localStorage.getItem('mk_lang') as Lang) || 'ar'
    lang.value = v === 'en' ? 'en' : 'ar'
  }
  
  // ===== content base (same as ChapterPage) =====
  const CONTENT_BASE = Capacitor.isNativePlatform()
    ? 'https://nancyhenry89.github.io/ma3ankolyoum/content'
    : `${import.meta.env.BASE_URL}content`.replace(/\/$/, '')
  
  // ===== UI state =====
  const testament = ref<Testament>('nt') // ✅ default New Testament
  
  function onSegChange() {
    // optional: you can persist selection
    localStorage.setItem('mk_bible_testament', testament.value)
  }
  
  // ===== Books (canonical order) =====
  // ⚠️ حطي هنا كل الأسفار اللي عايزاها.
  // أنا حاطط NT كامل + OT قانوني كامل. عدّلي الأسماء/الفولدرات/عدد الأصحاحات لو محتاجة.
  // لو أنتِ لسه مش عاملة كل folders/chapters، chapters هتظهر رمادي تلقائيًا بعد الفحص.
  
  const BOOKS: BookDef[] = [
    // ===== New Testament (default) =====
    { key: 'Matthew', slug: 'matthew', nameAr: 'متى', maxChapters: 28, testament: 'nt' },
    { key: 'Mark', slug: 'mark', nameAr: 'مرقس', maxChapters: 16, testament: 'nt' },
    { key: 'Luke', slug: 'luke', nameAr: 'لوقا', maxChapters: 24, testament: 'nt' },
    { key: 'John', slug: 'john', nameAr: 'يوحنا', maxChapters: 21, testament: 'nt' },
    { key: 'Acts', slug: 'acts', nameAr: 'أعمال الرسل', maxChapters: 28, testament: 'nt' },
    { key: 'Romans', slug: 'romans', nameAr: 'رومية', maxChapters: 16, testament: 'nt' },
    { key: '1Corinthians', slug: '1corinthians', nameAr: '١ كورنثوس', maxChapters: 16, testament: 'nt' },
    { key: '2Corinthians', slug: '2corinthians', nameAr: '٢ كورنثوس', maxChapters: 13, testament: 'nt' },
    { key: 'Galatians', slug: 'galatians', nameAr: 'غلاطية', maxChapters: 6, testament: 'nt' },
    { key: 'Ephesians', slug: 'ephesians', nameAr: 'أفسس', maxChapters: 6, testament: 'nt' },
    { key: 'Philippians', slug: 'philippians', nameAr: 'فيلبي', maxChapters: 4, testament: 'nt' },
    { key: 'Colossians', slug: 'colossians', nameAr: 'كولوسي', maxChapters: 4, testament: 'nt' },
    { key: '1Thessalonians', slug: '1thessalonians', nameAr: '١ تسالونيكي', maxChapters: 5, testament: 'nt' },
    { key: '2Thessalonians', slug: '2thessalonians', nameAr: '٢ تسالونيكي', maxChapters: 3, testament: 'nt' },
    { key: '1Timothy', slug: '1timothy', nameAr: '١ تيموثاوس', maxChapters: 6, testament: 'nt' },
    { key: '2Timothy', slug: '2timothy', nameAr: '٢ تيموثاوس', maxChapters: 4, testament: 'nt' },
    { key: 'Titus', slug: 'titus', nameAr: 'تيطس', maxChapters: 3, testament: 'nt' },
    { key: 'Philemon', slug: 'philemon', nameAr: 'فليمون', maxChapters: 1, testament: 'nt' },
    { key: 'Hebrews', slug: 'hebrews', nameAr: 'عبرانيين', maxChapters: 13, testament: 'nt' },
    { key: 'James', slug: 'james', nameAr: 'يعقوب', maxChapters: 5, testament: 'nt' },
    { key: '1Peter', slug: '1peter', nameAr: '١ بطرس', maxChapters: 5, testament: 'nt' },
    { key: '2Peter', slug: '2peter', nameAr: '٢ بطرس', maxChapters: 3, testament: 'nt' },
    { key: '1John', slug: '1john', nameAr: '١ يوحنا', maxChapters: 5, testament: 'nt' },
    { key: '2John', slug: '2john', nameAr: '٢ يوحنا', maxChapters: 1, testament: 'nt' },
    { key: '3John', slug: '3john', nameAr: '٣ يوحنا', maxChapters: 1, testament: 'nt' },
    { key: 'Jude', slug: 'jude', nameAr: 'يهوذا', maxChapters: 1, testament: 'nt' },
    { key: 'Revelation', slug: 'revelation', nameAr: 'رؤيا يوحنا', maxChapters: 22, testament: 'nt' },
  
    // ===== Old Testament (canonical) =====
    { key: 'Genesis', slug: 'genesis', nameAr: 'التكوين', maxChapters: 50, testament: 'ot' },
    { key: 'Exodus', slug: 'exodus', nameAr: 'الخروج', maxChapters: 40, testament: 'ot' },
    { key: 'Leviticus', slug: 'leviticus', nameAr: 'اللاويين', maxChapters: 27, testament: 'ot' },
    { key: 'Numbers', slug: 'numbers', nameAr: 'العدد', maxChapters: 36, testament: 'ot' },
    { key: 'Deuteronomy', slug: 'deuteronomy', nameAr: 'التثنية', maxChapters: 34, testament: 'ot' },
    { key: 'Joshua', slug: 'joshua', nameAr: 'يشوع', maxChapters: 24, testament: 'ot' },
    { key: 'Judges', slug: 'judges', nameAr: 'القضاة', maxChapters: 21, testament: 'ot' },
    { key: 'Ruth', slug: 'ruth', nameAr: 'راعوث', maxChapters: 4, testament: 'ot' },
    { key: '1Samuel', slug: '1samuel', nameAr: '١ صموئيل', maxChapters: 31, testament: 'ot' },
    { key: '2Samuel', slug: '2samuel', nameAr: '٢ صموئيل', maxChapters: 24, testament: 'ot' },
    { key: '1Kings', slug: '1kings', nameAr: '١ ملوك', maxChapters: 22, testament: 'ot' },
    { key: '2Kings', slug: '2kings', nameAr: '٢ ملوك', maxChapters: 25, testament: 'ot' },
    { key: '1Chronicles', slug: '1chronicles', nameAr: '١ أخبار', maxChapters: 29, testament: 'ot' },
    { key: '2Chronicles', slug: '2chronicles', nameAr: '٢ أخبار', maxChapters: 36, testament: 'ot' },
    { key: 'Ezra', slug: 'ezra', nameAr: 'عزرا', maxChapters: 10, testament: 'ot' },
    { key: 'Nehemiah', slug: 'nehemiah', nameAr: 'نحميا', maxChapters: 13, testament: 'ot' },
    { key: 'Esther', slug: 'esther', nameAr: 'أستير', maxChapters: 10, testament: 'ot' },
    { key: 'Job', slug: 'job', nameAr: 'أيوب', maxChapters: 42, testament: 'ot' },
    { key: 'Psalms', slug: 'psalms', nameAr: 'المزامير', maxChapters: 150, testament: 'ot' },
    { key: 'Proverbs', slug: 'proverbs', nameAr: 'الأمثال', maxChapters: 31, testament: 'ot' },
    { key: 'Ecclesiastes', slug: 'ecclesiastes', nameAr: 'الجامعة', maxChapters: 12, testament: 'ot' },
    { key: 'SongOfSolomon', slug: 'songofsolomon', nameAr: 'نشيد الأنشاد', maxChapters: 8, testament: 'ot' },
    { key: 'Isaiah', slug: 'isaiah', nameAr: 'إشعياء', maxChapters: 66, testament: 'ot' },
    { key: 'Jeremiah', slug: 'jeremiah', nameAr: 'إرميا', maxChapters: 52, testament: 'ot' },
    { key: 'Lamentations', slug: 'lamentations', nameAr: 'مراثي إرميا', maxChapters: 5, testament: 'ot' },
    { key: 'Ezekiel', slug: 'ezekiel', nameAr: 'حزقيال', maxChapters: 48, testament: 'ot' },
    { key: 'Daniel', slug: 'daniel', nameAr: 'دانيال', maxChapters: 12, testament: 'ot' },
    { key: 'Hosea', slug: 'hosea', nameAr: 'هوشع', maxChapters: 14, testament: 'ot' },
    { key: 'Joel', slug: 'joel', nameAr: 'يوئيل', maxChapters: 3, testament: 'ot' },
    { key: 'Amos', slug: 'amos', nameAr: 'عاموس', maxChapters: 9, testament: 'ot' },
    { key: 'Obadiah', slug: 'obadiah', nameAr: 'عوبديا', maxChapters: 1, testament: 'ot' },
    { key: 'Jonah', slug: 'jonah', nameAr: 'يونان', maxChapters: 4, testament: 'ot' },
    { key: 'Micah', slug: 'micah', nameAr: 'ميخا', maxChapters: 7, testament: 'ot' },
    { key: 'Nahum', slug: 'nahum', nameAr: 'ناحوم', maxChapters: 3, testament: 'ot' },
    { key: 'Habakkuk', slug: 'habakkuk', nameAr: 'حبقوق', maxChapters: 3, testament: 'ot' },
    { key: 'Zephaniah', slug: 'zephaniah', nameAr: 'صفنيا', maxChapters: 3, testament: 'ot' },
    { key: 'Haggai', slug: 'haggai', nameAr: 'حجي', maxChapters: 2, testament: 'ot' },
    { key: 'Zechariah', slug: 'zechariah', nameAr: 'زكريا', maxChapters: 14, testament: 'ot' },
    { key: 'Malachi', slug: 'malachi', nameAr: 'ملاخي', maxChapters: 4, testament: 'ot' },
    // Old Testament (with Deuterocanon)
{ key: 'Tobit', slug: 'tobit', nameAr: 'طوبيا', maxChapters: 14, testament: 'ot' },
{ key: 'Judith', slug: 'judith', nameAr: 'يهوديت', maxChapters: 16, testament: 'ot' },
{ key: 'Wisdom', slug: 'wisdom', nameAr: 'الحكمة', maxChapters: 19, testament: 'ot' },
{ key: 'Sirach', slug: 'sirach', nameAr: 'يشوع بن سيراخ', maxChapters: 51, testament: 'ot' },
{ key: 'Baruch', slug: 'baruch', nameAr: 'باروخ', maxChapters: 6, testament: 'ot' },
{ key: '1Maccabees', slug: '1maccabees', nameAr: '١ مكابيين', maxChapters: 16, testament: 'ot' },
{ key: '2Maccabees', slug: '2maccabees', nameAr: '٢ مكابيين', maxChapters: 15, testament: 'ot' },
{ key: '3Maccabees', slug: '3maccabees', nameAr: '٣ مكابيين', maxChapters: 7, testament: 'ot' },
{ key: '4Maccabees', slug: '4maccabees', nameAr: '٤ مكابيين', maxChapters: 18, testament: 'ot' },

  ]
  
  const activeBooks = computed(() => BOOKS.filter(b => b.testament === testament.value))
  
  // ===== availability cache =====
  type AvState = { checked: Record<number, boolean>, checking: boolean, ts: number }
  const availability = ref<Record<string, AvState>>({})
  
  function cacheKeyForBook(bookKey: string) {
    return `mk_bible_avail_${bookKey}`
  }
  function chapterState(b: BookDef, ch: number): boolean | null {
  const st = ensureAvState(b.key)
  return (st.checked[ch] ?? null) as any
}

function chapterClass(b: BookDef, ch: number) {
  const v = chapterState(b, ch)
  return {
    neutral: v === null,     // لسه ما اتفحصش
    available: v === true,
    disabled: v === false,
  }
}

function chapterDisabled(b: BookDef, ch: number) {
  const v = chapterState(b, ch)
  // ✅ unknown (null) => disabled لحد ما السفر يتفحص عند فتحه
  return v !== true
}

  function loadCachedAvailability(bookKey: string) {
    try {
      const raw = localStorage.getItem(cacheKeyForBook(bookKey))
      if (!raw) return null
      const obj = JSON.parse(raw)
      if (!obj || typeof obj !== 'object') return null
      return obj as AvState
    } catch {
      return null
    }
  }
  
  function saveCachedAvailability(bookKey: string, st: AvState) {
    try {
      localStorage.setItem(cacheKeyForBook(bookKey), JSON.stringify(st))
    } catch {}
  }
  
  function ensureAvState(bookKey: string) {
    if (!availability.value[bookKey]) {
      const cached = loadCachedAvailability(bookKey)
      availability.value[bookKey] = cached || { checked: {}, checking: false, ts: 0 }
    }
    return availability.value[bookKey]
  }
  
  function chapterUrl(b: BookDef, ch: number) {
    return `${CONTENT_BASE}/bible/${b.slug}/${ch}.json`
  }
  
  async function checkChapterExists(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'GET', cache: 'no-store' })
    if (!res.ok) return false

    const ct = (res.headers.get('content-type') || '').toLowerCase()

    // GitHub Pages fallback بيرجع text/html حتى لو المسار غلط
    if (ct.includes('text/html')) return false

    // الأفضل: نتأكد إنه JSON فعلاً
    if (!ct.includes('application/json')) {
      // أحيانًا بيكون octet-stream، فنجرب parse
      try {
        const j = await res.clone().json()
        return !!j && typeof j === 'object' && Array.isArray(j.verses)
      } catch {
        return false
      }
    }

    const j = await res.json()
    return !!j && typeof j === 'object' && Array.isArray((j as any).verses)
  } catch {
    return false
  }
}

  
  // ===== UI helpers =====
  function isChapterAvailable(b: BookDef, ch: number) {
    const st = ensureAvState(b.key)
    return st.checked[ch] === true
  }
  function isChapterDisabled(b: BookDef, ch: number) {
    const st = ensureAvState(b.key)
    // لو اتفحص واتطلع false => disabled
    if (st.checked[ch] === false) return true
    // لو لسه مااتفحصش، هنخليه enabled؟ لا: علشان شرطك "لو مش متاح يبقى رمادي"
    // بس إحنا لسه مش عارفين.. فهنا الأفضل:
    // - قبل الفحص: نخليه رمادي (disabled)؟ ده هيمنع التجربة
    // - الأفضل: نخليه enabled لكن شكله neutral
    // أنا هخليه enabled قبل الفحص (علشان UX) لكن بمجرد الفحص يتظبط.
    return false
  }
  
  // ===== open chapter =====
  async function openChapter(b: BookDef, ch: number) {
  const st = ensureAvState(b.key)
  if (st.checked[ch] !== true) return
  router.push(`/chapter/${b.key}/${ch}`)
}

  
  // ===== when accordion opens: lazy check chapters =====
  async function ensureBookChecked(b: BookDef) {
  const st = ensureAvState(b.key)
  if (st.checking) return

  // ✅ بدل ما نعمل return لو fresh، هنسمح بإعادة فحص الـ false بعد 10 دقائق
  const ttl = 7 * 24 * 60 * 60 * 1000
  const recheckFalseAfter = 10 * 60 * 1000

  const isFresh = st.ts && (Date.now() - st.ts) < ttl
  const canRecheckFalse = !st.ts || (Date.now() - st.ts) > recheckFalseAfter

  st.checking = true
  availability.value = { ...availability.value, [b.key]: { ...st } }

  const max = b.maxChapters
  const concurrency = 6
  let i = 1

  async function worker() {
    while (i <= max) {
      const ch = i++

      // ✅ لو known true -> skip
      if (st.checked[ch] === true) continue

      // ✅ لو known false -> recheck فقط لو canRecheckFalse
      if (st.checked[ch] === false && !canRecheckFalse) continue

      // ✅ لو null/undefined -> check عادي
      const ok = await checkChapterExists(chapterUrl(b, ch))
      st.checked[ch] = ok

      // تحديث UI أسرع (مش كل 8)
      if (ch % 3 === 0) {
        availability.value = { ...availability.value, [b.key]: { ...st } }
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()))

  st.checking = false
  st.ts = Date.now()
  availability.value = { ...availability.value, [b.key]: { ...st } }
  saveCachedAvailability(b.key, st)
}

  function findBookByKey(key: string) {
  return BOOKS.find(x => x.key === key) || null
}

function onGroupChange(ev: any) {
  const openedKey = ev?.detail?.value
  if (!openedKey) return
  const b = findBookByKey(String(openedKey))
  if (!b) return
  ensureBookChecked(b).catch(console.error)
}

  function onAccordionChange(ev: any, b: BookDef) {
    // لما الـ accordion يتفتح، Ionic بيبعت value
    // لو اتفتح فعلاً => افحص
    // (لو قفل، مش مهم)
    const val = ev?.detail?.value
    if (val === b.key) {
      ensureBookChecked(b).catch(console.error)
    }
  }
  
  onMounted(() => {
    syncLang()
    window.addEventListener('mk:lang-changed', syncLang)
  
    const saved = localStorage.getItem('mk_bible_testament') as Testament | null
    if (saved === 'ot' || saved === 'nt') testament.value = saved
  })
  function stChecked(bookKey: string, ch: number) {
  const st = ensureAvState(bookKey)
  return st.checked[ch]
}

  </script>
  
  <style scoped>
  .bible{
    --mk-bg1: #eef4f8;
    --mk-bg2: #ffffff;
    --mk-text: #0b2b40;
    --mk-card: #ffffff;
    --mk-accent: #1fb6aa;
    --mk-border: rgba(11,43,64,0.10);
    font-family:"Noto Naskh Arabic","Noto Kufi Arabic",system-ui,sans-serif;
    color: var(--mk-text);
  }
  :global(html.ion-palette-dark) .bible,
  :global(html.dark) .bible,
  :global(body.dark) .bible,
  :global(ion-app.ion-palette-dark) .bible,
  :global(ion-app.dark) .bible{
    --mk-bg1: #0b1620;
    --mk-bg2: #0a0f14;
    --mk-text: #ffffff;
    --mk-card: rgba(255,255,255,0.07);
    --mk-accent: #1fb6aa;
    --mk-border: rgba(255,255,255,0.14);
  }
  
  :global(ion-content){ --background: transparent; }
  
  .bible::before{
    content:"";
    position: fixed;
    inset: 0;
    z-index: -1;
    background: linear-gradient(to bottom, var(--mk-bg1), var(--mk-bg2));
  }
  
  .wrap{
    padding:16px;
    padding-top: calc(env(safe-area-inset-top) + 10px);
    max-width: 860px;
    margin: 0 auto;
  }
  
  .segWrap{
    padding: 8px 12px 12px;
  }
  .seg{
  border-radius: 14px;
  overflow: hidden;
  background: color-mix(in srgb, var(--mk-card) 92%, transparent);
  border: 1px solid var(--mk-border);
  padding: 4px;
}

.seg :deep(ion-segment-button){
  --color: color-mix(in srgb, var(--mk-text) 80%, transparent);
  --color-checked: var(--mk-text);              /* ✅ مش أبيض */
  --indicator-color: rgba(31,182,170,0.22);     /* ✅ indicator “خلفية” */
  --indicator-height: 100%;
  --border-radius: 12px;
  font-weight: 1000;
}

.seg :deep(.segment-button-checked){
  background: rgba(31,182,170,0.18);            /* ✅ واضح في light/dark */
}

  .bookHeader{
    --background: var(--mk-card);
    border: 1px solid var(--mk-border);
    border-radius: 16px;
    margin-bottom: 10px;
  }
  .bookName{
    font-weight: 1000;
  }
  .bookMeta{
    font-size: 12px;
    font-weight: 900;
    opacity: 0.7;
  }
  
  .bookContent{
    margin: -4px 0 12px;
    padding: 12px;
    background: var(--mk-card);
    border: 1px solid var(--mk-border);
    border-radius: 16px;
  }
  
  .chapGrid{
    display:grid;
    grid-template-columns: repeat(8, minmax(0, 1fr));
    gap: 8px;
  }
  @media (max-width: 520px){
    .chapGrid{ grid-template-columns: repeat(6, minmax(0, 1fr)); }
  }
  
  .chapBtn{
    height: 38px;
    border-radius: 12px;
    border: 1px solid var(--mk-border);
    background: rgba(31,182,170,0.10);
    color: var(--mk-text);
    font-weight: 1000;
    cursor: pointer;
  }
  .chapBtn.available{
    border-color: rgba(31,182,170,0.35);
  }
  .chapBtn.disabled,
  .chapBtn:disabled{
    background: rgba(0,0,0,0.06);
    color: color-mix(in srgb, var(--mk-text) 45%, transparent);
    cursor: not-allowed;
    opacity: 0.7;
  }
  :global(html.ion-palette-dark) .chapBtn.disabled,
  :global(html.ion-palette-dark) .chapBtn:disabled{
    background: rgba(255,255,255,0.06);
    color: rgba(255,255,255,0.45);
  }
  
  .hint{
    margin-top: 10px;
    font-size: 13px;
    font-weight: 800;
    opacity: 0.75;
    text-align: center;
  }
  .chapBtn{
  height: 38px;
  border-radius: 12px;
  border: 1px solid var(--mk-border);
  background: rgba(31,182,170,0.10);
  color: var(--mk-text);
  font-weight: 1000;
}

/* قبل الفحص (unknown): شكل محايد */
.chapBtn.neutral{
  background: rgba(0,0,0,0.03);
}

/* available */
.chapBtn.available{
  background: rgba(31,182,170,0.14);
  border-color: rgba(31,182,170,0.35);
}

/* disabled (missing) */
.chapBtn.disabled,
.chapBtn:disabled{
  background: rgba(0,0,0,0.06);
  color: color-mix(in srgb, var(--mk-text) 45%, transparent);
  cursor: not-allowed;
  opacity: 0.7;
}
.chapBtn.neutral{
  background: rgba(0,0,0,0.04);
  border-style: dashed;
  opacity: 0.75;
}
:global(html.ion-palette-dark) .chapBtn.neutral{
  background: rgba(255,255,255,0.05);
  border-style: dashed;
}

  </style>
  