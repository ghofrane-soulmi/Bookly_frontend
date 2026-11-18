<script setup lang="ts">
import { watchDebounced } from '@vueuse/core'
import ListPaginationFooter from '@/components/ListPaginationFooter.vue'
import { invoicesApis } from '@/core/apis/invoices.apis'
import type { Invoice, InvoiceState, InvoiceSummary, UninvoicedAppointment } from '@/core/apis/types/invoices.types'
import { invoiceStateMeta } from '@/core/apis/types/invoices.types'
import { formatMoney } from '@/utils/money'

const router = useRouter()

const openRow = (_event: Event, row: { item: Invoice }) => router.push(`/invoices/${row.item.id}/preview`)

const invoices = ref<Invoice[]>([])
const summary = ref<InvoiceSummary | null>(null)
const total = ref(0)
const isLoading = ref(true)
const errorMessage = ref('')

const page = ref(1)
const perPage = ref(10)
const search = ref('')
const stateFilter = ref<InvoiceState | null>(null)
const perPageOptions = [10, 25, 50, 100]

const stateOptions = (Object.keys(invoiceStateMeta) as InvoiceState[])
  .map(value => ({ title: invoiceStateMeta[value].label, value }))

const fetchInvoices = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const res = await invoicesApis.handleListInvoices({
      page: page.value,
      per_page: perPage.value,
      search: search.value || undefined,
      state: stateFilter.value ?? undefined,
    })

    invoices.value = res.data
    total.value = res.meta?.total ?? 0
    summary.value = res.meta?.summary ?? null
  }
  catch {
    errorMessage.value = 'Invoices could not be loaded. Please try again.'
  }
  finally {
    isLoading.value = false
  }
}

watch([page, perPage, stateFilter], fetchInvoices, { immediate: true })
watch([perPage, stateFilter], () => {
  page.value = 1
})
watchDebounced(search, () => {
  page.value = 1
  fetchInvoices()
}, { debounce: 400 })

const formatDate = (isoDate: string) => new Date(`${isoDate}T00:00:00`).toLocaleDateString(undefined, { dateStyle: 'medium' })

const headers = [
  { title: '#', key: 'number', sortable: false },
  { title: 'Client', key: 'client', sortable: false },
  { title: 'Issued', key: 'issued_on', sortable: false },
  { title: 'Due', key: 'due_on', sortable: false },
  { title: 'Total', key: 'total', sortable: false },
  { title: 'Balance', key: 'balance', sortable: false },
  { title: 'Status', key: 'state', sortable: false },
  { title: '', key: 'actions', sortable: false, align: 'end' as const },
]

const cards = computed(() => {
  const s = summary.value
  if (!s)
    return []

  return [
    { title: 'Invoiced', value: formatMoney(s.invoiced), icon: 'bx-receipt', color: 'primary' },
    { title: 'Paid', value: formatMoney(s.paid), icon: 'bx-check-circle', color: 'success' },
    { title: 'Outstanding', value: formatMoney(s.outstanding), icon: 'bx-time-five', color: 'warning' },
    { title: 'Past due', value: String(s.counts.past_due), icon: 'bx-error-circle', color: 'error' },
  ]
})

// --- Row actions -----------------------------------------------------------
const snackbar = ref({ show: false, text: '', color: 'success' })

const notify = (text: string, color = 'success') => {
  snackbar.value = { show: true, text, color }
}

const duplicate = async (invoice: Invoice) => {
  const res = await invoicesApis.handleDuplicateInvoice(invoice.id)

  if (res.status.code === 201)
    router.push(`/invoices/${res.data.id}/edit`)
  else
    notify(res.status.message, 'error')
}

const deleting = ref<Invoice | null>(null)

const deleteInvoice = async () => {
  if (!deleting.value)
    return

  const res = await invoicesApis.handleDeleteInvoice(deleting.value.id)

  deleting.value = null
  notify(res.status.message, res.status.code === 200 ? 'success' : 'error')
  fetchInvoices()
}

// --- Invoice completed appointments ----------------------------------------
const isAppointmentsDialogOpen = ref(false)
const uninvoiced = ref<UninvoicedAppointment[]>([])
const selectedAppointmentIds = ref<number[]>([])
const isLoadingUninvoiced = ref(false)
const isCreatingFromAppointments = ref(false)

