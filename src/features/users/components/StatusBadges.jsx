import { motion } from 'framer-motion'
import { Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { initials, timeAgo } from '../usersUtils'

/** Estado de la cuenta: Activo, Inactivo o Bloqueado (con el tiempo que falta). */
export function AccountStatus({ user }) {
  if (!user.isActive) {
    return (
      <span className='inline-flex items-center gap-1.5 text-sm text-ink-500'>
        <span className='size-1.5 rounded-full bg-ink-500/60' aria-hidden />
        Inactivo
      </span>
    )
  }
  if (user.isLocked) {
    return (
      <span
        className='inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2 py-0.5 text-sm font-medium text-amber-700'
        title={`Bloqueado por intentos fallidos hasta ${new Date(user.lockedUntil).toLocaleTimeString('es')}`}
      >
        <Lock className='size-3.5' aria-hidden />
        Bloqueado
      </span>
    )
  }
  return (
    <span className='inline-flex items-center gap-1.5 text-sm text-forest-700'>
      <span className='size-1.5 rounded-full bg-forest-700' aria-hidden />
      Activo
    </span>
  )
}

const CONNECTION = {
  ONLINE: { label: 'En línea', dot: 'bg-emerald-500', text: 'text-ink-900' },
  IDLE: { label: 'Sesión abierta', dot: 'bg-amber-400', text: 'text-ink-900' },
  OFFLINE: { label: 'Desconectado', dot: 'bg-ink-500/40', text: 'text-ink-500' },
}

/** Conexión según sus sesiones: en línea (actividad reciente), sesión abierta o desconectado. */
export function ConnectionStatus({ sessions, className }) {
  const { label, dot, text } = CONNECTION[sessions.status] ?? CONNECTION.OFFLINE
  const detail =
    sessions.status === 'OFFLINE'
      ? null
      : `${sessions.active} ${sessions.active === 1 ? 'dispositivo' : 'dispositivos'} · ${timeAgo(sessions.lastActivityAt)}`
  return (
    <div className={cn('min-w-0', className)}>
      <span className={cn('inline-flex items-center gap-1.5 text-sm', text)}>
        <span className='relative grid size-2 place-items-center' aria-hidden>
          {sessions.status === 'ONLINE' && (
            <motion.span
              className='absolute size-2 rounded-full bg-emerald-500'
              animate={{ scale: [1, 2.2], opacity: [0.5, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
            />
          )}
          <span className={cn('size-2 rounded-full', dot)} />
        </span>
        {label}
      </span>
      {detail && <p className='mt-0.5 truncate text-xs text-ink-500'>{detail}</p>}
    </div>
  )
}

/** Círculo con las iniciales del usuario. */
export function Avatar({ name, className }) {
  return (
    <span
      className={cn('grid size-9 shrink-0 place-items-center rounded-full bg-sand-50 text-xs font-semibold text-ink-900 ring-1 ring-line', className)}
      aria-hidden
    >
      {initials(name)}
    </span>
  )
}
