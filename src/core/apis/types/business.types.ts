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
  notify_confirmation_email: boolean
  notify_reminder_email: boolean
  reminder_lead_hours: number
}

export interface BusinessPayload {
  name?: string
  email?: string | null
  phone?: string | null
  timezone?: string
  currency?: string
  notify_confirmation_email?: boolean
  notify_reminder_email?: boolean
  reminder_lead_hours?: number
}

export type { ApiEnvelope }
