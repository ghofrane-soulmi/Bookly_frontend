import type { Money } from '@/utils/money'
import type { ApiEnvelope } from './services.types'

export interface Client {
  id: number
  name: string
  email: string | null
  phone: string | null
  notes: string | null
}

export interface ClientAppointmentHistoryItem {
  id: number
  starts_at: string
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show'
  price: Money
  service: { id: number, name: string, price: Money }
  staff: { id: number, name: string }
}

export interface ClientStats {
  total_appointments: number
  completed_appointments: number
  total_spent: Money
}

export interface ClientDetail extends Client {
  appointments: ClientAppointmentHistoryItem[]
  stats: ClientStats
}

export interface ClientPayload {
  name: string
  email?: string | null
  phone?: string | null
  notes?: string | null
}

export interface ListClientsParams {
  page?: number
  per_page?: number
  search?: string
}

export type { ApiEnvelope }
