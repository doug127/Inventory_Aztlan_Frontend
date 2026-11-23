import { ChevronLeft, ChevronRight } from 'lucide-react'

/** Anterior / siguiente para una lista paginada (meta.pagination del backend). Sin páginas extra no se muestra. */
export function Pager({ pagination, onPage, label = 'Paginación' }) {
  if (!pagination || pagination.totalPages <= 1) return null
  const btn = 'grid size-9 place-items-center rounded-md border border-line bg-white hover:text-ink-900 disabled:opacity-40'
  return (
    <nav className='flex items-center justify-between text-sm text-ink-500' aria-label={label}>
      <span>
        Página {pagination.page} de {pagination.totalPages}
      </span>
      <div className='flex gap-2'>
        <button
          type='button'
          disabled={!pagination.hasPrevPage}
          onClick={() => onPage(pagination.page - 1)}
          aria-label='Página anterior'
          className={btn}
        >
          <ChevronLeft className='size-4' />
        </button>
        <button
          type='button'
          disabled={!pagination.hasNextPage}
          onClick={() => onPage(pagination.page + 1)}
          aria-label='Página siguiente'
          className={btn}
        >
          <ChevronRight className='size-4' />
        </button>
      </div>
    </nav>
  )
}
