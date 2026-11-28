import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { History, RotateCcw, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDateTime } from '@/lib/format'
import { useAuthStore } from '@/stores/authStore'
import { REASONS_BY_TYPE } from '@/lib/constants'
import { Pager } from '@/components/common/Pager'
import { SearchPicker } from '@/components/common/SearchPicker'
import { TABLE_PAGE_SIZE } from '@/lib/pagination'
import { useWarehouses } from '@/features/warehouses/warehousesApi'
import { useProduct } from '@/features/products/productsApi'
import { useAsset, useAssets } from '@/features/assets/assetsApi'
import { MOVEMENT_TYPE_LABELS, REASON_LABELS, useMovements } from './movementsApi'
import { ProductPicker, useDebounced } from './movementForm'

// Historial de movimientos (HU-408, user_flow.md §9): del más reciente al más antiguo, 10 por página.
// Filtros: documento o referencia, tipo, motivo, almacén, fechas, quién registró (los míos), producto
// y activo. Viven en la URL (prefijo h_) para volver desde el detalle sin perderlos. Clic en una fila → detalle.

const TYPE_TONES = {
  IN: 'bg-forest-50 text-forest-800 ring-forest-700/15',
  OUT: 'bg-arena text-amber-900 ring-amber-200',
  TRANSFER: 'bg-sand-50 text-ink-900 ring-line',
  ADJUST: 'bg-amber-100 text-amber-900 ring-amber-300',
}

const warehousesOf = (m) =>
  m.fromWarehouse && m.toWarehouse ? `${m.fromWarehouse.code} → ${m.toWarehouse.code}` : (m.fromWarehouse ?? m.toWarehouse)?.code

function AssetFilter({ value, onChange }) {
  const [search, setSearch] = useState('')
  const debounced = useDebounced(search)
  const { data: selected } = useAsset(value)
  const { data, isFetching } = useAssets({ search: debounced || undefined, limit: 12, sort: 'code' })
  const options = (data?.data ?? []).map((a) => ({ id: a.id, label: `${a.code} · ${a.name}` }))
  return (
    <SearchPicker
      ariaLabel='Activo'
      value={value && selected ? { id: selected.id, label: `${selected.code} · ${selected.name}` } : null}
      onChange={(option) => onChange(option?.id ?? '')}
      onSearch={setSearch}
      options={options}
      loading={isFetching}
      placeholder='Activo'
      emptyText='Ningún activo coincide'
    />
  )
}

