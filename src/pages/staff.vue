<script setup lang="ts">
import { watchDebounced } from '@vueuse/core'
import ListPaginationFooter from '@/components/ListPaginationFooter.vue'
import { rolesApis } from '@/core/apis/roles.apis'
import { staffApis } from '@/core/apis/staff.apis'
import type { Staff, StaffRole } from '@/core/apis/types/staff.types'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
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
const roleOptions = ref<{ title: string, value: StaffRole }[]>([
  { title: 'Owner', value: 'owner' },
  { title: 'Admin', value: 'admin' },
  { title: 'Staff', value: 'staff' },
])

const builtInRoleMeta: Record<string, { color: string, icon: string }> = {
  owner: { color: 'primary', icon: 'bx-crown' },
  admin: { color: 'warning', icon: 'bx-shield-quarter' },
  staff: { color: 'info', icon: 'bx-user' },
}

const roleMeta = (role: StaffRole) => builtInRoleMeta[role] ?? { color: 'secondary', icon: 'bx-shield' }

// Business can have custom roles beyond owner/admin/staff — pull the real
// list so the filter dropdown and labels stay accurate.
const fetchRoleOptions = async () => {
  const res = await rolesApis.handleListRoles()

  if (res.status.code === 200 && res.data) {
    roleOptions.value = res.data.map(r => ({
      title: r.name.charAt(0).toUpperCase() + r.name.slice(1),
      value: r.name,
    }))
  }
}

fetchRoleOptions()

const headers = [
  { title: 'User', key: 'name' },
  { title: 'Role', key: 'role' },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' as const },
]

const initials = (name: string) => name.split(' ').map(part => part[0]).slice(0, 2).join('').toUpperCase()

// Stats are drawn from a broad, unfiltered fetch (independent of the paginated,
// filtered table below) so they reflect overall headcount, not the current view.
const stats = ref({ total: 0, owner: 0, admin: 0, staff: 0 })

const fetchStats = async () => {
  const res = await staffApis.handleListStaff({ per_page: 100 })
  const all = res.data ?? []

  stats.value = {
    total: res.meta?.total ?? all.length,
    owner: all.filter(s => s.role === 'owner').length,
    admin: all.filter(s => s.role === 'admin').length,
    staff: all.filter(s => s.role === 'staff').length,
  }
}

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

fetchStats()
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
    await Promise.all([fetchStaff(), fetchStats()])
  }
  else {
    deleteErrorMessage.value = res.status.message
  }
}
</script>

<template>
  <VRow class="mb-6">
    <VCol
      cols="12"
      sm="6"
      md="3"
    >
      <VCard>
        <VCardText class="d-flex justify-space-between">
          <div class="d-flex flex-column gap-y-1">
            <div class="text-body-1 text-high-emphasis">
              Total Staff
            </div>
            <h4 class="text-h4">
              {{ stats.total }}
            </h4>
            <div class="text-sm">
              All staff members
            </div>
          </div>
          <VAvatar
            color="secondary"
            variant="tonal"
            rounded
            size="40"
          >
            <VIcon icon="bx-group" />
          </VAvatar>
        </VCardText>
      </VCard>
    </VCol>

    <VCol
      cols="12"
      sm="6"
      md="3"
    >
      <VCard>
        <VCardText class="d-flex justify-space-between">
          <div class="d-flex flex-column gap-y-1">
            <div class="text-body-1 text-high-emphasis">
              Owners
            </div>
            <h4 class="text-h4">
              {{ stats.owner }}
            </h4>
            <div class="text-sm">
              Full access
            </div>
          </div>
          <VAvatar
            color="primary"
            variant="tonal"
            rounded
            size="40"
          >
            <VIcon icon="bx-crown" />
          </VAvatar>
        </VCardText>
      </VCard>
    </VCol>

    <VCol
      cols="12"
      sm="6"
      md="3"
    >
      <VCard>
        <VCardText class="d-flex justify-space-between">
          <div class="d-flex flex-column gap-y-1">
            <div class="text-body-1 text-high-emphasis">
              Admins
            </div>
            <h4 class="text-h4">
              {{ stats.admin }}
            </h4>
            <div class="text-sm">
              Operational access
            </div>
          </div>
          <VAvatar
            color="warning"
            variant="tonal"
            rounded
            size="40"
          >
            <VIcon icon="bx-shield-quarter" />
          </VAvatar>
        </VCardText>
      </VCard>
    </VCol>

    <VCol
      cols="12"
      sm="6"
      md="3"
    >
      <VCard>
        <VCardText class="d-flex justify-space-between">
          <div class="d-flex flex-column gap-y-1">
            <div class="text-body-1 text-high-emphasis">
              Staff
            </div>
            <h4 class="text-h4">
              {{ stats.staff }}
            </h4>
            <div class="text-sm">
              Limited access
            </div>
          </div>
          <VAvatar
            color="info"
            variant="tonal"
            rounded
            size="40"
          >
            <VIcon icon="bx-user" />
          </VAvatar>
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
          @click="router.push('/staff/add')"
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
      class="text-no-wrap"
    >
      <template #item.name="{ item }">
        <div class="d-flex align-center gap-x-4">
          <VAvatar
            size="34"
            color="primary"
            variant="tonal"
          >
            <span class="text-sm">{{ initials(item.name) }}</span>
          </VAvatar>
          <div class="d-flex flex-column">
            <span class="font-weight-medium">{{ item.name }}</span>
            <span class="text-sm text-medium-emphasis">{{ item.email }}</span>
          </div>
        </div>
      </template>

      <template #item.role="{ item }">
        <div class="d-flex align-center gap-x-2">
          <VIcon
            :icon="roleMeta(item.role).icon"
            :color="roleMeta(item.role).color"
            size="20"
          />
          <span class="text-capitalize text-high-emphasis">{{ item.role }}</span>
        </div>
      </template>

      <template #item.actions="{ item }">
        <VBtn
          icon
          variant="text"
          size="small"
          @click="router.push(`/staff/${item.id}/edit`)"
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
