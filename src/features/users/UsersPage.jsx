import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Plus, Search, UserX } from 'lucide-react'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'
import { EASE_OUT } from '@/features/auth/components/AuthUI'
import {
  useActivateUser,
  useAssignableRoles,
  useDeactivateUser,
  useForcePasswordReset,
  useRevokeSessions,
  useUnlockUser,
  useUsersList,
} from './hooks/useUsers'
import { canManage, timeAgo } from './usersUtils'
import { AccountStatus, Avatar, ConnectionStatus } from './components/StatusBadges'
import { UserActionsMenu } from './components/UserActionsMenu'
import { UserFormPanel } from './components/UserFormPanel'
import { UserSessionsPanel } from './components/UserSessionsPanel'

const PAGE_SIZE = 20

// Filtro de estado → parámetros de GET /api/users
const STATUS_FILTERS = [
  { id: 'all', label: 'Todos', params: {} },
  { id: 'active', label: 'Activos', params: { isActive: true } },
  { id: 'inactive', label: 'Inactivos', params: { isActive: false } },
  { id: 'locked', label: 'Bloqueados', params: { isLocked: true } },
  { id: 'online', label: 'Conectados', params: { connected: true } },
]

// Acciones que piden confirmación antes de ejecutarse.
const CONFIRMATIONS = {
  deactivate: (u) => ({
    title: `¿Desactivar a ${u.fullName}?`,
    description: 'No podrá iniciar sesión y se cerrarán todas sus sesiones. Podrás activarlo de nuevo cuando quieras.',
    confirmLabel: 'Desactivar',
    variant: 'destructive',
  }),
  'reset-password': (u) => ({
    title: `¿Restablecer la contraseña de ${u.fullName}?`,
    description: `Su contraseña actual dejará de funcionar, se cerrarán sus sesiones y recibirá en ${u.email} un enlace para crear una nueva.`,
    confirmLabel: 'Restablecer',
    variant: 'destructive',
  }),
  'revoke-sessions': (u) => ({
    title: `¿Cerrar las sesiones de ${u.fullName}?`,
    description: `Se cerrarán sus ${u.sessions.active} sesiones abiertas. Tendrá que volver a iniciar sesión en cada dispositivo.`,
    confirmLabel: 'Cerrar sesiones',
    variant: 'destructive',
  }),
}

const useDebounced = (value, delay = 300) => {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

/** Botón tipo "píldora" del diseño (filtros por rol). El activo se desliza con layoutId. */
function Chip({ active, onClick, children, group }) {
  return (
    <button
      type='button'
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'relative h-8 rounded-full border px-3.5 text-sm transition-colors',
        active ? 'border-transparent text-white' : 'border-line bg-white text-ink-900 hover:border-ink-500/40'
      )}
    >
      {active && (
        <motion.span
          layoutId={`chip-${group}`}
          className='absolute inset-0 rounded-full bg-ink-900'
          transition={{ type: 'spring', stiffness: 500, damping: 38 }}
        />
      )}
      <span className='relative'>{children}</span>
    </button>
  )
}

function SkeletonRows() {
  return Array.from({ length: 5 }, (_, i) => (
    <tr key={i} className='border-t border-line/60'>
      <td className='px-5 py-3.5' colSpan={6}>
        <div className='flex items-center gap-3'>
          <div className='size-9 animate-pulse rounded-full bg-sand-50' />
          <div className='space-y-1.5'>
            <div className='h-3 w-36 animate-pulse rounded bg-sand-50' />
            <div className='h-2.5 w-48 animate-pulse rounded bg-sand-50' />
          </div>
        </div>
      </td>
    </tr>
  ))
}

