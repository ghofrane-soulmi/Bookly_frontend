import type { Money } from '@/utils/money'

export interface Service {
  id: number
  name: string
  description: string | null
  category: string | null
  duration_minutes: number
  price: Money
  color: string | null
  is_active: boolean
}

export interface ServicePayload {
  name: string
  description?: string | null
  category?: string | null
  duration_minutes: number
  price: number
  color?: string | null
  is_active?: boolean
}

export interface ApiStatus {
  message: string
  code: number
}

export interface ApiMeta {
  current_page: number
  per_page: number
  total: number
  last_page: number
  categories?: string[]
  status_counts?: { total: number, scheduled: number, completed: number, cancelled: number }
}

export interface ApiEnvelope<T> {
  data?: T
  meta?: ApiMeta
  status: ApiStatus
  errors?: Record<string, string[]>
  error?: string
}

export interface ListServicesParams {
  page?: number
  per_page?: number
  search?: string
  status?: 'active' | 'inactive'
  category?: string
}
