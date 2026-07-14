import { api } from '@/utils/api'
import type { ApiEnvelope, ListServicesParams, Service, ServicePayload } from './types/services.types'

export const servicesApis = {
  handleListServices: async (params: ListServicesParams = {}): Promise<ApiEnvelope<Service[]>> => {
    try {
      const res = await api.get('/services/list', { params })

      return res.data
    }
    catch (error) {
      console.error('Error fetching services:', error)
      throw error
    }
  },

  handleGetService: async (id: number): Promise<ApiEnvelope<Service>> => {
    try {
      const res = await api.get(`/services/${id}/detail`)

      return res.data
    }
    catch (error) {
      console.error('Error fetching service:', error)
      throw error
    }
  },

  handleCreateService: async (data: ServicePayload): Promise<ApiEnvelope<Service>> => {
    try {
      const res = await api.post('/services/create', data)

      return res.data
    }
    catch (error) {
      console.error('Error creating service:', error)
      throw error
    }
  },

  handleUpdateService: async (id: number, data: Partial<ServicePayload>): Promise<ApiEnvelope<Service>> => {
    try {
      const res = await api.put(`/services/update/${id}`, data)

      return res.data
    }
    catch (error) {
      console.error('Error updating service:', error)
      throw error
    }
  },

  handleDeleteService: async (id: number): Promise<ApiEnvelope<null>> => {
    try {
      const res = await api.delete(`/services/delete/${id}`)

      return res.data
    }
    catch (error) {
      console.error('Error deleting service:', error)
      throw error
    }
  },
}
