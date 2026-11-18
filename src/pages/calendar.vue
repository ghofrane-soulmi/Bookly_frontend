<script setup lang="ts">
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import timeGridPlugin from '@fullcalendar/timegrid'
import FullCalendar from '@fullcalendar/vue3'
import Flatpickr from 'vue-flatpickr-component'
import { appointmentsApis } from '@/core/apis/appointments.apis'
import type { Appointment } from '@/core/apis/types/appointments.types'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/utils/api'
import 'flatpickr/dist/flatpickr.css'

const authStore = useAuthStore()

interface Option {
  id: number
  name: string
}

const statusColors: Record<Appointment['status'], string> = {
  scheduled: '#7367F0',
  completed: '#28C76F',
  cancelled: '#82868B',
  no_show: '#EA5455',
}

// Fixed categorical order, one swatch per staff slot (never generated/cycled beyond this set).
const staffPalette = ['primary', 'info', 'warning', 'success', 'error', 'secondary']

const clients = ref<Option[]>([])
const services = ref<Option[]>([])
const staff = ref<Option[]>([])

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

fetchLookups()

const staffColor = (staffId: number) => {
  const index = staff.value.findIndex(s => s.id === staffId)

  return staffPalette[index % staffPalette.length] ?? staffPalette[0]
}

// "View all" + one togglable entry per staff member — mirrors the template's Event Filters list,
// adapted to the one real grouping Bookly appointments actually have (who it's with).
const selectedStaffIds = ref<number[]>([])

watch(staff, () => {
  selectedStaffIds.value = staff.value.map(s => s.id)
}, { immediate: true })

const allStaffSelected = computed(() => selectedStaffIds.value.length === staff.value.length)

const toggleAllStaff = (value: boolean | null) => {
  selectedStaffIds.value = value ? staff.value.map(s => s.id) : []
}

const toEvent = (appointment: Appointment) => ({
  id: String(appointment.id),
  title: `${appointment.client.name} — ${appointment.service.name}`,
  start: appointment.starts_at,
  end: appointment.ends_at,
  color: statusColors[appointment.status],
})

// Appointments for the currently visible calendar range. Kept as reactive state (rather than
// FullCalendar's function-based `events` source + imperative refetchEvents()) so create/edit/delete
// just re-populate this and the calendar's :events prop updates itself via normal Vue reactivity.
const rawAppointments = ref<Appointment[]>([])
const appointmentsById = computed(() => Object.fromEntries(rawAppointments.value.map(a => [a.id, a])))
const visibleAppointments = computed(() => rawAppointments.value.filter(a => selectedStaffIds.value.includes(a.staff.id)))
const calendarEvents = computed(() => visibleAppointments.value.map(toEvent))
const visibleRange = ref<{ from: string, to: string } | null>(null)

const fetchAppointments = async () => {
  if (!visibleRange.value)
    return

  const res = await appointmentsApis.handleListAppointments(visibleRange.value)

  rawAppointments.value = res.data ?? []
}

const calendarTitle = ref('')

const onDatesSet = (info: { startStr: string, endStr: string, view: { title: string } }) => {
  calendarTitle.value = info.view.title
  visibleRange.value = { from: info.startStr.slice(0, 10), to: info.endStr.slice(0, 10) }
  fetchAppointments()
}

const isFormOpen = ref(false)
const isSaving = ref(false)
const editingId = ref<number | null>(null)
const formErrors = ref<Record<string, string[]>>({})
const conflictMessage = ref('')

const emptyForm = () => ({
  client_id: null as number | null,
  service_id: null as number | null,
  user_id: null as number | null,
  starts_at: '',
  notes: '',
})

const form = ref(emptyForm())

