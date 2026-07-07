import { api } from '@/lib/api'

export const productsService = {

  getAll: async ({
    page = 1,
    limit = 5,
    name = '',
    unit = '',
    category_product = '',
  }) => {
    const params = new URLSearchParams({
      page,
      limit,
    })

    if (name) {
      params.append('name', name)
    }

    if (unit) {
      params.append('unit', unit)
    }

    if (category_product) {
      params.append(
        'category_product',
        category_product
      )
    }

    const res =
      await api.get(`/products/filter?${params.toString()}`)

    return res
  },

  create: async (data) => {
    const res =
      await api.post('/products/create', data)
    return res
  }

}