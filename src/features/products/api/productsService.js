import { api } from '@/lib/api'

export const productsService = {

  getAll: async ({
    page = 1,
    limit = 5,
    name = '',
    code = '',
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

  if (code) {
    params.append('code', code)
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

}