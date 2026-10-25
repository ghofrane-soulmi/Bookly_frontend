<script setup lang="ts">
import { watchDebounced } from '@vueuse/core'
import ListPaginationFooter from '@/components/ListPaginationFooter.vue'
import { appointmentsApis } from '@/core/apis/appointments.apis'
import type { Appointment, AppointmentStatus, AppointmentStatusCounts } from '@/core/apis/types/appointments.types'
import { api } from '@/utils/api'
import { formatDateTime } from '@/utils/datetime'
import { formatMoney } from '@/utils/money'

const router = useRouter()

interface Option {
  id: number
  name: string
}

const appointments = ref<Appointment[]>([])
const clients = ref<Option[]>([])
const services = ref<Option[]>([])
const staff = ref<Option[]>([])
const isLoading = ref(false)
const errorMessage = ref('')

const page = ref(1)
const perPage = ref(10)
const total = ref(0)
const statusCounts = ref<AppointmentStatusCounts>({ total: 0, scheduled: 0, completed: 0, cancelled: 0 })
const search = ref('')
const statusFilter = ref<AppointmentStatus | null>(null)
const serviceFilter = ref<number | null>(null)
const staffFilter = ref<number | null>(null)

const perPageOptions = [10, 25, 50, 100]
const statusOptions: { title: string, value: AppointmentStatus }[] = [
  { title: 'Scheduled', value: 'scheduled' },
  { title: 'Completed', value: 'completed' },
  { title: 'Cancelled', value: 'cancelled' },
  { title: 'No Show', value: 'no_show' },
]

const statusColors: Record<Appointment['status'], string> = {
  scheduled: 'info',
  completed: 'success',
  cancelled: 'secondary',
  no_show: 'error',
}

const headers = [
  { title: 'Client', key: 'client.name' },
  { title: 'Service', key: 'service.name' },
  { title: 'Staff', key: 'staff.name' },
  { title: 'Amount', key: 'price' },
  { title: 'Starts', key: 'starts_at' },
  { title: 'Status', key: 'status' },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' as const },
]

const initials = (name: string) => name.split(' ').map(part => part[0]).slice(0, 2).join('').toUpperCase()

const fetchLookups = async () => {
  const [clientsRes, servicesRes, staffRes] = await Promise.all([
    api.get('/clients/list'),
    api.get('/services/list'),
    api.get('/staff/list'),
  ])

  clients.value = clientsRes.data.data
  services.value = servicesRes.data.data
  staff.value = staffRes.data.data
}

const fetchAppointments = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const res = await appointmentsApis.handleListAppointments({
      page: page.value,
      per_page: perPage.value,
      search: search.value || undefined,
      status: statusFilter.value ?? undefined,
      service_id: serviceFilter.value ?? undefined,
      user_id: staffFilter.value ?? undefined,
    })

    if (res.status.code === 200) {
      appointments.value = res.data ?? []
      total.value = res.meta?.total ?? 0
      statusCounts.value = res.meta?.status_counts ?? statusCounts.value
    }
    else {
      errorMessage.value = res.status.message
    }
  }
  catch {
    errorMessage.value = 'Could not load appointments.'
  }
  finally {
    isLoading.value = false
  }
}

fetchLookups()
fetchAppointments()

watch([page, perPage, statusFilter, serviceFilter, staffFilter], fetchAppointments)
watchDebounced(search, () => {
  page.value = 1
  fetchAppointments()
}, { debounce: 400 })

