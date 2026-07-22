import type { ApiEnvelope } from './services.types'

export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show'

export interface Appointment {
  id: number
  starts_at: string
  ends_at: string
  status: AppointmentStatus
  notes: string | null
  client: { id: number, name: string }
  service: { id: number, name: string, price: string }
  staff: { id: number, name: string }
}

export interface AppointmentStatusCounts {
  total: number
  scheduled: number
  completed: number
  cancelled: number
}

export interface AppointmentPayload {
  client_id: number | null
  service_id: number | null
  user_id: number | null
  starts_at: string
  notes?: string | null
  status?: AppointmentStatus
}

export interface ListAppointmentsParams {
  page?: number
  per_page?: number
  search?: string
  status?: AppointmentStatus
  service_id?: number
  user_id?: number
  from?: string
  to?: string
}

export type { ApiEnvelope }
