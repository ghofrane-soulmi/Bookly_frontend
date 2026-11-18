<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const initials = computed(() => (authStore.user?.name ?? '?')
  .split(/\s+/)
  .filter(Boolean)
  .slice(0, 2)
  .map(part => part[0]!.toUpperCase())
  .join(''))

const onLogout = async () => {
  await authStore.logout()
  router.push('/login')
}
</script>

<template>
  <VAvatar
    class="cursor-pointer"
    color="primary"
    variant="tonal"
  >
    <span class="text-body-1 font-weight-medium">{{ initials }}</span>

    <VMenu
      activator="parent"
      width="240"
      location="bottom end"
      offset="14px"
    >
      <VList>
        <VListItem>
          <template #prepend>
            <VListItemAction start>
              <VAvatar
                color="primary"
                variant="tonal"
              >
                <span class="text-body-1 font-weight-medium">{{ initials }}</span>
              </VAvatar>
            </VListItemAction>
          </template>

          <VListItemTitle class="font-weight-semibold">
            {{ authStore.user?.name }}
          </VListItemTitle>
          <VListItemSubtitle class="text-capitalize">
            {{ authStore.user?.role }}<template v-if="authStore.business?.name">
              · {{ authStore.business.name }}
            </template>
          </VListItemSubtitle>
        </VListItem>

        <VDivider class="my-2" />

        <VListItem to="/account-settings">
          <template #prepend>
            <VIcon
              class="me-2"
              icon="bx-cog"
              size="22"
            />
          </template>
          <VListItemTitle>Account settings</VListItemTitle>
        </VListItem>

        <VDivider class="my-2" />

        <VListItem @click="onLogout">
          <template #prepend>
            <VIcon
              class="me-2"
              icon="bx-log-out"
              size="22"
            />
          </template>
          <VListItemTitle>Logout</VListItemTitle>
        </VListItem>
      </VList>
    </VMenu>
  </VAvatar>
</template>
