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

// Permissions are re-read from the API once per page load, so a role change
// (or a session saved before permissions were stored) is picked up.
let permissionsRefreshed = false

router.beforeEach(async to => {
  const authStore = useAuthStore()

  if (to.matched.some(record => record.meta.requiresAuth) && !authStore.isLoggedIn)
    return '/login'

  if (guestOnlyPaths.includes(to.path) && authStore.isLoggedIn)
    return '/dashboard'

  if (authStore.isLoggedIn && !permissionsRefreshed) {
    permissionsRefreshed = true

    const refresh = authStore.fetchMe().catch(() => {})

    // Only block the first navigation when nothing is stored yet; otherwise
    // render straight away and let the refresh land in the background.
    if (!authStore.permissions.length)
      await refresh
  }

  // A page the user's role can't use would only show empty data and 403s:
  // send them somewhere they can work instead.
  const needed = to.meta.permission as string | undefined
  if (authStore.isLoggedIn && needed && !authStore.can(needed))
    return authStore.can('dashboard.view') && to.path !== '/dashboard' ? '/dashboard' : '/account-settings'

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
