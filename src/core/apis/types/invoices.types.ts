import type { Money } from '@/utils/money'

export type InvoiceState = 'draft' | 'sent' | 'partial' | 'paid' | 'past_due'
export type PaymentMethod = 'cash' | 'card' | 'bank_transfer' | 'other'

export interface InvoiceItem {
  id: number
  description: string
  quantity: number

  /** Minor units. */
  unit_price: number

  /** Minor units. */
  line_total: number
  service_id: number | null
  appointment_id: number | null
}

export interface InvoicePayment {
  id: number
  amount: number
  method: PaymentMethod
  paid_on: string
  note: string | null
}

export interface Invoice {
  id: number
  number: number
  status: 'draft' | 'sent'
  state: InvoiceState
  client_id: number
  client: { id: number; name: string; email: string | null; phone: string | null }
  issued_on: string
  due_on: string
  currency_code: string
  discount_percent: number
  tax_percent: number
  notes: string | null
  sent_at: string | null
  money: {
    subtotal: Money
    discount: Money
    tax: Money
    total: Money
    paid: Money
    balance: Money
  }
  items?: InvoiceItem[]
  payments?: InvoicePayment[]
}

export interface InvoiceSummary {
  counts: Record<InvoiceState, number>
  invoiced: Money
  paid: Money
  outstanding: Money
}

export interface InvoiceLinePayload {
  description: string
  quantity: number

  /** Major units, as typed (e.g. "35.5"). */
  unit_price: number | string
  service_id?: number | null
}

export interface InvoicePayload {
  client_id: number
  issued_on: string
  due_on: string
  discount_percent: number
  tax_percent: number
  notes?: string | null
  items: InvoiceLinePayload[]
}

export interface PaymentPayload {

  /** Major units. */
  amount: number | string
  method: PaymentMethod
  paid_on: string
  note?: string | null
}

export interface ListInvoicesParams {
  page?: number
  per_page?: number
  state?: InvoiceState
  search?: string
  client_id?: number
}

export interface UninvoicedAppointment {
  id: number
  starts_at: string
  client_id: number
  price: Money
  client: { id: number; name: string }
  service: { id: number; name: string }
  staff: { id: number; name: string }
}

export interface ApiEnvelope<T> {
  data: T
  meta?: {
    current_page: number
    per_page: number
    total: number
    last_page: number
    summary: InvoiceSummary
  }
  status: { message: string; code: number }
  errors?: Record<string, string[]>
}

export const invoiceStateMeta: Record<InvoiceState, { label: string; color: string; icon: string }> = {
  draft: { label: 'Draft', color: 'secondary', icon: 'bx-edit' },
  sent: { label: 'Sent', color: 'info', icon: 'bx-send' },
  partial: { label: 'Partially paid', color: 'warning', icon: 'bx-pie-chart-alt' },
  paid: { label: 'Paid', color: 'success', icon: 'bx-check-circle' },
  past_due: { label: 'Past due', color: 'error', icon: 'bx-error-circle' },
}

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash: 'Cash',
  card: 'Card',
  bank_transfer: 'Bank transfer',
  other: 'Other',
}
