import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { HandCoins, Search, Undo2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDateTime } from '@/lib/format'
import { useAuthStore } from '@/stores/authStore'
import { HIERARCHY } from '@/lib/constants'
import { Pager } from '@/components/common/Pager'
import { TABLE_PAGE_SIZE } from '@/lib/pagination'
import { usePendingLoans } from './movementsApi'
import { fmt, useDebounced } from './movementForm'

// Préstamos pendientes de devolver (HU-405; user_flow.md §3, también irá al dashboard en HU-504).
// Uno por activo y producto, del más antiguo al más reciente. Todos los roles los ven; registrar la
// devolución es de ALMACENISTA o superior.

export function PendingLoans({ assetId, title = 'Préstamos pendientes', className }) {
  const canReturn = useAuthStore((s) => s.hasHierarchy(HIERARCHY.ALMACENISTA))
  const [search, setSearch] = useState('')
  const debounced = useDebounced(search)
  const [page, setPage] = useState(1)
  useEffect(() => setPage(1), [debounced])
  const { data, isLoading, isError, error, isPlaceholderData } = usePendingLoans({ page, limit: TABLE_PAGE_SIZE, search: debounced || undefined, assetId })
  const loans = data?.data ?? []
  const total = data?.meta?.pagination?.totalItems

  return (
    <section className={cn('rounded-xl border border-line/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]', className)} aria-label={title}>
      <div className='flex flex-col gap-3 border-b border-line/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5'>
        <h2 className='flex items-center gap-2 text-sm font-semibold'>
          <HandCoins className='size-4 text-cosecha' aria-hidden />
          {title}
          {total > 0 && <span className='rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800'>{total}</span>}
        </h2>
        <div className='relative'>
          <Search className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-500' aria-hidden />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder='Activo, producto o persona'
            aria-label='Buscar préstamos pendientes'
            className='h-9 w-full rounded-md border border-line bg-white pl-9 pr-3 text-sm outline-none focus:border-forest-700 sm:w-64'
          />
        </div>
      </div>

      <table className={cn('hidden w-full text-sm transition-opacity md:table', isPlaceholderData && 'opacity-60')}>
        <thead className='border-b border-line/60 bg-sand-50/60 text-left text-xs font-medium uppercase tracking-wide text-ink-500'>
          <tr>
            <th className='px-5 py-2.5 font-medium'>Activo</th>
            <th className='px-3 py-2.5 font-medium'>Producto</th>
            <th className='px-3 py-2.5 font-medium'>Último préstamo</th>
            <th className='px-3 py-2.5 text-right font-medium'>Pendiente</th>
            {canReturn && <th className='px-5 py-2.5' />}
          </tr>
        </thead>
        <tbody>
          {loans.map((loan) => (
            <tr key={`${loan.asset.id}|${loan.product.id}`} className='border-t border-line/50 first:border-t-0 align-top'>
              <td className='px-5 py-2.5'>
                <Link to={`/assets/${loan.asset.id}`} className='font-mono text-xs font-semibold hover:underline'>
                  {loan.asset.code}
                </Link>
                <span className='block text-ink-500'>{loan.asset.name}</span>
              </td>
              <td className='px-3 py-2.5'>
                {loan.product.name}
                <span className='block font-mono text-xs text-ink-500'>{loan.product.code}</span>
              </td>
              <td className='px-3 py-2.5 text-ink-500'>
                <Link to={`/movements/${loan.lastLoan.id}`} className='font-mono text-xs text-ink-900 hover:underline'>
                  {loan.lastLoan.documentNumber}
                </Link>
                <span className='block text-xs'>
                  {formatDateTime(loan.lastLoan.movementDate)}
                  {loan.lastLoan.receivedBy && <> · {loan.lastLoan.receivedBy}</>}
                </span>
              </td>
              <td className='px-3 py-2.5 text-right tabular-nums'>
                <span className='font-semibold'>{fmt(loan.pending)}</span> <span className='text-ink-500'>{loan.product.unitCode}</span>
                {Number(loan.returned) > 0 && <span className='block text-xs text-ink-500'>de {fmt(loan.lent)} prestados</span>}
              </td>
              {canReturn && (
                <td className='px-5 py-2.5 text-right'>
                  <Link
                    to={`/movements/new/return?asset=${loan.asset.id}`}
                    className='inline-flex h-8 items-center gap-1.5 rounded-md border border-line px-2.5 text-xs font-medium hover:border-forest-700 hover:text-forest-800'
                  >
                    <Undo2 className='size-3.5' aria-hidden />
                    Registrar devolución
                  </Link>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Móvil: tarjetas */}
      <ul className='divide-y divide-line/60 md:hidden'>
        {loans.map((loan) => (
          <li key={`${loan.asset.id}|${loan.product.id}`} className='flex items-start gap-3 px-4 py-3'>
            <div className='min-w-0 flex-1'>
              <p className='truncate text-sm font-medium'>{loan.product.name}</p>
              <p className='truncate text-xs text-ink-500'>
                <span className='font-mono'>{loan.asset.code}</span> · {loan.asset.name}
              </p>
              <p className='truncate text-xs text-ink-500'>
                <span className='font-mono'>{loan.lastLoan.documentNumber}</span>
                {loan.lastLoan.receivedBy && <> · {loan.lastLoan.receivedBy}</>}
              </p>
            </div>
            <div className='shrink-0 text-right'>
              <p className='text-sm font-semibold tabular-nums'>
                {fmt(loan.pending)} <span className='font-normal text-ink-500'>{loan.product.unitCode}</span>
              </p>
              {canReturn && (
                <Link to={`/movements/new/return?asset=${loan.asset.id}`} className='mt-1 inline-block text-xs font-medium text-forest-700 hover:underline'>
                  Devolver
                </Link>
              )}
            </div>
          </li>
        ))}
      </ul>

      {isLoading && <div className='m-4 h-16 animate-pulse rounded-lg bg-sand-50' />}
      {!isLoading && !isError && loans.length === 0 && (
        <p className='px-6 py-10 text-center text-sm text-ink-500'>{debounced ? 'Ningún préstamo pendiente coincide.' : 'No hay préstamos pendientes de devolver.'}</p>
      )}
      {isError && <p className='px-6 py-10 text-center text-sm text-red-600'>{error?.message ?? 'No se pudieron cargar los préstamos'}</p>}
      <div className='border-t border-line/60 px-4 py-2 empty:hidden sm:px-5'>
        <Pager pagination={data?.meta?.pagination} onPage={setPage} label='Páginas de préstamos pendientes' />
      </div>
    </section>
  )
}