export function MovementHistory() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const userId = useAuthStore((s) => s.user?.id)
  const get = (key) => params.get(`h_${key}`) ?? ''
  const filters = {
    search: get('search'),
    movementType: get('type'),
    reason: get('reason'),
    warehouseId: Number(get('warehouse')) || '',
    from: get('from'),
    to: get('to'),
    mine: get('mine') === '1',
    productId: Number(get('product')) || '',
    assetId: Number(get('asset')) || '',
  }
  const page = Math.max(1, Number(get('page')) || 1)

  /** Cambia filtros en la URL; cualquier cambio (salvo la página) vuelve a la página 1. */
  const update = (changes) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        for (const [key, value] of Object.entries(changes)) {
          if (value === '' || value === undefined || value === null || value === false) next.delete(`h_${key}`)
          else next.set(`h_${key}`, value === true ? '1' : String(value))
        }
        if (!('page' in changes)) next.delete('h_page')
        return next
      },
      { replace: true }
    )
  const clearAll = () =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        for (const key of [...next.keys()]) if (key.startsWith('h_')) next.delete(key)
        return next
      },
      { replace: true }
    )

  const [search, setSearch] = useState(filters.search)
  const debounced = useDebounced(search)
  useEffect(() => {
    if (debounced !== filters.search) update({ search: debounced })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced])

  const { data: warehousesData } = useWarehouses({ limit: 100, sort: 'code' })
  const warehouses = warehousesData?.data ?? []
  const { data: product } = useProduct(filters.productId || undefined)
  const reasons = filters.movementType ? REASONS_BY_TYPE[filters.movementType] : Object.keys(REASON_LABELS)

  const query = useMemo(
    () => ({
      page,
      limit: TABLE_PAGE_SIZE,
      search: filters.search || undefined,
      movementType: filters.movementType || undefined,
      reason: filters.reason || undefined,
      warehouseId: filters.warehouseId || undefined,
      from: filters.from || undefined,
      to: filters.to || undefined,
      userId: filters.mine ? userId : undefined,
      productId: filters.productId || undefined,
      assetId: filters.assetId || undefined,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [params, userId]
  )
  const { data, isLoading, isError, error, isPlaceholderData } = useMovements(query)
  const movements = data?.data ?? []
  const active = Object.entries(filters).some(([k, v]) => k !== 'search' && v) || filters.search

  const selectClass = 'h-9 rounded-md border border-line bg-white px-2 text-sm outline-none focus:border-forest-700'
  const dateClass = 'h-9 rounded-md border border-line bg-white px-2 text-sm outline-none focus:border-forest-700'

  return (
    <section className='rounded-xl border border-line/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]' aria-label='Historial de movimientos'>
      <div className='flex flex-col gap-3 border-b border-line/60 px-4 py-3 sm:px-5'>
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <h2 className='flex items-center gap-2 text-sm font-semibold'>
            <History className='size-4 text-forest-700' aria-hidden />
            Historial
            {data?.meta?.pagination && <span className='font-normal text-ink-500'>· {data.meta.pagination.totalItems} movimientos</span>}
          </h2>
          {active && (
            <button
              type='button'
              onClick={() => {
                setSearch('')
                clearAll()
              }}
              className='inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs text-ink-500 hover:bg-sand-50 hover:text-ink-900'
            >
              <X className='size-3.5' aria-hidden />
              Quitar filtros
            </button>
          )}
        </div>
        <div className='grid gap-2 sm:grid-cols-2 lg:grid-cols-4'>
          <div className='relative'>
            <Search className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-500' aria-hidden />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder='Documento o referencia (RET-000145)'
              aria-label='Buscar por documento o referencia'
              className='h-9 w-full rounded-md border border-line bg-white pl-9 pr-3 text-sm outline-none focus:border-forest-700'
            />
          </div>
          <select
            value={filters.movementType}
            onChange={(e) => update({ type: e.target.value, reason: '' })}
            aria-label='Tipo de movimiento'
            className={selectClass}
          >
            <option value=''>Todos los tipos</option>
            {Object.entries(MOVEMENT_TYPE_LABELS).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
          <select value={filters.reason} onChange={(e) => update({ reason: e.target.value })} aria-label='Motivo' className={selectClass}>
            <option value=''>Todos los motivos</option>
            {reasons.map((id) => (
              <option key={id} value={id}>
                {REASON_LABELS[id]}
              </option>
            ))}
          </select>
          <select value={filters.warehouseId} onChange={(e) => update({ warehouse: e.target.value })} aria-label='Almacén' className={selectClass}>
            <option value=''>Todos los almacenes</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.code} · {w.name}
              </option>
            ))}
          </select>
          <div className='flex items-center gap-2'>
            <input type='date' value={filters.from} max={filters.to || undefined} onChange={(e) => update({ from: e.target.value })} aria-label='Desde' className={cn(dateClass, 'min-w-0 flex-1')} />
            <span className='text-xs text-ink-500'>a</span>
            <input type='date' value={filters.to} min={filters.from || undefined} onChange={(e) => update({ to: e.target.value })} aria-label='Hasta' className={cn(dateClass, 'min-w-0 flex-1')} />
          </div>
          <ProductPicker value={filters.productId ? (product ?? null) : null} onChange={(p) => update({ product: p?.id ?? '' })} />
          <AssetFilter value={filters.assetId || undefined} onChange={(id) => update({ asset: id })} />
          <label className='flex h-9 cursor-pointer items-center gap-2 rounded-md border border-line px-3 text-sm'>
            <input type='checkbox' checked={filters.mine} onChange={(e) => update({ mine: e.target.checked })} className='accent-forest-700' />
            Registrados por mí
          </label>
        </div>
      </div>

      <table className={cn('hidden w-full text-sm transition-opacity md:table', isPlaceholderData && 'opacity-60')}>
        <thead className='border-b border-line/60 bg-sand-50/60 text-left text-xs font-medium uppercase tracking-wide text-ink-500'>
          <tr>
            <th className='px-5 py-2.5 font-medium'>Documento</th>
            <th className='px-3 py-2.5 font-medium'>Fecha</th>
            <th className='px-3 py-2.5 font-medium'>Tipo · motivo</th>
            <th className='px-3 py-2.5 font-medium'>Almacén</th>
            <th className='px-3 py-2.5 font-medium'>Registrado por</th>
            <th className='px-5 py-2.5 text-right font-medium'>Líneas</th>
          </tr>
        </thead>
        <tbody>
          {movements.map((m) => (
            <tr
              key={m.id}
              onClick={() => navigate(`/movements/${m.id}`)}
              className='cursor-pointer border-t border-line/50 align-top first:border-t-0 hover:bg-sand-50/60'
            >
              <td className='px-5 py-2.5'>
                <Link to={`/movements/${m.id}`} onClick={(e) => e.stopPropagation()} className='font-mono text-xs font-semibold tracking-wide hover:underline'>
                  {m.documentNumber}
                </Link>
                {m.reference && <span className='block font-mono text-xs text-ink-500'>{m.reference}</span>}
                {m.correctionCount > 0 && (
                  <span className='mt-0.5 inline-flex items-center gap-1 text-xs text-aviso'>
                    <RotateCcw className='size-3' aria-hidden />
                    {m.correctionCount === 1 ? 'Corregido' : `${m.correctionCount} correcciones`}
                  </span>
                )}
              </td>
              <td className='whitespace-nowrap px-3 py-2.5 text-ink-500'>{formatDateTime(m.movementDate)}</td>
              <td className='px-3 py-2.5'>
                <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1', TYPE_TONES[m.movementType])}>{MOVEMENT_TYPE_LABELS[m.movementType]}</span>
                <span className='ml-1.5 text-ink-500'>{m.isCorrection ? 'Corrección' : (REASON_LABELS[m.reason] ?? m.reason)}</span>
              </td>
              <td className='px-3 py-2.5 font-mono text-xs'>{warehousesOf(m)}</td>
              <td className='px-3 py-2.5 text-ink-500'>{m.createdBy.fullName}</td>
              <td className='px-5 py-2.5 text-right tabular-nums'>{m.lineCount}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Móvil: tarjetas */}
      <ul className={cn('divide-y divide-line/60 md:hidden', isPlaceholderData && 'opacity-60')}>
        {movements.map((m) => (
          <li key={m.id}>
            <Link to={`/movements/${m.id}`} className='flex items-start gap-3 px-4 py-3'>
              <div className='min-w-0 flex-1'>
                <p className='font-mono text-sm font-semibold'>{m.documentNumber}</p>
                <p className='truncate text-xs text-ink-500'>
                  {MOVEMENT_TYPE_LABELS[m.movementType]} · {m.isCorrection ? 'Corrección' : (REASON_LABELS[m.reason] ?? m.reason)} · {warehousesOf(m)}
                </p>
                <p className='truncate text-xs text-ink-500'>{m.createdBy.fullName}</p>
              </div>
              <div className='shrink-0 text-right text-xs text-ink-500'>
                {formatDateTime(m.movementDate)}
                <span className='block'>
                  {m.lineCount} {m.lineCount === 1 ? 'línea' : 'líneas'}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {isLoading && <div className='m-4 h-24 animate-pulse rounded-lg bg-sand-50' />}
      {!isLoading && !isError && movements.length === 0 && (
        <p className='px-6 py-12 text-center text-sm text-ink-500'>{active ? 'Ningún movimiento coincide con los filtros.' : 'Aún no hay movimientos registrados.'}</p>
      )}
      {isError && <p className='px-6 py-12 text-center text-sm text-red-600'>{error?.message ?? 'No se pudo cargar el historial'}</p>}
      <div className='border-t border-line/60 px-4 py-2 empty:hidden sm:px-5'>
        <Pager pagination={data?.meta?.pagination} onPage={(p) => update({ page: p })} label='Páginas del historial' />
      </div>
    </section>
  )
}
