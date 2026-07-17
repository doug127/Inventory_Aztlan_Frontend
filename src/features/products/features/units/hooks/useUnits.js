import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { unitsService } from '../api/unitsService'

export const useAllUnits = ({
  page = 1,
  limit = 5,
  name = '',
  code = '',
  base_unit = ''
} = {}) => {

  return useQuery({
    queryKey: ['units', page, limit, name, code, base_unit],
    queryFn: () => unitsService.getAll({page, limit, name, code, base_unit}),
    keepPreviousData: true
  })
}

export const useBaseUnits = () => {
  return useQuery({
    queryKey: ['base-units'],
    queryFn: unitsService.getBaseUnits,
  })
}

export const useCreateUnit = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data) => unitsService.create(data),

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