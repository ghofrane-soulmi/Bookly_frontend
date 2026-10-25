<script setup lang="ts">
import { permissionsApis } from '@/core/apis/permissions.apis'
import { rolesApis } from '@/core/apis/roles.apis'
import { staffApis } from '@/core/apis/staff.apis'
import type { Role } from '@/core/apis/types/roles.types'
import type { Staff } from '@/core/apis/types/staff.types'

const router = useRouter()

const roles = ref<Role[]>([])
const staff = ref<Staff[]>([])
const permissionsCount = ref(0)
const isLoading = ref(false)
const errorMessage = ref('')

const builtInMeta: Record<string, { color: string, icon: string }> = {
  owner: { color: 'primary', icon: 'bx-crown' },
  admin: { color: 'warning', icon: 'bx-shield-quarter' },
  staff: { color: 'info', icon: 'bx-user' },
}

const customColors = ['success', 'error', 'secondary', 'primary', 'warning', 'info']

const roleMeta = (role: Pick<Role, 'id' | 'name'>) => {
  if (builtInMeta[role.name])
    return builtInMeta[role.name]

  return { color: customColors[role.id % customColors.length], icon: 'bx-shield' }
}

const initials = (name: string) => name.split(' ').map(part => part[0]).slice(0, 2).join('').toUpperCase()

const fetchAll = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const [rolesRes, staffRes, permissionsRes] = await Promise.all([
      rolesApis.handleListRoles(),
      staffApis.handleListStaff({ per_page: 100 }),
      permissionsApis.handleListPermissions(),
    ])

    if (rolesRes.status.code === 200)
      roles.value = rolesRes.data ?? []
    else
      errorMessage.value = rolesRes.status.message

    staff.value = staffRes.data ?? []
    permissionsCount.value = permissionsRes.data?.length ?? 0
  }
  catch {
    errorMessage.value = 'Could not load roles.'
  }
  finally {
    isLoading.value = false
  }
}

fetchAll()

const duplicatingId = ref<number | null>(null)

const duplicateRole = async (role: Role) => {
  duplicatingId.value = role.id

  try {
    const res = await rolesApis.handleCreateRole({
      name: `${role.name} copy`,
      permissions: role.permissions,
    })

    if (res.status.code === 201)
      await fetchAll()
    else
      errorMessage.value = res.status.message
  }
  finally {
    duplicatingId.value = null
  }
}

const isDeleteDialogOpen = ref(false)
const deletingRole = ref<Role | null>(null)
const deleteErrorMessage = ref('')

const confirmDelete = (role: Role) => {
  deletingRole.value = role
  deleteErrorMessage.value = ''
  isDeleteDialogOpen.value = true
}

const deleteRole = async () => {
  if (!deletingRole.value)
    return

  const res = await rolesApis.handleDeleteRole(deletingRole.value.id)

  if (res.status.code === 200) {
    isDeleteDialogOpen.value = false
    await fetchAll()
  }
  else {
    deleteErrorMessage.value = res.status.message
  }
}

const headers = [
  { title: 'User', key: 'name' },
  { title: 'Role', key: 'role' },
]
</script>

<template>
  <h4 class="text-h4 mb-1">
    Roles & Permissions
  </h4>
  <p class="text-body-1 mb-6">
    Manage who can do what across your business. {{ permissionsCount }} permissions available.
  </p>

  <VAlert
    v-if="errorMessage"
    type="error"
    variant="tonal"
    class="mb-6"
  >
    {{ errorMessage }}
  </VAlert>

  <VRow class="mb-6">
    <VCol
      v-for="role in roles"
      :key="role.id"
      cols="12"
      sm="6"
      lg="4"
    >
      <VCard>
        <VCardText class="d-flex justify-space-between align-start">
          <div class="d-flex flex-column gap-y-2">
            <div class="d-flex align-center gap-x-2">
              <span class="text-h6 text-capitalize">{{ role.name }}</span>
              <VChip
                v-if="role.is_built_in"
                size="x-small"
                variant="tonal"
                color="secondary"
              >
                Built-in
              </VChip>
            </div>
            <span class="text-body-2 text-medium-emphasis">
              {{ role.users_count }} user{{ role.users_count === 1 ? '' : 's' }}
            </span>
          </div>

          <VAvatar
            :color="roleMeta(role).color"
            variant="tonal"
            rounded
            size="40"
          >
            <VIcon :icon="roleMeta(role).icon" />
          </VAvatar>
        </VCardText>

        <VCardText class="d-flex align-center justify-space-between">
          <div class="d-flex">
            <VAvatar
              v-for="u in role.users.slice(0, 4)"
              :key="u.id"
              size="32"
              color="primary"
              variant="tonal"
              class="border"
              style="margin-inline-end: -0.5rem;"
            >
              <span class="text-xs">{{ initials(u.name) }}</span>
            </VAvatar>
            <VAvatar
              v-if="role.users_count > 4"
              size="32"
              color="secondary"
              variant="tonal"
            >
              <span class="text-xs">+{{ role.users_count - 4 }}</span>
            </VAvatar>
          </div>

          <div class="d-flex gap-x-1">
            <VBtn
              icon
              variant="text"
              size="small"
              :loading="duplicatingId === role.id"
              title="Duplicate role"
              @click="duplicateRole(role)"
            >
              <VIcon icon="bx-copy" />
            </VBtn>
            <VBtn
              v-if="!role.is_built_in"
              icon
              variant="text"
              size="small"
              title="Delete role"
              @click="confirmDelete(role)"
            >
              <VIcon icon="bx-trash" />
            </VBtn>
          </div>
        </VCardText>

        <VDivider />

        <VCardText>
          <VBtn
            variant="text"
            block
            @click="router.push(`/roles/${role.id}/edit`)"
          >
            Edit Role
          </VBtn>
        </VCardText>
      </VCard>
    </VCol>

    <VCol
      cols="12"
      sm="6"
      lg="4"
    >
      <VCard
        class="d-flex align-center justify-center cursor-pointer"
        height="100%"
        min-height="220"
        @click="router.push('/roles/add')"
      >
        <VCardText class="d-flex flex-column align-center gap-y-3">
          <div class="d-flex">
            <VAvatar
              size="40"
              color="secondary"
              variant="tonal"
            >
              <VIcon icon="bx-plus" />
            </VAvatar>
          </div>
          <span class="text-body-1 font-weight-medium">Add New Role</span>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>

  <VCard title="Total users with their roles">
    <VDataTable
      :headers="headers"
      :items="staff"
      :loading="isLoading"
      no-data-text="No staff yet."
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
            :icon="roleMeta({ id: item.id, name: item.role }).icon"
            :color="roleMeta({ id: item.id, name: item.role }).color"
            size="20"
          />
          <span class="text-capitalize text-high-emphasis">{{ item.role }}</span>
        </div>
      </template>
    </VDataTable>
  </VCard>

  <!-- Delete confirmation -->
  <VDialog
    v-model="isDeleteDialogOpen"
    max-width="400"
  >
    <VCard title="Delete role?">
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
          @click="deleteRole"
        >
          Delete
        </VBtn>
      </VCardText>
    </VCard>
  </VDialog>
</template>
