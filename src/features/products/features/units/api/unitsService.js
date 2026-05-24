import { api } from '@/lib/api'

export const unitsService = {
  ggetAll: async () => {
    return await api.get('/units')
  },

  getBaseUnits: async () => {
    return await api.get('/units/base-units')
    console.log('baseUnits', response.data)
  },

  create: async (data) => {
    return await api.post('/units/create', data)
  },

  update: async (id, data) => {
    return await api.put(`/units/update/${id}`, data)
  },

  remove: async (id) => {
    return await api.delete(`/units/delete/${id}`)
  },
}