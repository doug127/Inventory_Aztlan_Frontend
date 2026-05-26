import { api } from '@/lib/api'

export const productsService = {

  getAll: async ({
    page = 1,
    limit = 5,
  }) => {

    const res =
      await api.get(`/products/filter?page=${page}&limit=${limit}`)

    return res
  },

}