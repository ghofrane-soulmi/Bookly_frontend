import { api } from '@/utils/api'
import type { ApiEnvelope, Business, BusinessPayload } from './types/business.types'

export const businessApis = {
  handleGetBusiness: async (): Promise<ApiEnvelope<Business>> => {
    try {
      const res = await api.get('/business/detail')

      return res.data
    }
    catch (error) {
      console.error('Error fetching business:', error)
      throw error
    }
  },

  handleUpdateBusiness: async (data: BusinessPayload): Promise<ApiEnvelope<Business>> => {
    try {
      const res = await api.put('/business/update', data)

      return res.data
    }
    catch (error) {
      console.error('Error updating business:', error)
      throw error
    }
  },
}
