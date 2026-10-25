<script setup lang="ts">
import { rolesApis } from '@/core/apis/roles.apis'
import { staffApis } from '@/core/apis/staff.apis'
import type { StaffRole } from '@/core/apis/types/staff.types'

const route = useRoute()
const router = useRouter()

const editingId = computed(() => (route.params.id ? Number(route.params.id) : null))
const isLoading = ref(false)
const isSaving = ref(false)
const errorMessage = ref('')
const formErrors = ref<Record<string, string[]>>({})

// Businesses can define custom roles beyond owner/admin/staff (see Roles &
// Permissions), so this list is fetched rather than hardcoded. The owner
// role is excluded — staff can't be assigned it (there's always exactly one
// owner, created at registration).
const roleOptions = ref<{ title: string, value: StaffRole }[]>([])

const fetchRoleOptions = async () => {
  const res = await rolesApis.handleListRoles()

  if (res.status.code === 200 && res.data) {
    roleOptions.value = res.data
      .filter(r => r.name !== 'owner')
      .map(r => ({ title: r.name.charAt(0).toUpperCase() + r.name.slice(1), value: r.name }))
  }
}

fetchRoleOptions()

const form = ref({
  name: '',
  email: '',
  password: '',
  role: 'staff' as StaffRole,
})

const fetchStaff = async () => {
  if (!editingId.value)
    return

  isLoading.value = true
  errorMessage.value = ''

  try {
    const res = await staffApis.handleGetStaff(editingId.value)

    if (res.status.code === 200 && res.data) {
      form.value = {
        name: res.data.name,
        email: res.data.email,
        password: '',
        role: res.data.role,
      }
    }
    else {
      errorMessage.value = res.status.message
    }
  }
  catch {
    errorMessage.value = 'Could not load staff member.'
  }
  finally {
    isLoading.value = false
  }
}

fetchStaff()

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
      router.push('/staff')
    }
    else if (res.status.code === 422) {
      formErrors.value = res.errors ?? {}
    }
  }
  finally {
    isSaving.value = false
  }
}
</script>

<template>
  <VCard
    :title="editingId ? 'Edit Staff Member' : 'New Staff Member'"
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
              :to="'/staff'"
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
