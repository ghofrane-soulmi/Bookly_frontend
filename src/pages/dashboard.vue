<script setup lang="ts">
import { useTheme } from 'vuetify'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/utils/api'
import { formatDateTime, formatMonthLabel, formatShortDate } from '@/utils/datetime'
import type { Money } from '@/utils/money'
import { formatMoney, toMajorUnits } from '@/utils/money'
import { hexToRgb } from '@layouts/utils'

interface RankedItem {
  name: string
  total: number
}

interface RecentAppointment {
  id: number
  client_name: string
  service_name: string
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show'
  starts_at: string
}

interface ActivityItem {
  type: 'appointment_booked' | 'client_added'
  message: string
  at: string
}

interface DashboardSummary {
  today_appointments: number
  upcoming_appointments: number
  total_clients: number
  total_services: number
  revenue_this_month: Money
  revenue_change_percent: number | null
  bookings_by_day: { date: string, count: number }[]
  revenue_by_month: { month: string, revenue: Money }[]
  top_services: RankedItem[]
  busiest_staff: RankedItem[]
  recent_appointments: RecentAppointment[]
  recent_activity: ActivityItem[]
}

const authStore = useAuthStore()
const vuetifyTheme = useTheme()

const summary = ref<DashboardSummary | null>(null)
const isLoading = ref(true)

const fetchSummary = async () => {
  isLoading.value = true

  const { data } = await api.get('/dashboard/summary')

  summary.value = data.data
  isLoading.value = false
}

fetchSummary()

/**
 * Chart callbacks (yaxis/tooltip formatters) only receive a bare major-unit
 * number, not the original Money object — so this formats using the
 * dashboard's own currency (one business = one currency per response)
 * rather than going through formatMoney, which expects minor units.
 */
const formatMajorAmount = (major: number) => new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: summary.value?.revenue_this_month.currency ?? 'USD',
}).format(major)

const timeAgo = (iso: string) => {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000)

  if (minutes < 1)
    return 'just now'
  if (minutes < 60)
    return `${minutes} min ago`

  const hours = Math.round(minutes / 60)
  if (hours < 24)
    return `${hours}h ago`

  return `${Math.round(hours / 24)}d ago`
}

const statusColors: Record<RecentAppointment['status'], string> = {
  scheduled: 'info',
  completed: 'success',
  cancelled: 'secondary',
  no_show: 'error',
}

const miniStats = computed(() => [
  { title: "Today's Appointments", value: String(summary.value?.today_appointments ?? 0), icon: 'bx-calendar-check' },
  { title: 'Upcoming (7 days)', value: String(summary.value?.upcoming_appointments ?? 0), icon: 'bx-calendar' },
])

const statTiles = computed(() => [
  { title: 'Revenue this month', value: formatMoney(summary.value?.revenue_this_month), icon: 'bx-dollar-circle' },
  { title: 'Total Clients', value: String(summary.value?.total_clients ?? 0), icon: 'bx-group' },
  { title: 'Total Services', value: String(summary.value?.total_services ?? 0), icon: 'bx-spreadsheet' },
])

const revenueChangeAbs = computed(() => Math.abs(summary.value?.revenue_change_percent ?? 0))
const revenueChangeIsUp = computed(() => (summary.value?.revenue_change_percent ?? 0) >= 0)

const bookingsChartOptions = computed(() => {
  const currentTheme = vuetifyTheme.current.value.colors
  const variableTheme = vuetifyTheme.current.value.variables
  const borderColor = `rgba(${hexToRgb(String(variableTheme['border-color']))},${variableTheme['border-opacity']})`
  const mutedColor = `rgba(${hexToRgb(String(currentTheme['on-surface']))},${variableTheme['disabled-opacity']})`

  return {
    chart: { toolbar: { show: false }, parentHeightOffset: 0 },
    colors: [currentTheme.primary],
    stroke: { width: 2, curve: 'smooth' },
    fill: { type: 'solid', opacity: 0.1 },
    dataLabels: { enabled: false },
    grid: {
      strokeDashArray: 0,
      borderColor,
      padding: { left: 8, right: 8 },
    },
    markers: {
      size: 4,
      strokeWidth: 2,
      strokeColors: currentTheme.surface,
      colors: [currentTheme.primary],
      hover: { size: 6 },
    },
    xaxis: {
      categories: summary.value?.bookings_by_day.map(d => formatShortDate(d.date)) ?? [],
      labels: { style: { colors: mutedColor, fontSize: '11px' }, rotate: 0 },
      axisBorder: { show: false },
      axisTicks: { show: false },
      tickAmount: 6,
    },
    yaxis: {
      labels: {
        style: { colors: mutedColor },
        formatter: (value: number) => Math.round(value).toString(),
      },
      forceNiceScale: true,
    },
    tooltip: { x: { show: true } },
  }
})

