import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { MotionConfig, motion } from 'framer-motion'
import { ArrowLeft, Droplets, HandHelping, History, Pencil } from 'lucide-react'
import { Pager } from '@/components/common/Pager'
import { useAuthStore } from '@/stores/authStore'
import { HIERARCHY } from '@/lib/constants'
import { formatDateTime, timeAgo } from '@/lib/format'
import { cn } from '@/lib/utils'
import { EASE_OUT } from '@/features/auth/components/AuthUI'
import { categoryPathLabel, useAssetConsumption, useAssetHistory } from './assetsApi'
import { AssetFormPanel } from './AssetFormPanel'
import { AssetIcon } from './AssetsPage'
import { TABLE_PAGE_SIZE } from '@/lib/pagination'

// Ficha del activo (HU-304, user_flow.md §11): consumo neto por producto en el período, préstamos
// pendientes e historial de movimientos. Todos los roles consultan; ADMIN o superior edita.

const pad = (n) => String(n).padStart(2, '0')
const isoDay = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

/** Períodos: desde una fecha hasta hoy. 'all' no envía fechas. */
const PERIODS = [
  { id: 'month', label: 'Este mes', from: (now) => new Date(now.getFullYear(), now.getMonth(), 1) },
  { id: '90d', label: '3 meses', from: (now) => new Date(now.getFullYear(), now.getMonth(), now.getDate() - 89) },
  { id: 'year', label: 'Este año', from: (now) => new Date(now.getFullYear(), 0, 1) },
  { id: 'all', label: 'Todo', from: () => null },
]

/** Clases de línea (backend: ASSET_LINE_KINDS) agrupadas para el filtro del historial. */
const KIND_FILTERS = [
  { id: 'all', label: 'Todos', kind: undefined },
  { id: 'consumption', label: 'Consumos y correcciones', kind: 'CONSUMO,CORRECCION' },
  { id: 'loans', label: 'Préstamos', kind: 'PRESTAMO,DEVOLUCION' },
  { id: 'other', label: 'Otros', kind: 'OTRO' },
]

const KIND_LABEL = {
  CONSUMO: { label: 'Consumo', className: 'bg-forest-50 text-forest-800 ring-forest-700/15' },
  CORRECCION: { label: 'Corrección', className: 'bg-red-50 text-red-700 ring-red-200' },
  PRESTAMO: { label: 'Préstamo', className: 'bg-amber-50 text-amber-800 ring-amber-200' },
  DEVOLUCION: { label: 'Devolución', className: 'bg-sky-50 text-sky-800 ring-sky-200' },
  OTRO: { label: 'Otro', className: 'bg-sand-50 text-ink-500 ring-line' },
}

const numberFormat = new Intl.NumberFormat('es', { maximumFractionDigits: 3 })
/** '300.000' → '300'; '0.250' → '0,25'. El texto del backend es exacto: se formatea sin operar. */
const qty = (value) => numberFormat.format(Number(value))

const KindBadge = ({ kind }) => (
  <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1', KIND_LABEL[kind].className)}>{KIND_LABEL[kind].label}</span>
)

/** Cantidad de la línea con su efecto en el consumo: +150 L, −50 L, o la cantidad sin signo si no cuenta. */
function LineQuantity({ line }) {
  const effect = Number(line.consumptionEffect)
  const unit = line.product.unitCode
  if (effect > 0)
    return (
      <span className='font-semibold tabular-nums'>
        +{qty(line.quantity)} {unit}
      </span>
    )
  if (effect < 0)
    return (
      <span className='font-semibold tabular-nums text-red-700'>
        −{qty(line.quantity)} {unit}
      </span>
    )
  return (
    <span className='tabular-nums text-ink-500'>
      {qty(line.quantity)} {unit}
    </span>
  )
}

