import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { MOVEMENT_TYPE_LABELS, REASON_LABELS, useMovement } from './movementsApi'

// Detalle de un movimiento (HU-401: "Ver detalle" al registrar la orden). El historial con filtros
// llega en HU-408 y la impresión con espacio para firmas en HU-410.

const numberFormat = new Intl.NumberFormat('es', { maximumFractionDigits: 3 })
const qty = (value) => numberFormat.format(Number(value))

const Card = ({ className, children }) => (
  <section className={cn('rounded-xl border border-line/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]', className)}>{children}</section>
)

const Item = ({ label, children, mono }) => (
  <div>
    <dt className='text-xs text-ink-500'>{label}</dt>
    <dd className={cn('font-medium', mono && 'font-mono')}>{children}</dd>
  </div>
)

export function MovementDetailPage() {
  const { id } = useParams()
  const { data: movement, isLoading, isError, error } = useMovement(Number(id))

  const back = (
    <Link to='/movements' className='inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900'>
      <ArrowLeft className='size-4' aria-hidden />
      Movimientos
    </Link>
  )
  if (isError) {
    return (
      <div className='mx-auto max-w-4xl font-plex'>
        {back}
        <p className='mt-10 text-center text-sm text-red-600'>
          {error?.status === 404 ? 'Este movimiento no existe.' : (error?.message ?? 'No se pudo cargar')}
        </p>
      </div>
    )
  }
  if (isLoading || !movement) {
    return (
      <div className='mx-auto max-w-4xl font-plex'>
        {back}
        <div className='mt-6 h-40 animate-pulse rounded-xl bg-sand-50' />
      </div>
    )
  }

  const warehouse = movement.fromWarehouse ?? movement.toWarehouse
  return (
    <div className='mx-auto max-w-4xl font-plex text-ink-900'>
      {back}
      <header className='mt-3'>
        <p className='text-sm text-ink-500'>
          {MOVEMENT_TYPE_LABELS[movement.movementType]} · {REASON_LABELS[movement.reason] ?? movement.reason}
        </p>
        <h1 className='font-mono text-[1.75rem] font-semibold tracking-wide'>{movement.documentNumber}</h1>
      </header>

      <Card className='mt-5 p-4 sm:p-6'>
        <dl className='grid gap-x-6 gap-y-3 text-sm sm:grid-cols-3'>
          <Item label='Fecha'>{formatDateTime(movement.movementDate)}</Item>
          <Item label={movement.fromWarehouse ? 'Almacén de origen' : 'Almacén de destino'}>
            {warehouse.code} · {warehouse.name}
          </Item>
          <Item label='Registró'>{movement.createdBy.fullName}</Item>
          {movement.receivedBy && <Item label='Recibido por'>{movement.receivedBy}</Item>}
          {movement.workOrder && (
            <Item label='Orden de trabajo' mono>
              {movement.workOrder}
            </Item>
          )}
          {movement.reference && (
            <Item label='Referencia' mono>
              {movement.reference}
            </Item>
          )}
          {movement.note && (
            <div className='sm:col-span-3'>
              <dt className='text-xs text-ink-500'>Observación</dt>
              <dd>{movement.note}</dd>
            </div>
          )}
        </dl>
      </Card>

      <Card className='mt-4 overflow-hidden'>
        <table className='hidden w-full text-sm md:table'>
          <thead className='border-b border-line/60 bg-sand-50/60 text-left text-xs font-medium uppercase tracking-wide text-ink-500'>
            <tr>
              <th className='w-10 px-5 py-3 font-medium'>#</th>
              <th className='px-3 py-3 font-medium'>Producto</th>
              <th className='px-3 py-3 text-right font-medium'>Cantidad</th>
              <th className='px-5 py-3 font-medium'>Activo destino</th>
            </tr>
          </thead>
          <tbody>
            {movement.lines.map((line, i) => (
              <tr key={line.id} className='border-t border-line/50 first:border-t-0 align-top'>
                <td className='px-5 py-2.5 text-ink-500'>{i + 1}</td>
                <td className='px-3 py-2.5'>
                  {line.product.name}
                  <span className='block font-mono text-xs text-ink-500'>{line.product.code}</span>
                  {line.note && <span className='block text-xs text-ink-500'>{line.note}</span>}
                </td>
                <td className='whitespace-nowrap px-3 py-2.5 text-right font-semibold tabular-nums'>
                  {qty(line.quantity)} {line.product.unitCode}
                </td>
                <td className='px-5 py-2.5'>
                  {line.asset ? (
                    <Link to={`/assets/${line.asset.id}`} className='hover:underline'>
                      <span className='font-mono text-xs font-semibold'>{line.asset.code}</span> {line.asset.name}
                      <span className='block text-xs text-ink-500'>{line.asset.category.name}</span>
                    </Link>
                  ) : (
                    <span className='text-ink-500'>—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <ul className='md:hidden'>
          {movement.lines.map((line) => (
            <li key={line.id} className='flex items-start justify-between gap-3 border-t border-line/50 px-4 py-3 first:border-t-0'>
              <div className='min-w-0'>
                <p className='truncate text-sm font-medium'>{line.product.name}</p>
                <p className='truncate text-xs text-ink-500'>{line.asset ? `${line.asset.code} · ${line.asset.name}` : 'Sin activo'}</p>
              </div>
              <span className='shrink-0 text-sm font-semibold tabular-nums'>
                {qty(line.quantity)} {line.product.unitCode}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      {movement.totals.length > 0 && movement.totals.some((t) => t.lines > 1) && (
        <Card className='mt-4 p-4 sm:p-6'>
          <h2 className='text-sm font-semibold'>Total por producto</h2>
          <ul className='mt-2 space-y-1 text-sm'>
            {movement.totals.map((t) => (
              <li key={t.product.id} className='flex justify-between gap-3'>
                <span className='truncate'>{t.product.name}</span>
                <span className='shrink-0 font-semibold tabular-nums'>
                  {qty(t.quantity)} {t.product.unitCode}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}
