import type { ApiEnvelope } from './services.types'

export interface DayHours {
  open: string
  close: string
}

export type OperatingHours = Record<
  'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday',
  DayHours | null
>

export interface Business {
  id: number
  name: string
  slug: string
  email: string | null
  phone: string | null
  timezone: string
  currency_code: string
  locale: string
  is_active: boolean
  notify_confirmation_email: boolean
  notify_reminder_email: boolean
  reminder_lead_hours: number
  operating_hours: OperatingHours | null
}

export interface BusinessPayload {
  name?: string
  email?: string | null
  phone?: string | null
  timezone?: string
  currency_code?: string
  notify_confirmation_email?: boolean
  notify_reminder_email?: boolean
  reminder_lead_hours?: number
  operating_hours?: OperatingHours | null
}

export type { ApiEnvelope }
