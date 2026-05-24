import {api} from '@/lib/api'

export const categoriesService = {
  getAll: async () => {
    return await api.get('/categories')
  },

  getTree: async () => {
    return await api.get('/categories/root')
  },

  create: async (data) => {
    return await api.post('/categories/create', data)
    },

  update: async (id, data) => {
    return await api.put(`/categories/update/${id}`, data)
  },

  delete: async (id) => {
    return await api.delete(`/categories/destroy/${id}`)
  }
}
