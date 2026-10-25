<script setup lang="ts">
import { clientsApis } from '@/core/apis/clients.apis'

const route = useRoute()
const router = useRouter()

const editingId = computed(() => (route.params.id ? Number(route.params.id) : null))
const isLoading = ref(false)
const isSaving = ref(false)
const errorMessage = ref('')
const formErrors = ref<Record<string, string[]>>({})

const form = ref({
  name: '',
  email: '',
  phone: '',
  notes: '',
})

const fetchClient = async () => {
  if (!editingId.value)
    return

  isLoading.value = true
  errorMessage.value = ''

  try {
    const res = await clientsApis.handleGetClient(editingId.value)

    if (res.status.code === 200 && res.data) {
      form.value = {
        name: res.data.name,
        email: res.data.email ?? '',
        phone: res.data.phone ?? '',
        notes: res.data.notes ?? '',
      }
    }
    else {
      errorMessage.value = res.status.message
    }
  }
  catch {
    errorMessage.value = 'Could not load client.'
  }
  finally {
    isLoading.value = false
  }
}

fetchClient()

const saveClient = async () => {
  isSaving.value = true
  formErrors.value = {}

  try {
    const res = editingId.value
      ? await clientsApis.handleUpdateClient(editingId.value, form.value)
      : await clientsApis.handleCreateClient(form.value)

    if (res.status.code === 200 || res.status.code === 201) {
      router.push('/clients')
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
    :title="editingId ? 'Edit Client' : 'New Client'"
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
              :to="'/clients'"
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
