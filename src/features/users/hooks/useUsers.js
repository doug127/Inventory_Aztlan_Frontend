import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { usersService } from '../api/usersService'

const KEY = 'users'

export const usersKeys = {
  all: [KEY],
  list: (params) => [KEY, 'list', params],
  sessions: (id) => [KEY, 'sessions', id],
  roles: [KEY, 'assignable-roles'],
}

/** Lista paginada. La conexión de cada usuario cambia sola: se refresca cada minuto. */
export const useUsersList = (params) =>
  useQuery({
    queryKey: usersKeys.list(params),
    queryFn: () => usersService.list(params),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    refetchInterval: 60_000,
  })

export const useAssignableRoles = () =>
  useQuery({ queryKey: usersKeys.roles, queryFn: usersService.assignableRoles, staleTime: Infinity })

export const useUserSessions = (id, { enabled = true } = {}) =>
  useQuery({
    queryKey: usersKeys.sessions(id),
    queryFn: () => usersService.sessions(id),
    enabled: Boolean(id) && enabled,
    staleTime: 0,
  })

/**
 * Mutación sobre usuarios: al terminar refresca la lista (y las sesiones) y avisa con un toast.
 * `success` puede ser un texto o una función del resultado.
 */
const useUserMutation = (mutationFn, { success, silentErrors = false } = {}) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: (result, variables) => {
      qc.invalidateQueries({ queryKey: usersKeys.all })
      const message = typeof success === 'function' ? success(result, variables) : success
      if (message) toast.success(message)
    },
    onError: (error) => {
      if (!silentErrors) toast.error(error?.message ?? 'No se pudo completar la acción')
    },
  })
}

// Crear y editar muestran los errores dentro del formulario (por campo), no en un toast.
export const useCreateUser = () =>
  useUserMutation(usersService.create, {
    success: (user) => `Usuario creado. Se envió un correo a ${user.email} con sus datos de acceso.`,
    silentErrors: true,
  })

export const useUpdateUser = () =>
  useUserMutation(({ id, body }) => usersService.update(id, body), { success: 'Usuario actualizado', silentErrors: true })

export const useDeactivateUser = () =>
  useUserMutation(usersService.deactivate, { success: (u) => `${u.fullName} fue desactivado y se cerraron sus sesiones` })

export const useActivateUser = () => useUserMutation(usersService.activate, { success: (u) => `${u.fullName} fue reactivado` })

export const useUnlockUser = () =>
  useUserMutation(usersService.unlock, {
    success: ({ user, wasLocked }) => (wasLocked ? `${user.fullName} fue desbloqueado` : 'La cuenta no estaba bloqueada'),
  })

export const useForcePasswordReset = () =>
  useUserMutation(usersService.forcePasswordReset, {
    success: ({ user }) => `Se envió a ${user.email} un enlace para crear una contraseña nueva`,
  })

export const useRevokeSessions = () =>
  useUserMutation(usersService.revokeSessions, {
    success: ({ user, revokedSessions }) =>
      revokedSessions
        ? `Se cerraron ${revokedSessions} ${revokedSessions === 1 ? 'sesión' : 'sesiones'} de ${user.fullName}`
        : `${user.fullName} no tenía sesiones abiertas`,
  })
