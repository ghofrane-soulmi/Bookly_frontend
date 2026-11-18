<script setup lang="ts">
import { invoicesApis } from '@/core/apis/invoices.apis'
import type { Invoice, PaymentMethod } from '@/core/apis/types/invoices.types'
import { invoiceStateMeta, paymentMethodLabels } from '@/core/apis/types/invoices.types'
import { useAuthStore } from '@/stores/auth'
import { currencyDecimals, formatMoney } from '@/utils/money'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const invoiceId = computed(() => Number(route.params.id))
const invoice = ref<Invoice | null>(null)
const isLoading = ref(true)
const errorMessage = ref('')

const snackbar = ref({ show: false, text: '', color: 'success' })

const notify = (text: string, color = 'success') => {
  snackbar.value = { show: true, text, color }
}

const load = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const res = await invoicesApis.handleGetInvoice(invoiceId.value)

    if (res.status.code === 200)
      invoice.value = res.data
    else
      errorMessage.value = res.status.message
  }
  catch {
    errorMessage.value = 'This invoice could not be loaded. Please try again.'
  }
  finally {
    isLoading.value = false
  }
}

watch(invoiceId, load, { immediate: true })

const formatDate = (isoDate: string) => new Date(`${isoDate}T00:00:00`).toLocaleDateString(undefined, { dateStyle: 'long' })
const money = (amount: number) => formatMoney({ amount, currency: invoice.value?.currency_code ?? 'USD' })
const quantity = (q: number) => Number.isInteger(q) ? String(q) : q.toFixed(2)

// --- Actions -----------------------------------------------------------------
const busy = ref<string | null>(null)

const run = async (name: string, action: () => Promise<{ data: Invoice; status: { message: string; code: number } }>) => {
  busy.value = name

  try {
    const res = await action()

    if ([200, 201].includes(res.status.code)) {
      invoice.value = res.data
      notify(res.status.message)
    }
    else {
      notify(res.status.message, 'error')
    }

    return res
  }
  catch {
    notify('Something went wrong. Please try again.', 'error')
  }
  finally {
    busy.value = null
  }
}

const send = () => run('send', () => invoicesApis.handleSendInvoice(invoiceId.value))

const duplicate = async () => {
  const res = await invoicesApis.handleDuplicateInvoice(invoiceId.value)

  if (res.status.code === 201)
    router.push(`/invoices/${res.data.id}/edit`)
}

const isDeleteOpen = ref(false)

const remove = async () => {
  const res = await invoicesApis.handleDeleteInvoice(invoiceId.value)

  isDeleteOpen.value = false

  if (res.status.code === 200)
    router.push('/invoices')
  else
    notify(res.status.message, 'error')
}

// --- Payments ------------------------------------------------------------------
const isPaymentOpen = ref(false)
const paymentErrors = ref<Record<string, string[]>>({})
const payment = ref({ amount: '' as number | string, method: 'cash' as PaymentMethod, paid_on: '', note: '' })
const methodOptions = (Object.keys(paymentMethodLabels) as PaymentMethod[]).map(value => ({ title: paymentMethodLabels[value], value }))
const priceStep = computed(() => 10 ** -currencyDecimals(invoice.value?.currency_code ?? 'USD'))

const openPayment = () => {
  if (!invoice.value)
    return

  paymentErrors.value = {}
  payment.value = {
    amount: invoice.value.money.balance.amount / 10 ** currencyDecimals(invoice.value.currency_code),
    method: 'cash',
    paid_on: new Date().toLocaleDateString('en-CA'),
    note: '',
  }
  isPaymentOpen.value = true
}

const savePayment = async () => {
  busy.value = 'payment'
  paymentErrors.value = {}

  try {
    const res = await invoicesApis.handleAddPayment(invoiceId.value, { ...payment.value, note: payment.value.note || null })

    if (res.status.code === 201) {
      invoice.value = res.data
      isPaymentOpen.value = false
      notify('Payment recorded')
    }
    else {
      paymentErrors.value = res.errors ?? {}
    }
  }
  finally {
    busy.value = null
  }
}

const removePayment = (paymentId: number) => run('payment', () => invoicesApis.handleDeletePayment(invoiceId.value, paymentId))

const print = () => window.print()
</script>