function Segmented({ options, value, onChange, label }) {
  return (
    <div className='-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0'>
      <div className='inline-flex rounded-lg bg-sand-50 p-0.5' role='group' aria-label={label}>
        {options.map((o) => (
          <button
            key={o.id}
            type='button'
            aria-pressed={value === o.id}
            onClick={() => onChange(o.id)}
            className={cn(
              'h-8 shrink-0 whitespace-nowrap rounded-md px-3 text-sm transition-colors',
              value === o.id ? 'bg-white text-ink-900 shadow-sm ring-1 ring-line' : 'text-ink-500 hover:text-ink-900'
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

const Card = ({ className, children, ...props }) => (
  <section className={cn('rounded-xl border border-line/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]', className)} {...props}>
    {children}
  </section>
)

/** Consumo neto por producto: lo consumido menos las correcciones. Un clic filtra el historial. */
function ConsumptionCard({ sheet, periodLabel, selectedProductId, onSelectProduct, isFetching }) {
  const rows = sheet.consumption
  return (
    <Card className={cn('p-4 transition-opacity sm:p-5', isFetching && 'opacity-60')} aria-label='Consumo por producto'>
      <div className='flex items-center gap-2'>
        <Droplets className='size-4 text-ink-500' aria-hidden />
        <h2 className='text-sm font-semibold'>Consumo neto · {periodLabel}</h2>
      </div>
      {rows.length === 0 ? (
        <p className='mt-3 text-sm text-ink-500'>Sin consumos en este período.</p>
      ) : (
        <ul className='mt-3 divide-y divide-line/60'>
          {rows.map((row) => {
            const corrected = Number(row.corrected) > 0
            const selected = selectedProductId === row.product.id
            return (
              <li key={row.product.id}>
                <button
                  type='button'
                  onClick={() => onSelectProduct(selected ? null : row.product.id)}
                  aria-pressed={selected}
                  className={cn(
                    '-mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-md px-2 py-2.5 text-left outline-none transition-colors hover:bg-sand-50/70 focus-visible:bg-sand-50',
                    selected && 'bg-forest-50/60 hover:bg-forest-50/80'
                  )}
                >
                  <span className='min-w-0 flex-1'>
                    <span className='block truncate text-sm font-medium'>{row.product.name}</span>
                    <span className='block truncate text-xs text-ink-500'>
                      <span className='font-mono'>{row.product.code}</span>
                      {corrected && ` · ${qty(row.consumed)} consumidos − ${qty(row.corrected)} corregidos`}
                      {row.lastConsumedAt && ` · último ${timeAgo(row.lastConsumedAt)}`}
                    </span>
                  </span>
                  <span className='shrink-0 text-right'>
                    <span className='text-lg font-semibold tabular-nums tracking-tight'>{qty(row.net)}</span>
                    <span className='ml-1 text-xs text-ink-500'>{row.product.unitCode}</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}

function PendingLoansCard({ loans }) {
  return (
    <Card className='p-4 sm:p-5' aria-label='Préstamos pendientes'>
      <div className='flex items-center gap-2'>
        <HandHelping className='size-4 text-ink-500' aria-hidden />
        <h2 className='text-sm font-semibold'>Préstamos pendientes</h2>
      </div>
      {loans.length === 0 ? (
        <p className='mt-3 text-sm text-ink-500'>No tiene nada pendiente por devolver.</p>
      ) : (
        <ul className='mt-3 space-y-2'>
          {loans.map((loan) => (
            <li key={loan.product.code} className='flex items-center justify-between gap-3 rounded-lg bg-amber-50 px-3 py-2 ring-1 ring-amber-200'>
              <span className='min-w-0'>
                <span className='block truncate text-sm font-medium text-amber-900'>{loan.product.name}</span>
                <span className='font-mono text-xs text-amber-800'>{loan.product.code}</span>
              </span>
              <span className='shrink-0 text-sm font-semibold tabular-nums text-amber-900'>
                {qty(loan.pending)} {loan.product.unitCode}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

function HistorySection({ assetId, period, productId, productName, onClearProduct }) {
  const [kindId, setKindId] = useState('all')
  const [page, setPage] = useState(1)
  const params = useMemo(
    () => ({ ...period, productId: productId ?? undefined, kind: KIND_FILTERS.find((k) => k.id === kindId).kind, page, limit: TABLE_PAGE_SIZE }),
    [period, productId, kindId, page]
  )
  const { data, isLoading, isError, error, isPlaceholderData } = useAssetHistory(assetId, params)
  const lines = data?.data ?? []
  const changeKind = (id) => {
    setKindId(id)
    setPage(1)
  }

  return (
    <section className='mt-6' aria-label='Historial de movimientos'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex items-center gap-2'>
          <History className='size-4 text-ink-500' aria-hidden />
          <h2 className='text-sm font-semibold'>Historial</h2>
          {productId && (
            <button
              type='button'
              onClick={onClearProduct}
              className='rounded-full bg-forest-50 px-2.5 py-0.5 text-xs text-forest-800 ring-1 ring-forest-700/15 hover:bg-forest-100'
            >
              {productName} ✕
            </button>
          )}
        </div>
        <Segmented options={KIND_FILTERS} value={kindId} onChange={changeKind} label='Filtrar el historial' />
      </div>

      <Card className={cn('mt-3 overflow-hidden transition-opacity', isPlaceholderData && 'opacity-60')}>
        {/* Escritorio: tabla */}
        <table className='hidden w-full text-sm md:table'>
          <thead className='border-b border-line/60 bg-sand-50/60 text-left text-xs font-medium uppercase tracking-wide text-ink-500'>
            <tr>
              <th className='px-5 py-3 font-medium'>Fecha</th>
              <th className='px-3 py-3 font-medium'>Documento</th>
              <th className='px-3 py-3 font-medium'>Tipo</th>
              <th className='px-3 py-3 font-medium'>Producto</th>
              <th className='px-3 py-3 text-right font-medium'>Cantidad</th>
              <th className='px-5 py-3 font-medium'>Almacén</th>
            </tr>
          </thead>
          <tbody>
            {isLoading &&
              [0, 1, 2, 3].map((i) => (
                <tr key={i} className='border-t border-line/50'>
                  <td colSpan={6} className='px-5 py-3.5'>
                    <div className='h-4 w-2/3 animate-pulse rounded bg-sand-50' />
                  </td>
                </tr>
              ))}
            {lines.map((line) => (
              <tr key={line.id} className='border-t border-line/50 first:border-t-0 align-top hover:bg-sand-50/50'>
                <td className='whitespace-nowrap px-5 py-2.5 text-ink-500'>{formatDateTime(line.movement.movementDate)}</td>
                <td className='px-3 py-2.5'>
                  <Link to={`/movements/${line.movement.id}`} className='font-mono text-xs font-semibold tracking-wide hover:underline'>
                    {line.movement.documentNumber}
                  </Link>
                  {line.movement.reference && <span className='block font-mono text-xs text-ink-500'>{line.movement.reference}</span>}
                </td>
                <td className='px-3 py-2.5'>
                  <KindBadge kind={line.kind} />
                  {line.movement.receivedBy && <span className='mt-0.5 block text-xs text-ink-500'>Recibió: {line.movement.receivedBy}</span>}
                </td>
                <td className='px-3 py-2.5'>
                  {line.product.name}
                  <span className='block font-mono text-xs text-ink-500'>{line.product.code}</span>
                </td>
                <td className='whitespace-nowrap px-3 py-2.5 text-right'>
                  <LineQuantity line={line} />
                </td>
                <td className='px-5 py-2.5 text-ink-500'>
                  {line.movement.warehouse?.name ?? '—'}
                  <span className='block text-xs'>Registró {line.movement.createdBy.fullName}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Móvil: tarjetas */}
        <ul className='md:hidden'>
          {isLoading && [0, 1, 2].map((i) => <li key={i} className='h-20 animate-pulse border-t border-line/50 bg-sand-50/40 first:border-t-0' />)}
          {lines.map((line) => (
            <li key={line.id} className='border-t border-line/50 px-4 py-3 first:border-t-0'>
              <div className='flex items-start justify-between gap-3'>
                <div className='min-w-0'>
                  <p className='truncate text-sm font-medium'>{line.product.name}</p>
                  <p className='truncate text-xs text-ink-500'>
                    <Link to={`/movements/${line.movement.id}`} className='font-mono font-semibold text-ink-900 hover:underline'>
                      {line.movement.documentNumber}
                    </Link>{' '}
                    ·{' '}
                    {formatDateTime(line.movement.movementDate)}
                  </p>
                </div>
                <span className='shrink-0 text-sm'>
                  <LineQuantity line={line} />
                </span>
              </div>
              <div className='mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-ink-500'>
                <KindBadge kind={line.kind} />
                {line.movement.reference && <span className='font-mono'>{line.movement.reference}</span>}
                {line.movement.receivedBy && <span>Recibió: {line.movement.receivedBy}</span>}
              </div>
            </li>
          ))}
        </ul>

        {!isLoading && !isError && lines.length === 0 && (
          <p className='px-6 py-12 text-center text-sm text-ink-500'>No hay movimientos con estos filtros.</p>
        )}
        {isError && <p className='px-6 py-10 text-center text-sm text-red-600'>{error?.message ?? 'No se pudo cargar el historial'}</p>}
      </Card>
      <div className='mt-4 empty:hidden'>
        <Pager pagination={data?.meta?.pagination} onPage={setPage} label='Páginas del historial' />
      </div>
    </section>
  )
}

export function AssetDetailPage() {
  const { id } = useParams()
  const assetId = Number(id)
  const canManage = useAuthStore((s) => s.hasHierarchy(HIERARCHY.ADMIN))
  const [periodId, setPeriodId] = useState('month')
  const [productId, setProductId] = useState(null)
  const [editing, setEditing] = useState(false)

  const period = useMemo(() => {
    const from = PERIODS.find((p) => p.id === periodId).from(new Date())
    return from ? { from: isoDay(from) } : {}
  }, [periodId])
  const { data: sheet, isLoading, isError, error, isPlaceholderData } = useAssetConsumption(assetId, period)
  const asset = sheet?.asset
  const productName = sheet?.consumption.find((c) => c.product.id === productId)?.product.name ?? 'Producto'

  const back = (
    <Link to='/assets' className='inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900'>
      <ArrowLeft className='size-4' aria-hidden />
      Activos
    </Link>
  )

  if (isError) {
    return (
      <div className='mx-auto max-w-6xl font-plex text-ink-900'>
        {back}
        <p className='mt-10 text-center text-sm text-red-600'>
          {error?.status === 404 ? 'Este activo no existe.' : (error?.message ?? 'No se pudo cargar el activo')}
        </p>
      </div>
    )
  }

  return (
    <MotionConfig reducedMotion='user'>
      <div className='mx-auto max-w-6xl font-plex text-ink-900'>
        {back}

        <motion.header
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: EASE_OUT }}
          className='mt-4 flex flex-wrap items-start justify-between gap-4'
        >
          {isLoading || !asset ? (
            <div className='h-14 w-72 animate-pulse rounded-lg bg-sand-50' />
          ) : (
            <div className='flex min-w-0 items-center gap-4'>
              <AssetIcon asset={asset} />
              <div className='min-w-0'>
                <h1 className='truncate text-[1.75rem] font-semibold leading-tight tracking-tight'>{asset.name}</h1>
                <p className='mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-500'>
                  <span className='font-mono font-semibold tracking-wide text-ink-900'>{asset.code}</span>
                  <span>{categoryPathLabel(asset.category.path)}</span>
                  {!asset.isActive && <span className='rounded-full bg-sand-50 px-2 py-0.5 text-xs ring-1 ring-line'>Inactivo</span>}
                </p>
              </div>
            </div>
          )}
          {canManage && asset && (
            <button
              type='button'
              onClick={() => setEditing(true)}
              className='inline-flex h-10 items-center gap-2 rounded-md border border-line bg-white px-4 text-sm font-medium transition-colors hover:border-ink-500/40'
            >
              <Pencil className='size-4' aria-hidden />
              Editar
            </button>
          )}
        </motion.header>

        {sheet && (
          <p className='mt-3 text-sm text-ink-500'>
            {sheet.activity.lines === 0
              ? 'Todavía no tiene movimientos. Los consumos aparecerán aquí cuando se registren órdenes de retiro para este activo.'
              : `${sheet.activity.lines} ${sheet.activity.lines === 1 ? 'movimiento' : 'movimientos'} desde ${formatDateTime(sheet.activity.firstMovementAt)} · último ${timeAgo(sheet.activity.lastMovementAt)}`}
          </p>
        )}

        <div className='mt-5'>
          <Segmented
            options={PERIODS}
            value={periodId}
            onChange={(value) => {
              setPeriodId(value)
              setProductId(null)
            }}
            label='Período del consumo'
          />
        </div>

        {sheet && (
          <div className='mt-4 grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]'>
            <ConsumptionCard
              sheet={sheet}
              periodLabel={PERIODS.find((p) => p.id === periodId).label.toLowerCase()}
              selectedProductId={productId}
              onSelectProduct={setProductId}
              isFetching={isPlaceholderData}
            />
            <PendingLoansCard loans={sheet.pendingLoans} />
          </div>
        )}

        {asset && (
          <HistorySection
            key={`${periodId}-${productId}`}
            assetId={assetId}
            period={period}
            productId={productId}
            productName={productName}
            onClearProduct={() => setProductId(null)}
          />
        )}
      </div>

      {canManage && asset && <AssetFormPanel open={editing} asset={asset} onClose={() => setEditing(false)} />}
    </MotionConfig>
  )
}
