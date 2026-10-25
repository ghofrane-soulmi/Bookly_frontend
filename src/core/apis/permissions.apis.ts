import { api } from '@/utils/api'
import type { ApiEnvelope, Permission } from './types/roles.types'

export const permissionsApis = {
  handleListPermissions: async (): Promise<ApiEnvelope<Permission[]>> => {
    try {
      const res = await api.get('/permissions/list')

      return res.data
    }
    catch (error) {
      console.error('Error fetching permissions:', error)
      throw error
    }
  },
}
