import type { ApiEnvelope } from './services.types'

export type StaffRole = 'owner' | 'admin' | 'staff'

export interface Staff {
  id: number
  name: string
  email: string
  role: StaffRole
}

export interface StaffPayload {
  name: string
  email: string
  password?: string
  role: StaffRole
}

export interface ListStaffParams {
  page?: number
  per_page?: number
  search?: string
  role?: StaffRole
}

export type { ApiEnvelope }
