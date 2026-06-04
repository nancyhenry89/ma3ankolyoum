// src/router/index.ts
import { createRouter, createWebHashHistory } from '@ionic/vue-router'
import type { RouteRecordRaw } from 'vue-router'
import TabsLayout from '@/layouts/TabsLayout.vue'
import DailyPrayerPage from "@/views/DailyPrayerPageNew.vue"
const routes: Array<RouteRecordRaw> = [
  // ===== Root =====
  { path: '/', redirect: '/tabs/home' },

  // ===== Tabs wrapper =====
  {
    path: '/tabs',
    component: TabsLayout,
    children: [
      { path: '', redirect: '/tabs/home' },

      // Tabs الرئيسية
      { path: 'home', name: 'Home', component: () => import('@/views/HomePage.vue') },
      { path: 'bible', name: 'Bible', component: () => import('@/views/BiblePage.vue') },
      { path: 'bible-intros', name: 'BibleIntros', component: () => import('@/views/BibleIntrosPage.vue') },
      { path: 'bible-stories', name: 'BibleStories', component: () => import('@/views/BibleStoriesPage.vue') },
      { path: 'books', name: 'Books', component: () => import('@/views/BooksTab.vue') },

      // More / extra pages
      { path: 'noor-alalam', name: 'NoorAlAlam', component: () => import('@/views/NourAlAlamPage.vue') },
      { path: 'coptic-words', name: 'CopticWords', component: () => import('@/views/CopticWordsPage.vue') },
      { path: 'notes', name: 'Notes', component: () => import('@/views/NotesPage.vue') },

      // Pages from Home navigations
      { path: 'chapter/:bookKey/:chapter', name: 'Chapter', component: () => import('@/views/ChapterPage.vue') },
      { path: 'saint/:dateISO', name: 'Saint', component: () => import('@/views/SaintPage.vue') },
      { path: 'agbia-audio/:date', name: 'AgbiaAudio', component: () => import('@/views/AgbiaAudioPage.vue') },
      { path: 'occasional/:file', name: 'Occasional', component: () => import('@/views/OccasionalPage.vue') },
      { path: 'daily-audio/:iso', name: 'DailyAudio', component: () => import('@/views/DailyAudioPage.vue') },
    ],
  },

  // ===== Legacy redirects (VERY IMPORTANT) =====
  // tabs roots (old -> new)
  { path: '/home', redirect: '/tabs/home' },
  { path: '/bible', redirect: '/tabs/bible' },
  { path: '/bible-intros', redirect: '/tabs/bible-intros' },
  { path: '/bible-stories', redirect: '/tabs/bible-stories' },
  { path: '/noor-alalam', redirect: '/tabs/noor-alalam' },
  { path: '/coptic-words', redirect: '/tabs/coptic-words' },
  { path: '/notes', redirect: '/tabs/notes' },

  // dynamic pages (old -> new) ✅ keep params
  { path: '/chapter/:bookKey/:chapter', redirect: to => `/tabs/chapter/${to.params.bookKey}/${to.params.chapter}` },
  { path: '/saint/:dateISO', redirect: to => `/tabs/saint/${to.params.dateISO}` },
  { path: '/agbia-audio/:date', redirect: to => `/tabs/agbia-audio/${to.params.date}` },
  { path: '/occasional/:file', redirect: to => `/tabs/occasional/${to.params.file}` },
  { path: '/daily-audio/:iso', redirect: to => `/tabs/daily-audio/${to.params.iso}` },

  { path: '/books', redirect: '/tabs/books' },
{ path: '/book/:bookId', component: () => import('@/views/BookTocPage.vue') },
{ path: '/book/:bookId/:chapterId/:sectionId', component: () => import('@/views/BookReaderPage.vue') },
{
  path: "/daily-prayer-new",
  name: "DailyPrayerNew",
  component: DailyPrayerPage,
},
  // ===== Fallback =====
  { path: '/:pathMatch(.*)*', redirect: '/tabs/home' }

]

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL), // GitHub Pages safe
  routes,
})

export default router
