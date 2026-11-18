import { createApp } from 'vue'

import App from '@/App.vue'
import { registerPlugins } from '@core/utils/plugins'
import { router } from '@/plugins/router'

// Styles
import '@core/scss/template/index.scss'
import '@layouts/styles/index.scss'
import '@styles/styles.scss'

// Create vue app
const app = createApp(App)

// Register plugins
registerPlugins(app)

// Mount only once the first route's lazy layout + page are loaded. Mounting
// straight away replaced the branded startup loader in index.html with an
// empty screen while those chunks downloaded.
router.isReady()
  .catch(() => {})
  .finally(() => app.mount('#app'))
