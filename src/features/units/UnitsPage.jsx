import { useMemo, useState } from 'react'
import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
import { MoreHorizontal, Pencil, Plus, Power, PowerOff, Ruler, Search } from 'lucide-react'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useAuthStore } from '@/stores/authStore'
import { HIERARCHY } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { EASE_OUT } from '@/features/auth/components/AuthUI'
import { useActivateUnit, useDeactivateUnit, useUnits } from './unitsApi'
import { UnitConverter } from './UnitConverter'
import { UnitFormPanel } from './UnitFormPanel'

const STATUS = [
  { id: 'active', label: 'Activas', isActive: true },
  { id: 'inactive', label: 'Inactivas', isActive: false },
  { id: 'all', label: 'Todas', isActive: undefined },
]

/** Por qué no se puede desactivar (business_rules.md §6.3), o null si se puede. */
const deactivateBlocker = (unit) => {
  const { activeProducts, activeDerivedUnits } = unit.usage
  if (activeProducts > 0) return `La usan ${activeProducts} ${activeProducts === 1 ? 'producto activo' : 'productos activos'}`
  if (activeDerivedUnits > 0) return `Es base de ${activeDerivedUnits} ${activeDerivedUnits === 1 ? 'unidad activa' : 'unidades activas'}`
  return null
}

/** Agrupa por familia: cada unidad base con sus derivadas, en el orden del catálogo. */
const groupByFamily = (units) => {
  const families = new Map()
  for (const unit of units) {
    const base = unit.isBase ? unit : unit.baseUnit
    if (!families.has(base.id)) families.set(base.id, { base, baseInList: false, derived: [] })
    const family = families.get(base.id)
    if (unit.isBase) {
      family.base = unit
      family.baseInList = true
    } else family.derived.push(unit)
  }
  return [...families.values()]
}

function UnitMenu({ unit, onEdit, onDeactivate, onActivate }) {
  const blocker = deactivateBlocker(unit)
  const baseInactive = unit.baseUnit && !unit.baseUnit.isActive
  const item = 'items-start gap-2.5 rounded-md px-2.5 py-2 text-sm outline-none focus:bg-sand-50 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50'
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        aria-label={`Acciones para ${unit.code}`}
        className='grid size-7 place-items-center rounded-md text-ink-500 outline-none transition-colors hover:bg-sand-50 hover:text-ink-900 focus-visible:ring-2 focus-visible:ring-forest-700/30'
      >
        <MoreHorizontal className='size-4' />
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-64 border-line/80 p-1.5 font-plex shadow-lg'>
        <DropdownMenuItem className={cn(item, 'text-ink-900 hover:bg-sand-50')} onSelect={() => onEdit(unit)}>
          <Pencil className='mt-0.5 size-4' aria-hidden />
          Editar
        </DropdownMenuItem>
        {unit.isActive ? (
          <DropdownMenuItem
            disabled={Boolean(blocker)}
            className={cn(item, 'text-red-600 hover:bg-red-50')}
            onSelect={() => onDeactivate(unit)}
          >
            <PowerOff className='mt-0.5 size-4' aria-hidden />
            <span>
              Desactivar
              {blocker && <span className='mt-0.5 block text-xs text-ink-500'>{blocker}</span>}
            </span>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem disabled={baseInactive} className={cn(item, 'text-ink-900 hover:bg-sand-50')} onSelect={() => onActivate(unit)}>
            <Power className='mt-0.5 size-4' aria-hidden />
            <span>
              Activar
              {baseInactive && <span className='mt-0.5 block text-xs text-ink-500'>Activa primero {unit.baseUnit.code}</span>}
            </span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** "1 producto", "3 productos" o el texto para cero. */
const plural = (count, one, many, zero) => (count ? `${count} ${count === 1 ? one : many}` : zero)

function ProductsCount({ count }) {
  return <span className='text-xs text-ink-500'>{plural(count, 'producto', 'productos', 'Sin productos')}</span>
}

/** Una familia: la unidad base arriba y sus derivadas con su equivalencia. */
function FamilyCard({ family, canManage, actions, index }) {
  const { base, baseInList, derived } = family
  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0, transition: { delay: Math.min(index, 8) * 0.04, duration: 0.3 } }}
      exit={{ opacity: 0 }}
      // break-inside-avoid: la tarjeta nunca se parte entre dos columnas del mosaico.
      className='mb-4 break-inside-avoid overflow-hidden rounded-xl border border-line/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]'
    >
      <header className={cn('flex items-center gap-3 border-b border-line/60 bg-sand-50/60 px-5 py-3.5', !base.isActive && 'opacity-60')}>
        <span className='grid h-9 min-w-9 place-items-center rounded-md bg-forest-700 px-2 font-mono text-sm font-semibold text-white'>
          {base.code}
        </span>
        <div className='min-w-0 flex-1'>
          <p className='truncate text-sm font-semibold'>{base.name}</p>
          <p className='text-xs text-ink-500'>
            Unidad base{!base.isActive && ' · inactiva'}
            {baseInList && base.usage && <> · {plural(base.usage.totalProducts, 'producto', 'productos', 'sin productos')}</>}
          </p>
        </div>
        {canManage && baseInList && <UnitMenu unit={base} {...actions} />}
      </header>

      {derived.length > 0 ? (
        <ul>
          {derived.map((unit) => (
            <li key={unit.id} className={cn('flex items-center gap-3 border-t border-line/50 px-5 py-3 first:border-t-0', !unit.isActive && 'opacity-60')}>
              <span className='grid h-8 min-w-12 place-items-center rounded-md bg-forest-50 px-2 font-mono text-xs font-semibold text-forest-800'>
                {unit.code}
              </span>
              <div className='min-w-0 flex-1'>
                <p className='truncate text-sm'>
                  {unit.name}
                  {!unit.isActive && <span className='ml-2 text-xs text-ink-500'>Inactiva</span>}
                </p>
                <p className='font-mono text-xs text-ink-500'>{unit.equivalence}</p>
              </div>
              <ProductsCount count={unit.usage.totalProducts} />
              {canManage && <UnitMenu unit={unit} {...actions} />}
            </li>
          ))}
        </ul>
      ) : (
        <p className='px-5 py-3.5 text-xs text-ink-500'>Sin unidades derivadas.</p>
      )}
    </motion.article>
  )
}

