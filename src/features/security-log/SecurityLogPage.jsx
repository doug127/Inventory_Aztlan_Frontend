import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Globe, Monitor, Search, ShieldAlert, Smartphone, UserRound, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { describeDevice, formatDateTime, timeAgo } from '@/lib/format'
import { EASE_OUT } from '@/features/auth/components/AuthUI'
import { EVENT_TYPES, PRESETS, TONES } from './eventCatalog'
import { useSecurityEventCount, useSecurityEvents } from './securityLogApi'
import { TABLE_PAGE_SIZE } from '@/lib/pagination'

const PAGE_SIZE = TABLE_PAGE_SIZE

/** AAAA-MM-DD de hoy en la hora local (el backend interpreta el día completo). */
const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const useDebounced = (value, delay = 350) => {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

const IPV4 = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/
/** IPv4 completa o algo con forma de IPv6 (el backend hace la validación estricta). */
const isValidIp = (value) => IPV4.test(value) || (/^[0-9a-f:.]+$/i.test(value) && value.includes(':') && value.length >= 3)

const inputClass =
  'h-9 rounded-md border border-line bg-white px-3 text-sm outline-none transition focus:border-forest-700 focus:ring-4 focus:ring-forest-700/10'

/** Contador del día; al pulsarlo aplica ese filtro. */
function StatCard({ label, types, tone, active, onSelect }) {
  const { data: count, isLoading } = useSecurityEventCount({ eventType: types, from: today() })
  return (
    <button
      type='button'
      onClick={onSelect}
      aria-pressed={active}
      className={cn(
        'rounded-xl border bg-white px-5 py-4 text-left transition-colors hover:border-ink-500/40',
        active ? 'border-forest-700 ring-4 ring-forest-700/10' : 'border-line/80'
      )}
    >
      <p className='text-xs text-ink-500'>{label}</p>
      <motion.p
        key={count}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn('mt-1 text-2xl font-semibold tabular-nums', tone === 'danger' && count > 0 ? 'text-red-600' : 'text-ink-900')}
      >
        {isLoading ? '—' : count}
      </motion.p>
    </button>
  )
}

function EventBadge({ type }) {
  const meta = EVENT_TYPES[type] ?? { label: type, icon: ShieldAlert, tone: 'neutral' }
  const Icon = meta.icon
  return (
    <span className='inline-flex items-center gap-2.5'>
      <span className={cn('grid size-8 shrink-0 place-items-center rounded-md', TONES[meta.tone])}>
        <Icon className='size-4' aria-hidden />
      </span>
      <span className='text-sm font-medium text-ink-900'>{meta.label}</span>
    </span>
  )
}

/**
 * Bitácora de seguridad (HU-110, user_flow.md §15). Solo lectura y solo para el SUPERADMIN.
 * Los filtros viven en la URL: se pueden compartir y el botón "atrás" los respeta.
 */
