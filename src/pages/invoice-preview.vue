<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { invoiceTotals, useInvoicesStore } from '@/stores/invoices'
import { formatMoney } from '@/utils/money'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const invoicesStore = useInvoicesStore()

const invoiceId = computed(() => Number(route.params.id))
const invoice = computed(() => invoicesStore.getById(invoiceId.value))

const currency = computed(() => authStore.business?.currency_code ?? 'USD')
const totals = computed(() => invoice.value ? invoiceTotals(invoice.value, currency.value) : null)

const businessBank = {
  bankName: 'Bookly Business Bank',
  country: 'United States',
  iban: 'BK00 0000 0000',
  swift: 'BOOKLYXX',
}

const formatDate = (isoDate: string) => new Date(`${isoDate}T00:00:00`).toLocaleDateString('en-US', { dateStyle: 'medium' })
const itemPrice = (cost: number, hours: number) => formatMoney({ amount: Math.round(cost * hours * 100), currency: currency.value })

const isSendDrawerOpen = ref(false)
const sendForm = reactive({ from: '', to: '', subject: '', message: '' })

const openSendDrawer = () => {
  if (!invoice.value || !totals.value)
    return

  sendForm.from = authStore.business?.email ?? ''
  sendForm.to = invoice.value.client.email
  sendForm.subject = `Invoice #${invoice.value.number} from ${authStore.business?.name ?? 'Bookly'}`
  sendForm.message = `Dear ${invoice.value.client.name || 'Customer'},\n\n${invoice.value.thanksNote}\n\nWe have generated a new invoice in the amount of ${formatMoney(totals.value.total)}.\n\nWe would appreciate payment of this invoice by ${formatDate(invoice.value.dueDate)}.`
  isSendDrawerOpen.value = true
}

const sendInvoice = () => {
  invoicesStore.markSent(invoiceId.value)
  isSendDrawerOpen.value = false
}

const isPaymentDrawerOpen = ref(false)
const paymentForm = reactive({
  amount: 0,
  date: new Date().toISOString().slice(0, 10),
  method: 'Bank Account',
  note: '',
})

const openPaymentDrawer = () => {
  paymentForm.amount = 0
  paymentForm.date = new Date().toISOString().slice(0, 10)
  paymentForm.method = 'Bank Account'
  paymentForm.note = ''
  isPaymentDrawerOpen.value = true
}

const recordPayment = () => {
  if (paymentForm.amount > 0)
    invoicesStore.addPayment(invoiceId.value, currency.value, Math.round(paymentForm.amount * 100))

  isPaymentDrawerOpen.value = false
}

const printInvoice = () => window.print()
</script>

