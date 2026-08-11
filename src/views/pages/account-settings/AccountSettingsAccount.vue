<script lang="ts" setup>
import { staffApis } from '@/core/apis/staff.apis'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const form = ref({
  name: authStore.user?.name ?? '',
  email: authStore.user?.email ?? '',
  password: '',
})

const isSaving = ref(false)
const formErrors = ref<Record<string, string[]>>({})
const successMessage = ref('')

const saveAccount = async () => {
  if (!authStore.user)
    return

  isSaving.value = true
  formErrors.value = {}
  successMessage.value = ''

  try {
    const payload: Record<string, string> = { name: form.value.name, email: form.value.email }

    if (form.value.password)
      payload.password = form.value.password

    const res = await staffApis.handleUpdateStaff(authStore.user.id, payload)

    if (res.status.code === 200) {
      authStore.updateUser({ name: form.value.name, email: form.value.email })
      form.value.password = ''
      successMessage.value = 'Account updated successfully.'
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
