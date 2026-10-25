<script setup lang="ts">
import { servicesApis } from '@/core/apis/services.apis'
import { useAuthStore } from '@/stores/auth'
import { currencyDecimals, toMajorUnits } from '@/utils/money'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const editingId = computed(() => (route.params.id ? Number(route.params.id) : null))
const isLoading = ref(false)
const isSaving = ref(false)
const errorMessage = ref('')
const formErrors = ref<Record<string, string[]>>({})
const categories = ref<string[]>([])

const form = ref({
  name: '',
  description: '',
  category: '',
  duration_minutes: 30,
  price: 0,
  color: '#7367F0',
})

const priceStep = computed(() => 10 ** -currencyDecimals(authStore.business?.currency_code ?? 'USD'))

const fetchCategories = async () => {
  const res = await servicesApis.handleListServices({ per_page: 100 })

  categories.value = [...new Set((res.data ?? []).map(s => s.category).filter((c): c is string => !!c))]
}

const fetchService = async () => {
  if (!editingId.value)
    return

  isLoading.value = true
  errorMessage.value = ''

  try {
    const res = await servicesApis.handleGetService(editingId.value)

    if (res.status.code === 200 && res.data) {
      form.value = {
        name: res.data.name,
        description: res.data.description ?? '',
        category: res.data.category ?? '',
        duration_minutes: res.data.duration_minutes,
        price: toMajorUnits(res.data.price),
        color: res.data.color ?? '#7367F0',
      }
    }
    else {
      errorMessage.value = res.status.message
    }
  }
  catch {
    errorMessage.value = 'Could not load service.'
  }
  finally {
    isLoading.value = false
  }
}

fetchCategories()
fetchService()

const saveService = async () => {
  isSaving.value = true
  formErrors.value = {}

  try {
    const res = editingId.value
      ? await servicesApis.handleUpdateService(editingId.value, form.value)
      : await servicesApis.handleCreateService(form.value)

    if (res.status.code === 200 || res.status.code === 201) {
      router.push('/services')
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
    :title="editingId ? 'Edit Service' : 'New Service'"
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

      <VForm @submit.prevent="saveService">
        <VRow>
          <VCol cols="12">
            <VTextField
              v-model="form.name"
              label="Name"
              :error-messages="formErrors.name"
            />
          </VCol>
          <VCol cols="12">
            <VTextarea
              v-model="form.description"
              label="Description"
              rows="2"
              :error-messages="formErrors.description"
            />
          </VCol>
          <VCol cols="12">
            <VCombobox
              v-model="form.category"
              label="Category"
              :items="categories"
              clearable
              :error-messages="formErrors.category"
            />
          </VCol>
          <VCol
            cols="12"
            sm="6"
          >
            <VTextField
              v-model.number="form.duration_minutes"
              type="number"
              label="Duration (minutes)"
              :error-messages="formErrors.duration_minutes"
            />
          </VCol>
          <VCol
            cols="12"
            sm="6"
          >
            <VTextField
              v-model.number="form.price"
              type="number"
              :step="priceStep"
              min="0"
              label="Price"
              :error-messages="formErrors.price"
            />
          </VCol>
          <VCol cols="12">
            <VTextField
              v-model="form.color"
              type="color"
              label="Color"
              :error-messages="formErrors.color"
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
              :to="'/services'"
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
