<script setup lang="ts">
import { rolesApis } from '@/core/apis/roles.apis'
import type { PermissionName } from '@/core/apis/types/roles.types'

const route = useRoute()
const router = useRouter()

const editingId = computed(() => (route.params.id ? Number(route.params.id) : null))
const isLoading = ref(false)
const isSaving = ref(false)
const errorMessage = ref('')
const formErrors = ref<Record<string, string[]>>({})
const isBuiltIn = ref(false)

const form = ref({
  name: '',
  permissions: [] as PermissionName[],
})

interface PermissionGroup {
  title: string
  permissions: { value: PermissionName, label: string }[]
}

const groups: PermissionGroup[] = [
  {
    title: 'Dashboard',
    permissions: [{ value: 'dashboard.view', label: 'View' }],
  },
  {
    title: 'Services',
    permissions: [
      { value: 'services.view', label: 'View' },
      { value: 'services.manage', label: 'Manage' },
    ],
  },
  {
    title: 'Clients',
    permissions: [
      { value: 'clients.view', label: 'View' },
      { value: 'clients.manage', label: 'Manage' },
    ],
  },
  {
    title: 'Appointments',
    permissions: [
      { value: 'appointments.view', label: 'View' },
      { value: 'appointments.manage', label: 'Manage' },
    ],
  },
  {
    title: 'Staff',
    permissions: [
      { value: 'staff.view', label: 'View' },
      { value: 'staff.manage', label: 'Manage' },
    ],
  },
  {
    title: 'Roles & Permissions',
    permissions: [{ value: 'roles.manage', label: 'Manage' }],
  },
  {
    title: 'Business Settings',
    permissions: [{ value: 'business.manage', label: 'Manage' }],
  },
]

const hasPermission = (name: PermissionName) => form.value.permissions.includes(name)

const togglePermission = (name: PermissionName, checked: boolean) => {
  if (checked) {
    if (!hasPermission(name))
      form.value.permissions.push(name)
  }
  else {
    form.value.permissions = form.value.permissions.filter(p => p !== name)
  }
}

const isGroupFullySelected = (group: PermissionGroup) => group.permissions.every(p => hasPermission(p.value))
const isGroupPartiallySelected = (group: PermissionGroup) => group.permissions.some(p => hasPermission(p.value)) && !isGroupFullySelected(group)

const toggleGroup = (group: PermissionGroup, checked: boolean) => {
  for (const p of group.permissions)
    togglePermission(p.value, checked)
}

const fetchRole = async () => {
  if (!editingId.value)
    return

  isLoading.value = true
  errorMessage.value = ''

  try {
    const res = await rolesApis.handleGetRole(editingId.value)

    if (res.status.code === 200 && res.data) {
      form.value = { name: res.data.name, permissions: [...res.data.permissions] }
      isBuiltIn.value = res.data.is_built_in
    }
    else {
      errorMessage.value = res.status.message
    }
  }
  catch {
    errorMessage.value = 'Could not load role.'
  }
  finally {
    isLoading.value = false
  }
}

fetchRole()

const saveRole = async () => {
  isSaving.value = true
  formErrors.value = {}
  errorMessage.value = ''

  try {
    const payload = isBuiltIn.value
      ? { permissions: form.value.permissions }
      : { name: form.value.name, permissions: form.value.permissions }

    const res = editingId.value
      ? await rolesApis.handleUpdateRole(editingId.value, payload)
      : await rolesApis.handleCreateRole(payload)

    if (res.status.code === 200 || res.status.code === 201)
      router.push('/roles')
    else if (res.status.code === 422)
      formErrors.value = res.errors ?? {}
    else
      errorMessage.value = res.status.message
  }
  finally {
    isSaving.value = false
  }
}
</script>

<template>
  <VCard
    :title="editingId ? 'Edit Role' : 'New Role'"
    :loading="isLoading"
  >
    <VCardText>
      <VAlert
        v-if="errorMessage"
        type="error"
        variant="tonal"
        class="mb-4"
      >
        {{ errorMessage }}
      </VAlert>

      <VForm @submit.prevent="saveRole">
        <VRow>
          <VCol cols="12">
            <VTextField
              v-model="form.name"
              label="Role Name"
              :disabled="isBuiltIn"
              :hint="isBuiltIn ? 'Built-in role names cannot be changed.' : undefined"
              persistent-hint
              :error-messages="formErrors.name"
            />
          </VCol>

          <VCol cols="12">
            <VTable class="border rounded">
              <thead>
                <tr>
                  <th>Permission</th>
                  <th class="text-center">
                    Access
                  </th>
                </tr>
              </thead>
              <tbody>
                <template
                  v-for="group in groups"
                  :key="group.title"
                >
                  <tr class="bg-var-theme-background">
                    <td class="font-weight-medium">
                      {{ group.title }}
                    </td>
                    <td class="text-center">
                      <VCheckboxBtn
                        :model-value="isGroupFullySelected(group)"
                        :indeterminate="isGroupPartiallySelected(group)"
                        @update:model-value="(v: boolean) => toggleGroup(group, v)"
                      />
                    </td>
                  </tr>
                  <tr
                    v-for="permission in group.permissions"
                    :key="permission.value"
                  >
                    <td class="ps-6">
                      {{ permission.label }}
                    </td>
                    <td class="text-center">
                      <VCheckboxBtn
                        :model-value="hasPermission(permission.value)"
                        @update:model-value="(v: boolean) => togglePermission(permission.value, v)"
                      />
                    </td>
                  </tr>
                </template>
              </tbody>
            </VTable>
          </VCol>

          <VCol
            cols="12"
            class="d-flex justify-end gap-3"
          >
            <VBtn
              type="button"
              variant="tonal"
              color="secondary"
              :to="'/roles'"
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
</template>