const openAppointmentsDialog = async () => {
  isAppointmentsDialogOpen.value = true
  isLoadingUninvoiced.value = true
  selectedAppointmentIds.value = []

  try {
    uninvoiced.value = (await invoicesApis.handleUninvoicedAppointments()).data
  }
  finally {
    isLoadingUninvoiced.value = false
  }
}

const selectedClientId = computed(() => uninvoiced.value.find(a => selectedAppointmentIds.value.includes(a.id))?.client_id ?? null)

const toggleAppointment = (appointment: UninvoicedAppointment) => {
  const ids = selectedAppointmentIds.value

  selectedAppointmentIds.value = ids.includes(appointment.id)
    ? ids.filter(id => id !== appointment.id)
    : [...ids, appointment.id]
}

const createFromAppointments = async () => {
  isCreatingFromAppointments.value = true

  try {
    const res = await invoicesApis.handleCreateFromAppointments(selectedAppointmentIds.value)

    if (res.status.code === 201) {
      isAppointmentsDialogOpen.value = false
      router.push(`/invoices/${res.data.id}/preview`)
    }
    else {
      notify(Object.values(res.errors ?? {})[0]?.[0] ?? res.status.message, 'error')
    }
  }
  finally {
    isCreatingFromAppointments.value = false
  }
}

const formatDateTime = (iso: string) => new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
</script>

