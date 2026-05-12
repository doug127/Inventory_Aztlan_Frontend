import { api } from '@/lib/api'

export const unitsService = {
  getAll: () => api.get('/units'),
  create: (data) => api.post('/units/create', data),
  update: (id, data) => api.put(`/units/update/${id}`, data),
  remove: (id) => api.delete(`/units/destroy/${id}`),
}