import { api } from '@/utils/api'
import type { Appointment, AppointmentPayload, ApiEnvelope, ListAppointmentsParams } from './types/appointments.types'

export const appointmentsApis = {
  handleListAppointments: async (params: ListAppointmentsParams = {}): Promise<ApiEnvelope<Appointment[]>> => {
    try {
      const res = await api.get('/appointments/list', { params })

      return res.data
    }
    catch (error) {
      console.error('Error fetching appointments:', error)
      throw error
    }
  },

  handleGetAppointment: async (id: number): Promise<ApiEnvelope<Appointment>> => {
    try {
      const res = await api.get(`/appointments/${id}/detail`)

      return res.data
    }
    catch (error) {
      console.error('Error fetching appointment:', error)
      throw error
    }
  },

  handleCreateAppointment: async (data: Partial<AppointmentPayload>): Promise<ApiEnvelope<Appointment>> => {
    try {
      const res = await api.post('/appointments/create', data)

      return res.data
    }
    catch (error) {
      console.error('Error creating appointment:', error)
      throw error
    }
  },

  handleUpdateAppointment: async (id: number, data: Partial<AppointmentPayload>): Promise<ApiEnvelope<Appointment>> => {
    try {
      const res = await api.put(`/appointments/update/${id}`, data)

      return res.data
    }
    catch (error) {
      console.error('Error updating appointment:', error)
      throw error
    }
  },

  handleDeleteAppointment: async (id: number): Promise<ApiEnvelope<null>> => {
    try {
      const res = await api.delete(`/appointments/delete/${id}`)

      return res.data
    }
    catch (error) {
      console.error('Error deleting appointment:', error)
      throw error
    }
  },
}
