import { createRouter, createWebHashHistory } from '@ionic/vue-router'
import type { RouteRecordRaw } from 'vue-router'

import HomePage from '../views/HomePage.vue'
import ChapterPage from '@/views/ChapterPage.vue'

const routes: Array<RouteRecordRaw> = [
  { path: '/', name: 'HomeRoot', component: HomePage },
  { path: '/home', redirect: '/' },
  

  // ✅ مرة واحدة فقط
  { path: '/chapter/:bookKey/:chapter', name: 'Chapter', 
    component: ChapterPage},

  { path: '/saint/:dateISO', name: 'Saint', component: () => import('@/views/SaintPage.vue') },
  { path: '/agbia-audio/:date', name: 'AgbiaAudio', component: () => import('@/views/AgbiaAudioPage.vue') },
  {
    path: '/occasional/:file',
    component: () => import('@/views/OccasionalPage.vue')
  },
  {
    path: '/daily-audio/:iso',
    component: () => import('@/views/DailyAudioPage.vue')
  },
  { path: '/bible-stories', name: 'BibleStories', component: () => import('@/views/BibleStoriesPage.vue') },
{ path: '/bible-intros', name: 'BibleIntros', component: () => import('@/views/BibleIntrosPage.vue') },
{ path: '/coptic-words', name: 'CopticWords', component: () => import('@/views/CopticWordsPage.vue') },
{
  path: '/noor-alalam',
  component: () => import('@/views/NourAlAlamPage.vue')
},
{
  path: "/notes",
  component: () => import("@/views/NotesPage.vue"),
}


  
]

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL), // ✅ GitHub Pages safe
  routes,
})

export default router
