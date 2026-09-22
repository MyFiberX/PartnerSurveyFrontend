/**
 * Routes and guards.
 *
 * There is deliberately no /register route: the frontend exposes no
 * registration entry point. /login is the only way in.
 */
import { watch } from 'vue'
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { auth, setUnauthorizedRedirect } from '../stores/auth'
import { i18n, type MessageKey } from '../stores/i18n'

declare module 'vue-router' {
  interface RouteMeta {
    /** Requires a valid token. */
    requiresAuth?: boolean
    /** Requires role === 'Admin'. UX only; the backend is the real authority. */
    requiresAdmin?: boolean
    /** Signed-in users are bounced away (the login page). */
    guestOnly?: boolean
    /** i18n key; resolved at navigation time so the title follows the locale. */
    titleKey?: MessageKey
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: () => (auth.isAuthenticated.value ? '/dashboard' : '/survey'),
  },
  {
    // The public partner survey wizard, unchanged from before the dashboard.
    path: '/survey',
    name: 'survey',
    component: () => import('../views/PublicSurveyView.vue'),
    meta: { titleKey: 'survey.title' },
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/LoginView.vue'),
    meta: { guestOnly: true, titleKey: 'login.title' },
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('../views/DashboardView.vue'),
    meta: { requiresAuth: true, titleKey: 'nav.dashboard' },
  },
  {
    path: '/surveys',
    name: 'surveys',
    component: () => import('../views/SurveysView.vue'),
    meta: { requiresAuth: true, titleKey: 'surveys.title' },
  },
  {
    path: '/surveys/:id',
    name: 'survey-details',
    component: () => import('../views/SurveyDetailsView.vue'),
    meta: { requiresAuth: true, titleKey: 'surveys.detailsTitle' },
  },
  {
    path: '/rating-criteria',
    name: 'rating-criteria',
    component: () => import('../views/RatingCriteriaView.vue'),
    meta: { requiresAuth: true, titleKey: 'criteria.title' },
  },
  {
    path: '/rating-criteria/:id',
    name: 'rating-criterion-details',
    component: () => import('../views/RatingCriterionDetailsView.vue'),
    meta: { requiresAuth: true, titleKey: 'criteria.detailsTitle' },
  },
  {
    path: '/users',
    name: 'users',
    component: () => import('../views/UsersView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true, titleKey: 'users.title' },
  },
  {
    path: '/users/:id',
    name: 'user-details',
    component: () => import('../views/UserDetailsView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true, titleKey: 'users.detailsTitle' },
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('../views/ProfileView.vue'),
    meta: { requiresAuth: true, titleKey: 'profile.title' },
  },
  {
    path: '/change-password',
    name: 'change-password',
    component: () => import('../views/ChangePasswordView.vue'),
    meta: { requiresAuth: true, titleKey: 'password.title' },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('../views/NotFoundView.vue'),
    meta: { titleKey: 'notFound.title' },
  },
]

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach((to) => {
  const signedIn = auth.isAuthenticated.value

  if (to.meta.requiresAuth && !signedIn) {
    // Remember where they were headed, unless it is login itself (no loops).
    return { name: 'login', query: to.fullPath === '/login' ? {} : { redirect: to.fullPath } }
  }

  if (to.meta.requiresAdmin && !auth.isAdmin.value) {
    return { name: 'dashboard' }
  }

  if (to.meta.guestOnly && signedIn) {
    return { name: 'dashboard' }
  }

  return true
})

function applyTitle() {
  const base = i18n.t('app.brand')
  const key = router.currentRoute.value.meta.titleKey
  document.title = key ? `${i18n.t(key)} — ${base}` : base
}

router.afterEach(applyTitle)

// Switching language retitles the page already on screen.
watch(i18n.locale, applyTitle)

// A 401 from any request clears auth and lands on login, preserving the target.
setUnauthorizedRedirect(() => {
  const current = router.currentRoute.value
  if (current.name === 'login') return
  void router.replace({
    name: 'login',
    query: current.meta.requiresAuth ? { redirect: current.fullPath } : {},
  })
})
