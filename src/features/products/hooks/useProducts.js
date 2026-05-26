import { useQuery } from '@tanstack/react-query'
import { productsService } from '../api/productsService'

export const useProducts = ({
  page = 1,
  limit = 5,
}) => {
  return useQuery({
    queryKey: ['products', page, limit],
    queryFn: () => productsService.getAll({ page, limit }),
    keepPreviousData: true,
  })
}