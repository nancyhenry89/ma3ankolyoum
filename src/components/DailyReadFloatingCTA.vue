<template>
    <div
      class="drfWrap"
      :class="[dirClass, { open: sheetOpen, done: readToday, reward: rewardPulse }]"
      :style="wrapStyle"
    >
      <button
        class="drfFab"
        type="button"
        :aria-label="readToday ? t.doneToday : ctaText"
        @click="onFabClick"
      >
        <div class="drfGlow" />
  
        <svg
          class="drfRingSvg"
          :viewBox="`0 0 ${ringBox} ${ringBox}`"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="drfReadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#28d6cc" />
              <stop offset="55%" stop-color="#7cdbff" />
              <stop offset="100%" stop-color="#ffd166" />
            </linearGradient>
          </defs>
  
          <line
            v-for="seg in monthSegments"
            :key="seg.day"
            :x1="seg.x1"
            :y1="seg.y1"
            :x2="seg.x2"
            :y2="seg.y2"
            class="drfSeg"
            :class="seg.kind"
            stroke-linecap="round"
          />
        </svg>
  
        <div class="drfInner">
          <div class="drfCount">{{ animatedTotal }}</div>
          <div class="drfCountLabel">{{ totalDaysLabel }}</div>
  
          <div class="drfText">
            {{ readToday ? t.doneToday : ctaText }}
          </div>
        </div>
  
        <span v-if="rewardBurst" class="drfBurst" aria-hidden="true">
          <span>✨</span>
          <span>✨</span>
          <span>✨</span>
        </span>
      </button>
  
      <transition name="drfFade">
        <button
          v-if="sheetOpen"
          class="drfBackdrop"
          type="button"
          aria-label="Close"
          @click="closeAll"
        />
      </transition>
  
      <transition name="drfSheet">
        <section
          v-if="sheetOpen"
          class="drfSheet"
          :dir="dir"
          :lang="locale"
        >
          <div class="drfHandle" />
  
          <div class="drfSheetHeader">
            <div class="drfSheetTitle">{{ headerMessage }}</div>
            <button class="drfClose" type="button" @click="closeAll">×</button>
          </div>
  
          <div class="drfStatsGrid">
            <div class="drfStatCard drfStatCardWide drfMonthCard">
              <div class="drfStatLabel">{{ t.thisMonth }}</div>
              <div class="drfStatSub drfMonthProgress">{{ monthProgressText }}</div>
            </div>
  
            <div class="drfStatCard">
              <div class="drfStatLabel">{{ t.daysSinceLastRead }}</div>
              <div class="drfStatValue">{{ daysSinceLastRead }}</div>
              <div class="drfStatSub">
                {{ daysSinceLastReadText }}
              </div>
            </div>
  
            <div class="drfStatCard">
              <div class="drfStatLabel">{{ t.inRow }}</div>
              <div class="drfStatValue">{{ currentStreak }}</div>
              <div class="drfStatSub">
                {{ streakText }}
              </div>
            </div>
  
            <div class="drfStatCard drfStatCardWide">
              <div class="drfStatLabel">{{ t.totalRead }}</div>
              <div class="drfStatValue">{{ totalReadDays }}</div>
              <div class="drfStatSub">
                {{ totalText }}
              </div>
            </div>
          </div>
  
          <div class="drfWeek">
            <div class="drfWeekTitle">{{ t.thisWeek }}</div>
            <div class="drfWeekStrip">
              <div
                v-for="item in weekStrip"
                :key="item.iso"
                class="drfWeekDot"
                :class="{
                  read: item.read,
                  today: item.iso === todayISO
                }"
                :title="item.iso"
              >
                <span class="drfWeekDay">{{ item.label }}</span>
              </div>
            </div>
          </div>
  
          <div class="drfRewardsCard">
            <div class="drfRewardsHead">{{ t.consistencyRewards }}</div>
  
            <div class="drfRewardsRow">
              <div class="drfRewardItem">
                <div class="drfRewardIcon">⭐</div>
                <div class="drfRewardMeta">
                  <div class="drfRewardCount">{{ starsCount }}</div>
                  <div class="drfRewardLabel">{{ t.stars }}</div>
                </div>
              </div>
  
              <button
                class="drfRewardItem drfRewardBtn"
                type="button"
                @click="monthsOpen = true"
              >
                <div class="drfRewardIcon">✠</div>
                <div class="drfRewardMeta">
                  <div class="drfRewardCount">{{ crossesCount }}</div>
                  <div class="drfRewardLabel">{{ t.crosses }}</div>
                </div>
              </button>
            </div>
  
            <div class="drfRewardsHint">
              {{ rewardHint }}
            </div>
          </div>
        </section>
      </transition>
  
      <transition name="drfFade">
        <button
          v-if="monthsOpen"
          class="drfBackdrop drfBackdropTop"
          type="button"
          aria-label="Close completed months"
          @click="monthsOpen = false"
        />
      </transition>
  
      <transition name="drfScale">
        <section
          v-if="monthsOpen"
          class="drfMonthsModal"
          :dir="dir"
          :lang="locale"
        >
          <div class="drfMonthsHead">
            <div class="drfMonthsTitle">{{ t.completedMonths }}</div>
            <button class="drfClose" type="button" @click="monthsOpen = false">×</button>
          </div>
  
          <div v-if="completedMonthsDetailed.length" class="drfMonthsList">
            <div
              v-for="item in completedMonthsDetailed"
              :key="item.key"
              class="drfMonthRow"
            >
              <span class="drfMonthIcon">✠</span>
              <span class="drfMonthText">{{ item.label }}</span>
            </div>
          </div>
  
          <div v-else class="drfMonthsEmpty">
            {{ t.noCompletedMonths }}
          </div>
        </section>
      </transition>
    </div>
  </template>
  
  <script setup lang="ts">
  import { computed, onMounted, ref, watch } from 'vue'
  import { Preferences } from '@capacitor/preferences'
  
  type Locale = 'ar' | 'en'
  type SegKind = 'read' | 'unread-past' | 'today-unread' | 'future'
  
  const props = withDefaults(
    defineProps<{
      locale?: Locale
      storageKey?: string
      bottom?: string
      side?: string
      zIndex?: number
    }>(),
    {
      locale: 'ar',
      storageKey: 'mk_daily_read_fab_v1',
      bottom: '96px',
      side: '16px',
      zIndex: 99999
    }
  )
  
  const locale = computed<Locale>(() => (props.locale === 'en' ? 'en' : 'ar'))
  const dir = computed(() => (locale.value === 'ar' ? 'rtl' : 'ltr'))
  const dirClass = computed(() => (dir.value === 'rtl' ? 'rtl' : 'ltr'))
  
  const tMap = {
    ar: {
      readTodayQ: 'قرأت النهاردة؟',
      readAgainTodayQ: 'تحب تراجع الإحصائيات؟',
      comebackQ: 'نبتدي النهاردة؟',
      doneToday: 'تم النهاردة',
      daysShortSingle: 'يوم',
      daysShortPlural: 'يوم',
      nice: 'جميل 👏',
      goodStep: 'خطوة حلوة',
      keepGoing: 'كمل بالراحة',
      welcomeBack: 'رجوعك جميل ✨',
      thisMonth: 'هذا الشهر',
      daysSinceLastRead: "من آخر مرة قرأت",
      inRow: 'أيام متتالية',
      totalRead: 'إجمالي الأيام المقروءة',
      thisWeek: 'الأسبوع ده',
      consistencyRewards: "الانجازات",
      stars: 'نجوم',
      crosses: 'شهور كاملة',
      completedMonths: 'الشهور المكتملة',
      noCompletedMonths: 'لسه مفيش شهور مكتملة',
      monthProgress: 'قرأت {read} من {total} يوم هذا الشهر',
      haventReadFor: 'بقالك {n} يوم مقريتش',
      readTodayGap: 'قرأت النهاردة 👏',
      stayingConsistent: 'بتقرأ بشكل مستمر 👏',
      readInRow: 'قرأت {n} أيام ورا بعض',
      totalReadText: 'قرأت {n} يوم',
      rewardsHint: '⭐ نجمة لكل 7 أيام متتالية، و ✠ لكل شهر كامل بعد انتهائه.',
      notStartedYet: 'لسه ما بدأتش القراءة'
    },
    en: {
      readTodayQ: 'Did you read today?',
      readAgainTodayQ: 'View your stats?',
      comebackQ: 'Start again today?',
      doneToday: 'Done today',
      daysShortSingle: 'day',
      daysShortPlural: 'days',
      nice: 'Nice 👏',
      goodStep: 'Good step',
      keepGoing: 'Keep going',
      welcomeBack: 'Glad you’re back ✨',
      thisMonth: 'This month',
      daysSinceLastRead: 'Days since last read',
      inRow: 'Days in a row',
      totalRead: 'Total days read',
      thisWeek: 'This week',
      consistencyRewards: 'Consistency rewards',
      stars: 'Stars',
      crosses: 'Full months',
      completedMonths: 'Completed months',
      noCompletedMonths: 'No completed months yet',
      monthProgress: 'You read {read} out of {total} days this month',
      haventReadFor: 'You haven’t read for {n} days',
      readTodayGap: 'You read today 👏',
      stayingConsistent: 'You’re staying consistent 👏',
      readInRow: 'You read {n} days in a row',
      totalReadText: 'You’ve read for {n} days',
      rewardsHint: '⭐ One star for every 7 consecutive days, and ✠ one cross for each full month after it ends.',
      notStartedYet: 'You have not started yet'
    }
  } as const
  
  const t = computed(() => tMap[locale.value])
  
  const wrapStyle = computed(() => {
    const sideProp = dir.value === 'rtl' ? 'left' : 'right'
    return {
      bottom: props.bottom,
      zIndex: String(props.zIndex),
      [sideProp]: props.side
    }
  })
  
  const readDays = ref<string[]>([])
  const sheetOpen = ref(false)
  const monthsOpen = ref(false)
  const rewardPulse = ref(false)
  const rewardBurst = ref(false)
  
  const totalReadDays = computed(() => readDays.value.length)
  
  const today = computed(() => new Date())
  const todayISO = computed(() => formatLocalISO(today.value))
  
  const currentYear = computed(() => today.value.getFullYear())
  const currentMonthIndex = computed(() => today.value.getMonth())
  const currentMonthNumber = computed(() => currentMonthIndex.value + 1)
  
  const daysInCurrentMonth = computed(() => {
    return new Date(currentYear.value, currentMonthNumber.value, 0).getDate()
  })
  
  const todayDayOfMonth = computed(() => today.value.getDate())
  
  const currentMonthKey = computed(() => {
    return `${currentYear.value}-${String(currentMonthNumber.value).padStart(2, '0')}`
  })
  
  const currentMonthReadSet = computed(() => {
    return new Set(readDays.value.filter((d) => d.startsWith(`${currentMonthKey.value}-`)))
  })
  
  const readDaysThisMonth = computed(() => currentMonthReadSet.value.size)
  const readToday = computed(() => currentMonthReadSet.value.has(todayISO.value))
  const sortedReadDates = computed(() => [...readDays.value].sort())
  
  const lastReadISO = computed(() => {
    if (!sortedReadDates.value.length) return ''
    return sortedReadDates.value[sortedReadDates.value.length - 1]
  })
  
  const daysSinceLastRead = computed(() => {
    if (!lastReadISO.value) return 0
    const diff = diffDays(new Date(lastReadISO.value), today.value)
    return diff < 0 ? 0 : diff
  })
  
  const currentStreak = computed(() => {
    const set = new Set(readDays.value)
    let count = 0
    const cursor = new Date(today.value)
  
    while (true) {
      const iso = formatLocalISO(cursor)
      if (!set.has(iso)) break
      count++
      cursor.setDate(cursor.getDate() - 1)
    }
  
    if (count > 0) return count
  
    cursor.setTime(today.value.getTime())
    cursor.setDate(cursor.getDate() - 1)
  
    while (true) {
      const iso = formatLocalISO(cursor)
      if (!set.has(iso)) break
      count++
      cursor.setDate(cursor.getDate() - 1)
    }
  
    return count
  })
  
  const ctaText = computed(() => {
    if (readToday.value) return t.value.readAgainTodayQ
    if (!lastReadISO.value) return t.value.readTodayQ
    if (daysSinceLastRead.value >= 3) return t.value.comebackQ
    return t.value.readTodayQ
  })
  
  const headerMessage = computed(() => {
    if (!lastReadISO.value && readToday.value) return t.value.goodStep
    if (readToday.value && currentStreak.value >= 7) return t.value.keepGoing
    if (readToday.value) return t.value.nice
    if (daysSinceLastRead.value >= 3) return t.value.welcomeBack
    return t.value.goodStep
  })
  
  const monthProgressText = computed(() => {
    return interpolate(t.value.monthProgress, {
      read: readDaysThisMonth.value,
      total: todayDayOfMonth.value
    })
  })
  
  const daysSinceLastReadText = computed(() => {
    if (!lastReadISO.value) return t.value.notStartedYet
    if (readToday.value && daysSinceLastRead.value === 0) return t.value.readTodayGap
    if (daysSinceLastRead.value === 0) return t.value.stayingConsistent
    return interpolate(t.value.haventReadFor, { n: daysSinceLastRead.value })
  })
  
  const streakText = computed(() => interpolate(t.value.readInRow, { n: currentStreak.value }))
  const totalText = computed(() => interpolate(t.value.totalReadText, { n: totalReadDays.value }))
  
  const animatedTotal = ref(0)
  
  const totalDaysLabel = computed(() => {
    if (locale.value === 'ar') return t.value.daysShortSingle
    return animatedTotal.value === 1 ? t.value.daysShortSingle : t.value.daysShortPlural
  })
  
  const weekStrip = computed(() => {
    const start = startOfWeek(today.value, 0) // Sunday
    const set = new Set(readDays.value)
  
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      const iso = formatLocalISO(d)
  
      return {
        iso,
        read: set.has(iso),
        label:
          locale.value === 'ar'
            ? ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'][i]
            : ['S', 'M', 'T', 'W', 'T', 'F', 'S'][i]
      }
    })
  })
  
  const starsCount = computed(() => {
    const sorted = [...new Set(readDays.value)].sort()
    if (!sorted.length) return 0
  
    let stars = 0
    let streak = 1
  
    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i - 1])
      const curr = new Date(sorted[i])
      const diff = diffDays(prev, curr)
  
      if (diff === 1) {
        streak++
        if (streak === 7) {
          stars++
          streak = 0
        }
      } else {
        streak = 1
      }
    }
  
    return stars
  })
  
  const completedMonthsDetailed = computed(() => {
    const grouped: Record<string, Set<string>> = {}
  
    for (const d of readDays.value) {
      const ym = d.slice(0, 7)
      if (!grouped[ym]) grouped[ym] = new Set()
      grouped[ym].add(d)
    }
  
    const results: Array<{ key: string; label: string }> = []
  
    for (const ym of Object.keys(grouped)) {
      const [y, m] = ym.split('-').map(Number)
  
      if (y === currentYear.value && m === currentMonthNumber.value) continue
  
      const dim = new Date(y, m, 0).getDate()
      if (grouped[ym].size === dim) {
        results.push({
          key: ym,
          label: formatMonthLabel(y, m, locale.value)
        })
      }
    }
  
    return results.sort((a, b) => b.key.localeCompare(a.key))
  })
  
  const crossesCount = computed(() => completedMonthsDetailed.value.length)
  const rewardHint = computed(() => t.value.rewardsHint)
  
  watch(
    totalReadDays,
    (val, oldVal) => {
      if (oldVal == null || oldVal === val) {
        animatedTotal.value = val
        return
      }
      animateNumber(oldVal, val, 420)
    },
    { immediate: true }
  )
  
  watch(
    () => props.locale,
    () => {
      monthsOpen.value = false
      sheetOpen.value = false
    }
  )
  
  async function loadReadDays() {
    const { value } = await Preferences.get({ key: props.storageKey })
    if (!value) {
      readDays.value = []
      return
    }
  
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) {
        readDays.value = [...new Set(parsed.filter((x) => typeof x === 'string'))].sort()
      } else {
        readDays.value = []
      }
    } catch {
      readDays.value = []
    }
  }
  
  async function saveReadDays() {
    await Preferences.set({
      key: props.storageKey,
      value: JSON.stringify(readDays.value)
    })
  }
  
  async function markTodayAsRead() {
    if (readToday.value) return false
    readDays.value = [...new Set([...readDays.value, todayISO.value])].sort()
    await saveReadDays()
    return true
  }
  
  async function onFabClick() {
    const beforeStars = starsCount.value
    const beforeCrosses = crossesCount.value
  
    const wasAdded = await markTodayAsRead()
  
    if (wasAdded) {
      const gainedStar = starsCount.value > beforeStars
      const gainedCross = crossesCount.value > beforeCrosses
      triggerReward(gainedStar || gainedCross)
      void tryHaptics()
    }
  
    sheetOpen.value = true
  }
  
  function closeAll() {
    monthsOpen.value = false
    sheetOpen.value = false
  }
  
  function triggerReward(extra = false) {
    rewardPulse.value = false
    rewardBurst.value = false
  
    requestAnimationFrame(() => {
      rewardPulse.value = true
      rewardBurst.value = true
    })
  
    window.setTimeout(() => {
      rewardPulse.value = false
    }, extra ? 950 : 700)
  
    window.setTimeout(() => {
      rewardBurst.value = false
    }, extra ? 1100 : 900)
  }
  
  async function tryHaptics() {
    try {
      const mod = await import('@capacitor/haptics')
      await mod.Haptics.impact({ style: mod.ImpactStyle.Light })
    } catch {
      // ignore if unavailable
    }
  }
  
  function interpolate(template: string, vars: Record<string, string | number>) {
    return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? ''))
  }
  
  function formatLocalISO(date: Date) {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  
  function diffDays(from: Date, to: Date) {
    const a = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime()
    const b = new Date(to.getFullYear(), to.getMonth(), to.getDate()).getTime()
    return Math.round((b - a) / 86400000)
  }
  
  function startOfWeek(date: Date, weekStart: number) {
    const d = new Date(date)
    const day = d.getDay()
    const diff = (day - weekStart + 7) % 7
    d.setDate(d.getDate() - diff)
    d.setHours(0, 0, 0, 0)
    return d
  }
  
  function animateNumber(from: number, to: number, duration = 400) {
    const start = performance.now()
    const delta = to - from
  
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      animatedTotal.value = Math.round(from + delta * eased)
      if (p < 1) requestAnimationFrame(step)
    }
  
    requestAnimationFrame(step)
  }
  
  function formatMonthLabel(year: number, monthNumber: number, loc: Locale) {
    const d = new Date(year, monthNumber - 1, 1)
    return new Intl.DateTimeFormat(loc === 'ar' ? 'ar-EG' : 'en-US', {
      month: 'long',
      year: 'numeric'
    }).format(d)
  }
  
  const ringBox = 152
  const cx = ringBox / 2
  const cy = ringBox / 2
  const outerR = 62
  
  const monthSegments = computed(() => {
    const total = daysInCurrentMonth.value
    const result: Array<{
      day: number
      x1: number
      y1: number
      x2: number
      y2: number
      kind: SegKind
    }> = []
  
    for (let day = 1; day <= total; day++) {
      const startAngle = (-90 + ((day - 1) / total) * 360) * (Math.PI / 180)
      const endAngle = (-90 + ((day - 0.74) / total) * 360) * (Math.PI / 180)
  
      const x1 = cx + Math.cos(startAngle) * outerR
      const y1 = cy + Math.sin(startAngle) * outerR
      const x2 = cx + Math.cos(endAngle) * outerR
      const y2 = cy + Math.sin(endAngle) * outerR
  
      const iso = `${currentMonthKey.value}-${String(day).padStart(2, '0')}`
  
      let kind: SegKind
      if (day > todayDayOfMonth.value) {
        kind = 'future'
      } else if (currentMonthReadSet.value.has(iso)) {
        kind = 'read'
      } else if (day === todayDayOfMonth.value) {
        kind = 'today-unread'
      } else {
        kind = 'unread-past'
      }
  
      result.push({ day, x1, y1, x2, y2, kind })
    }
  
    return result
  })
  
  onMounted(async () => {
    await loadReadDays()
    console.log('mk_daily_read_fab_v1', readDays.value)
  })
  </script>
  
  <style scoped>
  .drfWrap {
    position: fixed;
    pointer-events: none;
  }
  
  .drfWrap > * {
    pointer-events: auto;
  }
  
  /* =========================
     FAB
  ========================= */
  .drfFab {
  position: relative;
  width: 152px;
  height: 152px;
  border: 0;
  border-radius: 999px;
  background:
    radial-gradient(circle at 26% 18%, rgba(255, 209, 102, 0.18), transparent 32%),
    radial-gradient(circle at 80% 18%, rgba(124, 219, 255, 0.16), transparent 30%),
    radial-gradient(circle at 50% 100%, rgba(40, 214, 204, 0.10), transparent 48%),
    linear-gradient(180deg, rgba(255,255,255,0.97), rgba(246,251,252,0.96));
  box-shadow:
    0 16px 38px rgba(15, 27, 47, 0.2),
    0 6px 18px rgba(15, 27, 47, 0.1),
    0 0 0 1px rgba(255,255,255,0.75) inset;
  cursor: pointer;
  overflow: hidden;
  backdrop-filter: blur(10px);
  -webkit-tap-highlight-color: transparent;
  transition: filter 0.25s ease, transform 0.2s ease, box-shadow 0.25s ease, background 0.25s ease;
}
.drfWrap.done .drfFab {
  background:
    radial-gradient(circle at 26% 18%, rgba(255, 209, 102, 0.34), transparent 32%),
    radial-gradient(circle at 80% 18%, rgba(124, 219, 255, 0.34), transparent 30%),
    radial-gradient(circle at 50% 100%, rgba(40, 214, 204, 0.22), transparent 48%),
    linear-gradient(180deg, rgba(255,255,255,0.97), rgba(246,251,252,0.96));
}
.drfWrap:not(.done) .drfFab {
  filter: saturate(0.45) brightness(0.98);
}

