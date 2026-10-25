<script setup lang="ts">
import { appointmentsApis } from '@/core/apis/appointments.apis'
import { api } from '@/utils/api'

interface Option {
  id: number
  name: string
}

const route = useRoute()
const router = useRouter()

const editingId = computed(() => (route.params.id ? Number(route.params.id) : null))

const clients = ref<Option[]>([])
const services = ref<Option[]>([])
const staff = ref<Option[]>([])

const isLoading = ref(false)
const isSaving = ref(false)
const errorMessage = ref('')
const formErrors = ref<Record<string, string[]>>({})
const conflictMessage = ref('')

const form = ref({
  client_id: null as number | null,
  service_id: null as number | null,
  user_id: null as number | null,
  starts_at: '',
  notes: '',
})

// datetime-local input needs "YYYY-MM-DDTHH:mm", ISO strings from the API use "YYYY-MM-DDTHH:mm:ss.ssssssZ"
const toDatetimeLocal = (iso: string) => {
  const date = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const fetchLookups = async () => {
  const [clientsRes, servicesRes, staffRes] = await Promise.all([
    api.get('/clients/list'),
    api.get('/services/list'),
    api.get('/staff/list'),
  ])

  clients.value = clientsRes.data.data
  services.value = servicesRes.data.data
  staff.value = staffRes.data.data
}

const fetchAppointment = async () => {
  if (!editingId.value)
    return

  isLoading.value = true
  errorMessage.value = ''

  try {
    const res = await appointmentsApis.handleGetAppointment(editingId.value)

    if (res.status.code === 200 && res.data) {
      form.value = {
        client_id: res.data.client.id,
        service_id: res.data.service.id,
        user_id: res.data.staff.id,
        starts_at: toDatetimeLocal(res.data.starts_at),
        notes: res.data.notes ?? '',
      }
    }
    else {
      errorMessage.value = res.status.message
    }
  }
  catch {
    errorMessage.value = 'Could not load appointment.'
  }
  finally {
    isLoading.value = false
  }
}

fetchLookups()
fetchAppointment()

const saveAppointment = async () => {
  isSaving.value = true
  formErrors.value = {}
  conflictMessage.value = ''

  try {
    const res = editingId.value
      ? await appointmentsApis.handleUpdateAppointment(editingId.value, form.value)
      : await appointmentsApis.handleCreateAppointment(form.value)

    if (res.status.code === 200 || res.status.code === 201) {
      router.push('/appointments')
    }
    else if (res.status.code === 409) {
      conflictMessage.value = res.status.message
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
    :title="editingId ? 'Edit Appointment' : 'New Appointment'"
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

      <VAlert
        v-if="conflictMessage"
        type="warning"
        variant="tonal"
        class="mb-4"
      >
        {{ conflictMessage }}
      </VAlert>

      <VForm @submit.prevent="saveAppointment">
        <VRow>
          <VCol cols="12">
            <VSelect
              v-model="form.client_id"
              label="Client"
              :items="clients"
              item-title="name"
              item-value="id"
              :error-messages="formErrors.client_id"
            />
          </VCol>
          <VCol cols="12">
            <VSelect
              v-model="form.service_id"
              label="Service"
              :items="services"
              item-title="name"
              item-value="id"
              :error-messages="formErrors.service_id"
            />
          </VCol>
          <VCol cols="12">
            <VSelect
              v-model="form.user_id"
              label="Staff"
              :items="staff"
              item-title="name"
              item-value="id"
              :error-messages="formErrors.user_id"
            />
          </VCol>
          <VCol cols="12">
            <VTextField
              v-model="form.starts_at"
              type="datetime-local"
              label="Starts at"
              :error-messages="formErrors.starts_at"
            />
          </VCol>
          <VCol cols="12">
            <VTextarea
              v-model="form.notes"
              label="Notes"
              rows="2"
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
              :to="'/appointments'"
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
