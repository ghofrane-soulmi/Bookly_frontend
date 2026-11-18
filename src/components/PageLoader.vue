<script setup lang="ts">
withDefaults(defineProps<{ text?: string }>(), { text: 'Loading…' })
</script>

<template>
  <!-- Centered in the content area while a page fetches its data. -->
  <div
    class="page-loader"
    role="status"
    aria-live="polite"
  >
    <VProgressCircular
      indeterminate
      color="primary"
      size="44"
      width="4"
    />
    <span class="text-body-2 text-medium-emphasis">{{ text }}</span>
  </div>
</template>

<style scoped>
.page-loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-block-size: 60vh;
  inline-size: 100%;
}
</style>
