<script setup lang="ts">
import { watchDebounced } from '@vueuse/core'
import ListPaginationFooter from '@/components/ListPaginationFooter.vue'
import { staffApis } from '@/core/apis/staff.apis'
import type { Staff, StaffRole } from '@/core/apis/types/staff.types'
import { useAuthStore } from '@/stores/auth'

// Patron Créer/Modifier : A. Modale intégrée à la liste (≤ 6 champs)

const authStore = useAuthStore()

const staff = ref<Staff[]>([])
const isLoading = ref(false)
const errorMessage = ref('')

const page = ref(1)
const perPage = ref(10)
const total = ref(0)
const search = ref('')
const roleFilter = ref<StaffRole | null>(null)

const perPageOptions = [10, 25, 50, 100]
const roleOptions: { title: string, value: StaffRole }[] = [
  { title: 'Owner', value: 'owner' },
  { title: 'Admin', value: 'admin' },
  { title: 'Staff', value: 'staff' },
]

const roleColors: Record<StaffRole, string> = {
  owner: 'primary',
  admin: 'warning',
  staff: 'info',
}

const headers = [
  { title: 'Name', key: 'name' },
  { title: 'Email', key: 'email' },
  { title: 'Role', key: 'role' },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' as const },
]

const initials = (name: string) => name.split(' ').map(part => part[0]).slice(0, 2).join('').toUpperCase()

const fetchStaff = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const res = await staffApis.handleListStaff({
      page: page.value,
      per_page: perPage.value,
      search: search.value || undefined,
      role: roleFilter.value ?? undefined,
    })

    if (res.status.code === 200) {
      staff.value = res.data ?? []
      total.value = res.meta?.total ?? 0
    }
    else {
      errorMessage.value = res.status.message
    }
  }
  catch {
    errorMessage.value = 'Could not load staff.'
  }
  finally {
    isLoading.value = false
  }
}

fetchStaff()

watch([page, perPage, roleFilter], fetchStaff)
watchDebounced(search, () => {
  page.value = 1
  fetchStaff()
}, { debounce: 400 })

const exportCsv = () => {
  const header = ['Name', 'Email', 'Role']
  const rows = staff.value.map(s => [s.name, s.email, s.role])

  const csv = [header, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = 'staff.csv'
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
  password: '',
  role: 'staff' as StaffRole,
})

const form = ref(emptyForm())

const openCreateDialog = () => {
  editingId.value = null
  form.value = emptyForm()
  formErrors.value = {}
  isDialogOpen.value = true
}

const openEditDialog = (member: Staff) => {
  editingId.value = member.id
  form.value = {
    name: member.name,
    email: member.email,
    password: '',
    role: member.role,
  }
  formErrors.value = {}
  isDialogOpen.value = true
}

const saveStaff = async () => {
  isSaving.value = true
  formErrors.value = {}

  try {
    const payload = { ...form.value }

    if (editingId.value && !payload.password)
      delete (payload as Partial<typeof payload>).password

    const res = editingId.value
      ? await staffApis.handleUpdateStaff(editingId.value, payload)
      : await staffApis.handleCreateStaff(payload)

    if (res.status.code === 200 || res.status.code === 201) {
      isDialogOpen.value = false
      await fetchStaff()
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
const deleteErrorMessage = ref('')

const confirmDelete = (member: Staff) => {
  deletingId.value = member.id
  deleteErrorMessage.value = ''
  isDeleteDialogOpen.value = true
}

const deleteStaff = async () => {
  if (!deletingId.value)
    return

  const res = await staffApis.handleDeleteStaff(deletingId.value)

  if (res.status.code === 200) {
    isDeleteDialogOpen.value = false
    await fetchStaff()
  }
  else {
    deleteErrorMessage.value = res.status.message
  }
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
            v-model="roleFilter"
            label="Select Role"
            :items="roleOptions"
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
          placeholder="Search staff"
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
          New Staff Member
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
      :items="staff"
      :loading="isLoading"
      :items-per-page="perPage"
      hide-default-footer
      no-data-text="No staff yet. Add your first one."
    >
      <template #item.name="{ item }">
        <div class="d-flex align-center gap-x-3">
          <VAvatar
            size="32"
            color="primary"
            variant="tonal"
          >
            <span class="text-sm">{{ initials(item.name) }}</span>
          </VAvatar>
          {{ item.name }}
        </div>
      </template>

      <template #item.role="{ item }">
        <VChip
          :color="roleColors[item.role]"
          size="small"
          class="text-capitalize"
        >
          {{ item.role }}
        </VChip>
      </template>

      <template #item.actions="{ item }">
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
          :disabled="item.id === authStore.user?.id"
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
    <VCard :title="editingId ? 'Edit Staff Member' : 'New Staff Member'">
      <VCardText>
        <VForm @submit.prevent="saveStaff">
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
                v-model="form.password"
                type="password"
                :label="editingId ? 'New Password (leave blank to keep current)' : 'Password'"
                :error-messages="formErrors.password"
              />
            </VCol>
            <VCol cols="12">
              <VSelect
                v-model="form.role"
                label="Role"
                :items="roleOptions"
                :error-messages="formErrors.role"
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
    <VCard title="Delete staff member?">
      <VCardText>
        <VAlert
          v-if="deleteErrorMessage"
          type="error"
          variant="tonal"
          class="mb-4"
        >
          {{ deleteErrorMessage }}
        </VAlert>
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
          @click="deleteStaff"
        >
          Delete
        </VBtn>
      </VCardText>
    </VCard>
  </VDialog>
</template>
