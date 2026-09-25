import { defineStore } from 'pinia'
import { api } from '@/utils/api'

export interface AuthUser {
  id: number
  business_id: number
  name: string
  email: string
  role: 'owner' | 'admin' | 'staff'
}

export interface AuthBusiness {
  id: number
  name: string
  slug: string
  timezone: string
  currency_code: string
}

interface RegisterPayload {
  business_name: string
  name: string
  email: string
  password: string
  password_confirmation: string
}

interface LoginPayload {
  email: string
  password: string
}

function readStorage<T>(key: string): T | null {
  const raw = localStorage.getItem(key)

  return raw ? JSON.parse(raw) as T : null
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: readStorage<AuthUser>('bookly_user'),
    business: readStorage<AuthBusiness>('bookly_business'),
    token: localStorage.getItem('bookly_token') as string | null,
  }),

  getters: {
    isLoggedIn: state => !!state.token,
  },

  actions: {
    setSession(user: AuthUser, token: string, business?: AuthBusiness) {
      this.user = user
      this.token = token
      localStorage.setItem('bookly_user', JSON.stringify(user))
      localStorage.setItem('bookly_token', token)

      if (business) {
        this.business = business
        localStorage.setItem('bookly_business', JSON.stringify(business))
      }
    },

    updateUser(user: Partial<AuthUser>) {
      if (!this.user)
        return

      this.user = { ...this.user, ...user }
      localStorage.setItem('bookly_user', JSON.stringify(this.user))
    },

    updateBusiness(business: Partial<AuthBusiness>) {
      if (!this.business)
        return

      this.business = { ...this.business, ...business }
      localStorage.setItem('bookly_business', JSON.stringify(this.business))
    },

    clearSession() {
      this.user = null
      this.business = null
      this.token = null
      localStorage.removeItem('bookly_user')
      localStorage.removeItem('bookly_business')
      localStorage.removeItem('bookly_token')
    },

    async register(payload: RegisterPayload) {
      const { data } = await api.post('/auth/register', payload)

      this.setSession(data.user, data.token, data.business)
    },

    async login(payload: LoginPayload) {
      const { data } = await api.post('/auth/login', payload)

      this.setSession(data.user, data.token, data.business)
    },

    async logout() {
      try {
        await api.post('/auth/logout')
      }
      finally {
        this.clearSession()
      }
    },

    async refresh() {
      // Returns only a new token (no user/business), so the rest of the
      // session is left as-is.
      const { data } = await api.post('/auth/refresh')

      this.token = data.token
      localStorage.setItem('bookly_token', data.token)
    },
  },
})
