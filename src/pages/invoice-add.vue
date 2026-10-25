<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { invoiceTotals, mockClients, mockServiceItems, useInvoicesStore, type Invoice, type InvoiceClient, type InvoiceItem, type InvoiceStatus } from '@/stores/invoices'
import { formatMoney } from '@/utils/money'

// One page for both Create and Edit: the presence of `:id` in the route
// decides the mode. Saving in create mode redirects to the edit URL for the
// newly-created invoice, so a subsequent Save/Send updates it in place.

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const invoicesStore = useInvoicesStore()

const editingId = computed(() => (route.params.id ? Number(route.params.id) : null))
const existingInvoice = computed(() => (editingId.value ? invoicesStore.getById(editingId.value) : null))

const currency = computed(() => authStore.business?.currency_code ?? 'USD')
const invoiceNumber = computed(() => existingInvoice.value?.number ?? invoicesStore.nextNumber())

const businessBank = {
  bankName: 'Bookly Business Bank',
  country: 'United States',
  iban: 'BK00 0000 0000',
  swift: 'BOOKLYXX',
}

let localItemId = 1
const makeEmptyItem = (): InvoiceItem => ({ id: localItemId++, name: '', description: '', cost: 0, hours: 1 })
const emptyClient = (): InvoiceClient => ({ name: '', email: '', company: '', address: '', phone: '' })

function buildInitialForm() {
  const invoice = existingInvoice.value

  if (invoice) {
    return {
      client: { ...invoice.client },
      items: invoice.items.map(item => ({ ...item })),
      issuedDate: invoice.issuedDate,
      dueDate: invoice.dueDate,
      discountPercent: invoice.discountPercent,
      taxPercent: invoice.taxPercent,
      amountPaid: invoice.amountPaid,
      salesperson: invoice.salesperson,
      thanksNote: invoice.thanksNote,
      note: invoice.note,
      paymentMethod: invoice.paymentMethod,
      status: invoice.status,
    }
  }

  return {
    client: emptyClient(),
    items: [makeEmptyItem()],
    issuedDate: new Date().toISOString().slice(0, 10),
    dueDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
    discountPercent: 0,
    taxPercent: 0,
    amountPaid: 0,
    salesperson: '',
    thanksNote: 'Thanks for your business',
    note: '',
    paymentMethod: 'Bank Account',
    status: 'draft' as InvoiceStatus,
  }
}

const form = reactive(buildInitialForm())

const selectedClientEmail = computed({
  get: () => form.client.email || null,
  set: (email: string | null) => {
    const found = mockClients.find(client => client.email === email)

    if (found)
      form.client = { ...found }
  },
})

const serviceItemNames = mockServiceItems.map(item => item.name)

const selectServiceItem = (item: InvoiceItem, name: string | null) => {
  const found = mockServiceItems.find(service => service.name === name)

  item.name = name ?? ''

  if (found) {
    item.description = found.description
    item.cost = found.cost
  }
}

const addItem = () => form.items.push(makeEmptyItem())
const removeItem = (id: number) => {
  if (form.items.length > 1)
    form.items = form.items.filter(item => item.id !== id)
}

const totals = computed(() => invoiceTotals(form, currency.value))
const itemPrice = (item: InvoiceItem) => formatMoney({ amount: Math.round(item.cost * item.hours * 100), currency: currency.value })

const formatDate = (isoDate: string) => new Date(`${isoDate}T00:00:00`).toLocaleDateString('en-US', { dateStyle: 'medium' })

function buildPayload(status: InvoiceStatus): Omit<Invoice, 'id' | 'number'> {
  return {
    status,
    client: { ...form.client },
    items: form.items.map(item => ({ ...item })),
    issuedDate: form.issuedDate,
    dueDate: form.dueDate,
    discountPercent: form.discountPercent,
    taxPercent: form.taxPercent,
    amountPaid: form.amountPaid,
    salesperson: form.salesperson,
    thanksNote: form.thanksNote,
    note: form.note,
    paymentMethod: form.paymentMethod,
  }
}

/** Saves the current form and returns the invoice's id, creating it if this is a new invoice. */
const persist = (status: InvoiceStatus): number => {
  const payload = buildPayload(status)

  if (editingId.value) {
    invoicesStore.update(editingId.value, payload)

    return editingId.value
  }

  const created = invoicesStore.create(payload)

  router.replace(`/invoices/${created.id}/edit`)

  return created.id
}

const saveAndExit = () => {
  persist(form.status)
  router.push('/invoices')
}

