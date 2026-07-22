import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { productsService } from '../api/productsService'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/authStore'

export const useProducts = ({
  page = 1,
  limit = 5,
  name = '',
  unit = '',
  category_product = '',
}) => {
  const user = useAuthStore(
    (state) => state.user
  );

  return useQuery({
    queryKey: ['products', user?.id, user?.hierarchy_level, page, limit, name, unit, category_product],
    queryFn: () => productsService.getAll({ page, limit, name, unit, category_product }),
    enabled: !!user?.id,
    placeholderData: (previousData) => previousData,
    keepPreviousData: true,
  })
}

export const useCreateProduct = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data) => productsService.create(data),
    onSuccess: () => {
      toast.success('Producto creado exitosamente')
      queryClient.invalidateQueries(['products'])
    }
  })
}

export const useUpdateProduct = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }) => productsService.update(id, data),
    onSuccess: () => {
      toast.success('Producto actualizado exitosamente')
      queryClient.invalidateQueries(['products'])
    }
  })

}

export const useDeleteProduct = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id) => productsService.delete(id),
    onSuccess: () => {
      toast.success('Producto eliminado exitosamente')
      queryClient.invalidateQueries({
        queryKey: ['products']
      })
    },
    onError: (error) => {
      toast.error('Error al eliminar el producto')
      console.error('Error deleting product:', error)
    },
  })
}

