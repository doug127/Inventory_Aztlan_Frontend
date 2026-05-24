import { api } from '@/lib/api'

export const productsService = {

  getAll: async () => {

    const res =
      await api.get('/products/filter')

    return res.data || []
  },

}