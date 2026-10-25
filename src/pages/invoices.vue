<script setup lang="ts">
import { watchDebounced } from '@vueuse/core'
import ListPaginationFooter from '@/components/ListPaginationFooter.vue'
import { useAuthStore } from '@/stores/auth'
import { invoiceStatusMeta, invoiceStatusOptions, invoiceTotals, useInvoicesStore, type Invoice, type InvoiceStatus } from '@/stores/invoices'
import { formatMoney } from '@/utils/money'

const router = useRouter()
const authStore = useAuthStore()
const invoicesStore = useInvoicesStore()
const currency = computed(() => authStore.business?.currency_code ?? 'USD')

const avatarColors = ['primary', 'success', 'warning', 'error', 'secondary', 'info']
const avatarColor = (name: string) => avatarColors[[...name].reduce((sum, char) => sum + char.charCodeAt(0), 0) % avatarColors.length]
const initials = (name: string) => name.split(' ').map(part => part[0]).slice(0, 2).join('').toUpperCase()

const page = ref(1)
const perPage = ref(10)
const search = ref('')
const statusFilter = ref<InvoiceStatus | null>(null)
const selected = ref<number[]>([])

const perPageOptions = [10, 25, 50, 100]

const invoiceRows = computed(() => invoicesStore.invoices.map(invoice => ({
  invoice,
  ...invoiceTotals(invoice, currency.value),
})))

const filteredInvoices = computed(() => invoiceRows.value.filter(({ invoice }) => {
  const matchesSearch = !search.value
    || invoice.client.name.toLowerCase().includes(search.value.toLowerCase())
    || invoice.client.email.toLowerCase().includes(search.value.toLowerCase())
    || invoice.number.includes(search.value)

  const matchesStatus = !statusFilter.value || invoice.status === statusFilter.value

  return matchesSearch && matchesStatus
}))

const total = computed(() => filteredInvoices.value.length)

const paginatedInvoices = computed(() => {
  const start = (page.value - 1) * perPage.value

  return filteredInvoices.value.slice(start, start + perPage.value)
})

watch([perPage, statusFilter], () => { page.value = 1 })
watchDebounced(search, () => { page.value = 1 }, { debounce: 400 })

const stats = computed(() => {
  const distinctClients = new Set(invoicesStore.invoices.map(i => i.client.email)).size
  const paidTotal = invoiceRows.value.filter(r => r.invoice.status === 'paid').reduce((sum, r) => sum + r.total.amount, 0)
  const unpaidTotal = invoiceRows.value.filter(r => r.invoice.status !== 'paid').reduce((sum, r) => sum + r.balance.amount, 0)

  return {
    clients: distinctClients,
    invoices: invoicesStore.invoices.length,
    paid: { amount: paidTotal, currency: currency.value },
    unpaid: { amount: unpaidTotal, currency: currency.value },
  }
})

const formatDate = (isoDate: string) => new Date(`${isoDate}T00:00:00`).toLocaleDateString('en-US', { dateStyle: 'medium' })

const headers = [
  { title: '#', key: 'number' },
  { title: 'Status', key: 'status', sortable: false },
  { title: 'Client', key: 'client' },
  { title: 'Total', key: 'total' },
  { title: 'Issued Date', key: 'issuedDate' },
  { title: 'Balance', key: 'balance', sortable: false },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' as const },
]

const isDeleteDialogOpen = ref(false)
const deletingId = ref<number | null>(null)

const confirmDelete = (invoice: Invoice) => {
  deletingId.value = invoice.id
  isDeleteDialogOpen.value = true
}

const deleteInvoice = () => {
  if (deletingId.value)
    invoicesStore.remove(deletingId.value)

  isDeleteDialogOpen.value = false
}

const openPreview = (invoice: Invoice) => router.push(`/invoices/${invoice.id}/preview`)
</script>

