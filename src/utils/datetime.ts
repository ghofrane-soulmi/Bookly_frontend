import { useAuthStore } from '@/stores/auth'

function businessTimezone(): string {
  const authStore = useAuthStore()

  return authStore.business?.timezone ?? 'UTC'
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    timeZone: businessTimezone(),
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    timeZone: businessTimezone(),
    month: 'short',
    day: 'numeric',
  })
}

export function formatMonthLabel(ym: string): string {
  return new Date(`${ym}-01T00:00:00Z`).toLocaleDateString('en-US', {
    timeZone: businessTimezone(),
    month: 'short',
  })
}
