<script setup lang="ts">
import { isNavigating } from '@/plugins/router'
</script>

<template>
  <VApp>
    <!--
      Thin bar at the top while the next page's code is loading, so a
      click never looks ignored.
    -->
    <VProgressLinear
      :active="isNavigating"
      indeterminate
      color="primary"
      height="3"
      class="route-progress"
    />
    <RouterView />
  </VApp>
</template>

<style scoped>
.route-progress {
  position: fixed !important;
  z-index: 9999;
  inset-block-start: 0;
}
</style>
