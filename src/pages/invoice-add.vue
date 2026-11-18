<script setup lang="ts">
import { invoicesApis } from '@/core/apis/invoices.apis'
import type { InvoicePayload } from '@/core/apis/types/invoices.types'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/utils/api'
import { currencyDecimals, formatMoney } from '@/utils/money'
import type { Money } from '@/utils/money'

interface Option { id: number; name: string }
interface ServiceOption extends Option { price: Money | null }
interface Line { key: number; description: string; quantity: number; unit_price: number | string; service_id: number | null }

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const invoiceId = computed(() => (route.params.id ? Number(route.params.id) : null))
const isEdit = computed(() => invoiceId.value !== null)
const currency = computed(() => authStore.business?.currency_code ?? 'USD')
const decimals = computed(() => currencyDecimals(currency.value))
const priceStep = computed(() => 10 ** -decimals.value)

const today = () => new Date().toLocaleDateString('en-CA')
const inDays = (days: number) => new Date(Date.now() + days * 86_400_000).toLocaleDateString('en-CA')

let lineKey = 0
const newLine = (): Line => ({ key: ++lineKey, description: '', quantity: 1, unit_price: '', service_id: null })

const form = ref({
  client_id: null as number | null,
  issued_on: today(),
  due_on: inDays(14),
  discount_percent: 0,
  tax_percent: 0,
  notes: '',
})

const lines = ref<Line[]>([newLine()])

const invoiceNumber = ref<number | null>(null)
const clients = ref<Option[]>([])
const services = ref<ServiceOption[]>([])
const isLoading = ref(true)
const isSaving = ref(false)
const errorMessage = ref('')
const formErrors = ref<Record<string, string[]>>({})

const load = async () => {
  isLoading.value = true

  try {
    const [clientsRes, servicesRes] = await Promise.all([api.get('/clients/list'), api.get('/services/list')])

    clients.value = clientsRes.data.data
    services.value = servicesRes.data.data

    if (route.query.client_id)
      form.value.client_id = Number(route.query.client_id)

    if (invoiceId.value) {
      const res = await invoicesApis.handleGetInvoice(invoiceId.value)

      if (res.status.code !== 200) {
        errorMessage.value = res.status.message

        return
      }

      const invoice = res.data

      invoiceNumber.value = invoice.number
      form.value = {
        client_id: invoice.client_id,
        issued_on: invoice.issued_on,
        due_on: invoice.due_on,
        discount_percent: invoice.discount_percent,
        tax_percent: invoice.tax_percent,
        notes: invoice.notes ?? '',
      }
      lines.value = (invoice.items ?? []).map(item => ({
        key: ++lineKey,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price / 10 ** decimals.value,
        service_id: item.service_id,
      }))
    }
  }
  catch {
    errorMessage.value = 'The invoice form could not be loaded. Please try again.'
  }
  finally {
    isLoading.value = false
  }
}

load()

const pickService = (line: Line, serviceId: number | null) => {
  line.service_id = serviceId

  const service = services.value.find(s => s.id === serviceId)

  if (service) {
    line.description = service.name
    line.unit_price = service.price ? service.price.amount / 10 ** decimals.value : 0
  }
}

const addLine = () => lines.value.push(newLine())

const removeLine = (key: number) => {
  lines.value = lines.value.filter(line => line.key !== key)
  if (!lines.value.length)
    addLine()
}

// Live preview only; the API recomputes and stores the real totals.
const toMinor = (value: number | string) => Math.round((Number(value) || 0) * 10 ** decimals.value)
const lineTotal = (line: Line) => Math.round(toMinor(line.unit_price) * (Number(line.quantity) || 0))

const totals = computed(() => {
  const subtotal = lines.value.reduce((sum, line) => sum + lineTotal(line), 0)
  const discount = Math.round(subtotal * (Number(form.value.discount_percent) || 0) / 100)
  const tax = Math.round((subtotal - discount) * (Number(form.value.tax_percent) || 0) / 100)
  const money = (amount: number): Money => ({ amount, currency: currency.value })

  return { subtotal: money(subtotal), discount: money(discount), tax: money(tax), total: money(subtotal - discount + tax) }
})

const lineError = (index: number, field: string) => formErrors.value[`items.${index}.${field}`]

const save = async () => {
  isSaving.value = true
  errorMessage.value = ''
  formErrors.value = {}

  const payload: InvoicePayload = {
    client_id: form.value.client_id as number,
    issued_on: form.value.issued_on,
    due_on: form.value.due_on,
    discount_percent: Number(form.value.discount_percent) || 0,
    tax_percent: Number(form.value.tax_percent) || 0,
    notes: form.value.notes || null,
    items: lines.value.map(line => ({
      description: line.description,
      quantity: Number(line.quantity),
      unit_price: line.unit_price === '' ? '' : String(line.unit_price),
      service_id: line.service_id,
    })),
  }

  try {
    const res = invoiceId.value
      ? await invoicesApis.handleUpdateInvoice(invoiceId.value, payload)
      : await invoicesApis.handleCreateInvoice(payload)

    if ([200, 201].includes(res.status.code))
      router.push(`/invoices/${res.data.id}/preview`)
    else if (res.errors)
      formErrors.value = res.errors
    else
      errorMessage.value = res.status.message
  }
  catch {
    errorMessage.value = 'The invoice could not be saved. Please try again.'
  }
  finally {
    isSaving.value = false
  }
}
</script>

