import { useQuery } from '@tanstack/react-query'
import { productsService } from '../api/productsService'

export const useProducts = () => {
  return useQuery({
    queryKey: ['products'],
    queryFn: productsService.getAll,
  })
}