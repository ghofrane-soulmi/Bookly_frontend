import type { ApiEnvelope } from './services.types'

export const PERMISSION_CATALOG = [
  'services.view',
  'services.manage',
  'clients.view',
  'clients.manage',
  'appointments.view',
  'appointments.manage',
  'staff.view',
  'staff.manage',
  'business.manage',
  'dashboard.view',
  'roles.manage',
] as const

export type PermissionName = typeof PERMISSION_CATALOG[number]

export interface RoleUser {
  id: number
  name: string
}

export interface Role {
  id: number
  name: string
  is_built_in: boolean
  permissions: PermissionName[]
  users_count: number
  users: RoleUser[]
}

export interface RoleDetail {
  id: number
  name: string
  is_built_in: boolean
  permissions: PermissionName[]
}

export interface RolePayload {
  name?: string
  permissions: PermissionName[]
}

export interface Permission {
  id: number
  name: PermissionName
  roles: string[]
}

export type { ApiEnvelope }