const openPreview = () => {
  const id = persist(form.status)

  router.push(`/invoices/${id}/preview`)
}

const isSendDrawerOpen = ref(false)
const sendForm = reactive({ from: '', to: '', subject: '', message: '' })

const openSendDrawer = () => {
  sendForm.from = authStore.business?.email ?? ''
  sendForm.to = form.client.email
  sendForm.subject = `Invoice #${invoiceNumber.value} from ${authStore.business?.name ?? 'Bookly'}`
  sendForm.message = `Dear ${form.client.name || 'Customer'},\n\n${form.thanksNote}\n\nWe have generated a new invoice in the amount of ${formatMoney(totals.value.total)}.\n\nWe would appreciate payment of this invoice by ${formatDate(form.dueDate)}.`
  isSendDrawerOpen.value = true
}

const sendInvoice = () => {
  const id = persist(form.status)

  invoicesStore.markSent(id)
  isSendDrawerOpen.value = false
  router.push('/invoices')
}

const paymentTerms = ref(true)
const clientNotes = ref(false)
const paymentStub = ref(false)
</script>

<template>
  <VRow>
    <VCol
      cols="12"
      md="9"
    >
      <VCard class="pa-6 pa-sm-12">
        <div class="d-flex flex-wrap justify-space-between flex-column bg-surface rounded flex-sm-row gap-6 pa-6 mb-6">
          <div>
            <h6 class="text-h6 mb-4">
              {{ authStore.business?.name ?? 'Bookly' }}
            </h6>
            <p
              v-if="authStore.business?.email"
              class="text-high-emphasis mb-0 text-body-1"
            >
              {{ authStore.business.email }}
            </p>
            <p
              v-if="authStore.business?.phone"
              class="text-high-emphasis mb-0 text-body-1"
            >
              {{ authStore.business.phone }}
            </p>
          </div>

          <div class="d-flex flex-column gap-2">
            <div class="d-flex align-start align-sm-center gap-x-4 font-weight-medium text-h5 flex-column flex-sm-row">
              <span
                class="text-high-emphasis text-sm-end"
                style="inline-size: 5.625rem;"
              >Invoice</span>
              <VTextField
                :model-value="invoiceNumber"
                prefix="#"
                disabled
                style="inline-size: 9.5rem;"
              />
            </div>
            <div class="d-flex gap-x-4 align-start align-sm-center flex-column flex-sm-row">
              <span
                class="text-high-emphasis text-body-1 text-sm-end"
                style="inline-size: 5.625rem;"
              >Date Issued:</span>
              <VTextField
                v-model="form.issuedDate"
                type="date"
                style="inline-size: 9.5rem;"
              />
            </div>
            <div class="d-flex gap-x-4 align-start align-sm-center flex-column flex-sm-row">
              <span
                class="text-high-emphasis text-body-1 text-sm-end"
                style="inline-size: 5.625rem;"
              >Due Date:</span>
              <VTextField
                v-model="form.dueDate"
                type="date"
                style="inline-size: 9.5rem;"
              />
            </div>
          </div>
        </div>

        <VRow>
          <VCol
            cols="12"
            md="6"
            class="text-no-wrap"
          >
            <h6 class="text-h6 mb-4">
              Invoice To:
            </h6>
            <VSelect
              v-model="selectedClientEmail"
              :items="mockClients"
              item-title="name"
              item-value="email"
              placeholder="Select client"
              clearable
              class="mb-4"
              style="inline-size: 11.875rem;"
            />
            <p
              v-if="form.client.name"
              class="mb-0 text-body-1"
            >
              {{ form.client.name }}
            </p>
            <p
              v-if="form.client.phone"
              class="mb-0 text-body-1"
            >
              {{ form.client.phone }}
            </p>
            <p
              v-if="form.client.email"
              class="mb-0 text-body-1"
            >
              {{ form.client.email }}
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

        <VDivider class="my-6 border-dashed" />

        <div class="mb-4">
          <div class="d-none d-md-flex mb-4">
            <VRow class="me-10 w-100">
              <VCol
                cols="12"
                md="6"
              >
                <h6 class="text-h6">
                  Item
                </h6>
              </VCol>
              <VCol
                cols="12"
                md="2"
              >
                <h6 class="text-h6 ps-2">
                  Cost
                </h6>
              </VCol>
              <VCol
                cols="12"
                md="2"
              >
                <h6 class="text-h6 ps-2">
                  Hours
                </h6>
              </VCol>
              <VCol
                cols="12"
                md="2"
              >
                <h6 class="text-h6">
                  Price
                </h6>
              </VCol>
            </VRow>
          </div>

          <VCard
            v-for="item in form.items"
            :key="item.id"
            variant="outlined"
            class="d-flex flex-sm-row flex-column-reverse mb-4"
          >
            <div class="pa-6 flex-grow-1">
              <VRow>
                <VCol
                  cols="12"
                  md="6"
                >
                  <VSelect
                    :model-value="item.name"
                    :items="serviceItemNames"
                    placeholder="Select item"
                    class="mb-4"
                    @update:model-value="(value: string | null) => selectServiceItem(item, value)"
                  />
                  <VTextarea
                    v-model="item.description"
                    placeholder="Item description"
                    rows="2"
                  />
                </VCol>
                <VCol
                  cols="12"
                  sm="4"
                  md="2"
                >
                  <VTextField
                    v-model.number="item.cost"
                    type="number"
                    min="0"
                    placeholder="Cost"
                    class="mb-4"
                  />
                </VCol>
                <VCol
                  cols="12"
                  sm="4"
                  md="2"
                >
                  <VTextField
                    v-model.number="item.hours"
                    type="number"
                    min="0"
                    placeholder="Hours"
                  />
                </VCol>
                <VCol
                  cols="12"
                  sm="4"
                  md="2"
                >
                  <p class="my-2">
                    <span class="d-inline d-md-none">Price: </span>
                    <span class="text-high-emphasis">{{ itemPrice(item) }}</span>
                  </p>
                </VCol>
              </VRow>
            </div>
            <div class="d-flex flex-column align-end border-s">
              <VBtn
                icon
                variant="text"
                @click="removeItem(item.id)"
              >
                <VIcon icon="bx-x" />
              </VBtn>
            </div>
          </VCard>

          <VBtn
            size="small"
            prepend-icon="bx-plus"
            @click="addItem"
          >
            Add Item
          </VBtn>
        </div>

        <VDivider class="my-6 border-dashed" />

        <div class="d-flex justify-space-between flex-wrap flex-column flex-sm-row">
          <div class="mb-6 mb-sm-0">
            <div class="d-flex align-center mb-4">
              <h6 class="text-h6 me-2">
                Salesperson:
              </h6>
              <VTextField
                v-model="form.salesperson"
                placeholder="John Doe"
                style="inline-size: 8rem;"
              />
            </div>
            <VTextField
              v-model="form.thanksNote"
              placeholder="Thanks for your business"
            />
          </div>

          <div style="inline-size: 15.625rem;">
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
                    <VTextField
                      v-model.number="form.discountPercent"
                      type="number"
                      min="0"
                      max="100"
                      suffix="%"
                      density="compact"
                    />
                  </td>
                </tr>
                <tr>
                  <td class="pe-16">
                    Tax:
                  </td>
                  <td class="text-end">
                    <VTextField
                      v-model.number="form.taxPercent"
                      type="number"
                      min="0"
                      max="100"
                      suffix="%"
                      density="compact"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
            <VDivider class="my-2" />
            <table class="w-100">
              <tbody>
                <tr>
                  <td class="pe-16 text-body-1">
                    Total:
                  </td>
                  <td class="text-end">
                    <h6 class="text-h6">
                      {{ formatMoney(totals.total) }}
                    </h6>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <VDivider class="my-6 border-dashed" />

        <div>
          <h6 class="text-h6 font-weight-regular mb-1">
            Note:
          </h6>
          <VTextarea
            v-model="form.note"
            placeholder="Write note here..."
            rows="2"
          />
        </div>
      </VCard>
    </VCol>

    <VCol
      cols="12"
      md="3"
    >
      <VCard class="mb-6">
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
            @click="openPreview"
          >
            Preview
          </VBtn>
          <VBtn
            block
            variant="tonal"
            color="secondary"
            @click="saveAndExit"
          >
            Save
          </VBtn>
        </VCardText>

        <VCardText>
          <VSelect
            v-model="form.paymentMethod"
            label="Accept Payment Via"
            :items="['Bank Account', 'PayPal', 'Cash', 'Stripe']"
            class="mb-4"
          />

          <div class="d-flex align-center justify-space-between mb-2">
            <span class="text-body-1">Payment Terms</span>
            <VSwitch v-model="paymentTerms" />
          </div>
          <div class="d-flex align-center justify-space-between mb-2">
            <span class="text-body-1">Client Notes</span>
            <VSwitch v-model="clientNotes" />
          </div>
          <div class="d-flex align-center justify-space-between">
            <span class="text-body-1">Payment Stub</span>
            <VSwitch v-model="paymentStub" />
          </div>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>

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