export const UsersPage = () => {
  const actor = useAuthStore((s) => s.user)
  const isSuperadmin = actor?.role?.code === 'SUPERADMIN'
  const navigate = useNavigate()
  const [roleCode, setRoleCode] = useState('')
  const [statusId, setStatusId] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebounced(search.trim())

  // Paneles y confirmación. Se guarda el id: así el panel muestra siempre la versión recién cargada.
  const [formState, setFormState] = useState({ open: false, userId: null })
  const [sessionsUserId, setSessionsUserId] = useState(null)
  const [confirm, setConfirm] = useState(null) // { type, user }

  const params = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      search: debouncedSearch,
      roleCode,
      sort: 'fullName',
      ...STATUS_FILTERS.find((f) => f.id === statusId).params,
    }),
    [page, debouncedSearch, roleCode, statusId]
  )

  // Cualquier cambio de filtro vuelve a la primera página.
  useEffect(() => setPage(1), [debouncedSearch, roleCode, statusId])

  const { data, isLoading, isFetching, isError, error } = useUsersList(params)
  const { data: roles = [] } = useAssignableRoles()
  const users = data?.data ?? []
  const pagination = data?.meta?.pagination
  const findUser = (id) => users.find((u) => u.id === id) ?? null

  const deactivate = useDeactivateUser()
  const activate = useActivateUser()
  const unlock = useUnlockUser()
  const resetPassword = useForcePasswordReset()
  const revokeSessions = useRevokeSessions()
  const RUN = {
    deactivate: (u) => deactivate.mutateAsync(u.id),
    activate: (u) => activate.mutateAsync(u.id),
    unlock: (u) => unlock.mutateAsync(u.id),
    'reset-password': (u) => resetPassword.mutateAsync(u.id),
    'revoke-sessions': (u) => revokeSessions.mutateAsync(u.id),
  }
  const confirmBusy = deactivate.isPending || resetPassword.isPending || revokeSessions.isPending

  const handleAction = (type, user) => {
    if (type === 'edit') return setFormState({ open: true, userId: user.id })
    if (type === 'sessions') return setSessionsUserId(user.id)
    if (type === 'activity') return navigate(`/admin/security-log?${new URLSearchParams({ userId: user.id, name: user.fullName })}`)
    if (CONFIRMATIONS[type]) return setConfirm({ type, user })
    RUN[type](user).catch(() => {}) // el toast de error lo muestra el hook
  }

  const runConfirmed = async () => {
    try {
      await RUN[confirm.type](confirm.user)
    } catch {
      // el hook ya mostró el error
    } finally {
      setConfirm(null)
    }
  }

  const sessionsUser = sessionsUserId ? findUser(sessionsUserId) : null
  const formUser = formState.userId ? findUser(formState.userId) : null

  return (
    <MotionConfig reducedMotion='user'>
      <div className='mx-auto max-w-6xl font-plex text-ink-900'>
        {/* Encabezado */}
        <motion.header
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: EASE_OUT }}
          className='flex flex-wrap items-end justify-between gap-4'
        >
          <div>
            <h1 className='text-[1.75rem] font-semibold tracking-tight'>Usuarios</h1>
            <p className='mt-0.5 text-sm text-ink-500'>
              {pagination ? `${pagination.totalItems} ${pagination.totalItems === 1 ? 'usuario' : 'usuarios'}` : '—'} ·{' '}
              {roles.length} {roles.length === 1 ? 'rol' : 'roles'}
            </p>
          </div>
          <motion.button
            type='button'
            whileTap={{ scale: 0.97 }}
            onClick={() => setFormState({ open: true, userId: null })}
            className='inline-flex h-10 items-center gap-2 rounded-md bg-forest-700 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-forest-800'
          >
            <Plus className='size-4' aria-hidden />
            Nuevo usuario
          </motion.button>
        </motion.header>

        {/* Filtros */}
        <div className='mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
          <div className='flex flex-wrap gap-2' role='group' aria-label='Filtrar por rol'>
            <Chip group='role' active={!roleCode} onClick={() => setRoleCode('')}>
              Todos
            </Chip>
            {roles.map((role) => (
              <Chip key={role.code} group='role' active={roleCode === role.code} onClick={() => setRoleCode(role.code)}>
                {role.name}
              </Chip>
            ))}
          </div>

          <div className='flex flex-col gap-2 sm:flex-row sm:items-center'>
            <div className='relative'>
              <Search className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-500' aria-hidden />
              <input
                type='search'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder='Buscar nombre, usuario o correo'
                aria-label='Buscar usuarios'
                className='h-9 w-full rounded-md border border-line bg-white pl-9 pr-3 text-sm outline-none transition focus:border-forest-700 focus:ring-4 focus:ring-forest-700/10 sm:w-64'
              />
            </div>
            <select
              value={statusId}
              onChange={(e) => setStatusId(e.target.value)}
              aria-label='Filtrar por estado'
              className='h-9 cursor-pointer rounded-md border border-line bg-white px-3 text-sm outline-none transition focus:border-forest-700 focus:ring-4 focus:ring-forest-700/10'
            >
              {STATUS_FILTERS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.id === 'all' ? 'Todos los estados' : f.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabla */}
        <div className='mt-4 overflow-hidden rounded-xl border border-line/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]'>
          <div className='overflow-x-auto'>
            <table className='w-full text-left'>
              <thead className='bg-sand-50/70 text-xs font-medium text-ink-500'>
                <tr>
                  <th className='px-5 py-3 font-medium'>Usuario</th>
                  <th className='hidden px-4 py-3 font-medium md:table-cell'>Rol</th>
                  <th className='px-4 py-3 font-medium'>Estado</th>
                  <th className='hidden px-4 py-3 font-medium lg:table-cell'>Conexión</th>
                  <th className='hidden px-4 py-3 font-medium xl:table-cell'>Último acceso</th>
                  <th className='w-14 px-4 py-3'>
                    <span className='sr-only'>Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody className={cn('transition-opacity', isFetching && !isLoading && 'opacity-60')}>
                {isLoading && <SkeletonRows />}
                <AnimatePresence initial={false}>
                  {users.map((user, i) => {
                    const self = user.id === actor?.id
                    const manageable = canManage(actor, user)
                    return (
                      <motion.tr
                        key={user.id}
                        layout='position'
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1, transition: { delay: Math.min(i, 10) * 0.02 } }}
                        exit={{ opacity: 0 }}
                        className='border-t border-line/60 transition-colors hover:bg-sand-50/50'
                      >
                        <td className='px-5 py-3'>
                          <div className='flex items-center gap-3'>
                            <Avatar name={user.fullName} className={!user.isActive ? 'opacity-50' : undefined} />
                            <div className='min-w-0'>
                              <p className='flex items-center gap-2 truncate text-sm font-semibold'>
                                {user.fullName}
                                {self && <span className='rounded bg-forest-100 px-1.5 py-px text-[11px] font-medium text-forest-800'>Tú</span>}
                              </p>
                              <p className='truncate text-xs text-ink-500'>{user.email}</p>
                              <p className='truncate text-xs text-ink-500 md:hidden'>{user.role.name}</p>
                            </div>
                          </div>
                        </td>
                        <td className='hidden px-4 py-3 text-sm md:table-cell'>{user.role.name}</td>
                        <td className='px-4 py-3'>
                          <AccountStatus user={user} />
                          {user.mustChangePassword && user.isActive && (
                            <p className='mt-0.5 text-xs text-ink-500'>Pendiente primer ingreso</p>
                          )}
                        </td>
                        <td className='hidden px-4 py-3 lg:table-cell'>
                          <ConnectionStatus sessions={user.sessions} />
                        </td>
                        <td className='hidden px-4 py-3 text-sm text-ink-500 xl:table-cell'>
                          {user.lastLoginAt ? timeAgo(user.lastLoginAt) : 'Nunca'}
                        </td>
                        <td className='px-4 py-3 text-right'>
                          {manageable && <UserActionsMenu user={user} onAction={handleAction} showActivity={isSuperadmin} />}
                        </td>
                      </motion.tr>
                    )
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {!isLoading && !isError && users.length === 0 && (
            <div className='flex flex-col items-center px-6 py-14 text-center'>
              <span className='grid size-11 place-items-center rounded-full bg-sand-50 text-ink-500'>
                <UserX className='size-5' aria-hidden />
              </span>
              <p className='mt-3 text-sm font-medium'>No hay usuarios con esos filtros</p>
              <p className='mt-1 text-xs text-ink-500'>Prueba con otra búsqueda o quita los filtros.</p>
            </div>
          )}

          {isError && <p className='px-6 py-10 text-center text-sm text-red-600'>{error?.message ?? 'No se pudieron cargar los usuarios'}</p>}

          {pagination && pagination.totalPages > 1 && (
            <div className='flex items-center justify-between border-t border-line/60 px-5 py-3 text-sm text-ink-500'>
              <span>
                {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.totalItems)} de{' '}
                {pagination.totalItems}
              </span>
              <div className='flex gap-1'>
                <button
                  type='button'
                  disabled={!pagination.hasPrevPage}
                  onClick={() => setPage((p) => p - 1)}
                  aria-label='Página anterior'
                  className='grid size-8 place-items-center rounded-md border border-line bg-white text-ink-900 transition-colors hover:bg-sand-50 disabled:opacity-40'
                >
                  <ChevronLeft className='size-4' />
                </button>
                <button
                  type='button'
                  disabled={!pagination.hasNextPage}
                  onClick={() => setPage((p) => p + 1)}
                  aria-label='Página siguiente'
                  className='grid size-8 place-items-center rounded-md border border-line bg-white text-ink-900 transition-colors hover:bg-sand-50 disabled:opacity-40'
                >
                  <ChevronRight className='size-4' />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <UserFormPanel
        open={formState.open}
        user={formUser}
        onClose={() => setFormState({ open: false, userId: null })}
      />

      <UserSessionsPanel
        user={sessionsUser}
        canManage={sessionsUser ? canManage(actor, sessionsUser) : false}
        onClose={() => setSessionsUserId(null)}
      />

      <ConfirmDialog
        open={Boolean(confirm)}
        onOpenChange={(open) => !open && !confirmBusy && setConfirm(null)}
        loading={confirmBusy}
        onConfirm={runConfirmed}
        {...(confirm ? CONFIRMATIONS[confirm.type](confirm.user) : {})}
      />
    </MotionConfig>
  )
}