<template>
  <VCard class="mb-6">
    <VCardText class="px-3">
      <VRow>
        <VCol
          cols="12"
          sm="6"
          md="3"
          class="px-6"
        >
          <div class="d-flex justify-space-between align-center border-b pb-4">
            <div class="d-flex flex-column">
              <h4 class="text-h4">
                {{ stats.clients }}
              </h4>
              <span class="text-body-1 text-capitalize">Clients</span>
            </div>
            <VAvatar
              variant="tonal"
              rounded
              size="42"
            >
              <VIcon
                icon="bx-user"
                size="26"
              />
            </VAvatar>
          </div>
        </VCol>

        <VDivider
          vertical
          inset
          class="d-none d-sm-block"
        />

        <VCol
          cols="12"
          sm="6"
          md="3"
          class="px-6"
        >
          <div class="d-flex justify-space-between align-center border-b pb-4">
            <div class="d-flex flex-column">
              <h4 class="text-h4">
                {{ stats.invoices }}
              </h4>
              <span class="text-body-1 text-capitalize">Invoices</span>
            </div>
            <VAvatar
              variant="tonal"
              rounded
              size="42"
            >
              <VIcon
                icon="bx-file"
                size="26"
              />
            </VAvatar>
          </div>
        </VCol>

        <VCol
          cols="12"
          sm="6"
          md="3"
          class="px-6"
        >
          <div class="d-flex justify-space-between align-center">
            <div class="d-flex flex-column">
              <h4 class="text-h4">
                {{ formatMoney(stats.paid) }}
              </h4>
              <span class="text-body-1 text-capitalize">Paid</span>
            </div>
            <VAvatar
              variant="tonal"
              rounded
              size="42"
            >
              <VIcon
                icon="bx-check-double"
                size="26"
              />
            </VAvatar>
          </div>
        </VCol>

        <VDivider
          vertical
          inset
          class="d-none d-sm-block"
        />

        <VCol
          cols="12"
          sm="6"
          md="3"
          class="px-6"
        >
          <div class="d-flex justify-space-between align-center">
            <div class="d-flex flex-column">
              <h4 class="text-h4">
                {{ formatMoney(stats.unpaid) }}
              </h4>
              <span class="text-body-1 text-capitalize">Unpaid</span>
            </div>
            <VAvatar
              variant="tonal"
              rounded
              size="42"
            >
              <VIcon
                icon="bx-error-circle"
                size="26"
              />
            </VAvatar>
          </div>
        </VCol>
      </VRow>
    </VCardText>
  </VCard>

  <VCard id="invoice-list">
    <VCardText class="d-flex justify-space-between align-center flex-wrap gap-4">
      <div class="d-flex gap-4 align-center flex-wrap">
        <div class="d-flex align-center gap-2">
          <span>Show</span>
          <VSelect
            v-model="perPage"
            :items="perPageOptions"
            style="inline-size: 5.5rem;"
          />
        </div>
      </div>

      <VBtn
        prepend-icon="bx-plus"
        @click="router.push('/invoices/add')"
      >
        Create invoice
      </VBtn>
    </VCardText>

    <VCardText class="d-flex align-center flex-wrap gap-4">
      <VTextField
        v-model="search"
        placeholder="Search Invoice"
        style="inline-size: 12.5rem;"
      />
      <VSelect
        v-model="statusFilter"
        placeholder="Invoice Status"
        :items="invoiceStatusOptions"
        clearable
        style="inline-size: 10.2rem;"
      />
    </VCardText>

    <VDivider />

    <VDataTable
      v-model="selected"
      :headers="headers"
      :items="paginatedInvoices"
      :items-per-page="perPage"
      show-select
      hide-default-footer
      no-data-text="No invoices yet."
      class="text-no-wrap"
    >
      <template #item.number="{ item }">
        <a
          href="#"
          class="text-link"
          @click.prevent="openPreview(item.invoice)"
        >#{{ item.invoice.number }}</a>
      </template>

      <template #item.status="{ item }">
        <VTooltip :text="invoiceStatusMeta[item.invoice.status].label">
          <template #activator="{ props }">
            <VAvatar
              v-bind="props"
              :color="invoiceStatusMeta[item.invoice.status].color"
              variant="tonal"
              size="28"
            >
              <VIcon
                :icon="invoiceStatusMeta[item.invoice.status].icon"
                size="16"
              />
            </VAvatar>
          </template>
        </VTooltip>
      </template>

      <template #item.client="{ item }">
        <div class="d-flex align-center">
          <VAvatar
            :color="avatarColor(item.invoice.client.name)"
            variant="tonal"
            size="34"
            class="me-3"
          >
            <span>{{ initials(item.invoice.client.name) }}</span>
          </VAvatar>
          <div class="d-flex flex-column">
            <span class="font-weight-medium">{{ item.invoice.client.name }}</span>
            <span class="text-sm text-medium-emphasis">{{ item.invoice.client.email }}</span>
          </div>
        </div>
      </template>

      <template #item.total="{ item }">
        {{ formatMoney(item.total) }}
      </template>

      <template #item.issuedDate="{ item }">
        {{ formatDate(item.invoice.issuedDate) }}
      </template>

      <template #item.balance="{ item }">
        <VChip
          v-if="item.invoice.status === 'paid'"
          color="success"
          size="small"
          label
        >
          Paid
        </VChip>
        <span
          v-else
          class="text-base text-high-emphasis"
        >{{ formatMoney(item.balance) }}</span>
      </template>

      <template #item.actions="{ item }">
        <VBtn
          icon
          variant="text"
          size="small"
          @click="confirmDelete(item.invoice)"
        >
          <VIcon icon="bx-trash" />
        </VBtn>
        <VBtn
          icon
          variant="text"
          size="small"
          @click="openPreview(item.invoice)"
        >
          <VIcon icon="bx-show" />
        </VBtn>
        <VMenu>
          <template #activator="{ props }">
            <VBtn
              v-bind="props"
              icon
              variant="text"
              size="small"
              color="medium-emphasis"
            >
              <VIcon icon="bx-dots-vertical-rounded" />
            </VBtn>
          </template>
          <VList>
            <VListItem
              prepend-icon="bx-edit"
              title="Edit"
              @click="router.push(`/invoices/${item.invoice.id}/edit`)"
            />
            <VListItem
              prepend-icon="bx-copy"
              title="Duplicate"
              @click="invoicesStore.duplicate(item.invoice.id)"
            />
          </VList>
        </VMenu>
      </template>

      <template #bottom>
        <VDivider />
        <ListPaginationFooter
          v-model:page="page"
          :per-page="perPage"
          :total="total"
        />
      </template>
    </VDataTable>
  </VCard>

  <!-- Delete confirmation -->
  <VDialog
    v-model="isDeleteDialogOpen"
    max-width="400"
  >
    <VCard title="Delete invoice?">
      <VCardText>
        This can't be undone.
      </VCardText>
      <VCardText class="d-flex justify-end gap-3">
        <VBtn
          variant="tonal"
          color="secondary"
          @click="isDeleteDialogOpen = false"
        >
          Cancel
        </VBtn>
        <VBtn
          color="error"
          @click="deleteInvoice"
        >
          Delete
        </VBtn>
      </VCardText>
    </VCard>
  </VDialog>
</template>