.drfWrap:not(.done) .drfInner {
  background:
    radial-gradient(circle at 50% 30%, rgba(40,214,204,0.03), transparent 60%),
    radial-gradient(circle at 50% 120%, rgba(255,209,102,0.04), transparent 38%),
    rgba(255,255,255,0.92);
}
  .drfFab:active {
    transform: scale(0.985);
  }
  
  .drfInner {
    position: absolute;
    inset: 18px;
    display: grid;
    place-items: center;
    text-align: center;
    border-radius: 999px;
    background:
      radial-gradient(circle at 50% 30%, rgba(40,214,204,0.12), rgba(40,214,204,0.03) 56%, transparent 76%),
      radial-gradient(circle at 50% 120%, rgba(255,209,102,0.18), transparent 38%),
      rgba(255,255,255,0.88);
    padding: 10px 14px;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.72);
    transition: background 0.25s ease;
  }
  
  .drfRingSvg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }
  
  .drfSeg {
    stroke-width: 6.6;
    transition: opacity 0.25s ease, stroke 0.25s ease, transform 0.25s ease, filter 0.25s ease;
  }
  
  /* =========================
     Ring state
     Muted when NOT read today
  ========================= */
  .drfSeg.read {
    stroke: rgba(40,214,204,0.42);
  }
  
  .drfWrap.done .drfSeg.read {
    stroke: url(#drfReadGrad);
  }
  
  .drfSeg.unread-past {
    stroke: rgba(15, 27, 47, 0.14);
  }
  
  .drfWrap:not(.done) .drfSeg.unread-past {
    stroke: rgba(15, 27, 47, 0.09);
  }
  
  .drfSeg.today-unread {
    stroke: rgba(255, 209, 102, 0.92);
  }
  
  .drfWrap:not(.done) .drfSeg.today-unread {
    stroke: rgba(255, 209, 102, 0.98);
    filter: drop-shadow(0 0 3px rgba(255, 209, 102, 0.28));
  }
  
  .drfSeg.future {
    stroke: rgba(15, 27, 47, 0.06);
  }
  
  /* whole fab calmer when not done */
  .drfWrap:not(.done) .drfFab {
    filter: saturate(0.78) brightness(0.985);
  }
  
  .drfWrap:not(.done) .drfInner {
    background:
      radial-gradient(circle at 50% 30%, rgba(40,214,204,0.06), transparent 60%),
      radial-gradient(circle at 50% 120%, rgba(255,209,102,0.10), transparent 38%),
      rgba(255,255,255,0.9);
  }
  
  .drfWrap:not(.done) .drfText {
    color: rgba(15, 27, 47, 0.72);
  }
  
  .drfCount {
    font-size: 33px;
    font-weight: 900;
    line-height: 1;
    color: #0f1b2f;
    margin-top: 4px;
  }
  
  .drfCountLabel {
    display:none;
    font-size: 11px;
    line-height: 1;
    color: rgba(15, 27, 47, 0.58);
    margin-top: 4px;
    font-weight: 800;
  }
  
  .drfText {
    margin-top: 3px;
    font-size: 19px;
    line-height: 1.28;
    font-weight: 800;
    color: #0f1b2f;
    max-width: 90px;
    transition: color 0.25s ease;
  }
  
  .drfGlow {
    position: absolute;
    inset: -16px;
    border-radius: inherit;
    background:
      radial-gradient(circle, rgba(40,214,204,0.18), rgba(124,219,255,0.08) 35%, rgba(255,209,102,0.06) 52%, rgba(40,214,204,0) 68%);
    opacity: 0;
    transform: scale(0.88);
  }
  
  .drfWrap:not(.done) .drfGlow {
    display: none;
  }
  
  .drfWrap.reward .drfGlow {
    animation: drfGlowPulse 0.8s ease;
  }
  
  .drfBurst {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }
  
  .drfBurst span {
    position: absolute;
    font-size: 14px;
    opacity: 0;
    animation: drfBurst 0.9s ease forwards;
  }
  
  .drfBurst span:nth-child(1) { top: 22px; left: 30px; }
  .drfBurst span:nth-child(2) { top: 18px; right: 28px; animation-delay: 0.06s; }
  .drfBurst span:nth-child(3) { bottom: 28px; left: 24px; animation-delay: 0.11s; }
  
  /* =========================
     Backdrop
  ========================= */
  .drfBackdrop {
    position: fixed;
    inset: 0;
    border: 0;
    background: rgba(8, 12, 18, 0.22);
    cursor: default;
  }
  
  .drfBackdropTop {
    z-index: 100000;
  }
  
  /* =========================
     Sheet
  ========================= */
  .drfSheet {
    position: fixed;
    left: 12px;
    right: 12px;
    bottom: 12px;
    border-radius: 24px;
    background:
      radial-gradient(circle at 20% 0%, rgba(40,214,204,0.09), transparent 30%),
      radial-gradient(circle at 90% 0%, rgba(255,209,102,0.10), transparent 26%),
      rgba(255,255,255,0.985);
    box-shadow: 0 18px 50px rgba(15, 27, 47, 0.22);
    padding: 12px 12px 16px;
    backdrop-filter: blur(12px);
    max-width: 560px;
    margin-inline: auto;
    z-index: 100001;
    max-height: min(78vh, 720px);
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }
  
  .drfHandle {
    width: 54px;
    height: 5px;
    border-radius: 999px;
    background: rgba(15, 27, 47, 0.14);
    margin: 2px auto 12px;
  }
  
  .drfSheetHeader {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  
  .drfSheetTitle {
    font-size: 18px;
    font-weight: 900;
    color: #0f1b2f;
  }
  
  .drfClose {
    width: 34px;
    height: 34px;
    border: 0;
    border-radius: 999px;
    background: rgba(15, 27, 47, 0.06);
    color: #0f1b2f;
    font-size: 22px;
    line-height: 1;
    cursor: pointer;
  }
  
  .drfStatsGrid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-top: 14px;
  }
  
  .drfStatCard {
    border-radius: 18px;
    padding: 14px;
    background:
      linear-gradient(180deg, rgba(40,214,204,0.07), rgba(15,27,47,0.025));
    border: 1px solid rgba(15, 27, 47, 0.06);
  }
  
  .drfMonthCard {
    background:
      radial-gradient(circle at 0% 0%, rgba(40,214,204,0.12), transparent 30%),
      radial-gradient(circle at 100% 0%, rgba(255,209,102,0.14), transparent 24%),
      linear-gradient(180deg, rgba(255,255,255,0.76), rgba(15,27,47,0.02));
  }
  
  .drfStatCardWide {
    grid-column: 1 / -1;
  }
  
  .drfStatLabel {
    font-size: 12px;
    color: rgba(15, 27, 47, 0.62);
    margin-bottom: 8px;
    font-weight: 800;
  }
  
  .drfStatValue {
    font-size: 28px;
    font-weight: 900;
    line-height: 1;
    color: #0f1b2f;
  }
  
  .drfStatSub {
    margin-top: 8px;
    font-size: 13px;
    line-height: 1.4;
    color: rgba(15, 27, 47, 0.86);
  }
  
  .drfMonthProgress {
    margin-top: 0;
    font-size: 15px;
    font-weight: 800;
  }
  
  .drfWeek {
    margin-top: 14px;
    border-radius: 18px;
    padding: 14px;
    background: rgba(15, 27, 47, 0.03);
    border: 1px solid rgba(15, 27, 47, 0.06);
  }
  
  .drfWeekTitle {
    font-size: 13px;
    font-weight: 800;
    color: #0f1b2f;
    margin-bottom: 10px;
  }
  
  .drfWeekStrip {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 8px;
  }
  
  .drfWeekDot {
    min-height: 42px;
    border-radius: 14px;
    display: grid;
    place-items: center;
    background: rgba(15, 27, 47, 0.08);
    color: rgba(15, 27, 47, 0.55);
    transition: transform 0.18s ease, background 0.18s ease, box-shadow 0.18s ease;
  }
  
  .drfWeekDot.read {
    background:
      linear-gradient(135deg, rgba(40,214,204,0.25), rgba(124,219,255,0.18));
    color: #0f1b2f;
  }
  
  .drfWeekDot.today {
  }
  
  .drfWeekDay {
    font-size: 12px;
    font-weight: 900;
  }
  
  .drfRewardsCard {
    margin-top: 14px;
    border-radius: 18px;
    padding: 14px;
    background:
      radial-gradient(circle at 0% 0%, rgba(255,209,102,0.15), transparent 28%),
      radial-gradient(circle at 100% 0%, rgba(40,214,204,0.12), transparent 26%),
      rgba(15, 27, 47, 0.03);
    border: 1px solid rgba(15, 27, 47, 0.06);
  }
  
  .drfRewardsHead {
    font-size: 13px;
    font-weight: 900;
    color: #0f1b2f;
    margin-bottom: 10px;
  }
  
  .drfSheetHeader,
  .drfMonthsHead {
    backdrop-filter: blur(8px);
    padding-bottom: 8px;
  }
  
  .drfRewardsRow {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  
  .drfRewardItem {
    border: 0;
    border-radius: 16px;
    padding: 12px;
    background: rgba(255,255,255,0.72);
    display: flex;
    align-items: center;
    gap: 10px;
    text-align: start;
  }
  
  .drfRewardBtn {
    cursor: pointer;
  }
  
  .drfRewardIcon {
    width: 42px;
    height: 42px;
    border-radius: 14px;
    display: grid;
    place-items: center;
    font-size: 21px;
    background:
      linear-gradient(135deg, rgba(255,209,102,0.22), rgba(40,214,204,0.18));
  }
  
  .drfRewardMeta {
    min-width: 0;
  }
  
  .drfRewardCount {
    font-size: 22px;
    font-weight: 900;
    color: #0f1b2f;
    line-height: 1;
  }
  
  .drfRewardLabel {
    margin-top: 4px;
    font-size: 12px;
    color: rgba(15, 27, 47, 0.72);
    font-weight: 800;
  }
  
  .drfRewardsHint {
    margin-top: 10px;
    font-size: 12px;
    line-height: 1.45;
    color: rgba(15, 27, 47, 0.72);
  }
  
  /* =========================
     Completed months modal
  ========================= */
  .drfMonthsModal {
    position: fixed;
    left: 16px;
    right: 16px;
    top: 50%;
    transform: translateY(-50%);
    max-width: 460px;
    margin-inline: auto;
    border-radius: 24px;
    background: rgba(255,255,255,0.99);
    box-shadow: 0 24px 70px rgba(15, 27, 47, 0.25);
    padding: 14px;
    z-index: 100002;
    max-height: min(78vh, 720px);
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }
  
  .drfMonthsHead {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  
  .drfMonthsTitle {
    font-size: 18px;
    font-weight: 900;
    color: #0f1b2f;
  }
  
  .drfMonthsList {
    margin-top: 12px;
    display: grid;
    gap: 8px;
    max-height: min(50vh, 420px);
    overflow: auto;
  }
  
  .drfMonthRow {
    display: flex;
    align-items: center;
    gap: 10px;
    border-radius: 16px;
    padding: 12px 14px;
    background:
      linear-gradient(135deg, rgba(255,209,102,0.18), rgba(40,214,204,0.12));
  }
  
  .drfMonthIcon {
    font-size: 18px;
  }
  
  .drfMonthText {
    font-size: 14px;
    font-weight: 800;
    color: #0f1b2f;
  }
  
  .drfMonthsEmpty {
    margin-top: 14px;
    border-radius: 16px;
    padding: 18px;
    background: rgba(15, 27, 47, 0.04);
    text-align: center;
    font-weight: 800;
    color: rgba(15, 27, 47, 0.74);
  }
  
  /* =========================
     Animations
  ========================= */
  .drfFade-enter-active,
  .drfFade-leave-active {
    transition: opacity 0.22s ease;
  }
  
  .drfFade-enter-from,
  .drfFade-leave-to {
    opacity: 0;
  }
  
  .drfSheet-enter-active,
  .drfSheet-leave-active {
    transition: transform 0.28s ease, opacity 0.28s ease;
  }
  
  .drfSheet-enter-from,
  .drfSheet-leave-to {
    transform: translateY(18px);
    opacity: 0;
  }
  
  .drfScale-enter-active,
  .drfScale-leave-active {
    transition: transform 0.22s ease, opacity 0.22s ease;
  }
  
  .drfScale-enter-from,
  .drfScale-leave-to {
    transform: translateY(-50%) scale(0.96);
    opacity: 0;
  }
  
  @keyframes drfGlowPulse {
    0% {
      opacity: 0;
      transform: scale(0.88);
    }
    35% {
      opacity: 1;
      transform: scale(1.02);
    }
    100% {
      opacity: 0;
      transform: scale(1.14);
    }
  }
  
  @keyframes drfBurst {
    0% {
      opacity: 0;
      transform: translateY(0) scale(0.7);
    }
    18% {
      opacity: 1;
    }
    100% {
      opacity: 0;
      transform: translateY(-10px) scale(1.05);
    }
  }
  
  /* =========================
     Dark mode
     expects a parent with .theme-dark
  ========================= */
  :global(.theme-dark) .drfFab {
    background:
      radial-gradient(circle at 26% 18%, rgba(255, 209, 102, 0.16), transparent 32%),
      radial-gradient(circle at 80% 18%, rgba(124, 219, 255, 0.14), transparent 30%),
      radial-gradient(circle at 50% 100%, rgba(40, 214, 204, 0.14), transparent 48%),
      linear-gradient(180deg, rgba(18,26,38,0.96), rgba(10,16,26,0.96));
    box-shadow:
      0 16px 38px rgba(0, 0, 0, 0.42),
      0 6px 18px rgba(0, 0, 0, 0.32),
      0 0 0 1px rgba(255,255,255,0.06) inset;
  }
  
  :global(.theme-dark) .drfInner {
    background:
      radial-gradient(circle at 50% 30%, rgba(40,214,204,0.10), rgba(40,214,204,0.02) 56%, transparent 76%),
      radial-gradient(circle at 50% 120%, rgba(255,209,102,0.10), transparent 38%),
      rgba(12,18,28,0.86);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
  }
  
  :global(.theme-dark) .drfWrap:not(.done) .drfFab {
    filter: saturate(0.72) brightness(0.95);
  }
  
  :global(.theme-dark) .drfWrap:not(.done) .drfInner {
    background:
      radial-gradient(circle at 50% 30%, rgba(40,214,204,0.05), transparent 60%),
      radial-gradient(circle at 50% 120%, rgba(255,209,102,0.05), transparent 38%),
      rgba(12,18,28,0.9);
  }
  
  :global(.theme-dark) .drfSeg.read {
    stroke: rgba(40,214,204,0.34);
  }
  
  :global(.theme-dark) .drfWrap.done .drfSeg.read {
    stroke: url(#drfReadGrad);
  }
  
  :global(.theme-dark) .drfSeg.unread-past {
    stroke: rgba(255,255,255,0.11);
  }
  
  :global(.theme-dark) .drfWrap:not(.done) .drfSeg.unread-past {
    stroke: rgba(255,255,255,0.08);
  }
  
  :global(.theme-dark) .drfSeg.today-unread {
    stroke: rgba(255, 209, 102, 0.88);
  }
  
  :global(.theme-dark) .drfSeg.future {
    stroke: rgba(255,255,255,0.05);
  }
  
  :global(.theme-dark) .drfCount,
  :global(.theme-dark) .drfText,
  :global(.theme-dark) .drfSheetTitle,
  :global(.theme-dark) .drfStatValue,
  :global(.theme-dark) .drfWeekTitle,
  :global(.theme-dark) .drfRewardsHead,
  :global(.theme-dark) .drfRewardCount,
  :global(.theme-dark) .drfMonthsTitle,
  :global(.theme-dark) .drfMonthText {
    color: #f5f7fb;
  }
  
  :global(.theme-dark) .drfCountLabel,
  :global(.theme-dark) .drfStatLabel,
  :global(.theme-dark) .drfRewardLabel,
  :global(.theme-dark) .drfRewardsHint,
  :global(.theme-dark) .drfMonthsEmpty,
  :global(.theme-dark) .drfStatSub {
    color: rgba(245,247,251,0.72);
  }
  
  :global(.theme-dark) .drfWrap:not(.done) .drfText {
    color: rgba(245,247,251,0.76);
  }
  
  :global(.theme-dark) .drfBackdrop {
    background: rgba(0, 0, 0, 0.42);
  }
  
  :global(.theme-dark) .drfSheet {
    background:
      radial-gradient(circle at 20% 0%, rgba(40,214,204,0.12), transparent 30%),
      radial-gradient(circle at 90% 0%, rgba(255,209,102,0.10), transparent 26%),
      rgba(10,16,26,0.98);
    box-shadow: 0 18px 50px rgba(0, 0, 0, 0.45);
  }
  
  :global(.theme-dark) .drfHandle {
    background: rgba(255,255,255,0.14);
  }
  
  :global(.theme-dark) .drfClose {
    background: rgba(255,255,255,0.08);
    color: #f5f7fb;
  }
  
  :global(.theme-dark) .drfStatCard {
    background:
      linear-gradient(180deg, rgba(40,214,204,0.08), rgba(255,255,255,0.02));
    border-color: rgba(255,255,255,0.08);
  }
  
  :global(.theme-dark) .drfMonthCard {
    background:
      radial-gradient(circle at 0% 0%, rgba(40,214,204,0.14), transparent 30%),
      radial-gradient(circle at 100% 0%, rgba(255,209,102,0.12), transparent 24%),
      linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02));
  }
  
  :global(.theme-dark) .drfWeek {
    background: rgba(255,255,255,0.04);
    border-color: rgba(255,255,255,0.08);
  }
  
  :global(.theme-dark) .drfWeekDot {
    background: rgba(255,255,255,0.08);
    color: rgba(245,247,251,0.68);
  }
  
  :global(.theme-dark) .drfWeekDot.read {
    background:
      linear-gradient(135deg, rgba(40,214,204,0.24), rgba(124,219,255,0.16));
    color: #f5f7fb;
  }
  
  :global(.theme-dark) .drfWeekDot.today {
    box-shadow: inset 0 0 0 2px rgba(255, 209, 102, 0.78);
  }
  
  :global(.theme-dark) .drfRewardsCard {
    background:
      radial-gradient(circle at 0% 0%, rgba(255,209,102,0.12), transparent 28%),
      radial-gradient(circle at 100% 0%, rgba(40,214,204,0.10), transparent 26%),
      rgba(255,255,255,0.03);
    border-color: rgba(255,255,255,0.08);
  }
  
  :global(.theme-dark) .drfRewardItem {
    background: rgba(255,255,255,0.06);
  }
  
  :global(.theme-dark) .drfRewardIcon {
    background:
      linear-gradient(135deg, rgba(255,209,102,0.18), rgba(40,214,204,0.14));
  }
  
  :global(.theme-dark) .drfMonthsModal {
    background: rgba(10,16,26,0.99);
    box-shadow: 0 24px 70px rgba(0, 0, 0, 0.48);
  }
  
  :global(.theme-dark) .drfMonthRow {
    background:
      linear-gradient(135deg, rgba(255,209,102,0.14), rgba(40,214,204,0.10));
  }
  
  :global(.theme-dark) .drfMonthsEmpty {
    background: rgba(255,255,255,0.05);
    color: rgba(245,247,251,0.76);
  }
  
  /* =========================
     Mobile
  ========================= */
  @media (max-width: 420px) {
    .drfFab {
      width: 110px;
      height: 110px;
    }
  
    .drfInner {
      inset: 16px;
    }
  
    .drfCount {
      font-size: 28px;
    }
  
    .drfText {
      font-size: 13px;
      max-width: 82px;
    }
  
    .drfStatsGrid,
    .drfRewardsRow {
      grid-template-columns: 1fr;
    }
  
    .drfStatCardWide {
      grid-column: auto;
    }
  }
  </style>