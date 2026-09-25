<script lang="ts" setup>
import { businessApis } from '@/core/apis/business.apis'
import type { OperatingHours } from '@/core/apis/types/business.types'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const days = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
] as const

const defaultOperatingHours = (): OperatingHours => ({
  monday: { open: '09:00', close: '18:00' },
  tuesday: { open: '09:00', close: '18:00' },
  wednesday: { open: '09:00', close: '18:00' },
  thursday: { open: '09:00', close: '18:00' },
  friday: { open: '09:00', close: '18:00' },
  saturday: null,
  sunday: null,
})

const form = ref({
  name: '',
  email: '',
  phone: '',
  timezone: 'UTC',
  currency_code: 'USD',
})

const restrictHours = ref(false)
const operatingHours = ref<OperatingHours>(defaultOperatingHours())

const toggleRestrictHours = (value: boolean | null) => {
  if (value && Object.values(operatingHours.value).every(day => day === null))
    operatingHours.value = defaultOperatingHours()
}

const toggleDayOpen = (dayKey: keyof OperatingHours, isOpen: boolean | null) => {
  operatingHours.value[dayKey] = isOpen ? { open: '09:00', close: '18:00' } : null
}

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

// Mirrors the currencies seeded in the `currencies` table. Move this to a
// GET /currencies lookup once that endpoint exists.
const currencies = ['TND', 'EUR', 'USD', 'GBP', 'MAD', 'DZD', 'JPY']

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
        currency_code: res.data.currency_code,
      }

      if (res.data.operating_hours) {
        restrictHours.value = true
        operatingHours.value = res.data.operating_hours
      }
      else {
        restrictHours.value = false
        operatingHours.value = defaultOperatingHours()
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
    const res = await businessApis.handleUpdateBusiness({
      ...form.value,
      operating_hours: restrictHours.value ? operatingHours.value : null,
    })

    if (res.status.code === 200) {
      authStore.updateBusiness({
        name: form.value.name,
        timezone: form.value.timezone,
        currency_code: form.value.currency_code,
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
                  v-model="form.currency_code"
                  label="Currency"
                  :items="currencies"
                  :error-messages="formErrors.currency_code"
                />
              </VCol>

              <VCol cols="12">
                <VSwitch
                  v-model="restrictHours"
                  label="Only allow appointments within specific operating hours"
                  @update:model-value="toggleRestrictHours"
                />
              </VCol>

              <VCol
                v-if="restrictHours"
                cols="12"
              >
                <VTable density="comfortable">
                  <thead>
                    <tr>
                      <th>Day</th>
                      <th>Open</th>
                      <th>Opens at</th>
                      <th>Closes at</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="day in days"
                      :key="day.key"
                    >
                      <td>{{ day.label }}</td>
                      <td>
                        <VSwitch
                          :model-value="operatingHours[day.key] !== null"
                          density="compact"
                          hide-details
                          @update:model-value="value => toggleDayOpen(day.key, value)"
                        />
                      </td>
                      <td>
                        <VTextField
                          v-if="operatingHours[day.key]"
                          v-model="operatingHours[day.key]!.open"
                          type="time"
                          density="compact"
                          hide-details
                          :error-messages="formErrors[`operating_hours.${day.key}.open`]"
                        />
                      </td>
                      <td>
                        <VTextField
                          v-if="operatingHours[day.key]"
                          v-model="operatingHours[day.key]!.close"
                          type="time"
                          density="compact"
                          hide-details
                          :error-messages="formErrors[`operating_hours.${day.key}.close`]"
                        />
                      </td>
                    </tr>
                  </tbody>
                </VTable>
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
