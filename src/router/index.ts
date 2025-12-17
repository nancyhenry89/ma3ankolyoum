import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import HomePage from '../views/HomePage.vue';
import ChapterPage from '@/views/ChapterPage.vue'


const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/home'
  },
  {
    path: '/home',
    name: 'Home',
    component: HomePage
  },
  {
    path: '/chapter/:bookKey/:chapter',
    name: 'chapter',
    component: ChapterPage
  },
  {
    path: '/chapter/:bookKey/:chapter',
    component: () => import('../views/ChapterPage.vue')
  },
  {
    path: '/saint/:dateISO',
    name: 'Saint',
    component: () => import('@/views/SaintPage.vue')
  }
  
  
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router
