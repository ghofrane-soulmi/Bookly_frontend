import type { ApiEnvelope } from './services.types'

// Built-in role names; custom roles (created via Roles & Permissions) are
// also valid here but their names aren't known statically.
export type StaffRole = 'owner' | 'admin' | 'staff' | (string & {})

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
