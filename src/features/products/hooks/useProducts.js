import { useQuery } from '@tanstack/react-query'
import { productsService } from '../api/productsService'

export const useProducts = ({
  page = 1,
  limit = 5,
  name = '',
  code = '',
  unit = '',
  category_product = '',
}) => {
  return useQuery({
    queryKey: ['products', page, limit, name, code, unit, category_product],
    queryFn: () => productsService.getAll({ page, limit, name, code, unit, category_product }),
    keepPreviousData: true,
  })
}