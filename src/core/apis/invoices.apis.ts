import type {
  ApiEnvelope,
  Invoice,
  InvoicePayload,
  ListInvoicesParams,
  PaymentPayload,
  UninvoicedAppointment,
} from './types/invoices.types'
import { api } from '@/utils/api'

const call = async <T>(promise: Promise<{ data: ApiEnvelope<T> }>, what: string): Promise<ApiEnvelope<T>> => {
  try {
    return (await promise).data
  }
  catch (error) {
    console.error(`Error ${what}:`, error)
    throw error
  }
}

export const invoicesApis = {
  handleListInvoices: (params: ListInvoicesParams = {}) =>
    call<Invoice[]>(api.get('/invoices/list', { params }), 'fetching invoices'),

  handleGetInvoice: (id: number) =>
    call<Invoice>(api.get(`/invoices/${id}/detail`), 'fetching invoice'),

  handleCreateInvoice: (data: InvoicePayload) =>
    call<Invoice>(api.post('/invoices/create', data), 'creating invoice'),

  handleUpdateInvoice: (id: number, data: Partial<InvoicePayload>) =>
    call<Invoice>(api.put(`/invoices/update/${id}`, data), 'updating invoice'),

  handleDeleteInvoice: (id: number) =>
    call<null>(api.delete(`/invoices/delete/${id}`), 'deleting invoice'),

  handleDuplicateInvoice: (id: number) =>
    call<Invoice>(api.post(`/invoices/${id}/duplicate`), 'duplicating invoice'),

  handleSendInvoice: (id: number) =>
    call<Invoice>(api.post(`/invoices/${id}/send`), 'sending invoice'),

  handleAddPayment: (id: number, data: PaymentPayload) =>
    call<Invoice>(api.post(`/invoices/${id}/payments`, data), 'recording payment'),

  handleDeletePayment: (id: number, paymentId: number) =>
    call<Invoice>(api.delete(`/invoices/${id}/payments/${paymentId}`), 'removing payment'),

  handleUninvoicedAppointments: (clientId?: number) =>
    call<UninvoicedAppointment[]>(api.get('/invoices/uninvoiced-appointments', { params: { client_id: clientId } }), 'fetching uninvoiced appointments'),

  handleCreateFromAppointments: (appointmentIds: number[]) =>
    call<Invoice>(api.post('/invoices/from-appointments', { appointment_ids: appointmentIds }), 'invoicing appointments'),
}
