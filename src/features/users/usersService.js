import {api} from '@/lib/api'

export const usersService = {
  getAll:       ()         => api.get('/users'),
  getById:      (id)       => api.get(`/users/${id}`),
  create:       (data)     => api.post('/users/create', data),
  update:       (id, data) => api.put(`/users/update/${id}`, data),
  remove:       (id)       => api.delete(`/users/destroy/${id}`),
}