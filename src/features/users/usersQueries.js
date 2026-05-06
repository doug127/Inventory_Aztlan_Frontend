import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersService } from './usersService'
import { toast } from 'sonner'

const QUERY_KEY = 'users'

export const useUsers = () => {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: usersService.getAll,
  })
}

export const useUserById = (id) => {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => usersService.getById(id),
  })
}

export const useCreateUser = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: usersService.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] })
      toast.success('Usuario creado correctamente')
    },
    onError: (error) => toast.error(error?.message ?? 'Error al crear usuario'),
  })
}

export const useUpdateUser = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => usersService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] })
      toast.success('Usuario actualizado correctamente')
    },
    onError: (error) => toast.error(error?.message ?? 'Error al actualizar usuario'),
  })
}

export const useDeleteUser = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: usersService.remove,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] })
      toast.success('Usuario eliminado correctamente')
    },
    onError: (error) => toast.error(error?.message ?? 'Error al eliminar usuario'),
  })
}