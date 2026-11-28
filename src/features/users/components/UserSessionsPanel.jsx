import { AnimatePresence, motion } from 'framer-motion'
import { Loader2, LogOut, Monitor, Smartphone } from 'lucide-react'
import { useRevokeSessions, useUserSessions } from '../hooks/useUsers'
import { describeDevice, formatDateTime, timeAgo } from '../usersUtils'
import { SidePanel } from '@/components/common/SidePanel'
import { ConnectionStatus } from './StatusBadges'

/** Dispositivos con sesión abierta de un usuario (HU-109), con [Cerrar sesiones]. */
export function UserSessionsPanel({ user, canManage, onClose }) {
  const open = Boolean(user)
  const { data: sessions = [], isLoading, isError, error } = useUserSessions(user?.id, { enabled: open })
  const revoke = useRevokeSessions()

  return (
    <SidePanel
      open={open}
      onClose={onClose}
      title='Sesiones'
      subtitle={user ? `${user.fullName} · ${user.email}` : undefined}
      footer={
        canManage && sessions.length > 0 ? (
          <>
            <button
              type='button'
              onClick={onClose}
              className='h-11 rounded-md border border-line bg-white text-[15px] font-semibold text-ink-900 transition-colors hover:bg-sand-50'
            >
              Cerrar
            </button>
            <button
              type='button'
              disabled={revoke.isPending}
              onClick={() => revoke.mutate(user.id)}
              className='flex h-11 items-center justify-center gap-2 rounded-md bg-red-600 text-[15px] font-semibold text-blanco transition-colors hover:bg-red-700 disabled:opacity-70'
            >
              {revoke.isPending ? <Loader2 className='size-4 animate-spin' /> : <LogOut className='size-4' />}
              Cerrar todas las sesiones
            </button>
          </>
        ) : null
      }
    >
      {user && <ConnectionStatus sessions={user.sessions} className='mb-5' />}

      {isLoading && (
        <div className='flex justify-center py-10 text-forest-700'>
          <Loader2 className='size-6 animate-spin' aria-label='Cargando sesiones' />
        </div>
      )}

      {isError && <p className='text-sm text-red-600'>{error?.message ?? 'No se pudieron cargar las sesiones'}</p>}

      {!isLoading && !isError && sessions.length === 0 && (
        <div className='rounded-lg border border-dashed border-line px-5 py-8 text-center'>
          <p className='text-sm font-medium text-ink-900'>Sin sesiones abiertas</p>
          <p className='mt-1 text-xs text-ink-500'>
            {user?.lastLoginAt ? `Último inicio de sesión ${timeAgo(user.lastLoginAt)}.` : 'Todavía no ha iniciado sesión.'}
          </p>
        </div>
      )}

      <ul className='space-y-2.5'>
        <AnimatePresence initial={false}>
          {sessions.map((session, i) => {
            const device = describeDevice(session.userAgent)
            const Icon = device.mobile ? Smartphone : Monitor
            return (
              <motion.li
                key={session.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0, transition: { delay: i * 0.04 } }}
                exit={{ opacity: 0, x: 24 }}
                className='flex gap-3.5 rounded-lg border border-line/80 px-4 py-3.5'
              >
                <span className='grid size-9 shrink-0 place-items-center rounded-md bg-forest-50 text-forest-700'>
                  <Icon className='size-[18px]' aria-hidden />
                </span>
                <div className='min-w-0 text-sm'>
                  <p className='truncate font-medium text-ink-900'>{device.name}</p>
                  <p className='mt-0.5 text-xs text-ink-500'>
                    {session.ipAddress ?? 'IP desconocida'} · activa {timeAgo(session.lastActiveAt)}
                  </p>
                  <p className='mt-0.5 text-xs text-ink-500'>Vence {formatDateTime(session.expiresAt)}</p>
                </div>
              </motion.li>
            )
          })}
        </AnimatePresence>
      </ul>

      {sessions.length > 0 && (
        <p className='mt-5 text-xs leading-relaxed text-ink-500'>
          Al cerrar las sesiones, cada dispositivo pierde el acceso en máximo 15 minutos, cuando vence su acceso actual.
        </p>
      )}
    </SidePanel>
  )
}
