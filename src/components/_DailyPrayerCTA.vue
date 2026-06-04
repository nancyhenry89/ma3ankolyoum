<template>
  <button
    v-if="visible"
    class="dpCta"
    type="button"
    dir="rtl"
    lang="ar"
    @click="goToPrayer"
  >
    <div class="dpText">
      <div class="dpTitle">🙏 {{ ctaTitle }}</div>
    </div>
  </button>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { useRouter } from "vue-router"
import {
  fetchPrayerForWeekdayNew,
  getDefaultCtaTitle,
  getWeekdayKeyFromISO,
  type WeekdayKey,
} from "@/utils/dailyPrayerNew"

const router = useRouter()

const props = defineProps<{
  dateIso?: string
}>()

const visible = ref(true)
const ctaTitle = ref("")

const weekdayKey = computed<WeekdayKey>(() => {
  return getWeekdayKeyFromISO(props.dateIso)
})

const fallbackTitle = computed(() => getDefaultCtaTitle(weekdayKey.value))

async function load() {
  console.log("CTA →", props.dateIso, weekdayKey.value)

  try {
    const data = await fetchPrayerForWeekdayNew(weekdayKey.value, true)
    ctaTitle.value = data.ctaTitle || fallbackTitle.value
    visible.value = Array.isArray(data.sections) && data.sections.length > 0
  } catch (e) {
    console.error("CTA load failed:", e)
    ctaTitle.value = fallbackTitle.value
    visible.value = true
  }
}

function goToPrayer() {
  router.push({
    name: "DailyPrayerNew",
    query: props.dateIso ? { date: props.dateIso } : undefined,
  })
}

watch(
  weekdayKey,
  () => {
    load()
  },
  { immediate: true }
)
</script>

<style scoped>
.dpCta{
  width:100%;
  display:flex;
  align-items:center;
  justify-content:center;
  gap:12px;
  padding:14px 16px;
  border:none;
  border-radius:20px;
  cursor:pointer;
  text-align:center;
  background: linear-gradient(135deg, #ffd166, #fff1c1);
  box-shadow: 0 10px 24px rgba(0,0,0,0.08);
  color:#000;
  transition: transform 0.15s ease, box-shadow 0.25s ease;
  margin-top:15px
}

.dpCta:active{
  transform: scale(0.98);
}

:global(html[data-mk-theme="dark"]) .dpCta{
  background:
    radial-gradient(700px 240px at 15% 0%, rgba(31,182,170,0.14), transparent 60%),
    linear-gradient(135deg, rgba(255,255,255,0.07), rgba(255,255,255,0.04));
  border: 1px solid rgba(255,255,255,0.12);
}

.dpText{
  flex:1;
  min-width:0;
}

.dpTitle{
  font-family: "Noto Kufi Arabic", system-ui, sans-serif;
  font-weight: 900;
  font-size: 19px;
  line-height: 1.7;
  text-align: center;
}

:global(html[data-mk-theme="dark"]) .dpTitle{
  color:#f5f7fa;
}
</style>