import { api } from '@/utils/api'
import type { ApiEnvelope, Role, RoleDetail, RolePayload } from './types/roles.types'

export const rolesApis = {
  handleListRoles: async (): Promise<ApiEnvelope<Role[]>> => {
    try {
      const res = await api.get('/roles/list')

      return res.data
    }
    catch (error) {
      console.error('Error fetching roles:', error)
      throw error
    }
  },

  handleGetRole: async (id: number): Promise<ApiEnvelope<RoleDetail>> => {
    try {
      const res = await api.get(`/roles/${id}/detail`)

      return res.data
    }
    catch (error) {
      console.error('Error fetching role:', error)
      throw error
    }
  },

  handleCreateRole: async (data: RolePayload): Promise<ApiEnvelope<RoleDetail>> => {
    try {
      const res = await api.post('/roles/create', data)

      return res.data
    }
    catch (error) {
      console.error('Error creating role:', error)
      throw error
    }
  },

  handleUpdateRole: async (id: number, data: Partial<RolePayload>): Promise<ApiEnvelope<RoleDetail>> => {
    try {
      const res = await api.put(`/roles/update/${id}`, data)

      return res.data
    }
    catch (error) {
      console.error('Error updating role:', error)
      throw error
    }
  },

  handleDeleteRole: async (id: number): Promise<ApiEnvelope<null>> => {
    try {
      const res = await api.delete(`/roles/delete/${id}`)

      return res.data
    }
    catch (error) {
      console.error('Error deleting role:', error)
      throw error
    }
  },
}
