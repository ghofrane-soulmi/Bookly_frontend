import { api } from '@/utils/api'
import type { ApiEnvelope, Client, ClientDetail, ClientPayload, ListClientsParams } from './types/clients.types'

export const clientsApis = {
  handleListClients: async (params: ListClientsParams = {}): Promise<ApiEnvelope<Client[]>> => {
    try {
      const res = await api.get('/clients/list', { params })

      return res.data
    }
    catch (error) {
      console.error('Error fetching clients:', error)
      throw error
    }
  },

  handleGetClient: async (id: number): Promise<ApiEnvelope<ClientDetail>> => {
    try {
      const res = await api.get(`/clients/${id}/detail`)

      return res.data
    }
    catch (error) {
      console.error('Error fetching client:', error)
      throw error
    }
  },

  handleCreateClient: async (data: ClientPayload): Promise<ApiEnvelope<Client>> => {
    try {
      const res = await api.post('/clients/create', data)

      return res.data
    }
    catch (error) {
      console.error('Error creating client:', error)
      throw error
    }
  },

  handleUpdateClient: async (id: number, data: Partial<ClientPayload>): Promise<ApiEnvelope<Client>> => {
    try {
      const res = await api.put(`/clients/update/${id}`, data)

      return res.data
    }
    catch (error) {
      console.error('Error updating client:', error)
      throw error
    }
  },

  handleDeleteClient: async (id: number): Promise<ApiEnvelope<null>> => {
    try {
      const res = await api.delete(`/clients/delete/${id}`)

      return res.data
    }
    catch (error) {
      console.error('Error deleting client:', error)
      throw error
    }
  },
}
