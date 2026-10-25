import { defineStore } from 'pinia'
import type { Money } from '@/utils/money'

// Frontend-only for now: no Invoices backend yet. This store holds in-memory
// mock data shaped like a future API response, shared between the list page
// and the create/edit page so navigating between them doesn't lose state.
// Swap the mutations below for real API calls once the Invoices module exists.

export type InvoiceStatus = 'draft' | 'sent' | 'downloaded' | 'partial' | 'past_due' | 'paid'

export interface InvoiceStatusMeta { label: string, color: string, icon: string }

export const invoiceStatusMeta: Record<InvoiceStatus, InvoiceStatusMeta> = {
  draft: { label: 'Draft', color: 'secondary', icon: 'bx-folder' },
  sent: { label: 'Sent', color: 'secondary', icon: 'bx-envelope' },
  downloaded: { label: 'Downloaded', color: 'info', icon: 'bx-download' },
  partial: { label: 'Partial Payment', color: 'warning', icon: 'bx-pie-chart-alt' },
  past_due: { label: 'Past Due', color: 'error', icon: 'bx-error-circle' },
  paid: { label: 'Paid', color: 'success', icon: 'bx-check' },
}

export const invoiceStatusOptions = Object.entries(invoiceStatusMeta)
  .map(([value, meta]) => ({ title: meta.label, value: value as InvoiceStatus }))

export interface InvoiceClient {
  name: string
  email: string
  company: string
  address: string
  phone: string
}

export interface InvoiceItem {
  id: number
  name: string
  description: string
  cost: number
  hours: number
}

export interface Invoice {
  id: number
  number: string
  status: InvoiceStatus
  client: InvoiceClient
  items: InvoiceItem[]
  issuedDate: string
  dueDate: string
  discountPercent: number
  taxPercent: number
  /** Minor units already paid against this invoice's total. */
  amountPaid: number
  salesperson: string
  thanksNote: string
  note: string
  paymentMethod: string
}

export const mockClients: InvoiceClient[] = [
  { name: 'Andrew Burns', email: 'andrew.burns@example.com', company: '', address: '', phone: '+1 123 3452 12' },
  { name: 'Dana Carey', email: 'dana.carey@example.com', company: '', address: '', phone: '+1 123 3452 13' },
  { name: 'Tammy Sanchez', email: 'tammy.sanchez@example.com', company: '', address: '', phone: '+1 123 3452 14' },
  { name: 'Lori Wells', email: 'lori.wells@example.com', company: '', address: '', phone: '+1 123 3452 15' },
  { name: 'Richard Payne', email: 'richard.payne@example.com', company: '', address: '', phone: '+1 123 3452 16' },
  { name: 'Jennifer Summers', email: 'jennifer.summers@example.com', company: '', address: '', phone: '+1 123 3452 17' },
  { name: 'Justin Richardson', email: 'justin.richardson@example.com', company: '', address: '', phone: '+1 123 3452 18' },
  { name: 'Nicholas Tanner', email: 'nicholas.tanner@example.com', company: '', address: '', phone: '+1 123 3452 19' },
  { name: 'Crystal Mays', email: 'crystal.mays@example.com', company: '', address: '', phone: '+1 123 3452 20' },
  { name: 'Mary Garcia', email: 'mary.garcia@example.com', company: '', address: '', phone: '+1 123 3452 21' },
]

export const mockServiceItems = [
  { name: 'Haircut', description: 'Standard haircut and styling', cost: 35 },
  { name: 'Hair Coloring', description: 'Full color treatment', cost: 80 },
  { name: 'Blowout', description: 'Wash and blow-dry styling', cost: 25 },
  { name: 'Manicure', description: 'Classic manicure', cost: 20 },
  { name: 'Facial Treatment', description: 'Deep-cleansing facial', cost: 45 },
]

let nextItemId = 1

function makeItem(pool: typeof mockServiceItems[number], hours: number): InvoiceItem {
  return { id: nextItemId++, name: pool.name, description: pool.description, cost: pool.cost, hours }
}

const statusCycle: InvoiceStatus[] = ['paid', 'paid', 'partial', 'past_due', 'sent', 'downloaded', 'draft', 'paid']