<template>
  <VAlert
    v-if="!invoice || !totals"
    type="warning"
    variant="tonal"
  >
    Invoice not found.
    <RouterLink to="/invoices">
      Back to invoices
    </RouterLink>
  </VAlert>

  <VRow v-else>
    <VCol
      cols="12"
      md="9"
    >
      <VCard class="pa-6 pa-sm-12">
        <div class="d-flex flex-wrap justify-space-between flex-column flex-sm-row bg-surface rounded gap-6 pa-6 mb-6">
          <div>
            <h6 class="text-h6 mb-4">
              {{ authStore.business?.name ?? 'Bookly' }}
            </h6>
            <h6
              v-if="authStore.business?.email"
              class="text-h6 font-weight-regular"
            >
              {{ authStore.business.email }}
            </h6>
            <h6
              v-if="authStore.business?.phone"
              class="text-h6 font-weight-regular"
            >
              {{ authStore.business.phone }}
            </h6>
          </div>

          <div>
            <h5 class="text-h5 mb-6">
              Invoice #{{ invoice.number }}
            </h5>
            <h6 class="text-h6 mb-1">
              <span class="font-weight-regular">Date Issued: </span>
              <span>{{ formatDate(invoice.issuedDate) }}</span>
            </h6>
            <h6 class="text-h6">
              <span class="font-weight-regular">Due Date: </span>
              <span>{{ formatDate(invoice.dueDate) }}</span>
            </h6>
          </div>
        </div>

        <VRow class="mb-6">
          <VCol
            cols="12"
            md="6"
            class="text-no-wrap"
          >
            <h6 class="text-h6 mb-4">
              Invoice To:
            </h6>
            <p class="mb-0 text-body-1">
              {{ invoice.client.name }}
            </p>
            <p
              v-if="invoice.client.phone"
              class="mb-0 text-body-1"
            >
              {{ invoice.client.phone }}
            </p>
            <p
              v-if="invoice.client.email"
              class="mb-0 text-body-1"
            >
              {{ invoice.client.email }}
            </p>
          </VCol>

          <VCol
            cols="12"
            md="6"
            class="text-no-wrap"
          >
            <h6 class="text-h6 mb-4">
              Bill To:
            </h6>
            <table>
              <tbody class="text-body-1">
                <tr>
                  <td class="pe-4">
                    Total Due:
                  </td>
                  <td>{{ formatMoney(totals.total) }}</td>
                </tr>
                <tr>
                  <td class="pe-4">
                    Bank Name:
                  </td>
                  <td>{{ businessBank.bankName }}</td>
                </tr>
                <tr>
                  <td class="pe-4">
                    Country:
                  </td>
                  <td>{{ businessBank.country }}</td>
                </tr>
                <tr>
                  <td class="pe-4">
                    IBAN:
                  </td>
                  <td>{{ businessBank.iban }}</td>
                </tr>
                <tr>
                  <td class="pe-4">
                    SWIFT Code:
                  </td>
                  <td>{{ businessBank.swift }}</td>
                </tr>
              </tbody>
            </table>
          </VCol>
        </VRow>

        <VTable class="border mb-6">
          <thead>
            <tr>
              <th>ITEM</th>
              <th>DESCRIPTION</th>
              <th class="text-center">
                HOURS
              </th>
              <th class="text-center">
                QTY
              </th>
              <th class="text-center">
                TOTAL
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in invoice.items"
              :key="item.id"
            >
              <td class="text-no-wrap">
                {{ item.name }}
              </td>
              <td class="text-no-wrap">
                {{ item.description }}
              </td>
              <td class="text-center">
                {{ item.hours }}
              </td>
              <td class="text-center">
                1
              </td>
              <td class="text-center">
                {{ itemPrice(item.cost, item.hours) }}
              </td>
            </tr>
          </tbody>
        </VTable>

        <div class="d-flex justify-space-between flex-column flex-sm-row">
          <div class="mb-2">
            <div
              v-if="invoice.salesperson"
              class="d-flex align-center mb-1"
            >
              <h6 class="text-h6 me-2">
                Salesperson:
              </h6>
              <span class="text-body-1">{{ invoice.salesperson }}</span>
            </div>
            <p
              v-if="invoice.thanksNote"
              class="text-body-1"
            >
              {{ invoice.thanksNote }}
            </p>
          </div>

          <div>
            <table class="w-100">
              <tbody class="text-body-1">
                <tr>
                  <td class="pe-16">
                    Subtotal:
                  </td>
                  <td class="text-end">
                    <h6 class="text-h6">
                      {{ formatMoney(totals.subtotal) }}
                    </h6>
                  </td>
                </tr>
                <tr>
                  <td class="pe-16">
                    Discount:
                  </td>
                  <td class="text-end">
                    <h6 class="text-h6">
                      {{ formatMoney(totals.discount) }}
                    </h6>
                  </td>
                </tr>
                <tr>
                  <td class="pe-16">
                    Tax:
                  </td>
                  <td class="text-end">
                    <h6 class="text-h6">
                      {{ invoice.taxPercent }}%
                    </h6>
                  </td>
                </tr>
                <tr v-if="totals.amountPaid.amount > 0">
                  <td class="pe-16">
                    Paid:
                  </td>
                  <td class="text-end">
                    <h6 class="text-h6 text-success">
                      {{ formatMoney(totals.amountPaid) }}
                    </h6>
                  </td>
                </tr>
              </tbody>
            </table>
            <VDivider class="my-2" />
            <table class="w-100">
              <tbody class="text-body-1">
                <tr>
                  <td class="pe-16">
                    Balance Due:
                  </td>
                  <td class="text-end">
                    <h6 class="text-h6">
                      {{ formatMoney(totals.balance) }}
                    </h6>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <template v-if="invoice.note">
          <VDivider class="my-6 border-dashed" />
          <p class="mb-0 text-body-1">
            <span class="text-high-emphasis font-weight-medium me-1">Note:</span>
            <span>{{ invoice.note }}</span>
          </p>
        </template>
      </VCard>
    </VCol>

    <VCol
      cols="12"
      md="3"
      class="d-print-none"
    >
      <VCard>
        <VCardText>
          <VBtn
            block
            prepend-icon="bx-paper-plane"
            class="mb-4"
            @click="openSendDrawer"
          >
            Send Invoice
          </VBtn>
          <VBtn
            block
            variant="tonal"
            color="secondary"
            class="mb-4"
            @click="printInvoice"
          >
            Download
          </VBtn>
          <div class="d-flex flex-wrap gap-4 mb-4">
            <VBtn
              variant="tonal"
              color="secondary"
              class="flex-grow-1"
              @click="printInvoice"
            >
              Print
            </VBtn>
            <VBtn
              variant="tonal"
              color="secondary"
              class="flex-grow-1"
              @click="router.push(`/invoices/${invoice.id}/edit`)"
            >
              Edit
            </VBtn>
          </div>
          <VBtn
            block
            color="success"
            prepend-icon="bx-dollar"
            :disabled="totals.balance.amount === 0"
            @click="openPaymentDrawer"
          >
            Add Payment
          </VBtn>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>

  <!-- Add Payment -->
  <VNavigationDrawer
    v-model="isPaymentDrawerOpen"
    location="end"
    temporary
    width="400"
  >
    <div class="px-6 py-5 d-flex align-center">
      <h5 class="text-h5">
        Add Payment
      </h5>
      <VSpacer />
      <VBtn
        icon
        variant="text"
        @click="isPaymentDrawerOpen = false"
      >
        <VIcon icon="bx-x" />
      </VBtn>
    </div>
    <VDivider />
    <VCardText v-if="totals">
      <VForm @submit.prevent="recordPayment">
        <VRow>
          <VCol cols="12">
            <VTextField
              :model-value="formatMoney(totals.balance)"
              label="Invoice Balance"
              disabled
            />
          </VCol>
          <VCol cols="12">
            <VTextField
              v-model.number="paymentForm.amount"
              type="number"
              min="0"
              label="Payment Amount"
            />
          </VCol>
          <VCol cols="12">
            <VTextField
              v-model="paymentForm.date"
              type="date"
              label="Payment Date"
            />
          </VCol>
          <VCol cols="12">
            <VSelect
              v-model="paymentForm.method"
              label="Select Payment Method"
              :items="['Bank Account', 'PayPal', 'Cash', 'Stripe']"
            />
          </VCol>
          <VCol cols="12">
            <VTextarea
              v-model="paymentForm.note"
              label="Internal Payment Note"
              rows="5"
            />
          </VCol>
          <VCol cols="12">
            <div class="d-flex gap-3">
              <VBtn type="submit">
                Send
              </VBtn>
              <VBtn
                variant="tonal"
                color="secondary"
                @click="isPaymentDrawerOpen = false"
              >
                Cancel
              </VBtn>
            </div>
          </VCol>
        </VRow>
      </VForm>
    </VCardText>
  </VNavigationDrawer>

  <!-- Send Invoice -->
  <VNavigationDrawer
    v-model="isSendDrawerOpen"
    location="end"
    temporary
    width="400"
  >
    <div class="px-6 py-5 d-flex align-center">
      <h5 class="text-h5">
        Send Invoice
      </h5>
      <VSpacer />
      <VBtn
        icon
        variant="text"
        @click="isSendDrawerOpen = false"
      >
        <VIcon icon="bx-x" />
      </VBtn>
    </div>
    <VDivider />
    <VCardText>
      <VForm @submit.prevent="sendInvoice">
        <VRow>
          <VCol cols="12">
            <VTextField
              v-model="sendForm.from"
              label="From"
              placeholder="sender@email.com"
            />
          </VCol>
          <VCol cols="12">
            <VTextField
              v-model="sendForm.to"
              label="To"
              placeholder="receiver@email.com"
            />
          </VCol>
          <VCol cols="12">
            <VTextField
              v-model="sendForm.subject"
              label="Subject"
            />
          </VCol>
          <VCol cols="12">
            <VTextarea
              v-model="sendForm.message"
              label="Message"
              rows="8"
            />
          </VCol>
          <VCol cols="12">
            <VChip
              color="primary"
              variant="tonal"
              size="small"
              class="mb-4"
              prepend-icon="bx-link"
            >
              Invoice Attached
            </VChip>
            <div class="d-flex gap-3">
              <VBtn type="submit">
                Send
              </VBtn>
              <VBtn
                variant="tonal"
                color="secondary"
                @click="isSendDrawerOpen = false"
              >
                Cancel
              </VBtn>
            </div>
          </VCol>
        </VRow>
      </VForm>
    </VCardText>
  </VNavigationDrawer>
</template>
