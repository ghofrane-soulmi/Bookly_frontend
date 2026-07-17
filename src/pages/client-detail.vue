<script setup lang="ts">
import { clientsApis } from '@/core/apis/clients.apis'
import type { ClientDetail } from '@/core/apis/types/clients.types'
import { formatDateTime } from '@/utils/datetime'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const client = ref<ClientDetail | null>(null)
const isLoading = ref(true)
const errorMessage = ref('')

const statusColors: Record<string, string> = {
  scheduled: 'info',
  completed: 'success',
  cancelled: 'secondary',
  no_show: 'error',
}

const headers = [
  { title: 'Service', key: 'service.name' },
  { title: 'Staff', key: 'staff.name' },
  { title: 'Amount', key: 'service.price' },
  { title: 'Date', key: 'starts_at' },
  { title: 'Status', key: 'status' },
]

const formatCurrency = (value: number) => value.toLocaleString('en-US', { style: 'currency', currency: authStore.business?.currency ?? 'USD' })

const fetchClient = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const res = await clientsApis.handleGetClient(Number(route.params.id))

    if (res.status.code === 200 && res.data)
      client.value = res.data
    else
      errorMessage.value = res.status.message
  }
  catch {
    errorMessage.value = 'Could not load client.'
  }
  finally {
    isLoading.value = false
  }
}

fetchClient()

const initials = (name: string) => name.split(' ').map(part => part[0]).slice(0, 2).join('').toUpperCase()
</script>

<template>
  <VBtn
    variant="text"
    prepend-icon="bx-arrow-back"
    class="mb-4"
    @click="router.push('/clients')"
  >
    Back to Clients
  </VBtn>

  <VAlert
    v-if="errorMessage"
    type="error"
    variant="tonal"
    class="mb-4"
  >
    {{ errorMessage }}
  </VAlert>

  <VProgressCircular
    v-if="isLoading"
    indeterminate
    color="primary"
  />

  <VRow v-else-if="client">
    <VCol
      cols="12"
      md="4"
    >
      <VCard>
        <VCardText class="text-center">
          <VAvatar
            size="88"
            color="primary"
            variant="tonal"
            class="mb-4"
          >
            <span class="text-h5">{{ initials(client.name) }}</span>
          </VAvatar>
          <h5 class="text-h5 mb-1">
            {{ client.name }}
          </h5>
          <p class="text-medium-emphasis mb-0">
            {{ client.email || 'No email' }}
          </p>
          <p class="text-medium-emphasis">
            {{ client.phone || 'No phone' }}
          </p>

          <VDivider class="my-4" />

          <p
            v-if="client.notes"
            class="text-body-2 text-start"
          >
            {{ client.notes }}
          </p>
          <p
            v-else
            class="text-medium-emphasis"
          >
            No notes.
          </p>
        </VCardText>
      </VCard>
    </VCol>

    <VCol
      cols="12"
      md="8"
    >
      <VRow class="mb-6">
        <VCol cols="4">
          <VCard>
            <VCardText>
              <h5 class="text-h5">
                {{ client.stats.total_appointments }}
              </h5>
              <p class="text-body-2 mb-0">
                Total Appointments
              </p>
            </VCardText>
          </VCard>
        </VCol>
        <VCol cols="4">
          <VCard>
            <VCardText>
              <h5 class="text-h5">
                {{ client.stats.completed_appointments }}
              </h5>
              <p class="text-body-2 mb-0">
                Completed
              </p>
            </VCardText>
          </VCard>
        </VCol>
        <VCol cols="4">
          <VCard>
            <VCardText>
              <h5 class="text-h5">
                {{ formatCurrency(client.stats.total_spent) }}
              </h5>
              <p class="text-body-2 mb-0">
                Total Spent
              </p>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <VCard title="Appointment History">
        <VDataTable
          :headers="headers"
          :items="client.appointments"
          no-data-text="No appointments yet."
        >
          <template #item.service.price="{ item }">
            {{ formatCurrency(Number(item.service.price)) }}
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
        </VDataTable>
      </VCard>
    </VCol>
  </VRow>
</template>
