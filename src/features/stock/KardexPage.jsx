import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowDownToLine, ArrowUpFromLine, Printer, Scale, ScrollText, Wallet } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDateTime } from '@/lib/format'
import { Pager } from '@/components/common/Pager'
import { TABLE_PAGE_SIZE } from '@/lib/pagination'
import { EASE_OUT } from '@/features/auth/components/AuthUI'
import { useWarehouses } from '@/features/warehouses/warehousesApi'
import { useProduct } from '@/features/products/productsApi'
import { MOVEMENT_TYPE_LABELS, REASON_LABELS } from '@/features/movements/movementsApi'
import { ProductPicker } from '@/features/movements/movementForm'
import { useKardex } from './stockApi'

// Kardex de un producto (HU-409, user_flow.md §10): entradas, salidas y saldo acumulado, del más
// antiguo al más reciente, en un almacén o en todos y en un rango de fechas. El saldo de cada fila es
// el real (lo calcula el backend sobre toda la historia), así que es correcto en cualquier página.
// Con todos los almacenes, un traslado aparece dos veces: sale de uno y entra al otro.
// Los filtros viven en la URL: Existencias abre /kardex?product=ID&warehouse=ID.

const numberFormat = new Intl.NumberFormat('es', { minimumFractionDigits: 0, maximumFractionDigits: 3 })
const qty = (value) => (value === null || value === undefined ? '' : numberFormat.format(Number(value)))

function Tile({ icon: Icon, label, value, unit, tone }) {
  return (
    <div className='flex items-center gap-3 rounded-xl border border-line/80 bg-white px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)]'>
      <span className={cn('grid size-10 shrink-0 place-items-center rounded-lg', tone)}>
        <Icon className='size-5' aria-hidden />
      </span>
      <span>
        <span className='block text-xl font-semibold tabular-nums leading-tight'>
          {value === undefined ? '—' : qty(value)} {value !== undefined && <span className='text-sm font-normal text-ink-500'>{unit}</span>}
        </span>
        <span className='block text-xs text-ink-500'>{label}</span>
      </span>
    </div>
  )
}

