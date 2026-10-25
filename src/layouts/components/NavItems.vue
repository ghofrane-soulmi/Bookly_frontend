<script lang="ts" setup>
import VerticalNavSectionTitle from '@/@layouts/components/VerticalNavSectionTitle.vue'
import VerticalNavLink from '@layouts/components/VerticalNavLink.vue'
</script>

<template>
  <VerticalNavLink
    :item="{
      title: 'Dashboard',
      icon: 'bx-home-smile',
      to: '/dashboard',
    }"
  />

  <!-- 👉 Business -->
  <VerticalNavSectionTitle
    :item="{
      heading: 'Business',
    }"
  />
  <VerticalNavLink
    :item="{
      title: 'Services',
      icon: 'bx-spreadsheet',
      to: '/services',
    }"
  />
  <VerticalNavLink
    :item="{
      title: 'Clients',
      icon: 'bx-group',
      to: '/clients',
    }"
  />
  <VerticalNavLink
    :item="{
      title: 'Appointments',
      icon: 'bx-calendar-check',
      to: '/appointments',
    }"
  />
  <VerticalNavLink
    :item="{
      title: 'Calendar',
      icon: 'bx-calendar',
      to: '/calendar',
    }"
  />
  <VerticalNavLink
    :item="{
      title: 'Staff',
      icon: 'bx-id-card',
      to: '/staff',
    }"
  />
  <VerticalNavLink
    :item="{
      title: 'Invoices',
      icon: 'bx-receipt',
      to: '/invoices',
    }"
  />

  <!-- 👉 Roles & Permissions -->
  <VerticalNavSectionTitle
    :item="{
      heading: 'Roles & Permissions',
    }"
  />
  <VerticalNavLink
    :item="{
      title: 'Roles',
      icon: 'bx-check-shield',
      to: '/roles',
    }"
  />
  <VerticalNavLink
    :item="{
      title: 'Permissions',
      icon: 'bx-lock-alt',
      to: '/permissions',
    }"
  />

  <!-- 👉 Account -->
  <VerticalNavSectionTitle
    :item="{
      heading: 'Account',
    }"
  />
  <VerticalNavLink
    :item="{
      title: 'Account Settings',
      icon: 'bx-user',
      to: '/account-settings',
    }"
  />
</template>
