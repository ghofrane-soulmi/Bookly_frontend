<script setup lang="ts">
import { permissionsApis } from '@/core/apis/permissions.apis'
import type { Permission } from '@/core/apis/types/roles.types'

const permissions = ref<Permission[]>([])
const isLoading = ref(false)
const errorMessage = ref('')

const roleColor: Record<string, string> = {
  owner: 'primary',
  admin: 'warning',
  staff: 'info',
}

const colorFor = (role: string) => roleColor[role] ?? 'secondary'

const fetchPermissions = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const res = await permissionsApis.handleListPermissions()

    if (res.status.code === 200)
      permissions.value = res.data ?? []
    else
      errorMessage.value = res.status.message
  }
  catch {
    errorMessage.value = 'Could not load permissions.'
  }
  finally {
    isLoading.value = false
  }
}

fetchPermissions()

const headers = [
  { title: 'Name', key: 'name' },
  { title: 'Assigned To', key: 'roles', sortable: false },
]
</script>

<template>
  <VCard title="Permissions">
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
      :items="permissions"
      :loading="isLoading"
      no-data-text="No permissions found."
      class="text-no-wrap"
    >
      <template #item.name="{ item }">
        <span class="font-weight-medium">{{ item.name }}</span>
      </template>

      <template #item.roles="{ item }">
        <div class="d-flex flex-wrap gap-2">
          <VChip
            v-for="role in item.roles"
            :key="role"
            size="small"
            variant="tonal"
            :color="colorFor(role)"
            class="text-capitalize"
          >
            {{ role }}
          </VChip>
          <span
            v-if="!item.roles.length"
            class="text-medium-emphasis"
          >
            No roles
          </span>
        </div>
      </template>
    </VDataTable>
  </VCard>
</template>