export function KardexPage() {
  const [params, setParams] = useSearchParams()
  const productId = Number(params.get('product')) || undefined
  const warehouseId = Number(params.get('warehouse')) || undefined
  const from = params.get('from') ?? ''
  const to = params.get('to') ?? ''
  const page = Math.max(1, Number(params.get('page')) || 1)

  const update = (changes) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        for (const [key, value] of Object.entries(changes)) {
          if (value === '' || value === undefined || value === null) next.delete(key)
          else next.set(key, String(value))
        }
        if (!('page' in changes)) next.delete('page')
        return next
      },
      { replace: true }
    )

  const { data: product } = useProduct(productId)
  const { data: warehousesData } = useWarehouses({ limit: 100, sort: 'code' })
  const warehouses = warehousesData?.data ?? []
  const { data, isLoading, isError, error, isPlaceholderData } = useKardex(
    { productId, warehouseId, from: from || undefined, to: to || undefined, page, limit: TABLE_PAGE_SIZE },
    { enabled: Boolean(productId) }
  )
  const rows = data?.data ?? []
  const summary = data?.meta?.summary
  const unit = summary?.product.unitCode ?? product?.unit?.code ?? ''
  const showWarehouse = !warehouseId

  const fieldClass = 'h-9 rounded-md border border-line bg-white px-2 text-sm outline-none focus:border-forest-700'

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: EASE_OUT }} className='mx-auto max-w-6xl font-plex text-ink-900'>
      <div className='flex flex-wrap items-start justify-between gap-3'>
        <div>
          <h1 className='text-[1.75rem] font-semibold tracking-tight'>Kardex</h1>
          <p className='mt-0.5 text-sm text-ink-500'>Entradas, salidas y saldo de un producto, movimiento a movimiento.</p>
        </div>
        {/* Imprime todo el período elegido (sin la página); requiere un producto. */}
        {productId && (
          <Link
            to={`/kardex/print?${new URLSearchParams([...params].filter(([k]) => k !== 'page')).toString()}`}
            className='inline-flex h-10 shrink-0 items-center gap-2 rounded-md border border-line bg-white px-4 text-sm font-semibold hover:border-ink-500/40'
          >
            <Printer className='size-4' aria-hidden />
            Imprimir
          </Link>
        )}
      </div>

      <section className='mt-5 grid gap-3 rounded-xl border border-line/80 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:grid-cols-2 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_auto] sm:p-5'>
        <div>
          <span className='mb-1.5 block text-xs font-medium text-ink-500'>Producto</span>
          <ProductPicker value={productId ? (product ?? null) : null} onChange={(p) => update({ product: p?.id })} />
        </div>
        <label>
          <span className='mb-1.5 block text-xs font-medium text-ink-500'>Almacén</span>
          <select value={warehouseId ?? ''} onChange={(e) => update({ warehouse: e.target.value })} className={cn(fieldClass, 'h-11 w-full')}>
            <option value=''>Todos los almacenes</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.code} · {w.name}
              </option>
            ))}
          </select>
        </label>
        <div className='sm:col-span-2 lg:col-span-1'>
          <span className='mb-1.5 block text-xs font-medium text-ink-500'>Período</span>
          <div className='flex items-center gap-2'>
            <input type='date' value={from} max={to || undefined} onChange={(e) => update({ from: e.target.value })} aria-label='Desde' className={cn(fieldClass, 'h-11 min-w-0 flex-1')} />
            <span className='text-xs text-ink-500'>a</span>
            <input type='date' value={to} min={from || undefined} onChange={(e) => update({ to: e.target.value })} aria-label='Hasta' className={cn(fieldClass, 'h-11 min-w-0 flex-1')} />
          </div>
        </div>
      </section>

      {!productId ? (
        <section className='mt-5 flex flex-col items-center rounded-xl border border-line/80 bg-white px-6 py-14 text-center'>
          <span className='grid size-11 place-items-center rounded-full bg-sand-50 text-ink-500'>
            <ScrollText className='size-5' aria-hidden />
          </span>
          <p className='mt-3 text-sm font-medium'>Elige un producto para ver su kardex</p>
          <p className='mt-1 max-w-md text-sm text-ink-500'>También se abre desde Existencias con [Ver kardex] en cada fila.</p>
        </section>
      ) : (
        <>
          <div className='mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4' aria-label='Resumen del período'>
            <Tile icon={Wallet} label={from ? 'Saldo inicial (antes del período)' : 'Saldo inicial'} value={summary?.opening} unit={unit} tone='bg-sand-50 text-ink-900' />
            <Tile icon={ArrowDownToLine} label='Entradas' value={summary?.in} unit={unit} tone='bg-forest-50 text-forest-800' />
            <Tile icon={ArrowUpFromLine} label='Salidas' value={summary?.out} unit={unit} tone='bg-arena text-amber-800' />
            <Tile icon={Scale} label={to ? 'Saldo al final del período' : 'Saldo actual'} value={summary?.closing} unit={unit} tone='bg-forest-100 text-forest-800' />
          </div>

          <section className='mt-5 rounded-xl border border-line/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]'>
            <table className={cn('hidden w-full text-sm transition-opacity md:table', isPlaceholderData && 'opacity-60')}>
              <thead className='border-b border-line/60 bg-sand-50/60 text-left text-xs font-medium uppercase tracking-wide text-ink-500'>
                <tr>
                  <th className='px-5 py-2.5 font-medium'>Fecha</th>
                  <th className='px-3 py-2.5 font-medium'>Documento</th>
                  <th className='px-3 py-2.5 font-medium'>Tipo · motivo</th>
                  {showWarehouse && <th className='px-3 py-2.5 font-medium'>Almacén</th>}
                  <th className='px-3 py-2.5 font-medium'>Activo</th>
                  <th className='px-3 py-2.5 text-right font-medium'>Entrada</th>
                  <th className='px-3 py-2.5 text-right font-medium'>Salida</th>
                  <th className='px-5 py-2.5 text-right font-medium'>Saldo</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={`${r.movement.id}|${r.warehouse.id}|${r.asset?.id ?? ''}|${i}`} className='border-t border-line/50 align-top first:border-t-0'>
                    <td className='whitespace-nowrap px-5 py-2.5 text-ink-500'>{formatDateTime(r.movement.movementDate)}</td>
                    <td className='px-3 py-2.5'>
                      <Link to={`/movements/${r.movement.id}`} className='font-mono text-xs font-semibold tracking-wide hover:underline'>
                        {r.movement.documentNumber}
                      </Link>
                      {r.movement.reference && <span className='block font-mono text-xs text-ink-500'>{r.movement.reference}</span>}
                    </td>
                    <td className='px-3 py-2.5'>
                      {MOVEMENT_TYPE_LABELS[r.movement.movementType]}
                      <span className='block text-xs text-ink-500'>
                        {r.movement.reference?.startsWith('REV-') ? 'Corrección' : (REASON_LABELS[r.movement.reason] ?? r.movement.reason)}
                      </span>
                    </td>
                    {showWarehouse && <td className='px-3 py-2.5 font-mono text-xs'>{r.warehouse.code}</td>}
                    <td className='px-3 py-2.5'>
                      {r.asset ? (
                        <Link to={`/assets/${r.asset.id}`} className='hover:underline'>
                          <span className='font-mono text-xs font-semibold'>{r.asset.code}</span>
                        </Link>
                      ) : (
                        <span className='text-ink-500'>—</span>
                      )}
                    </td>
                    <td className='whitespace-nowrap px-3 py-2.5 text-right tabular-nums text-forest-800'>{qty(r.in)}</td>
                    <td className='whitespace-nowrap px-3 py-2.5 text-right tabular-nums text-aviso'>{qty(r.out)}</td>
                    <td className='whitespace-nowrap px-5 py-2.5 text-right font-semibold tabular-nums'>
                      {qty(r.balance)} <span className='font-normal text-ink-500'>{unit}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Móvil: tarjetas */}
            <ul className={cn('divide-y divide-line/60 md:hidden', isPlaceholderData && 'opacity-60')}>
              {rows.map((r, i) => (
                <li key={`${r.movement.id}|${r.warehouse.id}|${r.asset?.id ?? ''}|${i}`} className='flex items-start gap-3 px-4 py-3'>
                  <div className='min-w-0 flex-1'>
                    <Link to={`/movements/${r.movement.id}`} className='font-mono text-sm font-semibold hover:underline'>
                      {r.movement.documentNumber}
                    </Link>
                    <p className='truncate text-xs text-ink-500'>
                      {formatDateTime(r.movement.movementDate)} · {MOVEMENT_TYPE_LABELS[r.movement.movementType]}
                      {showWarehouse && <> · {r.warehouse.code}</>}
                      {r.asset && <> · {r.asset.code}</>}
                    </p>
                  </div>
                  <div className='shrink-0 text-right tabular-nums'>
                    <p className={cn('text-sm font-medium', r.in ? 'text-forest-800' : 'text-aviso')}>
                      {r.in ? `+${qty(r.in)}` : `−${qty(r.out)}`}
                    </p>
                    <p className='text-xs text-ink-500'>
                      Saldo {qty(r.balance)} {unit}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            {isLoading && <div className='m-4 h-24 animate-pulse rounded-lg bg-sand-50' />}
            {!isLoading && !isError && rows.length === 0 && (
              <p className='px-6 py-12 text-center text-sm text-ink-500'>
                {from || to ? 'Sin movimientos de este producto en el período.' : 'Este producto aún no tiene movimientos.'}
              </p>
            )}
            {isError && <p className='px-6 py-12 text-center text-sm text-red-600'>{error?.message ?? 'No se pudo cargar el kardex'}</p>}
            <div className='border-t border-line/60 px-4 py-2 empty:hidden sm:px-5'>
              <Pager pagination={data?.meta?.pagination} onPage={(p) => update({ page: p })} label='Páginas del kardex' />
            </div>
          </section>
        </>
      )}
    </motion.div>
  )
}