function makeMockInvoices(): Invoice[] {
  return mockClients.flatMap((client, clientIndex) =>
    [0, 1].map((n): Invoice => {
      const index = clientIndex * 2 + n
      const status = statusCycle[index % statusCycle.length]
      const pool = mockServiceItems[index % mockServiceItems.length]
      const issued = new Date(2026, 8, 1 + (index % 28))
      const due = new Date(issued)

      due.setDate(due.getDate() + 14)

      const items = [makeItem(pool, 1 + (index % 3))]
      const totalMinor = Math.round(pool.cost * (1 + (index % 3)) * 100)
      const amountPaid = status === 'paid' ? totalMinor : status === 'partial' ? Math.round(totalMinor * 0.4) : 0

      return {
        id: 5001 + index,
        number: String(5001 + index),
        status,
        client,
        items,
        issuedDate: issued.toISOString().slice(0, 10),
        dueDate: due.toISOString().slice(0, 10),
        discountPercent: 0,
        taxPercent: index % 4 === 0 ? 10 : 0,
        amountPaid,
        salesperson: '',
        thanksNote: 'Thanks for your business',
        note: '',
        paymentMethod: 'Bank Account',
      }
    }),
  )
}

/**
 * Every money amount an Invoice implies, computed from its line items rather
 * than stored redundantly — items/discount/tax are the source of truth.
 * Takes just the fields it needs so it also works against in-progress form
 * state on the create/edit page, not only a saved Invoice.
 */
export function invoiceTotals(invoice: Pick<Invoice, 'items' | 'discountPercent' | 'taxPercent' | 'amountPaid'>, currency: string) {
  const subtotalMinor = invoice.items.reduce((sum, item) => sum + Math.round(item.cost * item.hours * 100), 0)
  const discountMinor = Math.round(subtotalMinor * (invoice.discountPercent / 100))
  const taxableMinor = subtotalMinor - discountMinor
  const taxMinor = Math.round(taxableMinor * (invoice.taxPercent / 100))
  const totalMinor = taxableMinor + taxMinor
  const balanceMinor = Math.max(totalMinor - invoice.amountPaid, 0)

  return {
    subtotal: { amount: subtotalMinor, currency } satisfies Money,
    discount: { amount: discountMinor, currency } satisfies Money,
    tax: { amount: taxMinor, currency } satisfies Money,
    total: { amount: totalMinor, currency } satisfies Money,
    amountPaid: { amount: invoice.amountPaid, currency } satisfies Money,
    balance: { amount: balanceMinor, currency } satisfies Money,
  }
}

export const useInvoicesStore = defineStore('invoices', {
  state: () => ({
    invoices: makeMockInvoices(),
  }),

  actions: {
    getById(id: number) {
      return this.invoices.find(invoice => invoice.id === id) ?? null
    },

    nextNumber() {
      return String(Math.max(...this.invoices.map(invoice => Number(invoice.number)), 5000) + 1)
    },

    create(invoice: Omit<Invoice, 'id' | 'number'>) {
      const created: Invoice = { ...invoice, id: Math.max(...this.invoices.map(i => i.id), 5000) + 1, number: this.nextNumber() }

      this.invoices.unshift(created)

      return created
    },

    update(id: number, changes: Omit<Invoice, 'id' | 'number'>) {
      const invoice = this.getById(id)

      if (invoice)
        Object.assign(invoice, changes)
    },

    remove(id: number) {
      this.invoices = this.invoices.filter(invoice => invoice.id !== id)
    },

    duplicate(id: number) {
      const invoice = this.getById(id)

      if (!invoice)
        return

      this.invoices.unshift({
        ...invoice,
        id: Math.max(...this.invoices.map(i => i.id), 5000) + 1,
        number: this.nextNumber(),
        status: 'draft',
        amountPaid: 0,
        items: invoice.items.map(item => ({ ...item, id: nextItemId++ })),
      })
    },

    /** Sending an invoice should only move it out of 'draft' — it must never regress an already-partial/paid/past_due invoice back to merely 'sent'. */
    markSent(id: number) {
      const invoice = this.getById(id)

      if (invoice && invoice.status === 'draft')
        invoice.status = 'sent'
    },

    /** Records a payment (minor units) against an invoice's total, deriving its status from the new balance. */
    addPayment(id: number, currency: string, amountMinor: number) {
      const invoice = this.getById(id)

      if (!invoice || amountMinor <= 0)
        return

      const { total } = invoiceTotals(invoice, currency)

      invoice.amountPaid = Math.min(invoice.amountPaid + amountMinor, total.amount)
      invoice.status = invoice.amountPaid >= total.amount ? 'paid' : 'partial'
    },
  },
})
