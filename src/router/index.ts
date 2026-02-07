// src/router/index.ts
import { createRouter, createWebHashHistory } from '@ionic/vue-router'
import type { RouteRecordRaw } from 'vue-router'

import TabsLayout from '@/layouts/TabsLayout.vue'

// ✅ (اختياري) لو بتحبي تسيبي Home lazy زي الباقي، بس مش لازم
// import HomePage from '@/views/HomePage.vue'

const routes: Array<RouteRecordRaw> = [
  // ✅ root -> home tab
  { path: '/', redirect: '/home' },

  // ✅ Tabs wrapper (Bottom bar ثابت)
  {
    path: '/',
    component: TabsLayout,
    children: [
      // Tabs الرئيسية
      { path: 'home', name: 'Home', component: () => import('@/views/HomePage.vue') },
      { path: 'bible-intros', name: 'BibleIntros', component: () => import('@/views/BibleIntrosPage.vue') },
      { path: 'bible-stories', name: 'BibleStories', component: () => import('@/views/BibleStoriesPage.vue') },
      { path: 'noor-alalam', name: 'NoorAlAlam', component: () => import('@/views/NourAlAlamPage.vue') },

      // More / extra pages (بتتفتح من ActionSheet أو deep links)
      { path: 'coptic-words', name: 'CopticWords', component: () => import('@/views/CopticWordsPage.vue') },
      { path: 'notes', name: 'Notes', component: () => import('@/views/NotesPage.vue') },

      // Pages from Home navigations
      { path: 'chapter/:bookKey/:chapter', name: 'Chapter', component: () => import('@/views/ChapterPage.vue') },
      { path: 'saint/:dateISO', name: 'Saint', component: () => import('@/views/SaintPage.vue') },
      { path: 'agbia-audio/:date', name: 'AgbiaAudio', component: () => import('@/views/AgbiaAudioPage.vue') },
      { path: 'occasional/:file', name: 'Occasional', component: () => import('@/views/OccasionalPage.vue') },
      { path: 'daily-audio/:iso', name: 'DailyAudio', component: () => import('@/views/DailyAudioPage.vue') },
      { path: '/bible', name: 'Bible', component: () => import('@/views/BiblePage.vue') },
    ],
  },

  // ✅ Fallback (اختياري)
  { path: '/:pathMatch(.*)*', redirect: '/home' },
]

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL), // ✅ GitHub Pages safe
  routes,
})

export default router
