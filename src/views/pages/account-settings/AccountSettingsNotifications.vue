<script lang="ts" setup>
import { businessApis } from '@/core/apis/business.apis'

const form = ref({
  notify_confirmation_email: true,
  notify_reminder_email: true,
  reminder_lead_hours: 24,
})

const isLoading = ref(true)
const isSaving = ref(false)
const formErrors = ref<Record<string, string[]>>({})
const successMessage = ref('')
const loadErrorMessage = ref('')

const fetchBusiness = async () => {
  isLoading.value = true
  loadErrorMessage.value = ''

  try {
    const res = await businessApis.handleGetBusiness()

    if (res.status.code === 200 && res.data) {
      form.value = {
        notify_confirmation_email: res.data.notify_confirmation_email,
        notify_reminder_email: res.data.notify_reminder_email,
        reminder_lead_hours: res.data.reminder_lead_hours,
      }
    }
    else {
      loadErrorMessage.value = res.status.message
    }
  }
  catch {
    loadErrorMessage.value = 'Could not load notification settings.'
  }
  finally {
    isLoading.value = false
  }
}

fetchBusiness()

const saveSettings = async () => {
  isSaving.value = true
  formErrors.value = {}
  successMessage.value = ''

  try {
    const res = await businessApis.handleUpdateBusiness(form.value)

    if (res.status.code === 200)
      successMessage.value = 'Notification settings updated successfully.'
    else if (res.status.code === 422)
      formErrors.value = res.errors ?? {}
  }
  finally {
    isSaving.value = false
  }
}
</script>

<template>
  <VRow>
    <VCol cols="12">
      <VCard title="Email Notifications">
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
            @submit.prevent="saveSettings"
          >
            <VRow>
              <VCol cols="12">
                <VSwitch
                  v-model="form.notify_confirmation_email"
                  label="Send a confirmation email when an appointment is booked"
                />
              </VCol>

              <VCol cols="12">
                <VSwitch
                  v-model="form.notify_reminder_email"
                  label="Send a reminder email before an appointment"
                />
              </VCol>

              <VCol
                cols="12"
                md="6"
              >
                <VTextField
                  v-model.number="form.reminder_lead_hours"
                  type="number"
                  min="1"
                  max="168"
                  label="Reminder lead time (hours before appointment)"
                  :disabled="!form.notify_reminder_email"
                  :error-messages="formErrors.reminder_lead_hours"
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