const bookingsChartSeries = computed(() => [
  { name: 'Bookings', data: summary.value?.bookings_by_day.map(d => d.count) ?? [] },
])

const revenueByMonthOptions = computed(() => {
  const currentTheme = vuetifyTheme.current.value.colors
  const variableTheme = vuetifyTheme.current.value.variables
  const mutedColor = `rgba(${hexToRgb(String(currentTheme['on-surface']))},${variableTheme['disabled-opacity']})`

  return {
    chart: { toolbar: { show: false }, parentHeightOffset: 0 },
    colors: [currentTheme.primary],
    plotOptions: {
      bar: { columnWidth: '40%', borderRadius: 4, borderRadiusApplication: 'end' },
    },
    dataLabels: { enabled: false },
    grid: { show: false },
    xaxis: {
      categories: summary.value?.revenue_by_month.map(m => formatMonthLabel(m.month)) ?? [],
      labels: { style: { colors: mutedColor } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        style: { colors: mutedColor },
        formatter: (value: number) => formatMajorAmount(value),
      },
    },
    tooltip: { y: { formatter: (value: number) => formatMajorAmount(value) } },
  }
})

const revenueByMonthSeries = computed(() => [
  { name: 'Revenue', data: summary.value?.revenue_by_month.map(m => toMajorUnits(m.revenue)) ?? [] },
])

const rankChartOptions = (items: RankedItem[]) => {
  const currentTheme = vuetifyTheme.current.value.colors

  return {
    chart: { toolbar: { show: false }, parentHeightOffset: 0 },
    colors: [currentTheme.primary],
    plotOptions: {
      bar: {
        horizontal: true,
        barHeight: '55%',
        borderRadius: 4,
        borderRadiusApplication: 'end',
      },
    },
    dataLabels: {
      enabled: true,
      textAnchor: 'start',
      offsetX: 8,
      style: { colors: [currentTheme['on-surface']] },
    },
    xaxis: {
      categories: items.map(i => i.name),
      labels: { show: false },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: { style: { colors: currentTheme['on-surface'] } },
    },
    grid: { show: false },
  }
}

const busiestStaffOptions = computed(() => rankChartOptions(summary.value?.busiest_staff ?? []))
const busiestStaffSeries = computed(() => [{ name: 'Appointments', data: summary.value?.busiest_staff.map(s => s.total) ?? [] }])

// Sequential single-hue categorical for the donut — fixed order, one swatch per service slot.
const donutPalette = ['#696CFF', '#8789FF', '#03C3EC', '#71DD37', '#FFAB00']

const topServicesDonutOptions = computed(() => {
  const currentTheme = vuetifyTheme.current.value.colors

  return {
    chart: { parentHeightOffset: 0 },
    labels: summary.value?.top_services.map(s => s.name) ?? [],
    colors: donutPalette,
    legend: { position: 'bottom', labels: { colors: currentTheme['on-surface'] } },
    dataLabels: { enabled: true, formatter: (val: number) => `${Math.round(val)}%` },
    stroke: { colors: [currentTheme.surface] },
    plotOptions: {
      pie: {
        donut: {
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Appointments',
              color: currentTheme['on-surface'],
              formatter: (w: { globals: { seriesTotals: number[] } }) =>
                String(w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0)),
            },
          },
        },
      },
    },
  }
})

const topServicesDonutSeries = computed(() => summary.value?.top_services.map(s => s.total) ?? [])
</script>

