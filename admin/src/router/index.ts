import i18n from '@/plugins/i18n'
import { createRouter, createWebHistory } from 'vue-router'

import type { RouteRecordRaw } from 'vue-router'

const __ = i18n.global.t

const routes: RouteRecordRaw[] = [
  {
    path: '/init',
    name: 'init',
    meta: {
      title: () => __('admin.init.title'),
    },
    component: () => import('@/views/init/index.vue'),
  },
  {
    path: '/sign-in',
    name: 'signIn',
    meta: {
      title: () => __('admin.signin.title'),
    },
    component: () => import('@/views/sign-in/index.vue'),
  },
  {
    path: '/upgrade-guide',
    name: 'upgradeGuide',
    meta: {
      title: () => __('admin.init.upgrade_guide'),
    },
    component: () => import('@/views/upgrade-guide/index.vue'),
  },
  {
    name: 'errorPage',
    path: '/:pathMatch(.*)*',
    meta: {
      title: () => __('admin.error.generic_title'),
    },
    component: () => import('@/views/error-page/index.vue'),
  },
]

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  strict: true,
})

export default router
