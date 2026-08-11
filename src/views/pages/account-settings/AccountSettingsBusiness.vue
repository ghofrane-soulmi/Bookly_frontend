<script lang="ts" setup>
import { businessApis } from '@/core/apis/business.apis'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const form = ref({
  name: '',
  email: '',
  phone: '',
  timezone: 'UTC',
  currency: 'USD',
})

const isLoading = ref(true)
const isSaving = ref(false)
const formErrors = ref<Record<string, string[]>>({})
const successMessage = ref('')
const loadErrorMessage = ref('')

const timezones = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Madrid',
  'Africa/Casablanca',
  'Africa/Cairo',
  'Africa/Johannesburg',
  'Asia/Dubai',
  'Asia/Karachi',
  'Asia/Kolkata',
  'Asia/Dhaka',
  'Asia/Bangkok',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Australia/Sydney',
  'Pacific/Auckland',
]

const currencies = ['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'CHF', 'CNY', 'INR', 'JPY', 'MAD', 'AED']

const fetchBusiness = async () => {
  isLoading.value = true
  loadErrorMessage.value = ''

  try {
    const res = await businessApis.handleGetBusiness()

    if (res.status.code === 200 && res.data) {
      form.value = {
        name: res.data.name,
        email: res.data.email ?? '',
        phone: res.data.phone ?? '',
        timezone: res.data.timezone,
        currency: res.data.currency,
      }
    }
    else {
      loadErrorMessage.value = res.status.message
    }
  }
  catch {
    loadErrorMessage.value = 'Could not load business details.'
  }
  finally {
    isLoading.value = false
  }
}

fetchBusiness()

const saveBusiness = async () => {
  isSaving.value = true
  formErrors.value = {}
  successMessage.value = ''

  try {
    const res = await businessApis.handleUpdateBusiness(form.value)

    if (res.status.code === 200) {
      authStore.updateBusiness({
        name: form.value.name,
        timezone: form.value.timezone,
        currency: form.value.currency,
      })
      successMessage.value = 'Business updated successfully.'
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
      <VCard title="Business Details">
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
            v-if="loadErrorMessage"
            type="error"
            variant="tonal"
            class="mb-4"
          >
            {{ loadErrorMessage }}
          </VAlert>

          <VProgressCircular
            v-if="isLoading"
            indeterminate
            color="primary"
          />

          <VForm
            v-if="!isLoading"
            @submit.prevent="saveBusiness"
          >
            <VRow>
              <VCol
                cols="12"
                md="6"
              >
                <VTextField
                  v-model="form.name"
                  label="Business Name"
                  :error-messages="formErrors.name"
                />
              </VCol>

              <VCol
                cols="12"
                md="6"
              >
                <VTextField
                  v-model="form.email"
                  label="Business Email"
                  type="email"
                  :error-messages="formErrors.email"
                />
              </VCol>

              <VCol
                cols="12"
                md="6"
              >
                <VTextField
                  v-model="form.phone"
                  label="Phone Number"
                  :error-messages="formErrors.phone"
                />
              </VCol>

              <VCol
                cols="12"
                md="6"
              >
                <VSelect
                  v-model="form.timezone"
                  label="Timezone"
                  :items="timezones"
                  :menu-props="{ maxHeight: 300 }"
                  :error-messages="formErrors.timezone"
                />
              </VCol>

              <VCol
                cols="12"
                md="6"
              >
                <VSelect
                  v-model="form.currency"
                  label="Currency"
                  :items="currencies"
                  :error-messages="formErrors.currency"
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