<template>
  <VRow v-if="summary">
    <!-- 👉 Greeting + mini stats -->
    <VCol
      cols="12"
      md="8"
    >
      <VCard>
        <VCardText>
          <h4 class="text-h4 mb-1">
            Welcome back, {{ authStore.user?.name }} 👋
          </h4>
          <p class="text-medium-emphasis mb-0">
            Here's what's happening at {{ authStore.business?.name }} today. You have
            <strong>{{ summary.today_appointments }}</strong> appointment{{ summary.today_appointments === 1 ? '' : 's' }} scheduled today.
          </p>
        </VCardText>
      </VCard>
    </VCol>

    <VCol
      cols="12"
      md="4"
    >
      <VRow>
        <VCol
          v-for="tile in miniStats"
          :key="tile.title"
          cols="6"
        >
          <VCard>
            <VCardText>
              <p class="mb-1 text-body-2">
                {{ tile.title }}
              </p>
              <h5 class="text-h5">
                {{ tile.value }}
              </h5>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>
    </VCol>

    <!-- 👉 Stat tiles -->
    <VCol
      v-for="tile in statTiles"
      :key="tile.title"
      cols="12"
      sm="4"
    >
      <VCard>
        <VCardText class="d-flex align-center gap-3">
          <VAvatar
            variant="tonal"
            color="primary"
            rounded
            size="42"
          >
            <VIcon :icon="tile.icon" />
          </VAvatar>
          <div>
            <p class="mb-1 text-body-2">
              {{ tile.title }}
            </p>
            <h5 class="text-h5">
              {{ tile.value }}
            </h5>
          </div>
        </VCardText>
      </VCard>
    </VCol>

    <!-- 👉 Revenue by month + change -->
    <VCol
      cols="12"
      md="8"
    >
      <VCard title="Revenue — last 6 months">
        <VCardText>
          <VueApexCharts
            type="bar"
            :height="260"
            :options="revenueByMonthOptions"
            :series="revenueByMonthSeries"
          />
        </VCardText>
      </VCard>
    </VCol>

    <VCol
      cols="12"
      md="4"
    >
      <VCard
        title="This Month"
        class="h-100"
      >
        <VCardText class="d-flex flex-column align-center justify-center h-100">
          <VProgressCircular
            :model-value="Math.min(revenueChangeAbs, 100)"
            :color="revenueChangeIsUp ? 'success' : 'error'"
            size="120"
            width="12"
          >
            <span class="text-h6">{{ summary.revenue_change_percent === null ? '—' : `${revenueChangeIsUp ? '+' : '-'}${revenueChangeAbs}%` }}</span>
          </VProgressCircular>
          <p class="text-medium-emphasis mt-4 mb-0 text-center">
            {{ summary.revenue_change_percent === null ? 'No revenue last month to compare against' : `vs. last month's revenue` }}
          </p>
        </VCardText>
      </VCard>
    </VCol>

    <!-- 👉 Top services (donut) -->
    <VCol
      cols="12"
      md="4"
    >
      <VCard title="Top Services">
        <VCardText>
          <VueApexCharts
            v-if="summary.top_services.length"
            type="donut"
            :height="280"
            :options="topServicesDonutOptions"
            :series="topServicesDonutSeries"
          />
          <p
            v-else
            class="text-medium-emphasis"
          >
            No appointments yet.
          </p>
        </VCardText>
      </VCard>
    </VCol>

    <!-- 👉 Recent appointments -->
    <VCol
      cols="12"
      md="4"
    >
      <VCard title="Recent Appointments">
        <VList lines="two">
          <VListItem
            v-for="appointment in summary.recent_appointments"
            :key="appointment.id"
          >
            <VListItemTitle>{{ appointment.client_name }} — {{ appointment.service_name }}</VListItemTitle>
            <VListItemSubtitle>{{ formatDateTime(appointment.starts_at) }}</VListItemSubtitle>

            <template #append>
              <VChip
                :color="statusColors[appointment.status]"
                size="small"
                class="text-capitalize"
              >
                {{ appointment.status.replace('_', ' ') }}
              </VChip>
            </template>
          </VListItem>

          <VListItem v-if="!summary.recent_appointments.length">
            <VListItemTitle class="text-medium-emphasis">
              No appointments yet.
            </VListItemTitle>
          </VListItem>
        </VList>
      </VCard>
    </VCol>

    <!-- 👉 Busiest staff -->
    <VCol
      cols="12"
      md="4"
    >
      <VCard title="Busiest Staff">
        <VCardText>
          <VueApexCharts
            v-if="summary.busiest_staff.length"
            type="bar"
            :height="Math.max(summary.busiest_staff.length * 50, 120)"
            :options="busiestStaffOptions"
            :series="busiestStaffSeries"
          />
          <p
            v-else
            class="text-medium-emphasis"
          >
            No appointments yet.
          </p>
        </VCardText>
      </VCard>
    </VCol>

    <!-- 👉 Recent activity -->
    <VCol cols="12">
      <VCard title="Recent Activity">
        <VTimeline
          density="compact"
          truncate-line="both"
          class="mx-4 my-2"
        >
          <VTimelineItem
            v-for="(activity, index) in summary.recent_activity"
            :key="index"
            :dot-color="activity.type === 'appointment_booked' ? 'primary' : 'success'"
            size="x-small"
          >
            <div class="d-flex justify-space-between align-center">
              <span>{{ activity.message }}</span>
              <span class="text-medium-emphasis text-sm">{{ timeAgo(activity.at) }}</span>
            </div>
          </VTimelineItem>

          <p
            v-if="!summary.recent_activity.length"
            class="text-medium-emphasis"
          >
            No recent activity yet.
          </p>
        </VTimeline>
      </VCard>
    </VCol>
  </VRow>

  <VProgressCircular
    v-else-if="isLoading"
    indeterminate
    color="primary"
  />
</template>
