import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { productsService } from '../api/productsService'
import { toast } from 'sonner'

export const useProducts = ({
  page = 1,
  limit = 5,
  name = '',
  unit = '',
  category_product = '',
}) => {
  return useQuery({
    queryKey: ['products', page, limit, name, unit, category_product],
    queryFn: () => productsService.getAll({ page, limit, name, unit, category_product }),
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
    },
    onError: (error) => {
      toast.error('Error al crear el producto')
      console.error('Error creating product:', error)
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
    },
    onError: (error) => {
      toast.error('Error al actualizar el producto')
      console.error('Error updating product:', error)
    }
  })
}

