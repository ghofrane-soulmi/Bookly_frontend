<script setup lang="ts">
import { watchDebounced } from '@vueuse/core'
import ListPaginationFooter from '@/components/ListPaginationFooter.vue'
import { servicesApis } from '@/core/apis/services.apis'
import type { Service } from '@/core/apis/types/services.types'
import { useAuthStore } from '@/stores/auth'
import { formatMoney } from '@/utils/money'

const router = useRouter()
const authStore = useAuthStore()

const services = ref<Service[]>([])
const isLoading = ref(false)
const errorMessage = ref('')

const page = ref(1)
const perPage = ref(10)
const total = ref(0)
const search = ref('')
const statusFilter = ref<'active' | 'inactive' | null>(null)
const categoryFilter = ref<string | null>(null)
const categories = ref<string[]>([])

const perPageOptions = [10, 25, 50, 100]

const statusOptions = [
  { title: 'Active', value: 'active' },
  { title: 'Inactive', value: 'inactive' },
]

const headers = [
  { title: 'Name', key: 'name' },
  { title: 'Category', key: 'category' },
  { title: 'Duration', key: 'duration_minutes' },
  { title: 'Price', key: 'price' },
  { title: 'Status', key: 'is_active' },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' as const },
]

const fetchServices = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const res = await servicesApis.handleListServices({
      page: page.value,
      per_page: perPage.value,
      search: search.value || undefined,
      status: statusFilter.value ?? undefined,
      category: categoryFilter.value ?? undefined,
    })

    if (res.status.code === 200) {
      services.value = res.data ?? []
      total.value = res.meta?.total ?? 0
      categories.value = res.meta?.categories ?? categories.value
    }
    else {
      errorMessage.value = res.status.message
    }
  }
  catch {
    errorMessage.value = 'Could not load services.'
  }
  finally {
    isLoading.value = false
  }
}

fetchServices()

watch([page, perPage, statusFilter, categoryFilter], fetchServices)
watchDebounced(search, () => {
  page.value = 1
  fetchServices()
}, { debounce: 400 })

const exportCsv = () => {
  const header = ['Name', 'Description', 'Category', 'Duration (min)', 'Price', 'Status']

  const rows = services.value.map(s => [
    s.name,
    s.description ?? '',
    s.category ?? '',
    String(s.duration_minutes),
    formatMoney(s.price),
    s.is_active ? 'Active' : 'Inactive',
  ])

  const csv = [header, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = 'services.csv'
  link.click()
  URL.revokeObjectURL(url)
}

const isDeleteDialogOpen = ref(false)
const deletingId = ref<number | null>(null)

const confirmDelete = (service: Service) => {
  deletingId.value = service.id
  isDeleteDialogOpen.value = true
}

const deleteService = async () => {
  if (!deletingId.value)
    return

  await servicesApis.handleDeleteService(deletingId.value)
  isDeleteDialogOpen.value = false
  await fetchServices()
}
</script>

<template>
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
            v-model="categoryFilter"
            label="Select Category"
            :items="categories"
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
          placeholder="Search services"
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
          v-if="authStore.can('services.manage')"
          prepend-icon="bx-plus"
          @click="router.push('/services/add')"
        >
          New Service
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
      :items="services"
      :loading="isLoading"
      :items-per-page="perPage"
      hide-default-footer
      no-data-text="No services yet. Create your first one."
    >
      <template #item.category="{ item }">
        {{ item.category || '—' }}
      </template>

      <template #item.duration_minutes="{ item }">
        {{ item.duration_minutes }} min
      </template>

      <template #item.price="{ item }">
        {{ formatMoney(item.price) }}
      </template>

      <template #item.is_active="{ item }">
        <VChip
          :color="item.is_active ? 'success' : 'secondary'"
          size="small"
        >
          {{ item.is_active ? 'Active' : 'Inactive' }}
        </VChip>
      </template>

      <template #item.actions="{ item }">
        <template v-if="authStore.can('services.manage')">
          <VBtn
            icon
            variant="text"
            size="small"
            @click="router.push(`/services/${item.id}/edit`)"
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
    <VCard title="Delete service?">
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
          @click="deleteService"
        >
          Delete
        </VBtn>
      </VCardText>
    </VCard>
  </VDialog>
</template>
