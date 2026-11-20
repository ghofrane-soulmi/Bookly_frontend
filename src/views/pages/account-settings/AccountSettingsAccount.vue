<script lang="ts" setup>
import { useAuthStore } from '@/stores/auth'
import { api } from '@/utils/api'

const authStore = useAuthStore()

const form = ref({
  name: authStore.user?.name ?? '',
  email: authStore.user?.email ?? '',
  password: '',
  current_password: '',
})

const isSaving = ref(false)
const formErrors = ref<Record<string, string[]>>({})
const successMessage = ref('')
const errorMessage = ref('')

const saveAccount = async () => {
  if (!authStore.user)
    return

  isSaving.value = true
  formErrors.value = {}
  successMessage.value = ''
  errorMessage.value = ''

  try {
    const payload: Record<string, string> = { name: form.value.name, email: form.value.email }

    if (form.value.password) {
      payload.password = form.value.password
      payload.current_password = form.value.current_password
    }

    // Self-service endpoint: works for every role, unlike /staff/update
    // which needs the staff.manage permission.
    const { data: res } = await api.put('/auth/profile', payload)

    if (res.status.code === 200) {
      authStore.updateUser({ name: form.value.name, email: form.value.email })
      form.value.password = ''
      form.value.current_password = ''
      successMessage.value = 'Account updated successfully.'
    }
    else if (res.status.code === 422) {
      formErrors.value = res.errors ?? {}
    }
  }
  catch (error: any) {
    // e.g. 403 for the shared demo account, whose login can't be changed.
    errorMessage.value = error.response?.data?.status?.message ?? 'Could not save your changes. Please try again.'
  }
  finally {
    isSaving.value = false
  }
}
</script>

<template>
  <VRow>
    <VCol cols="12">
      <VCard title="Account Details">
        <VCardText>
          <VAlert
            v-if="successMessage"
            type="success"
            variant="tonal"
            class="mb-4"
            closable
            @click:close="successMessage = ''"
          >
            {{ successMessage }}
          </VAlert>

          <VAlert
            v-if="errorMessage"
            type="error"
            variant="tonal"
            class="mb-4"
            closable
            @click:close="errorMessage = ''"
          >
            {{ errorMessage }}
          </VAlert>

          <VForm @submit.prevent="saveAccount">
            <VRow>
              <VCol
                cols="12"
                md="6"
              >
                <VTextField
                  v-model="form.name"
                  label="Name"
                  :error-messages="formErrors.name"
                />
              </VCol>

              <VCol
                cols="12"
                md="6"
              >
                <VTextField
                  v-model="form.email"
                  label="E-mail"
                  type="email"
                  :error-messages="formErrors.email"
                />
              </VCol>

              <VCol
                cols="12"
                md="6"
              >
                <VTextField
                  v-model="form.password"
                  label="New Password (leave blank to keep current)"
                  type="password"
                  :error-messages="formErrors.password"
                />
              </VCol>

              <VCol
                v-if="form.password"
                cols="12"
                md="6"
              >
                <VTextField
                  v-model="form.current_password"
                  label="Current Password"
                  type="password"
                  :error-messages="formErrors.current_password"
                />
              </VCol>

              <VCol
                cols="12"
                class="d-flex flex-wrap gap-4"
              >
                <VBtn
                  type="submit"
                  :loading="isSaving"
                >
                  Save changes
                </VBtn>
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>
