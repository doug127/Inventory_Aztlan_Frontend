import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AlertTriangle, ArrowUpFromLine, Boxes, PackageCheck, Printer, ScrollText, Search, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { HIERARCHY } from '@/lib/constants'
import { Pager } from '@/components/common/Pager'
import { TABLE_PAGE_SIZE } from '@/lib/pagination'
import { EASE_OUT } from '@/features/auth/components/AuthUI'
import { useWarehouses } from '@/features/warehouses/warehousesApi'
import { useCategoryOptions } from '@/features/product-categories/productCategoriesApi'
import { useDebounced } from '@/features/movements/movementForm'
import { useStock } from './stockApi'

// Existencias (HU-407, user_flow.md §4). Filtros: almacén, categoría (con subcategorías), búsqueda y
// alerta; vista por producto (total y dónde está) o por almacén (una fila por producto y almacén).
// El estado sale del total de todos los almacenes (business_rules.md §7) y siempre lleva su etiqueta
// de texto, no solo color. Los filtros viven en la URL: /stock?alert=true llega desde el dashboard.

const numberFormat = new Intl.NumberFormat('es', { maximumFractionDigits: 3 })
const qty = (value) => numberFormat.format(Number(value))

const STATUS = {
  NORMAL: { label: 'Normal', className: 'bg-forest-50 text-forest-800 ring-forest-700/15' },
  BAJO_MINIMO: { label: 'Bajo mínimo', className: 'bg-amber-100 text-amber-900 ring-amber-300' },
  SOBRE_MAXIMO: { label: 'Sobre máximo', className: 'bg-arena text-amber-900 ring-amber-200' },
}
const ALERTS = [
  { id: '', label: 'Todos' },
  { id: 'CON_ALERTA', label: 'Con alerta' },
  { id: 'BAJO_MINIMO', label: 'Bajo mínimo' },
  { id: 'SOBRE_MAXIMO', label: 'Sobre máximo' },
]

const StatusBadge = ({ status }) => (
  <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1', STATUS[status].className)}>{STATUS[status].label}</span>
)

/** Categorías activas aplanadas con sangría para el selector. */
const flattenCategories = (nodes, depth = 0) =>
  nodes.flatMap((n) => [{ id: n.id, label: `${'  '.repeat(depth)}${n.name}` }, ...flattenCategories(n.children ?? [], depth + 1)])

/** Tarjeta del resumen. Con onClick filtra la tabla; sin él, solo informa. */
function SummaryTile({ icon: Icon, label, value, active, onClick, tone }) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      {...(onClick && { type: 'button', onClick, 'aria-pressed': active })}
      className={cn(
        'flex items-center gap-3 rounded-xl border bg-white px-4 py-3 text-left shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-colors',
        active ? 'border-forest-700 ring-1 ring-forest-700' : 'border-line/80',
        onClick && !active && 'hover:border-ink-500/40'
      )}
    >
      <span className={cn('grid size-10 shrink-0 place-items-center rounded-lg', tone)}>
        <Icon className='size-5' aria-hidden />
      </span>
      <span>
        <span className='block text-2xl font-semibold tabular-nums leading-tight'>{value ?? '—'}</span>
        <span className='block text-xs text-ink-500'>{label}</span>
      </span>
    </Tag>
  )
}

