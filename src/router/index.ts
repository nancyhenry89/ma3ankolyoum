import { createRouter, createWebHashHistory } from '@ionic/vue-router'
import type { RouteRecordRaw } from 'vue-router'

import HomePage from '../views/HomePage.vue'
import ChapterPage from '@/views/ChapterPage.vue'

const routes: Array<RouteRecordRaw> = [
  { path: '/', redirect: '/home' },
  { path: '/home', name: 'Home', component: HomePage },

  // ✅ مرة واحدة فقط
  { path: '/chapter/:bookKey/:chapter', name: 'Chapter', component: ChapterPage },

  { path: '/saint/:dateISO', name: 'Saint', component: () => import('@/views/SaintPage.vue') },
  { path: '/agbia-audio/:date', name: 'AgbiaAudio', component: () => import('@/views/AgbiaAudioPage.vue') },
  {
    path: '/occasional/:file',
    component: () => import('@/views/OccasionalPage.vue')
  }
  
]

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL), // ✅ GitHub Pages safe
  routes,
})

export default router
