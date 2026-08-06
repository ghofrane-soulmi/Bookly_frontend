import { api } from '@/utils/api'
import type { ApiEnvelope, ListStaffParams, Staff, StaffPayload } from './types/staff.types'

export const staffApis = {
  handleListStaff: async (params: ListStaffParams = {}): Promise<ApiEnvelope<Staff[]>> => {
    try {
      const res = await api.get('/staff/list', { params })

      return res.data
    }
    catch (error) {
      console.error('Error fetching staff:', error)
      throw error
    }
  },

  handleGetStaff: async (id: number): Promise<ApiEnvelope<Staff>> => {
    try {
      const res = await api.get(`/staff/${id}/detail`)

      return res.data
    }
    catch (error) {
      console.error('Error fetching staff member:', error)
      throw error
    }
  },

  handleCreateStaff: async (data: StaffPayload): Promise<ApiEnvelope<Staff>> => {
    try {
      const res = await api.post('/staff/create', data)

      return res.data
    }
    catch (error) {
      console.error('Error creating staff member:', error)
      throw error
    }
  },

  handleUpdateStaff: async (id: number, data: Partial<StaffPayload>): Promise<ApiEnvelope<Staff>> => {
    try {
      const res = await api.put(`/staff/update/${id}`, data)

      return res.data
    }
    catch (error) {
      console.error('Error updating staff member:', error)
      throw error
    }
  },

  handleDeleteStaff: async (id: number): Promise<ApiEnvelope<null>> => {
    try {
      const res = await api.delete(`/staff/delete/${id}`)

      return res.data
    }
    catch (error) {
      console.error('Error deleting staff member:', error)
      throw error
    }
  },
}
