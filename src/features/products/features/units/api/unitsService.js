import { api } from '@/lib/api'

export const unitsService = {
  getAll: async ({
    page = 1,
    limit = 5,
    name = '',
    code = '',
    base_unit = ''
  }) => {
    const params = new URLSearchParams({
      page,
      limit,
    })

    if (name) {
      params.append('name', name);
    }

    if (code) {
      params.append('code', code);
    }

    if (base_unit) {
      params.append('base_unit', base_unit);
    }
    const res = await api.get(`/units/?${params.toString()}`)
    return res;
  },

  getBaseUnits: async () => {
    return await api.get('/units/base-units')
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