export function SecurityLogPage() {
  const [params, setParams] = useSearchParams()
  const presetId = params.get('preset') ?? 'access'
  const userId = params.get('userId') ?? ''
  const userName = params.get('name') ?? ''
  const ip = params.get('ip') ?? ''
  const from = params.get('from') ?? ''
  const to = params.get('to') ?? ''
  const page = Number(params.get('page') ?? 1)
  const [search, setSearch] = useState(params.get('username') ?? '')
  const username = useDebounced(search.trim())
  const [ipInput, setIpInput] = useState(ip)
  const typedIp = useDebounced(ipInput.trim())
  const ipInvalid = Boolean(typedIp) && !isValidIp(typedIp)

  /** Cambia filtros en la URL; cualquier filtro nuevo vuelve a la página 1. */
  const update = (changes, { keepPage = false } = {}) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        for (const [key, value] of Object.entries(changes)) {
          if (value === '' || value === null || value === undefined) next.delete(key)
          else next.set(key, String(value))
        }
        if (!keepPage) next.delete('page')
        return next
      },
      { replace: true }
    )

  useEffect(() => {
    if ((params.get('username') ?? '') !== username) update({ username })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username])

  // La IP solo se aplica cuando está completa; si se pulsa una IP en la tabla, se copia al campo.
  useEffect(() => {
    if (!ipInvalid && typedIp !== ip) update({ ip: typedIp })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typedIp, ipInvalid])
  useEffect(() => setIpInput(ip), [ip])

  const preset = PRESETS.find((p) => p.id === presetId) ?? PRESETS[0]
  const query = useMemo(
    () => ({ page, limit: PAGE_SIZE, eventType: preset.types, userId, username, ip, from, to }),
    [page, preset, userId, username, ip, from, to]
  )
  const { data, isLoading, isFetching, isError, error } = useSecurityEvents(query)
  const events = data?.data ?? []
  const pagination = data?.meta?.pagination
  const hasFilters = Boolean(userId || username || ip || from || to || presetId !== 'access')

  const todayActive = (id) => presetId === id && from === today() && !to

  return (
    <MotionConfig reducedMotion='user'>
      <div className='mx-auto max-w-6xl font-plex text-ink-900'>
        <motion.header initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: EASE_OUT }}>
          <h1 className='text-[1.75rem] font-semibold tracking-tight'>Bitácora de seguridad</h1>
          <p className='mt-0.5 text-sm text-ink-500'>Inicios de sesión, intentos fallidos, bloqueos y cambios de contraseña · solo lectura</p>
        </motion.header>

        {/* Resumen del día */}
        <div className='mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4'>
          <StatCard label='Inicios de sesión hoy' types={['LOGIN_SUCCESS']} active={todayActive('sessions')} onSelect={() => update({ preset: 'sessions', from: today(), to: '' })} />
          <StatCard label='Intentos fallidos hoy' types={['LOGIN_FAILED']} tone='danger' active={todayActive('failed')} onSelect={() => update({ preset: 'failed', from: today(), to: '' })} />
          <StatCard label='Bloqueos hoy' types={['ACCOUNT_LOCKED']} tone='danger' active={todayActive('locks')} onSelect={() => update({ preset: 'locks', from: today(), to: '' })} />
          <StatCard
            label='Cambios de contraseña hoy'
            types={['PASSWORD_CHANGED', 'PASSWORD_RESET_COMPLETED']}
            active={todayActive('passwords')}
            onSelect={() => update({ preset: 'passwords', from: today(), to: '' })}
          />
        </div>

        {/* Filtros */}
        <div className='mt-6 flex flex-wrap gap-2' role='group' aria-label='Tipo de evento'>
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type='button'
              onClick={() => update({ preset: p.id === 'access' ? '' : p.id })}
              aria-pressed={preset.id === p.id}
              className={cn(
                'relative h-8 rounded-full border px-3.5 text-sm transition-colors',
                preset.id === p.id ? 'border-transparent text-white' : 'border-line bg-white hover:border-ink-500/40'
              )}
            >
              {preset.id === p.id && (
                <motion.span layoutId='preset-chip' className='absolute inset-0 rounded-full bg-ink-900' transition={{ type: 'spring', stiffness: 500, damping: 38 }} />
              )}
              <span className='relative'>{p.label}</span>
            </button>
          ))}
        </div>

        <div className='mt-3 flex flex-wrap items-center gap-2'>
          <div className='relative'>
            <Search className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-500' aria-hidden />
            <input
              type='search'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder='Usuario o correo'
              aria-label='Buscar por usuario'
              className={cn(inputClass, 'w-52 pl-9')}
            />
          </div>
          <input
            value={ipInput}
            onChange={(e) => setIpInput(e.target.value)}
            placeholder='IP'
            aria-label='Filtrar por IP'
            aria-invalid={ipInvalid}
            title={ipInvalid ? 'Escribe una IP completa, p. ej. 192.168.1.40' : undefined}
            className={cn(inputClass, 'w-40 aria-[invalid=true]:border-amber-500')}
          />
          <label className='flex items-center gap-1.5 text-sm text-ink-500'>
            Desde
            <input type='date' value={from} max={to || undefined} onChange={(e) => update({ from: e.target.value })} className={inputClass} />
          </label>
          <label className='flex items-center gap-1.5 text-sm text-ink-500'>
            Hasta
            <input type='date' value={to} min={from || undefined} onChange={(e) => update({ to: e.target.value })} className={inputClass} />
          </label>
          {hasFilters && (
            <button
              type='button'
              onClick={() => {
                setSearch('')
                setIpInput('')
                setParams({}, { replace: true })
              }}
              className='h-9 rounded-md px-2 text-sm font-semibold text-forest-700 hover:underline'
            >
              Limpiar filtros
            </button>
          )}
        </div>

        <AnimatePresence>
          {userId && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className='overflow-hidden'>
              <span className='mt-3 inline-flex items-center gap-2 rounded-full bg-forest-100 py-1 pl-3 pr-1.5 text-sm text-forest-800'>
                <UserRound className='size-3.5' aria-hidden />
                Actividad de {userName || `usuario #${userId}`}
                <button type='button' onClick={() => update({ userId: '', name: '' })} aria-label='Quitar filtro de usuario' className='grid size-5 place-items-center rounded-full hover:bg-forest-700/10'>
                  <X className='size-3.5' />
                </button>
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Eventos */}
        <div className='mt-4 overflow-hidden rounded-xl border border-line/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]'>
          <div className='overflow-x-auto'>
            <table className='w-full text-left'>
              <thead className='bg-sand-50/70 text-xs text-ink-500'>
                <tr>
                  <th className='px-5 py-3 font-medium'>Evento</th>
                  <th className='px-4 py-3 font-medium'>Usuario</th>
                  <th className='hidden px-4 py-3 font-medium md:table-cell'>Origen</th>
                  <th className='px-4 py-3 text-right font-medium'>Fecha</th>
                </tr>
              </thead>
              <tbody className={cn('transition-opacity', isFetching && !isLoading && 'opacity-60')}>
                {isLoading &&
                  Array.from({ length: 6 }, (_, i) => (
                    <tr key={i} className='border-t border-line/60'>
                      <td colSpan={4} className='px-5 py-3.5'>
                        <div className='h-8 animate-pulse rounded bg-sand-50' />
                      </td>
                    </tr>
                  ))}
                <AnimatePresence initial={false}>
                  {events.map((event, i) => {
                    const device = describeDevice(event.userAgent)
                    const DeviceIcon = device.mobile ? Smartphone : Monitor
                    return (
                      <motion.tr
                        key={event.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1, transition: { delay: Math.min(i, 12) * 0.015 } }}
                        exit={{ opacity: 0 }}
                        className='border-t border-line/60 transition-colors hover:bg-sand-50/50'
                      >
                        <td className='px-5 py-2.5'>
                          <EventBadge type={event.eventType} />
                        </td>
                        <td className='px-4 py-2.5 text-sm'>
                          {event.user ? (
                            <button
                              type='button'
                              onClick={() => update({ userId: event.user.id, name: event.user.fullName })}
                              title='Ver solo la actividad de este usuario'
                              className='text-left hover:underline'
                            >
                              <span className='block font-medium'>{event.user.fullName}</span>
                              <span className='block text-xs text-ink-500'>
                                {event.user.username} · {event.user.role.name}
                              </span>
                            </button>
                          ) : (
                            <span>
                              <span className='block font-medium text-red-600'>Usuario inexistente</span>
                              <span className='block text-xs text-ink-500'>Escribió: {event.usernameAttempted ?? '—'}</span>
                            </span>
                          )}
                        </td>
                        <td className='hidden px-4 py-2.5 text-xs text-ink-500 md:table-cell'>
                          {event.ipAddress ? (
                            <button
                              type='button'
                              onClick={() => update({ ip: event.ipAddress })}
                              title='Ver solo los eventos de esta IP'
                              className='inline-flex items-center gap-1.5 font-mono text-ink-900 hover:underline'
                            >
                              <Globe className='size-3.5 text-ink-500' aria-hidden />
                              {event.ipAddress}
                            </button>
                          ) : (
                            '—'
                          )}
                          {event.userAgent && (
                            <span className='mt-0.5 flex items-center gap-1.5'>
                              <DeviceIcon className='size-3.5' aria-hidden />
                              {device.name}
                            </span>
                          )}
                        </td>
                        <td className='whitespace-nowrap px-4 py-2.5 text-right text-sm' title={formatDateTime(event.createdAt)}>
                          <span className='block'>{timeAgo(event.createdAt)}</span>
                          <span className='block text-xs text-ink-500'>{formatDateTime(event.createdAt)}</span>
                        </td>
                      </motion.tr>
                    )
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {!isLoading && !isError && events.length === 0 && (
            <div className='px-6 py-14 text-center'>
              <p className='text-sm font-medium'>No hay eventos con esos filtros</p>
              <p className='mt-1 text-xs text-ink-500'>Prueba con otro rango de fechas o quita los filtros.</p>
            </div>
          )}

          {isError && <p className='px-6 py-10 text-center text-sm text-red-600'>{error?.message ?? 'No se pudo cargar la bitácora'}</p>}

          {pagination && pagination.totalItems > 0 && (
            <div className='flex items-center justify-between border-t border-line/60 px-5 py-3 text-sm text-ink-500'>
              <span>
                {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.totalItems)} de{' '}
                {pagination.totalItems} eventos
              </span>
              <div className='flex gap-1'>
                <button
                  type='button'
                  disabled={!pagination.hasPrevPage}
                  onClick={() => update({ page: page - 1 }, { keepPage: true })}
                  aria-label='Página anterior'
                  className='grid size-8 place-items-center rounded-md border border-line bg-white text-ink-900 hover:bg-sand-50 disabled:opacity-40'
                >
                  <ChevronLeft className='size-4' />
                </button>
                <button
                  type='button'
                  disabled={!pagination.hasNextPage}
                  onClick={() => update({ page: page + 1 }, { keepPage: true })}
                  aria-label='Página siguiente'
                  className='grid size-8 place-items-center rounded-md border border-line bg-white text-ink-900 hover:bg-sand-50 disabled:opacity-40'
                >
                  <ChevronRight className='size-4' />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </MotionConfig>
  )
}