const exportCsv = () => {
  const header = ['Client', 'Service', 'Staff', 'Amount', 'Starts', 'Status']
  const rows = appointments.value.map(a => [
    a.client.name,
    a.service.name,
    a.staff.name,
    formatMoney(a.price),
    formatDateTime(a.starts_at),
    a.status,
  ])

  const csv = [header, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = 'appointments.csv'
  link.click()
  URL.revokeObjectURL(url)
}

const isDeleteDialogOpen = ref(false)
const deletingId = ref<number | null>(null)

const confirmDelete = (appointment: Appointment) => {
  deletingId.value = appointment.id
  isDeleteDialogOpen.value = true
}

const deleteAppointment = async () => {
  if (!deletingId.value)
    return

  await appointmentsApis.handleDeleteAppointment(deletingId.value)
  isDeleteDialogOpen.value = false
  await fetchAppointments()
}
</script>

<template>
  <VRow class="mb-6">
    <VCol
      cols="6"
      sm="3"
    >
      <VCard>
        <VCardText>
          <h5 class="text-h5">
            {{ statusCounts.total }}
          </h5>
          <p class="text-body-2 mb-0">
            Total
          </p>
        </VCardText>
      </VCard>
    </VCol>
    <VCol
      cols="6"
      sm="3"
    >
      <VCard>
        <VCardText>
          <h5 class="text-h5">
            {{ statusCounts.scheduled }}
          </h5>
          <p class="text-body-2 mb-0">
            Scheduled
          </p>
        </VCardText>
      </VCard>
    </VCol>
    <VCol
      cols="6"
      sm="3"
    >
      <VCard>
        <VCardText>
          <h5 class="text-h5">
            {{ statusCounts.completed }}
          </h5>
          <p class="text-body-2 mb-0">
            Completed
          </p>
        </VCardText>
      </VCard>
    </VCol>
    <VCol
      cols="6"
      sm="3"
    >
      <VCard>
        <VCardText>
          <h5 class="text-h5">
            {{ statusCounts.cancelled }}
          </h5>
          <p class="text-body-2 mb-0">
            Cancelled
          </p>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>

  <VCard
    title="Filters"
    class="mb-6"
  >
    <VCardText>
      <VRow>
        <VCol
          cols="12"
          sm="4"
        >
          <VSelect
            v-model="statusFilter"
            label="Select Status"
            :items="statusOptions"
            clearable
          />
        </VCol>
        <VCol
          cols="12"
          sm="4"
        >
          <VSelect
            v-model="serviceFilter"
            label="Select Service"
            :items="services"
            item-title="name"
            item-value="id"
            clearable
          />
        </VCol>
        <VCol
          cols="12"
          sm="4"
        >
          <VSelect
            v-model="staffFilter"
            label="Select Staff"
            :items="staff"
            item-title="name"
            item-value="id"
            clearable
          />
        </VCol>
      </VRow>
    </VCardText>

    <VDivider />

    <VCardText class="d-flex flex-wrap gap-4">
      <div class="me-3 d-flex gap-3">
        <VSelect
          v-model="perPage"
          :items="perPageOptions"
          style="inline-size: 6.25rem;"
        />
      </div>

      <VSpacer />

      <div class="d-flex align-center flex-wrap gap-4">
        <VTextField
          v-model="search"
          placeholder="Search by client"
          style="inline-size: 15.625rem;"
        />

        <VBtn
          variant="tonal"
          color="secondary"
          prepend-icon="bx-export"
          @click="exportCsv"
        >
          Export
        </VBtn>

        <VBtn
          prepend-icon="bx-plus"
          @click="router.push('/appointments/add')"
        >
          New Appointment
        </VBtn>
      </div>
    </VCardText>

    <VDivider />

    <VAlert
      v-if="errorMessage"
      type="error"
      variant="tonal"
      class="ma-4"
    >
      {{ errorMessage }}
    </VAlert>

    <VDataTable
      :headers="headers"
      :items="appointments"
      :loading="isLoading"
      :items-per-page="perPage"
      hide-default-footer
      no-data-text="No appointments yet. Book your first one."
    >
      <template #item.client.name="{ item }">
        <div class="d-flex align-center gap-x-3">
          <VAvatar
            size="32"
            color="primary"
            variant="tonal"
          >
            <span class="text-sm">{{ initials(item.client.name) }}</span>
          </VAvatar>
          {{ item.client.name }}
        </div>
      </template>

      <template #item.price="{ item }">
        {{ formatMoney(item.price) }}
      </template>

      <template #item.starts_at="{ item }">
        {{ formatDateTime(item.starts_at) }}
      </template>

      <template #item.status="{ item }">
        <VChip
          :color="statusColors[item.status]"
          size="small"
          class="text-capitalize"
        >
          {{ item.status.replace('_', ' ') }}
        </VChip>
      </template>

      <template #item.actions="{ item }">
        <VBtn
          icon
          variant="text"
          size="small"
          @click="router.push(`/appointments/${item.id}/edit`)"
        >
          <VIcon icon="bx-edit" />
        </VBtn>
        <VBtn
          icon
          variant="text"
          size="small"
          @click="confirmDelete(item)"
        >
          <VIcon icon="bx-trash" />
        </VBtn>
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
    <VCard title="Delete appointment?">
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
          @click="deleteAppointment"
        >
          Delete
        </VBtn>
      </VCardText>
    </VCard>
  </VDialog>
</template>
