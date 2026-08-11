import type { ApiEnvelope } from './services.types'

export interface Business {
  id: number
  name: string
  slug: string
  email: string | null
  phone: string | null
  timezone: string
  currency: string
  is_active: boolean
}

export interface BusinessPayload {
  name?: string
  email?: string | null
  phone?: string | null
  timezone?: string
  currency?: string
}

export type { ApiEnvelope }