<template>
  <VRow class="mb-2">
    <VCol
      v-for="card in cards"
      :key="card.title"
      cols="12"
      sm="6"
      md="3"
    >
      <VCard>
        <VCardText class="d-flex align-center justify-space-between">
          <div>
            <div class="text-body-2 text-medium-emphasis">
              {{ card.title }}
            </div>
            <div class="text-h5 mt-1">
              {{ card.value }}
            </div>
          </div>
          <VAvatar
            :color="card.color"
            variant="tonal"
            rounded
            size="42"
          >
            <VIcon
              :icon="card.icon"
              size="26"
            />
          </VAvatar>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>

  <VCard title="Invoices">
    <VCardText class="d-flex flex-wrap gap-4">
      <VSelect
        v-model="perPage"
        :items="perPageOptions"
        style="inline-size: 6.25rem;"
      />
      <VSelect
        v-model="stateFilter"
        :items="stateOptions"
        placeholder="All statuses"
        clearable
        style="inline-size: 12rem;"
      />

      <VSpacer />

      <div class="d-flex align-center flex-wrap gap-4">
        <VTextField
          v-model="search"
          placeholder="Search # or client"
          style="inline-size: 14rem;"
        />
        <VBtn
          variant="tonal"
          prepend-icon="bx-calendar-check"
          @click="openAppointmentsDialog"
        >
          Invoice appointments
        </VBtn>
        <VBtn
          prepend-icon="bx-plus"
          to="/invoices/add"
        >
          New invoice
        </VBtn>
      </div>
    </VCardText>

    <VDivider />

    <VAlert
      v-if="errorMessage"
      type="error"
      variant="tonal"
      class="ma-4"
      :text="errorMessage"
    />

    <VDataTable
      :headers="headers"
      :items="invoices"
      :loading="isLoading"
      :items-per-page="perPage"
      hide-default-footer
      no-data-text="No invoices yet. Create one, or invoice your completed appointments."
      hover
      @click:row="openRow"
    >
      <template #item.number="{ item }">
        <RouterLink
          :to="`/invoices/${item.id}/preview`"
          class="font-weight-medium"
          @click.stop
        >
          #{{ item.number }}
        </RouterLink>
      </template>

      <template #item.client="{ item }">
        <div class="d-flex flex-column">
          <span class="text-high-emphasis">{{ item.client.name }}</span>
          <small
            v-if="item.client.email"
            class="text-medium-emphasis"
          >{{ item.client.email }}</small>
        </div>
      </template>

      <template #item.issued_on="{ item }">
        {{ formatDate(item.issued_on) }}
      </template>

      <template #item.due_on="{ item }">
        {{ formatDate(item.due_on) }}
      </template>

      <template #item.total="{ item }">
        {{ formatMoney(item.money.total) }}
      </template>

      <template #item.balance="{ item }">
        <span :class="item.money.balance.amount ? 'text-high-emphasis' : 'text-success'">
          {{ item.money.balance.amount ? formatMoney(item.money.balance) : 'Settled' }}
        </span>
      </template>

      <template #item.state="{ item }">
        <VChip
          :color="invoiceStateMeta[item.state].color"
          :prepend-icon="invoiceStateMeta[item.state].icon"
          size="small"
          label
        >
          {{ invoiceStateMeta[item.state].label }}
        </VChip>
      </template>

      <template #item.actions="{ item }">
        <div
          class="d-flex justify-end"
          @click.stop
        >
          <VBtn
            icon
            variant="text"
            size="small"
            :to="`/invoices/${item.id}/edit`"
            aria-label="Edit"
          >
            <VIcon icon="bx-edit" />
          </VBtn>
          <VBtn
            icon
            variant="text"
            size="small"
            aria-label="More"
          >
            <VIcon icon="bx-dots-vertical-rounded" />
            <VMenu activator="parent">
              <VList density="compact">
                <VListItem
                  prepend-icon="bx-copy"
                  title="Duplicate"
                  @click="duplicate(item)"
                />
                <VListItem
                  prepend-icon="bx-trash"
                  title="Delete"
                  :disabled="item.money.paid.amount > 0"
                  @click="deleting = item"
                />
              </VList>
            </VMenu>
          </VBtn>
        </div>
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

  <!-- Invoice completed appointments -->
  <VDialog
    v-model="isAppointmentsDialogOpen"
    max-width="640"
    scrollable
  >
    <VCard title="Invoice completed appointments">
      <VCardSubtitle class="pb-2">
        Completed appointments that aren't on an invoice yet. Pick one or more for the same client.
      </VCardSubtitle>
      <VDivider />
      <VCardText style="max-block-size: 60vh;">
        <PageLoader
          v-if="isLoadingUninvoiced"
          text="Loading appointments…"
          style="min-block-size: 200px;"
        />
        <p
          v-else-if="!uninvoiced.length"
          class="text-medium-emphasis text-center py-6 mb-0"
        >
          Nothing to invoice: every completed appointment is already on an invoice.
        </p>
        <VList
          v-else
          density="compact"
        >
          <VListItem
            v-for="appointment in uninvoiced"
            :key="appointment.id"
            :disabled="selectedClientId !== null && appointment.client_id !== selectedClientId"
            @click="toggleAppointment(appointment)"
          >
            <template #prepend>
              <VCheckboxBtn
                :model-value="selectedAppointmentIds.includes(appointment.id)"
                class="me-2"
              />
            </template>
            <VListItemTitle>{{ appointment.client.name }} — {{ appointment.service.name }}</VListItemTitle>
            <VListItemSubtitle>{{ formatDateTime(appointment.starts_at) }} · {{ appointment.staff.name }}</VListItemSubtitle>
            <template #append>
              <span class="text-body-2">{{ formatMoney(appointment.price) }}</span>
            </template>
          </VListItem>
        </VList>
      </VCardText>
      <VDivider />
      <VCardActions class="pa-4">
        <VSpacer />
        <VBtn
          variant="tonal"
          color="secondary"
          @click="isAppointmentsDialogOpen = false"
        >
          Cancel
        </VBtn>
        <VBtn
          variant="flat"
          :disabled="!selectedAppointmentIds.length"
          :loading="isCreatingFromAppointments"
          @click="createFromAppointments"
        >
          Create draft invoice
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>

  <!-- Delete confirmation -->
  <VDialog
    :model-value="!!deleting"
    max-width="400"
    @update:model-value="v => !v && (deleting = null)"
  >
    <VCard :title="`Delete invoice #${deleting?.number}?`">
      <VCardText>This can't be undone. Any appointments on it can be invoiced again.</VCardText>
      <VCardActions class="pa-4">
        <VSpacer />
        <VBtn
          variant="tonal"
          color="secondary"
          @click="deleting = null"
        >
          Cancel
        </VBtn>
        <VBtn
          color="error"
          variant="flat"
          @click="deleteInvoice"
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
