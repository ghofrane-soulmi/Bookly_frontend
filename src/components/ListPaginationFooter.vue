<script setup lang="ts">
interface Props {
  page: number
  perPage: number
  total: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:page': [value: number]
}>()

const from = computed(() => (props.total === 0 ? 0 : (props.page - 1) * props.perPage + 1))
const to = computed(() => Math.min(props.page * props.perPage, props.total))
const lastPage = computed(() => Math.max(Math.ceil(props.total / props.perPage), 1))
</script>

<template>
  <div class="d-flex align-center justify-sm-space-between justify-center flex-wrap gap-3 px-6 py-3">
    <p class="text-disabled mb-0">
      Showing {{ from }} to {{ to }} of {{ total }} entries
    </p>

    <VPagination
      :model-value="page"
      :length="lastPage"
      :total-visible="5"
      density="comfortable"
      @update:model-value="value => emit('update:page', value)"
    />
  </div>
</template>
