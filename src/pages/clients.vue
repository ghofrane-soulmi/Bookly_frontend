<script setup lang="ts">
import { watchDebounced } from '@vueuse/core'
import ListPaginationFooter from '@/components/ListPaginationFooter.vue'
import { clientsApis } from '@/core/apis/clients.apis'
import type { Client } from '@/core/apis/types/clients.types'

// Patron Créer/Modifier : A. Modale intégrée à la liste (≤ 6 champs)

const clients = ref<Client[]>([])
const isLoading = ref(false)
const errorMessage = ref('')

const page = ref(1)
const perPage = ref(10)
const total = ref(0)
const search = ref('')

const perPageOptions = [10, 25, 50, 100]

const headers = [
  { title: 'Name', key: 'name' },
  { title: 'Email', key: 'email' },
  { title: 'Phone', key: 'phone' },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' as const },
]

const fetchClients = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const res = await clientsApis.handleListClients({
      page: page.value,
      per_page: perPage.value,
      search: search.value || undefined,
    })

    if (res.status.code === 200) {
      clients.value = res.data ?? []
      total.value = res.meta?.total ?? 0
    }
    else {
      errorMessage.value = res.status.message
    }
  }
  catch {
    errorMessage.value = 'Could not load clients.'
  }
  finally {
    isLoading.value = false
  }
}

fetchClients()

watch([page, perPage], fetchClients)
watchDebounced(search, () => {
  page.value = 1
  fetchClients()
}, { debounce: 400 })

const exportCsv = () => {
  const header = ['Name', 'Email', 'Phone', 'Notes']
  const rows = clients.value.map(c => [c.name, c.email ?? '', c.phone ?? '', c.notes ?? ''])

  const csv = [header, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = 'clients.csv'
  link.click()
  URL.revokeObjectURL(url)
}

const isDialogOpen = ref(false)
const isSaving = ref(false)
const editingId = ref<number | null>(null)
const formErrors = ref<Record<string, string[]>>({})

const emptyForm = () => ({
  name: '',
  email: '',
  phone: '',
  notes: '',
})

const form = ref(emptyForm())

const openCreateDialog = () => {
  editingId.value = null
  form.value = emptyForm()
  formErrors.value = {}
  isDialogOpen.value = true
}

const openEditDialog = (client: Client) => {
  editingId.value = client.id
  form.value = {
    name: client.name,
    email: client.email ?? '',
    phone: client.phone ?? '',
    notes: client.notes ?? '',
  }
  formErrors.value = {}
  isDialogOpen.value = true
}

const saveClient = async () => {
  isSaving.value = true
  formErrors.value = {}

  try {
    const res = editingId.value
      ? await clientsApis.handleUpdateClient(editingId.value, form.value)
      : await clientsApis.handleCreateClient(form.value)

    if (res.status.code === 200 || res.status.code === 201) {
      isDialogOpen.value = false
      await fetchClients()
    }
    else if (res.status.code === 422) {
      formErrors.value = res.errors ?? {}
    }
  }
  finally {
    isSaving.value = false
  }
}

const isDeleteDialogOpen = ref(false)
const deletingId = ref<number | null>(null)

const confirmDelete = (client: Client) => {
  deletingId.value = client.id
  isDeleteDialogOpen.value = true
}

const deleteClient = async () => {
  if (!deletingId.value)
    return

  await clientsApis.handleDeleteClient(deletingId.value)
  isDeleteDialogOpen.value = false
  await fetchClients()
}
</script>

<template>
  <VCard title="Clients">
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
          placeholder="Search clients"
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
          @click="openCreateDialog"
        >
          New Client
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
      :items="clients"
      :loading="isLoading"
      :items-per-page="perPage"
      hide-default-footer
      no-data-text="No clients yet. Add your first one."
    >
      <template #item.email="{ item }">
        {{ item.email || '—' }}
      </template>

      <template #item.phone="{ item }">
        {{ item.phone || '—' }}
      </template>

      <template #item.actions="{ item }">
        <VBtn
          icon
          variant="text"
          size="small"
          :to="`/clients/${item.id}`"
        >
          <VIcon icon="bx-show" />
        </VBtn>
        <VBtn
          icon
          variant="text"
          size="small"
          @click="openEditDialog(item)"
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

  <!-- Create/Edit dialog -->
  <VDialog
    v-model="isDialogOpen"
    max-width="500"
  >
    <VCard :title="editingId ? 'Edit Client' : 'New Client'">
      <VCardText>
        <VForm @submit.prevent="saveClient">
          <VRow>
            <VCol cols="12">
              <VTextField
                v-model="form.name"
                label="Name"
                :error-messages="formErrors.name"
              />
            </VCol>
            <VCol cols="12">
              <VTextField
                v-model="form.email"
                type="email"
                label="Email"
                :error-messages="formErrors.email"
              />
            </VCol>
            <VCol cols="12">
              <VTextField
                v-model="form.phone"
                label="Phone"
                :error-messages="formErrors.phone"
              />
            </VCol>
            <VCol cols="12">
              <VTextarea
                v-model="form.notes"
                label="Notes"
                rows="3"
                :error-messages="formErrors.notes"
              />
            </VCol>
            <VCol
              cols="12"
              class="d-flex justify-end gap-3"
            >
              <VBtn
                type="button"
                variant="tonal"
                color="secondary"
                @click="isDialogOpen = false"
              >
                Cancel
              </VBtn>
              <VBtn
                type="submit"
                :loading="isSaving"
              >
                Save
              </VBtn>
            </VCol>
          </VRow>
        </VForm>
      </VCardText>
    </VCard>
  </VDialog>

  <!-- Delete confirmation -->
  <VDialog
    v-model="isDeleteDialogOpen"
    max-width="400"
  >
    <VCard title="Delete client?">
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
          @click="deleteClient"
        >
          Delete
        </VBtn>
      </VCardText>
    </VCard>
  </VDialog>
</template>