const toDatetimeLocal = (date: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0')

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const openCreateDialog = (date: Date = new Date()) => {
  editingId.value = null
  form.value = { ...emptyForm(), starts_at: toDatetimeLocal(date) }
  formErrors.value = {}
  conflictMessage.value = ''
  isFormOpen.value = true
}

const onDateClick = (info: { date: Date }) => openCreateDialog(info.date)

const onEventClick = (info: { event: { id: string } }) => {
  const appointment = appointmentsById.value[Number(info.event.id)]

  if (!appointment)
    return

  editingId.value = appointment.id
  form.value = {
    client_id: appointment.client.id,
    service_id: appointment.service.id,
    user_id: appointment.staff.id,
    starts_at: toDatetimeLocal(new Date(appointment.starts_at)),
    notes: appointment.notes ?? '',
  }
  formErrors.value = {}
  conflictMessage.value = ''
  isFormOpen.value = true
}

const saveAppointment = async () => {
  isSaving.value = true
  formErrors.value = {}
  conflictMessage.value = ''

  try {
    const res = editingId.value
      ? await appointmentsApis.handleUpdateAppointment(editingId.value, form.value)
      : await appointmentsApis.handleCreateAppointment(form.value)

    if (res.status.code === 200 || res.status.code === 201) {
      isFormOpen.value = false
      await fetchAppointments()
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

const deleteAppointment = async () => {
  if (!editingId.value)
    return

  await appointmentsApis.handleDeleteAppointment(editingId.value)
  isFormOpen.value = false
  await fetchAppointments()
}

const calendarRef = ref<InstanceType<typeof FullCalendar>>()
const calendarApi = () => calendarRef.value?.getApi()

const miniPickerDate = ref(new Date())
const onMiniPickerChange = (dates: Date[]) => {
  if (dates[0])
    calendarApi()?.gotoDate(dates[0])
}

const goPrev = () => calendarApi()?.prev()
const goNext = () => calendarApi()?.next()

const activeView = ref('timeGridWeek')
const viewButtons = [
  { view: 'dayGridMonth', label: 'month' },
  { view: 'timeGridWeek', label: 'week' },
  { view: 'timeGridDay', label: 'day' },
  { view: 'listMonth', label: 'list' },
]

const setView = (view: string) => {
  activeView.value = view
  calendarApi()?.changeView(view)
}

const calendarOptions = computed(() => ({
  plugins: [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin],
  initialView: 'timeGridWeek',

  headerToolbar: false as const,

  // Fixed height so the time grid scrolls inside the card and can open on
  // working hours instead of midnight; earlier slots stay reachable.
  contentHeight: 680,
  scrollTime: '08:00:00',
  nowIndicator: true,
  timeZone: authStore.business?.timezone ?? 'local',
  events: calendarEvents.value,
  datesSet: onDatesSet,
  dateClick: onDateClick,
  eventClick: onEventClick,
}))
</script>

<template>
  <VCard class="calendar-shell">
    <VLayout>
      <VNavigationDrawer
        permanent
        location="start"
        width="340"
      >
        <div class="pa-6">
          <VBtn
            block
            prepend-icon="bx-plus"
            @click="openCreateDialog()"
          >
            New Appointment
          </VBtn>
        </div>

        <VDivider />

        <div class="d-flex justify-center px-0 py-2">
          <Flatpickr
            v-model="miniPickerDate"
            :config="{ inline: true }"
            @on-change="onMiniPickerChange"
          />
        </div>

        <VDivider />

        <div class="pa-6">
          <h5 class="text-h5 mb-4">
            Staff
          </h5>
          <div class="d-flex flex-column gap-y-1">
            <VCheckbox
              :model-value="allStaffSelected"
              label="View all"
              color="primary"
              @update:model-value="toggleAllStaff"
            />
            <VCheckbox
              v-for="member in staff"
              :key="member.id"
              v-model="selectedStaffIds"
              :value="member.id"
              :label="member.name"
              :color="staffColor(member.id)"
            />
          </div>
        </div>
      </VNavigationDrawer>

      <VMain class="calendar-main">
        <div class="pa-6 calendar-main-inner">
          <div class="d-flex align-center flex-wrap justify-space-between gap-4 mb-4">
            <div class="d-flex align-center gap-x-4">
              <VBtnGroup
                density="comfortable"
                variant="tonal"
                color="secondary"
              >
                <VBtn
                  icon
                  @click="goPrev"
                >
                  <VIcon icon="bx-chevron-left" />
                </VBtn>
                <VBtn
                  icon
                  @click="goNext"
                >
                  <VIcon icon="bx-chevron-right" />
                </VBtn>
              </VBtnGroup>

              <h2 class="text-h4">
                {{ calendarTitle }}
              </h2>
            </div>

            <VBtnGroup
              density="comfortable"
              variant="tonal"
              color="secondary"
              class="text-capitalize"
            >
              <VBtn
                v-for="btn in viewButtons"
                :key="btn.view"
                :color="activeView === btn.view ? 'primary' : undefined"
                :variant="activeView === btn.view ? 'flat' : 'tonal'"
                @click="setView(btn.view)"
              >
                {{ btn.label }}
              </VBtn>
            </VBtnGroup>
          </div>

          <FullCalendar
            ref="calendarRef"
            :options="calendarOptions"
          />
        </div>
      </VMain>

      <VNavigationDrawer
        v-model="isFormOpen"
        location="end"
        temporary
        width="370"
      >
      <div class="px-6 py-5 d-flex align-center">
        <h5 class="text-h5">
          {{ editingId ? 'Edit Appointment' : 'Add Appointment' }}
        </h5>
        <VSpacer />
        <VBtn
          v-if="editingId"
          icon
          variant="text"
          size="small"
          @click="deleteAppointment"
        >
          <VIcon icon="bx-trash" />
        </VBtn>
        <VBtn
          icon
          variant="text"
          size="small"
          @click="isFormOpen = false"
        >
          <VIcon icon="bx-x" />
        </VBtn>
      </div>

      <VDivider />

      <VCardText>
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
              <label class="v-label mb-1 text-body-2">Start date</label>
              <Flatpickr
                v-model="form.starts_at"
                class="flatpickr-input-field"
                :config="{ enableTime: true, dateFormat: 'Y-m-d H:i' }"
              />
              <span
                v-if="formErrors.starts_at"
                class="text-error text-caption"
              >{{ formErrors.starts_at[0] }}</span>
            </VCol>
            <VCol cols="12">
              <VTextarea
                v-model="form.notes"
                label="Description"
                rows="3"
                :error-messages="formErrors.notes"
              />
            </VCol>
            <VCol cols="12">
              <VBtn
                type="submit"
                :loading="isSaving"
                class="me-3"
              >
                Submit
              </VBtn>
              <VBtn
                type="button"
                variant="outlined"
                color="secondary"
                @click="isFormOpen = false"
              >
                Cancel
              </VBtn>
            </VCol>
          </VRow>
        </VForm>
      </VCardText>
    </VNavigationDrawer>
    </VLayout>
  </VCard>
</template>

<style scoped>
.calendar-shell {
  min-block-size: 70vh;
  overflow: hidden;
}

.calendar-main {
  min-inline-size: 0;
  flex: 1 1 0;
}

.calendar-main-inner {
  min-inline-size: 0;
  max-inline-size: 100%;
  overflow-x: auto;
}

.flatpickr-input-field {
  inline-size: 100%;
  padding-block: 0.5rem;
  padding-inline: 0.75rem;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 6px;
  background: transparent;
  color: inherit;
}

:deep(.flatpickr-calendar.inline) {
  box-shadow: none;
}

:deep(input.flatpickr-input:not(.flatpickr-input-field)) {
  display: none;
}

:deep(.flatpickr-current-month) {
  font-size: 0.85rem;
  padding-inline-start: 0;
}

:deep(.flatpickr-monthDropdown-months) {
  padding-inline-end: 0;
}

:deep(.numInputWrapper) {
  inline-size: 3.5rem;
}
</style>
