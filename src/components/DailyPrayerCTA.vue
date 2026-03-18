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
  import { computed, ref, onMounted } from "vue"
  import { useRouter } from "vue-router"
  import {
    fetchPrayerForWeekday,
    getDefaultCtaTitle,
    getTodayWeekdayKey,
  } from "@/utils/dailyPrayer"
  
  const router = useRouter()
  
  const visible = ref(true)
  const ctaTitle = ref("")
  
  const todayKey = getTodayWeekdayKey()
  
  const fallbackTitle = computed(() => getDefaultCtaTitle(todayKey))
  
  async function load() {
    try {
      const data = await fetchPrayerForWeekday(todayKey)
      ctaTitle.value = data.ctaTitle || fallbackTitle.value
      visible.value = data.sections.length > 0
    } catch {
      ctaTitle.value = fallbackTitle.value
      visible.value = true
    }
  }
  
  function goToPrayer() {
    router.push("/daily-prayer")
  }
  
  onMounted(load)
  </script>
  
  <style scoped>
  .dpCta{
    width:100%;
    display:flex;
    align-items:center;
    gap:12px;
    padding:14px 16px;
    border:none;
    border-radius:20px;
    cursor:pointer;
    text-align:right;
    background:
    linear-gradient(135deg, #ffd166, #fff1c1);
    box-shadow: 0 10px 24px rgba(0,0,0,0.08);
    color:#000;
  }
  
  :global(html[data-mk-theme="dark"]) .dpCta{
    background:
      radial-gradient(700px 240px at 15% 0%, rgba(31,182,170,0.14), transparent 60%),
      linear-gradient(135deg, rgba(255,255,255,0.07), rgba(255,255,255,0.04));
    border-color: rgba(255,255,255,0.12);
  }
  
  .dpIconWrap{
    width:46px;
    height:46px;
    border-radius:14px;
    display:grid;
    place-items:center;
    background: rgba(31,182,170,0.12);
    flex: 0 0 auto;
  }
  
  .dpIcon{
    font-size:24px;
    line-height:1;
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
  
  .dpArrow{
    flex:0 0 auto;
    font-size:24px;
    line-height:1;
    color:#4c677d;
  }
  
  :global(html[data-mk-theme="dark"]) .dpArrow{
    color:#d8e3ea;
  }
  </style>