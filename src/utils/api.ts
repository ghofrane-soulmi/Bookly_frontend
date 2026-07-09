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

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      const authStore = useAuthStore()

      authStore.clearSession()
      router.push('/login')
    }

    return Promise.reject(error)
  },
)
