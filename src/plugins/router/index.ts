import type { App } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { routes } from './routes'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

const guestOnlyPaths = ['/login', '/register']

router.beforeEach(to => {
  const authStore = useAuthStore()

  if (to.matched.some(record => record.meta.requiresAuth) && !authStore.isLoggedIn)
    return '/login'

  if (guestOnlyPaths.includes(to.path) && authStore.isLoggedIn)
    return '/dashboard'
})

export default function (app: App) {
  app.use(router)
}

export { router }
