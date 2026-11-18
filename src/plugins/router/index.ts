import type { App } from 'vue'
import { ref } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { routes } from './routes'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

const guestOnlyPaths = ['/login', '/register']

/**
 * True while a navigation is pending (mostly: the next page's lazy chunk is
 * downloading). Only flips on after a short delay so instant navigations
 * don't flash the progress bar.
 */
export const isNavigating = ref(false)
let navTimer: ReturnType<typeof setTimeout> | undefined

function stopProgress() {
  clearTimeout(navTimer)
  isNavigating.value = false
}

router.beforeEach(to => {
  const authStore = useAuthStore()

  if (to.matched.some(record => record.meta.requiresAuth) && !authStore.isLoggedIn)
    return '/login'

  if (guestOnlyPaths.includes(to.path) && authStore.isLoggedIn)
    return '/dashboard'

  clearTimeout(navTimer)
  navTimer = setTimeout(() => {
    isNavigating.value = true
  }, 120)
})

router.afterEach(stopProgress)

/**
 * A lazy page chunk can fail to load: after a new deploy the old chunk names
 * no longer exist, and in `vite dev` a dependency re-optimisation invalidates
 * already-requested modules. Without handling, the click just does nothing.
 * Reload once at the target URL (guarded so a real outage can't loop).
 */
const RELOAD_KEY = 'bookly_chunk_reload'

router.onError((error, to) => {
  stopProgress()

  const isChunkError = /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Outdated Optimize Dep/i
    .test(String(error?.message ?? error))

  if (!isChunkError)
    return

  const target = to?.fullPath ?? window.location.pathname

  if (sessionStorage.getItem(RELOAD_KEY) !== target) {
    sessionStorage.setItem(RELOAD_KEY, target)
    window.location.assign(target)
  }
})

router.isReady().then(() => sessionStorage.removeItem(RELOAD_KEY))

export default function (app: App) {
  app.use(router)
}

export { router }
