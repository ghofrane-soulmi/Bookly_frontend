import type { InternalAxiosRequestConfig } from 'axios'
import axios from 'axios'
import { router } from '@/plugins/router'
import { useAuthStore } from '@/stores/auth'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    Accept: 'application/json',
  },
})

api.interceptors.request.use(config => {
  const authStore = useAuthStore()

  if (authStore.token)
    config.headers.Authorization = `Bearer ${authStore.token}`

  return config
})

type RetryableConfig = InternalAxiosRequestConfig & { _retried?: boolean }

// A JWT is single-use to refresh: it's invalidated the moment /auth/refresh
// succeeds. If several requests 401 around the same moment (e.g. a page
// firing multiple calls right as the token expires), they must share one
// refresh instead of each racing to refresh — a second concurrent refresh
// would be attempted against a token the first refresh already invalidated.
let refreshPromise: Promise<string> | null = null

function refreshToken() {
  const authStore = useAuthStore()

  if (!refreshPromise) {
    refreshPromise = authStore.refresh()
      .then(() => authStore.token as string)
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

api.interceptors.response.use(
  response => response,
  async error => {
    const authStore = useAuthStore()
    const originalRequest = error.config as RetryableConfig | undefined
    const isAuthEndpoint = originalRequest?.url?.startsWith('/auth/login')
      || originalRequest?.url?.startsWith('/auth/register')
      || originalRequest?.url?.startsWith('/auth/refresh')

    const shouldAttemptRefresh = error.response?.status === 401
      && authStore.token
      && originalRequest
      && !originalRequest._retried
      && !isAuthEndpoint

    if (shouldAttemptRefresh) {
      originalRequest._retried = true

      try {
        const token = await refreshToken()

        originalRequest.headers.Authorization = `Bearer ${token}`

        return api(originalRequest)
      }
      catch {
        authStore.clearSession()
        router.push('/login')

        return Promise.reject(error)
      }
    }

    if (error.response?.status === 401) {
      authStore.clearSession()
      router.push('/login')
    }

    return Promise.reject(error)
  },
)