export function StockPage() {
  const [params, setParams] = useSearchParams()
  const canWithdraw = useAuthStore((s) => s.hasHierarchy(HIERARCHY.ALMACENISTA))
  const warehouseId = Number(params.get('warehouseId')) || undefined
  const categoryId = Number(params.get('categoryId')) || undefined
  const rawAlert = params.get('alert')
  const alert = rawAlert === 'true' ? 'CON_ALERTA' : (ALERTS.find((a) => a.id === rawAlert)?.id ?? '')
  const groupBy = params.get('groupBy') === 'warehouse' ? 'warehouse' : 'product'
  const page = Math.max(1, Number(params.get('page')) || 1)

  const [search, setSearch] = useState(params.get('search') ?? '')
  const debounced = useDebounced(search)

  /** Cambia filtros en la URL; cualquier cambio (salvo la página) vuelve a la página 1. */
  const update = (changes) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        for (const [key, value] of Object.entries(changes)) {
          if (value === undefined || value === '' || value === null) next.delete(key)
          else next.set(key, String(value))
        }
        if (!('page' in changes)) next.delete('page')
        return next
      },
      { replace: true }
    )
  useEffect(() => {
    if ((params.get('search') ?? '') !== debounced) update({ search: debounced })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced])

  const { data: warehousesData } = useWarehouses({ isActive: true, limit: 100, sort: 'code' })
  const warehouses = warehousesData?.data ?? []
  const { data: tree = [] } = useCategoryOptions()
  const categories = useMemo(() => flattenCategories(tree), [tree])

  const { data, isLoading, isError, error, isPlaceholderData } = useStock({
    page,
    limit: TABLE_PAGE_SIZE,
    search: params.get('search') || undefined,
    warehouseId,
    categoryId,
    alert: alert || undefined,
    groupBy,
  })
  const rows = data?.data ?? []
  const summary = data?.meta?.summary
  // La forma de la tabla sale de los datos en pantalla (meta.filters), no del filtro recién elegido:
  // mientras llega la respuesta nueva se siguen viendo (atenuadas) las filas anteriores, y las de la
  // vista por producto no traen almacén.
  const shownFilters = data?.meta?.filters ?? { groupBy, warehouseId }
  const showWarehouse = shownFilters.groupBy === 'warehouse' || Boolean(shownFilters.warehouseId)

  /** [Kardex] abre el kardex del producto, en el almacén de la fila (o del filtro) si lo hay. */
  const kardexLink = (row) => {
    const w = row.warehouse?.id ?? warehouseId
    return `/kardex?product=${row.product.id}${w ? `&warehouse=${w}` : ''}`
  }

  /** [Retirar] abre la orden de retiro con el producto (y el almacén, si la fila tiene uno) precargados. */
  const withdrawLink = (row) => {
    const w = row.warehouse?.id ?? (row.warehouses?.length === 1 ? row.warehouses[0].id : undefined)
    return `/movements/new/withdrawal?product=${row.product.id}${w ? `&warehouse=${w}` : ''}`
  }

  const selectClass = 'h-9 rounded-md border border-line bg-white px-2 text-sm outline-none focus:border-forest-700'

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: EASE_OUT }} className='mx-auto max-w-6xl font-plex text-ink-900'>
      <div className='flex flex-wrap items-start justify-between gap-3'>
        <div>
          <h1 className='text-[1.75rem] font-semibold tracking-tight'>Existencias</h1>
          <p className='mt-0.5 text-sm text-ink-500'>Lo disponible por almacén y categoría. El estado compara el total de todos los almacenes con el mínimo y el máximo.</p>
        </div>
        {/* Imprime todas las filas con los filtros actuales (sin la página). */}
        <Link
          to={`/stock/print?${new URLSearchParams([...params].filter(([k]) => k !== 'page')).toString()}`}
          className='inline-flex h-10 shrink-0 items-center gap-2 rounded-md border border-line bg-white px-4 text-sm font-semibold hover:border-ink-500/40'
        >
          <Printer className='size-4' aria-hidden />
          Imprimir
        </Link>
      </div>

      <div className='mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4' aria-label='Resumen por estado'>
        <SummaryTile icon={Boxes} label='Productos' value={summary?.total} active={!alert} onClick={() => update({ alert: '' })} tone='bg-sand-50 text-ink-900' />
        <SummaryTile icon={AlertTriangle} label='Bajo mínimo' value={summary?.bajoMinimo} active={alert === 'BAJO_MINIMO'} onClick={() => update({ alert: 'BAJO_MINIMO' })} tone='bg-amber-100 text-amber-800' />
        <SummaryTile icon={TrendingUp} label='Sobre máximo' value={summary?.sobreMaximo} active={alert === 'SOBRE_MAXIMO'} onClick={() => update({ alert: 'SOBRE_MAXIMO' })} tone='bg-arena text-amber-800' />
        <SummaryTile icon={PackageCheck} label='Normales' value={summary?.normal} tone='bg-forest-50 text-forest-800' />
      </div>

      <section className='mt-5 rounded-xl border border-line/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]'>
        <div className='flex flex-col gap-3 border-b border-line/60 px-4 py-3 sm:px-5 lg:flex-row lg:flex-wrap lg:items-center'>
          <div className='relative lg:w-64'>
            <Search className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-500' aria-hidden />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder='Código o nombre'
              aria-label='Buscar productos'
              className='h-9 w-full rounded-md border border-line bg-white pl-9 pr-3 text-sm outline-none focus:border-forest-700'
            />
          </div>
          <select value={warehouseId ?? ''} onChange={(e) => update({ warehouseId: e.target.value })} aria-label='Almacén' className={selectClass}>
            <option value=''>Todos los almacenes</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.code} · {w.name}
              </option>
            ))}
          </select>
          <select value={categoryId ?? ''} onChange={(e) => update({ categoryId: e.target.value })} aria-label='Categoría' className={cn(selectClass, 'lg:max-w-56')}>
            <option value=''>Todas las categorías</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
          <div className='flex gap-1 rounded-lg bg-sand-50 p-1 ring-1 ring-line' role='radiogroup' aria-label='Alerta'>
            {ALERTS.map((a) => (
              <button
                key={a.id || 'all'}
                type='button'
                role='radio'
                aria-checked={alert === a.id}
                onClick={() => update({ alert: a.id })}
                className={cn('h-7 rounded-md px-2.5 text-xs font-medium transition-colors', alert === a.id ? 'bg-white text-ink-900 shadow-sm ring-1 ring-line' : 'text-ink-500 hover:text-ink-900')}
              >
                {a.label}
              </button>
            ))}
          </div>
          <div className='flex gap-1 rounded-lg bg-sand-50 p-1 ring-1 ring-line lg:ml-auto' role='radiogroup' aria-label='Vista'>
            {[
              { id: 'product', label: 'Por producto' },
              { id: 'warehouse', label: 'Por almacén' },
            ].map((v) => (
              <button
                key={v.id}
                type='button'
                role='radio'
                aria-checked={groupBy === v.id}
                onClick={() => update({ groupBy: v.id === 'product' ? '' : v.id })}
                className={cn('h-7 rounded-md px-2.5 text-xs font-medium transition-colors', groupBy === v.id ? 'bg-white text-ink-900 shadow-sm ring-1 ring-line' : 'text-ink-500 hover:text-ink-900')}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        <table className={cn('hidden w-full text-sm transition-opacity md:table', isPlaceholderData && 'opacity-60')}>
          <thead className='border-b border-line/60 bg-sand-50/60 text-left text-xs font-medium uppercase tracking-wide text-ink-500'>
            <tr>
              <th className='px-5 py-2.5 font-medium'>Producto</th>
              <th className='px-3 py-2.5 font-medium'>Categoría</th>
              <th className='px-3 py-2.5 font-medium'>{showWarehouse ? 'Almacén' : 'Dónde está'}</th>
              <th className='px-3 py-2.5 text-right font-medium'>Existencia</th>
              <th className='px-3 py-2.5 text-right font-medium'>Mín. / Máx.</th>
              <th className='px-3 py-2.5 font-medium'>Estado</th>
              <th className='px-5 py-2.5' />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.product.id}|${row.warehouse?.id ?? ''}`} className='border-t border-line/50 first:border-t-0 align-top'>
                <td className='px-5 py-2.5'>
                  <span className='font-medium'>{row.product.name}</span>
                  <span className='block font-mono text-xs text-ink-500'>{row.product.code}</span>
                </td>
                <td className='px-3 py-2.5 text-ink-500'>{row.category.name}</td>
                <td className='px-3 py-2.5'>
                  {showWarehouse ? (
                    <span>
                      <span className='font-mono text-xs font-semibold'>{row.warehouse.code}</span> <span className='text-ink-500'>{row.warehouse.name}</span>
                    </span>
                  ) : row.warehouses.length ? (
                    <span className='flex flex-wrap gap-1'>
                      {row.warehouses.map((w) => (
                        <span key={w.id} className='rounded bg-sand-50 px-1.5 py-0.5 text-xs ring-1 ring-line' title={w.name}>
                          <span className='font-mono font-semibold'>{w.code}</span> {qty(w.quantity)}
                        </span>
                      ))}
                    </span>
                  ) : (
                    <span className='text-xs text-ink-500'>Sin existencia</span>
                  )}
                </td>
                <td className='whitespace-nowrap px-3 py-2.5 text-right tabular-nums'>
                  <span className='font-semibold'>{qty(row.quantity)}</span> <span className='text-ink-500'>{row.product.unitCode}</span>
                  {showWarehouse && row.total !== row.quantity && <span className='block text-xs text-ink-500'>total {qty(row.total)}</span>}
                </td>
                <td className='whitespace-nowrap px-3 py-2.5 text-right text-ink-500 tabular-nums'>
                  {qty(row.minStock)} / {row.maxStock === null ? '—' : qty(row.maxStock)}
                </td>
                <td className='px-3 py-2.5'>
                  <StatusBadge status={row.status} />
                </td>
                <td className='whitespace-nowrap px-5 py-2.5 text-right'>
                  <span className='inline-flex gap-1.5'>
                    <Link
                      to={kardexLink(row)}
                      className='inline-flex h-8 items-center gap-1.5 rounded-md border border-line px-2.5 text-xs font-medium hover:border-forest-700 hover:text-forest-800'
                    >
                      <ScrollText className='size-3.5' aria-hidden />
                      Kardex
                    </Link>
                    {canWithdraw && Number(row.quantity) > 0 && (
                      <Link
                        to={withdrawLink(row)}
                        className='inline-flex h-8 items-center gap-1.5 rounded-md border border-line px-2.5 text-xs font-medium hover:border-forest-700 hover:text-forest-800'
                      >
                        <ArrowUpFromLine className='size-3.5' aria-hidden />
                        Retirar
                      </Link>
                    )}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Móvil: tarjetas */}
        <ul className={cn('divide-y divide-line/60 md:hidden', isPlaceholderData && 'opacity-60')}>
          {rows.map((row) => (
            <li key={`${row.product.id}|${row.warehouse?.id ?? ''}`} className='flex items-start gap-3 px-4 py-3'>
              <div className='min-w-0 flex-1'>
                <p className='truncate text-sm font-medium'>{row.product.name}</p>
                <p className='truncate text-xs text-ink-500'>
                  <span className='font-mono'>{row.product.code}</span> · {row.category.name}
                  {showWarehouse && <> · {row.warehouse.code}</>}
                </p>
                <div className='mt-1.5'>
                  <StatusBadge status={row.status} />
                </div>
              </div>
              <div className='shrink-0 text-right'>
                <p className='text-sm font-semibold tabular-nums'>
                  {qty(row.quantity)} <span className='font-normal text-ink-500'>{row.product.unitCode}</span>
                </p>
                <p className='text-xs text-ink-500 tabular-nums'>
                  mín. {qty(row.minStock)}
                  {row.maxStock !== null && <> · máx. {qty(row.maxStock)}</>}
                </p>
                <span className='mt-1 flex justify-end gap-3 text-xs font-medium'>
                  <Link to={kardexLink(row)} className='text-forest-700 hover:underline'>
                    Kardex
                  </Link>
                  {canWithdraw && Number(row.quantity) > 0 && (
                    <Link to={withdrawLink(row)} className='text-forest-700 hover:underline'>
                      Retirar
                    </Link>
                  )}
                </span>
              </div>
            </li>
          ))}
        </ul>

        {isLoading && <div className='m-4 h-24 animate-pulse rounded-lg bg-sand-50' />}
        {!isLoading && !isError && rows.length === 0 && (
          <p className='px-6 py-12 text-center text-sm text-ink-500'>
            {alert ? 'Ningún producto con esa alerta en esta vista.' : warehouseId ? 'Este almacén no tiene existencias con esos filtros.' : 'Ningún producto coincide con los filtros.'}
          </p>
        )}
        {isError && <p className='px-6 py-12 text-center text-sm text-red-600'>{error?.message ?? 'No se pudieron cargar las existencias'}</p>}
        <div className='border-t border-line/60 px-4 py-2 empty:hidden sm:px-5'>
          <Pager pagination={data?.meta?.pagination} onPage={(p) => update({ page: p })} label='Páginas de existencias' />
        </div>
      </section>
    </motion.div>
  )
}
