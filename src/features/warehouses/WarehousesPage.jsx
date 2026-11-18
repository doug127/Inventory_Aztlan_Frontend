import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
import { Plus, Search, Warehouse as WarehouseIcon } from 'lucide-react'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { useAuthStore } from '@/stores/authStore'
import { HIERARCHY } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { EASE_OUT } from '@/features/auth/components/AuthUI'
import { useActivateWarehouse, useDeactivateWarehouse, useWarehouses } from './warehousesApi'
import { WarehouseCard } from './WarehouseCard'
import { WarehouseFormPanel } from './WarehouseFormPanel'

const STATUS = [
  { id: 'active', label: 'Activos', isActive: true },
  { id: 'inactive', label: 'Inactivos', isActive: false },
  { id: 'all', label: 'Todos', isActive: undefined },
]

const useDebounced = (value, delay = 300) => {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

/**
 * Almacenes (HU-201, diseño 07). Todos los roles consultan; ADMIN o superior crea, edita y
 * desactiva. Un almacén solo se desactiva vacío (business_rules.md §6.1).
 */
export function WarehousesPage() {
  const canManage = useAuthStore((s) => s.hasHierarchy(HIERARCHY.ADMIN))
  const [statusId, setStatusId] = useState('active')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounced(search.trim())
  const [form, setForm] = useState({ open: false, warehouse: null })
  const [toDeactivate, setToDeactivate] = useState(null)

  const params = useMemo(
    () => ({ limit: 100, sort: 'code', search: debouncedSearch, isActive: STATUS.find((s) => s.id === statusId).isActive }),
    [debouncedSearch, statusId]
  )
  const { data, isLoading, isError, error } = useWarehouses(params)
  const warehouses = data?.data ?? []
  const total = data?.meta?.pagination?.totalItems ?? 0

  const deactivate = useDeactivateWarehouse()
  const activate = useActivateWarehouse()

  return (
    <MotionConfig reducedMotion='user'>
      <div className='mx-auto max-w-6xl font-plex text-ink-900'>
        <motion.header
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: EASE_OUT }}
          className='flex flex-wrap items-end justify-between gap-4'
        >
          <div>
            <h1 className='text-[1.75rem] font-semibold tracking-tight'>Almacenes</h1>
            <p className='mt-0.5 text-sm text-ink-500'>
              {isLoading ? '—' : `${total} ${total === 1 ? 'ubicación' : 'ubicaciones'}`} · Agrícola Aztlán
            </p>
          </div>
          {canManage && (
            <motion.button
              type='button'
              whileTap={{ scale: 0.97 }}
              onClick={() => setForm({ open: true, warehouse: null })}
              className='inline-flex h-10 items-center gap-2 rounded-md bg-forest-700 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-forest-800'
            >
              <Plus className='size-4' aria-hidden />
              Nuevo almacén
            </motion.button>
          )}
        </motion.header>

        <div className='mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex gap-2' role='group' aria-label='Filtrar por estado'>
            {STATUS.map((s) => (
              <button
                key={s.id}
                type='button'
                onClick={() => setStatusId(s.id)}
                aria-pressed={statusId === s.id}
                className={cn(
                  'relative h-8 rounded-full border px-3.5 text-sm transition-colors',
                  statusId === s.id ? 'border-transparent text-white' : 'border-line bg-white hover:border-ink-500/40'
                )}
              >
                {statusId === s.id && (
                  <motion.span layoutId='warehouse-status' className='absolute inset-0 rounded-full bg-ink-900' transition={{ type: 'spring', stiffness: 500, damping: 38 }} />
                )}
                <span className='relative'>{s.label}</span>
              </button>
            ))}
          </div>
          <div className='relative'>
            <Search className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-500' aria-hidden />
            <input
              type='search'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder='Buscar por código o nombre'
              aria-label='Buscar almacenes'
              className='h-9 w-full rounded-md border border-line bg-white pl-9 pr-3 text-sm outline-none transition focus:border-forest-700 focus:ring-4 focus:ring-forest-700/10 sm:w-64'
            />
          </div>
        </div>

        <div className='mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {isLoading &&
            Array.from({ length: 6 }, (_, i) => <div key={i} className='h-[150px] animate-pulse rounded-xl border border-line/60 bg-white' />)}
          <AnimatePresence mode='popLayout'>
            {warehouses.map((warehouse, i) => (
              <WarehouseCard
                key={warehouse.id}
                index={i}
                warehouse={warehouse}
                canManage={canManage}
                onEdit={(w) => setForm({ open: true, warehouse: w })}
                onDeactivate={setToDeactivate}
                onActivate={(w) => activate.mutate(w.id)}
              />
            ))}
          </AnimatePresence>
        </div>

        {!isLoading && !isError && warehouses.length === 0 && (
          <div className='mt-5 flex flex-col items-center rounded-xl border border-dashed border-line px-6 py-14 text-center'>
            <span className='grid size-11 place-items-center rounded-full bg-sand-50 text-ink-500'>
              <WarehouseIcon className='size-5' aria-hidden />
            </span>
            <p className='mt-3 text-sm font-medium'>{debouncedSearch ? 'Ningún almacén coincide con la búsqueda' : 'No hay almacenes en esta vista'}</p>
            {canManage && !debouncedSearch && statusId !== 'inactive' && (
              <button type='button' onClick={() => setForm({ open: true, warehouse: null })} className='mt-2 text-sm font-semibold text-forest-700 hover:underline'>
                Crear el primero
              </button>
            )}
          </div>
        )}

        {isError && <p className='mt-6 text-center text-sm text-red-600'>{error?.message ?? 'No se pudieron cargar los almacenes'}</p>}
      </div>

      {canManage && (
        <>
          <WarehouseFormPanel open={form.open} warehouse={form.warehouse} onClose={() => setForm({ open: false, warehouse: null })} />
          <ConfirmDialog
            open={Boolean(toDeactivate)}
            onOpenChange={(open) => !open && setToDeactivate(null)}
            loading={deactivate.isPending}
            title={toDeactivate ? `¿Desactivar ${toDeactivate.name}?` : ''}
            description='No podrá usarse como origen ni destino de movimientos nuevos. Su historial se conserva y podrás activarlo de nuevo.'
            confirmLabel='Desactivar'
            variant='destructive'
            onConfirm={() => {
              deactivate.mutate(toDeactivate.id)
              setToDeactivate(null)
            }}
          />
        </>
      )}
    </MotionConfig>
  )
}
