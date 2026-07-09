<script lang="ts" setup>
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
</script>

<template>
  <VCard>
    <VCardText>
      <h4 class="text-h4 mb-1">
        Welcome, {{ authStore.user?.name }} 👋
      </h4>
      <p class="mb-0">
        Your dashboard is coming together — check back soon for bookings, revenue, and activity at a glance.
      </p>
    </VCardText>
  </VCard>
</template>
