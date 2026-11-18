<script lang="ts" setup>
import VerticalNavSectionTitle from '@/@layouts/components/VerticalNavSectionTitle.vue'
import { useAuthStore } from '@/stores/auth'
import VerticalNavLink from '@layouts/components/VerticalNavLink.vue'

interface Link { title: string; icon: string; to: string; permission?: string }
interface Section { heading?: string; links: Link[] }

const authStore = useAuthStore()

// Only links the user's role can open; the router guard uses the same
// permissions, and the API enforces them regardless.
const sections: Section[] = [
  { links: [{ title: 'Dashboard', icon: 'bx-home-smile', to: '/dashboard', permission: 'dashboard.view' }] },
  {
    heading: 'Business',
    links: [
      { title: 'Services', icon: 'bx-spreadsheet', to: '/services', permission: 'services.view' },
      { title: 'Clients', icon: 'bx-group', to: '/clients', permission: 'clients.view' },
      { title: 'Appointments', icon: 'bx-calendar-check', to: '/appointments', permission: 'appointments.view' },
      { title: 'Calendar', icon: 'bx-calendar', to: '/calendar', permission: 'appointments.view' },
      { title: 'Invoices', icon: 'bx-receipt', to: '/invoices', permission: 'invoices.view' },
      { title: 'Staff', icon: 'bx-id-card', to: '/staff', permission: 'staff.view' },
    ],
  },
  {
    heading: 'Roles & Permissions',
    links: [
      { title: 'Roles', icon: 'bx-check-shield', to: '/roles', permission: 'roles.manage' },
      { title: 'Permissions', icon: 'bx-lock-alt', to: '/permissions', permission: 'roles.manage' },
    ],
  },
  { heading: 'Account', links: [{ title: 'Account Settings', icon: 'bx-user', to: '/account-settings' }] },
]

const visibleSections = computed(() => sections
  .map(section => ({ ...section, links: section.links.filter(link => authStore.can(link.permission)) }))
  .filter(section => section.links.length))
</script>

<template>
  <template
    v-for="section in visibleSections"
    :key="section.heading ?? 'main'"
  >
    <VerticalNavSectionTitle
      v-if="section.heading"
      :item="{ heading: section.heading }"
    />
    <VerticalNavLink
      v-for="link in section.links"
      :key="link.to"
      :item="{ title: link.title, icon: link.icon, to: link.to }"
    />
  </template>
</template>