<template>
  <PageLoader
    v-if="isLoading"
    text="Loading invoice…"
  />

  <VAlert
    v-else-if="errorMessage || !invoice"
    type="error"
    variant="tonal"
    :text="errorMessage || 'Invoice not found'"
  >
    <template #append>
      <VBtn
        variant="text"
        to="/invoices"
      >
        Back to invoices
      </VBtn>
    </template>
  </VAlert>

  <VRow v-else>
    <VCol
      cols="12"
      md="9"
    >
      <VCard class="invoice-document">
        <VCardText class="d-flex flex-wrap justify-space-between gap-6 pa-8">
          <div>
            <h4 class="text-h4 mb-2">
              {{ authStore.business?.name }}
            </h4>
            <div
              v-if="authStore.business?.email"
              class="text-body-2"
            >
              {{ authStore.business.email }}
            </div>
            <div
              v-if="authStore.business?.phone"
              class="text-body-2"
            >
              {{ authStore.business.phone }}
            </div>
          </div>
          <div class="text-sm-end">
            <h5 class="text-h5 mb-2">
              Invoice #{{ invoice.number }}
            </h5>
            <div class="text-body-2">
              Issued: {{ formatDate(invoice.issued_on) }}
            </div>
            <div class="text-body-2">
              Due: {{ formatDate(invoice.due_on) }}
            </div>
            <VChip
              :color="invoiceStateMeta[invoice.state].color"
              :prepend-icon="invoiceStateMeta[invoice.state].icon"
              size="small"
              label
              class="mt-2 no-print"
            >
              {{ invoiceStateMeta[invoice.state].label }}
            </VChip>
          </div>
        </VCardText>

        <VDivider />

        <VCardText class="pa-8">
          <div class="text-overline text-medium-emphasis">
            Bill to
          </div>
          <div class="text-body-1 font-weight-medium">
            {{ invoice.client.name }}
          </div>
          <div
            v-if="invoice.client.email"
            class="text-body-2"
          >
            {{ invoice.client.email }}
          </div>
          <div
            v-if="invoice.client.phone"
            class="text-body-2"
          >
            {{ invoice.client.phone }}
          </div>
        </VCardText>

        <VTable class="border-t">
          <thead>
            <tr>
              <th>Item</th>
              <th class="text-end">
                Qty
              </th>
              <th class="text-end">
                Unit price
              </th>
              <th class="text-end">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in invoice.items"
              :key="item.id"
            >
              <td>{{ item.description }}</td>
              <td class="text-end">
                {{ quantity(item.quantity) }}
              </td>
              <td class="text-end">
                {{ money(item.unit_price) }}
              </td>
              <td class="text-end">
                {{ money(item.line_total) }}
              </td>
            </tr>
          </tbody>
        </VTable>

        <VDivider />

        <VCardText class="d-flex flex-wrap justify-space-between gap-6 pa-8">
          <div
            class="text-body-2"
            style="max-inline-size: 22rem;"
          >
            <template v-if="invoice.notes">
              <div class="font-weight-medium mb-1">
                Note
              </div>
              {{ invoice.notes }}
            </template>
          </div>
          <table class="totals">
            <tr>
              <td>Subtotal</td><td>{{ formatMoney(invoice.money.subtotal) }}</td>
            </tr>
            <tr v-if="invoice.money.discount.amount">
              <td>Discount ({{ invoice.discount_percent }}%)</td><td>−{{ formatMoney(invoice.money.discount) }}</td>
            </tr>
            <tr v-if="invoice.money.tax.amount">
              <td>Tax ({{ invoice.tax_percent }}%)</td><td>{{ formatMoney(invoice.money.tax) }}</td>
            </tr>
            <tr class="grand">
              <td>Total</td><td>{{ formatMoney(invoice.money.total) }}</td>
            </tr>
            <tr v-if="invoice.money.paid.amount">
              <td>Paid</td><td>−{{ formatMoney(invoice.money.paid) }}</td>
            </tr>
            <tr class="grand">
              <td>Balance due</td><td>{{ formatMoney(invoice.money.balance) }}</td>
            </tr>
          </table>
        </VCardText>
      </VCard>

      <VCard
        title="Payments"
        class="mt-6 no-print"
      >
        <VCardText v-if="!invoice.payments?.length">
          No payments recorded yet.
        </VCardText>
        <VTable v-else>
          <thead>
            <tr>
              <th>Date</th>
              <th>Method</th>
              <th>Note</th>
              <th class="text-end">
                Amount
              </th>
              <th />
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="p in invoice.payments"
              :key="p.id"
            >
              <td>{{ formatDate(p.paid_on) }}</td>
              <td>{{ paymentMethodLabels[p.method] }}</td>
              <td>{{ p.note || '—' }}</td>
              <td class="text-end">
                {{ money(p.amount) }}
              </td>
              <td class="text-end">
                <VBtn
                  icon
                  variant="text"
                  size="small"
                  color="error"
                  aria-label="Remove payment"
                  :loading="busy === 'payment'"
                  @click="removePayment(p.id)"
                >
                  <VIcon icon="bx-trash" />
                </VBtn>
              </td>
            </tr>
          </tbody>
        </VTable>
      </VCard>
    </VCol>

    <VCol
      cols="12"
      md="3"
      class="no-print"
    >
      <VCard>
        <VCardText class="d-flex flex-column gap-3">
          <VBtn
            block
            prepend-icon="bx-send"
            :loading="busy === 'send'"
            @click="send"
          >
            {{ invoice.status === 'draft' ? 'Send invoice' : 'Send again' }}
          </VBtn>
          <VBtn
            block
            color="success"
            prepend-icon="bx-dollar"
            :disabled="!invoice.money.balance.amount"
            @click="openPayment"
          >
            Record payment
          </VBtn>
          <VBtn
            block
            variant="tonal"
            color="secondary"
            prepend-icon="bx-edit"
            :to="`/invoices/${invoice.id}/edit`"
          >
            Edit
          </VBtn>
          <VBtn
            block
            variant="tonal"
            color="secondary"
            prepend-icon="bx-printer"
            @click="print"
          >
            Print / PDF
          </VBtn>
          <VBtn
            block
            variant="tonal"
            color="secondary"
            prepend-icon="bx-copy"
            @click="duplicate"
          >
            Duplicate
          </VBtn>
          <VBtn
            block
            variant="text"
            color="error"
            prepend-icon="bx-trash"
            :disabled="invoice.money.paid.amount > 0"
            @click="isDeleteOpen = true"
          >
            Delete
          </VBtn>
          <div
            v-if="invoice.money.paid.amount > 0"
            class="text-caption text-medium-emphasis text-center"
          >
            Invoices with payments can't be deleted.
          </div>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>

  <VDialog
    v-model="isPaymentOpen"
    max-width="440"
  >
    <VCard title="Record payment">
      <VForm @submit.prevent="savePayment">
        <VCardText class="d-flex flex-column gap-4">
          <VTextField
            v-model="payment.amount"
            type="number"
            min="0"
            :step="priceStep"
            label="Amount"
            :suffix="invoice?.currency_code"
            :hint="invoice ? `Balance due: ${formatMoney(invoice.money.balance)}` : ''"
            persistent-hint
            :error-messages="paymentErrors.amount"
          />
          <VSelect
            v-model="payment.method"
            :items="methodOptions"
            label="Method"
            :error-messages="paymentErrors.method"
          />
          <VTextField
            v-model="payment.paid_on"
            type="date"
            label="Paid on"
            :error-messages="paymentErrors.paid_on"
          />
          <VTextField
            v-model="payment.note"
            label="Note (optional)"
            :error-messages="paymentErrors.note"
          />
        </VCardText>
        <VCardActions class="pa-4">
          <VSpacer />
          <VBtn
            variant="tonal"
            color="secondary"
            @click="isPaymentOpen = false"
          >
            Cancel
          </VBtn>
          <VBtn
            type="submit"
            variant="flat"
            :loading="busy === 'payment'"
          >
            Save payment
          </VBtn>
        </VCardActions>
      </VForm>
    </VCard>
  </VDialog>

  <VDialog
    v-model="isDeleteOpen"
    max-width="400"
  >
    <VCard :title="`Delete invoice #${invoice?.number}?`">
      <VCardText>This can't be undone. Any appointments on it can be invoiced again.</VCardText>
      <VCardActions class="pa-4">
        <VSpacer />
        <VBtn
          variant="tonal"
          color="secondary"
          @click="isDeleteOpen = false"
        >
          Cancel
        </VBtn>
        <VBtn
          color="error"
          variant="flat"
          @click="remove"
        >
          Delete
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>

  <VSnackbar
    v-model="snackbar.show"
    :color="snackbar.color"
    location="top end"
  >
    {{ snackbar.text }}
  </VSnackbar>
</template>

<style scoped>
.totals {
  border-collapse: collapse;
  min-inline-size: 16rem;
}

.totals td {
  padding-block: 4px;
}

.totals td:last-child {
  padding-inline-start: 24px;
  text-align: end;
}

.totals .grand td {
  font-weight: 600;
  padding-block-start: 8px;
}
</style>

<style>
/* Print just the invoice document. */
@media print {
  .layout-navbar,
  .layout-vertical-nav,
  .layout-footer,
  .no-print,
  .v-snackbar {
    display: none !important;
  }

  .layout-page-content,
  .layout-content-wrapper {
    padding: 0 !important;
    margin: 0 !important;
  }

  .v-col-md-9 {
    flex: 0 0 100% !important;
    max-inline-size: 100% !important;
  }

  .invoice-document {
    box-shadow: none !important;
  }
}
</style>
