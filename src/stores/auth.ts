import { defineStore } from 'pinia'
import { api } from '@/utils/api'

export interface AuthUser {
  id: number
  business_id: number
  name: string
  email: string
  role: 'owner' | 'admin' | 'staff' | (string & {})
}

export interface AuthBusiness {
  id: number
  name: string
  slug: string
  email: string | null
  phone: string | null
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
  // Runs while the app boots: a corrupted value (e.g. the string "undefined")
  // must not throw, or the whole app white-screens before it can render.
  try {
    const raw = localStorage.getItem(key)

    return raw ? JSON.parse(raw) as T : null
  }
  catch {
    localStorage.removeItem(key)

    return null
  }
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: readStorage<AuthUser>('bookly_user'),
    business: readStorage<AuthBusiness>('bookly_business'),
    token: localStorage.getItem('bookly_token') as string | null,

    // Permission names from the API. Only decides what the UI shows; the API
    // enforces every permission itself.
    permissions: readStorage<string[]>('bookly_permissions') ?? [],
  }),

  getters: {
    isLoggedIn: state => !!state.token,

    /** True if the user holds the permission (or any of them, for an array). */
    can: state => (permission?: string | string[]) => {
      if (!permission)
        return true

      const needed = Array.isArray(permission) ? permission : [permission]

      return needed.some(p => state.permissions.includes(p))
    },
  },

  actions: {
    setSession(user: AuthUser, token: string, business?: AuthBusiness, permissions?: string[]) {
      this.user = user
      this.token = token
      localStorage.setItem('bookly_user', JSON.stringify(user))
      localStorage.setItem('bookly_token', token)

      if (business) {
        this.business = business
        localStorage.setItem('bookly_business', JSON.stringify(business))
      }

      if (permissions)
        this.setPermissions(permissions)
    },

    setPermissions(permissions: string[]) {
      this.permissions = permissions
      localStorage.setItem('bookly_permissions', JSON.stringify(permissions))
    },

    /** Re-reads user, business and permissions (role changes, older sessions). */
    async fetchMe() {
      const { data } = await api.get('/auth/me')

      this.user = data.user
      this.business = data.business
      localStorage.setItem('bookly_user', JSON.stringify(data.user))
      localStorage.setItem('bookly_business', JSON.stringify(data.business))
      this.setPermissions(data.permissions ?? [])
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
      this.permissions = []
      localStorage.removeItem('bookly_permissions')
      localStorage.removeItem('bookly_user')
      localStorage.removeItem('bookly_business')
      localStorage.removeItem('bookly_token')
    },

    async register(payload: RegisterPayload) {
      const { data } = await api.post('/auth/register', payload)

      this.setSession(data.user, data.token, data.business, data.permissions)
    },

    async login(payload: LoginPayload) {
      const { data } = await api.post('/auth/login', payload)

      this.setSession(data.user, data.token, data.business, data.permissions)
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
