import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { unitsService } from '../api/unitsService'

export const useUnits = () => {
  return useQuery({
    queryKey: ['units'],
    queryFn: unitsService.getAll,
  })
}

export const useCreateUnit = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: unitsService.create,

    onSuccess: () => {
      toast.success('Unidad creada')
      queryClient.invalidateQueries({ queryKey: ['units'] })
    },
  })
}

export const useUpdateUnit = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }) => unitsService.update(id, data),

    onSuccess: () => {
      toast.success('Unidad actualizada')
      queryClient.invalidateQueries({ queryKey: ['units'] })
    },
  })
}

export const useDeleteUnit = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: unitsService.remove,

    onSuccess: () => {
      toast.success('Unidad eliminada')
      queryClient.invalidateQueries({ queryKey: ['units'] })
    },
  })
}