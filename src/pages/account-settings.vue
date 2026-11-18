<script lang="ts" setup>
import AccountSettingsAccount from '@/views/pages/account-settings/AccountSettingsAccount.vue'
import AccountSettingsBusiness from '@/views/pages/account-settings/AccountSettingsBusiness.vue'
import AccountSettingsNotifications from '@/views/pages/account-settings/AccountSettingsNotifications.vue'

import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const authStore = useAuthStore()

const activeTab = ref(route.params.tab ?? 'account')

// Business-wide settings need business.manage (owners); everyone can edit
// their own account.
const tabs = computed(() => {
  const list = [{ title: 'Account', icon: 'bx-user', tab: 'account' }]

  if (authStore.can('business.manage')) {
    list.push(
      { title: 'Business', icon: 'bx-store', tab: 'business' },
      { title: 'Notifications', icon: 'bx-bell', tab: 'notifications' },
    )
  }

  return list
})
</script>

<template>
  <div>
    <VTabs
      v-model="activeTab"
      show-arrows
      class="v-tabs-pill"
    >
      <VTab
        v-for="item in tabs"
        :key="item.icon"
        :value="item.tab"
      >
        <VIcon
          size="20"
          start
          :icon="item.icon"
        />
        {{ item.title }}
      </VTab>
    </VTabs>

    <VWindow
      v-model="activeTab"
      class="mt-5 disable-tab-transition"
    >
      <!-- Account -->
      <VWindowItem value="account">
        <AccountSettingsAccount />
      </VWindowItem>

      <template v-if="authStore.can('business.manage')">
        <!-- Business -->
        <VWindowItem value="business">
          <AccountSettingsBusiness />
        </VWindowItem>

        <!-- Notifications -->
        <VWindowItem value="notifications">
          <AccountSettingsNotifications />
        </VWindowItem>
      </template>
    </VWindow>
  </div>
</template>