/**
 * Unidades con conversión (HU-202). Las unidades se muestran por familia (base y derivadas) con
 * su equivalencia, y una calculadora convierte con el mismo cálculo que usará el backend.
 */
export function UnitsPage() {
  const canManage = useAuthStore((s) => s.hasHierarchy(HIERARCHY.ADMIN))
  const [statusId, setStatusId] = useState('active')
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({ open: false, unit: null })
  const [toDeactivate, setToDeactivate] = useState(null)

  const { data: allUnits = [], isLoading, isError, error } = useUnits()
  const deactivate = useDeactivateUnit()
  const activate = useActivateUnit()

  // Filtros en el cliente: el catálogo de unidades es pequeño y así se agrupa por familia completa.
  const visible = useMemo(() => {
    const isActive = STATUS.find((s) => s.id === statusId).isActive
    const term = search.trim().toLowerCase()
    return allUnits.filter(
      (u) =>
        (isActive === undefined || u.isActive === isActive) &&
        (!term || u.code.toLowerCase().includes(term) || u.name.toLowerCase().includes(term))
    )
  }, [allUnits, statusId, search])
  const families = useMemo(() => groupByFamily(visible), [visible])
  const totalFamilies = allUnits.filter((u) => u.isBase).length

  const actions = {
    onEdit: (unit) => setForm({ open: true, unit }),
    onDeactivate: setToDeactivate,
    onActivate: (unit) => activate.mutate(unit.id),
  }

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
            <h1 className='text-[1.75rem] font-semibold tracking-tight'>Unidades</h1>
            <p className='mt-0.5 text-sm text-ink-500'>
              {isLoading ? '—' : `${allUnits.length} unidades · ${totalFamilies} ${totalFamilies === 1 ? 'familia' : 'familias'}`}
            </p>
          </div>
          {canManage && (
            <motion.button
              type='button'
              whileTap={{ scale: 0.97 }}
              onClick={() => setForm({ open: true, unit: null })}
              className='inline-flex h-10 items-center gap-2 rounded-md bg-forest-700 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-forest-800'
            >
              <Plus className='size-4' aria-hidden />
              Nueva unidad
            </motion.button>
          )}
        </motion.header>

        <div className='mt-6'>
          <UnitConverter units={allUnits} />
        </div>

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
                  <motion.span layoutId='unit-status' className='absolute inset-0 rounded-full bg-ink-900' transition={{ type: 'spring', stiffness: 500, damping: 38 }} />
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
              aria-label='Buscar unidades'
              className='h-9 w-full rounded-md border border-line bg-white pl-9 pr-3 text-sm outline-none transition focus:border-forest-700 focus:ring-4 focus:ring-forest-700/10 sm:w-64'
            />
          </div>
        </div>

        {/* Mosaico (masonry): columnas CSS en lugar de filas, así cada familia ocupa solo su alto y
            la siguiente se acomoda justo debajo, sin huecos, tenga 0 o 10 derivadas. */}
        <div className='mt-5 columns-1 gap-4 md:columns-2 xl:columns-3'>
          {isLoading &&
            [176, 120, 230, 150].map((h, i) => (
              <div key={i} style={{ height: h }} className='mb-4 break-inside-avoid animate-pulse rounded-xl border border-line/60 bg-white' />
            ))}
          <AnimatePresence initial={false}>
            {families.map((family, i) => (
              <FamilyCard key={family.base.id} family={family} index={i} canManage={canManage} actions={actions} />
            ))}
          </AnimatePresence>
        </div>

        {!isLoading && !isError && families.length === 0 && (
          <div className='mt-5 flex flex-col items-center rounded-xl border border-dashed border-line px-6 py-14 text-center'>
            <span className='grid size-11 place-items-center rounded-full bg-sand-50 text-ink-500'>
              <Ruler className='size-5' aria-hidden />
            </span>
            <p className='mt-3 text-sm font-medium'>No hay unidades en esta vista</p>
          </div>
        )}

        {isError && <p className='mt-6 text-center text-sm text-red-600'>{error?.message ?? 'No se pudieron cargar las unidades'}</p>}
      </div>

      {canManage && (
        <>
          <UnitFormPanel open={form.open} unit={form.unit} units={allUnits} onClose={() => setForm({ open: false, unit: null })} />
          <ConfirmDialog
            open={Boolean(toDeactivate)}
            onOpenChange={(open) => !open && setToDeactivate(null)}
            loading={deactivate.isPending}
            title={toDeactivate ? `¿Desactivar ${toDeactivate.code}?` : ''}
            description='No podrá asignarse a productos nuevos. Los productos que ya la usan y su historial no cambian.'
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
