import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { categoriesService } from '../api/categoriesService'

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: categoriesService.getAll,
  })
}

export const useParentCategories = () => {
  return useQuery({
    queryKey: ['categories', 'tree'],
    queryFn: categoriesService.getTree,
  })
}

export const useCreateCategory = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: categoriesService.create,
    onSuccess: () => {
      toast.success('Categoría creada exitosamente')
      queryClient.invalidateQueries(['categories'])
      queryClient.invalidateQueries(['categories', 'tree'])
    },
    onError: (error) => {
      toast.error('Error al crear la categoría')
      console.error('Error creating category:', error)
    }
  })
}

export const useUpdateCategory = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }) => categoriesService.update(id, data),
    onSuccess: () => {
      toast.success('Categoría actualizada exitosamente')
      queryClient.invalidateQueries(['categories'])
    },
    onError: (error) => {
      toast.error('Error al actualizar la categoría')
      console.error('Error updating category:', error)
    }
  })
}

export const useDeleteCategory = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id) => categoriesService.delete(id),
    onSuccess: () => {
      toast.success('Categoría eliminada exitosamente')
      queryClient.invalidateQueries(['categories'])
    },
    onError: (error) => {
      toast.error('Error al eliminar la categoría')
      console.error('Error deleting category:', error)
    }
  })
}