<template>
  <PageLoader
    v-if="isLoading"
    text="Loading invoice…"
  />

  <VForm
    v-else
    @submit.prevent="save"
  >
    <VRow>
      <VCol
        cols="12"
        lg="9"
      >
        <VCard>
          <VCardItem>
            <VCardTitle>{{ isEdit ? `Edit invoice #${invoiceNumber}` : 'New invoice' }}</VCardTitle>
            <VCardSubtitle>Prices in {{ currency }}. Totals are recalculated when you save.</VCardSubtitle>
          </VCardItem>

          <VCardText>
            <VAlert
              v-if="errorMessage"
              type="error"
              variant="tonal"
              class="mb-4"
              :text="errorMessage"
            />

            <VRow>
              <VCol
                cols="12"
                md="6"
              >
                <VAutocomplete
                  v-model="form.client_id"
                  :items="clients"
                  item-title="name"
                  item-value="id"
                  label="Client"
                  placeholder="Choose a client"
                  :error-messages="formErrors.client_id"
                />
              </VCol>
              <VCol
                cols="6"
                md="3"
              >
                <VTextField
                  v-model="form.issued_on"
                  type="date"
                  label="Issued on"
                  :error-messages="formErrors.issued_on"
                />
              </VCol>
              <VCol
                cols="6"
                md="3"
              >
                <VTextField
                  v-model="form.due_on"
                  type="date"
                  label="Due on"
                  :error-messages="formErrors.due_on"
                />
              </VCol>
            </VRow>
          </VCardText>

          <VDivider />

          <VCardText>
            <h6 class="text-h6 mb-4">
              Items
            </h6>
            <VAlert
              v-if="formErrors.items"
              type="error"
              variant="tonal"
              density="compact"
              class="mb-4"
              :text="formErrors.items[0]"
            />

            <div
              v-for="(line, index) in lines"
              :key="line.key"
              class="border rounded pa-4 mb-4"
            >
              <VRow>
                <VCol
                  cols="12"
                  md="5"
                >
                  <VSelect
                    :model-value="line.service_id"
                    :items="services"
                    item-title="name"
                    item-value="id"
                    label="Service (optional)"
                    clearable
                    class="mb-3"
                    @update:model-value="(v: number | null) => pickService(line, v)"
                  />
                  <VTextField
                    v-model="line.description"
                    label="Description"
                    :error-messages="lineError(index, 'description')"
                  />
                </VCol>
                <VCol
                  cols="6"
                  md="2"
                >
                  <VTextField
                    v-model.number="line.quantity"
                    type="number"
                    min="0.01"
                    step="1"
                    label="Qty"
                    :error-messages="lineError(index, 'quantity')"
                  />
                </VCol>
                <VCol
                  cols="6"
                  md="3"
                >
                  <VTextField
                    v-model="line.unit_price"
                    type="number"
                    min="0"
                    :step="priceStep"
                    label="Unit price"
                    :suffix="currency"
                    :error-messages="lineError(index, 'unit_price')"
                  />
                </VCol>
                <VCol
                  cols="12"
                  md="2"
                  class="d-flex flex-md-column align-center align-md-end justify-space-between"
                >
                  <span class="text-body-1 font-weight-medium">{{ formatMoney({ amount: lineTotal(line), currency }) }}</span>
                  <VBtn
                    icon
                    variant="text"
                    size="small"
                    color="error"
                    aria-label="Remove line"
                    @click="removeLine(line.key)"
                  >
                    <VIcon icon="bx-trash" />
                  </VBtn>
                </VCol>
              </VRow>
            </div>

            <VBtn
              variant="tonal"
              prepend-icon="bx-plus"
              @click="addLine"
            >
              Add item
            </VBtn>
          </VCardText>

          <VDivider />

          <VCardText>
            <VTextarea
              v-model="form.notes"
              label="Note to the client (optional)"
              rows="2"
              auto-grow
              :error-messages="formErrors.notes"
            />
          </VCardText>
        </VCard>
      </VCol>

      <VCol
        cols="12"
        lg="3"
      >
        <VCard class="mb-6">
          <VCardText>
            <VTextField
              v-model.number="form.discount_percent"
              type="number"
              min="0"
              max="100"
              label="Discount"
              suffix="%"
              class="mb-4"
              :error-messages="formErrors.discount_percent"
            />
            <VTextField
              v-model.number="form.tax_percent"
              type="number"
              min="0"
              max="100"
              label="Tax"
              suffix="%"
              :error-messages="formErrors.tax_percent"
            />
          </VCardText>
          <VDivider />
          <VCardText>
            <div class="d-flex justify-space-between mb-2">
              <span class="text-medium-emphasis">Subtotal</span><span>{{ formatMoney(totals.subtotal) }}</span>
            </div>
            <div class="d-flex justify-space-between mb-2">
              <span class="text-medium-emphasis">Discount</span><span>−{{ formatMoney(totals.discount) }}</span>
            </div>
            <div class="d-flex justify-space-between mb-2">
              <span class="text-medium-emphasis">Tax</span><span>{{ formatMoney(totals.tax) }}</span>
            </div>
            <VDivider class="my-3" />
            <div class="d-flex justify-space-between text-h6">
              <span>Total</span><span>{{ formatMoney(totals.total) }}</span>
            </div>
          </VCardText>
        </VCard>

        <VBtn
          block
          type="submit"
          :loading="isSaving"
          class="mb-3"
        >
          {{ isEdit ? 'Save changes' : 'Create draft' }}
        </VBtn>
        <VBtn
          block
          variant="tonal"
          color="secondary"
          :to="invoiceId ? `/invoices/${invoiceId}/preview` : '/invoices'"
        >
          Cancel
        </VBtn>
      </VCol>
    </VRow>
  </VForm>
</template>
