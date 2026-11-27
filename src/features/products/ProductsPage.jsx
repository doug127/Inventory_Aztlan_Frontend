import { useEffect, useMemo, useState } from 'react'
import { MotionConfig, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, MoreHorizontal, Package, Pencil, Plus, Power, PowerOff, Search } from 'lucide-react'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useAuthStore } from '@/stores/authStore'
import { HIERARCHY } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { EASE_OUT } from '@/features/auth/components/AuthUI'
import { flattenTree, useCategoryTree } from '@/features/product-categories/productCategoriesApi'
import { formatQuantity, useActivateProduct, useDeactivateProduct, useProducts } from './productsApi'
import { ProductFormPanel } from './ProductFormPanel'
import { TABLE_PAGE_SIZE } from '@/lib/pagination'

const STATUS = [
  { id: 'active', label: 'Activos', isActive: true },
  { id: 'inactive', label: 'Inactivos', isActive: false },
  { id: 'all', label: 'Todos', isActive: undefined },
]
const PAGE_SIZE = TABLE_PAGE_SIZE

const useDebounced = (value, delay = 300) => {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

/** Por qué no se puede desactivar (business_rules.md §6.4 regla 4), o null si se puede. */
const deactivateBlocker = ({ stock }) =>
  stock.isEmpty ? null : `Tiene existencias en ${stock.warehousesWithStock} ${stock.warehousesWithStock === 1 ? 'almacén' : 'almacenes'}`

/** Por qué no se puede reactivar, o null si se puede. */
const activateBlocker = ({ category, unit }) => {
  if (!category.isActive) return `Activa primero la categoría ${category.code}`
  if (!unit.isActive) return `Activa primero la unidad ${unit.code}`
  return null
}

function ProductMenu({ product, onEdit, onDeactivate, onActivate }) {
  const blocker = product.isActive ? deactivateBlocker(product) : activateBlocker(product)
  const item =
    'items-start gap-2.5 rounded-md px-2.5 py-2 text-sm outline-none focus:bg-sand-50 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50'
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        aria-label={`Acciones para ${product.code}`}
        className='grid size-7 place-items-center rounded-md text-ink-500 outline-none transition-colors hover:bg-sand-50 hover:text-ink-900 focus-visible:ring-2 focus-visible:ring-forest-700/30'
      >
        <MoreHorizontal className='size-4' />
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-64 border-line/80 p-1.5 font-plex shadow-lg'>
        <DropdownMenuItem className={cn(item, 'text-ink-900 hover:bg-sand-50')} onSelect={() => onEdit(product)}>
          <Pencil className='mt-0.5 size-4' aria-hidden />
          Editar
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={Boolean(blocker)}
          className={cn(item, product.isActive ? 'text-red-600 hover:bg-red-50' : 'text-ink-900 hover:bg-sand-50')}
          onSelect={() => (product.isActive ? onDeactivate(product) : onActivate(product))}
        >
          {product.isActive ? <PowerOff className='mt-0.5 size-4' aria-hidden /> : <Power className='mt-0.5 size-4' aria-hidden />}
          <span>
            {product.isActive ? 'Desactivar' : 'Activar'}
            {blocker && <span className='mt-0.5 block text-xs text-ink-500'>{blocker}</span>}
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function StockCell({ product }) {
  const total = Number(product.stock.total)
  const low = total < Number(product.minStock)
  const high = product.maxStock !== null && total > Number(product.maxStock)
  return (
    <span className={cn('tabular-nums', low && 'text-amber-700', high && 'text-sky-700')}>
      {formatQuantity(product.stock.total)} <span className='text-ink-500'>{product.unit.code}</span>
    </span>
  )
}

const Range = ({ product }) => (
  <span className='tabular-nums text-ink-500'>
    {formatQuantity(product.minStock)} – {product.maxStock === null ? 'sin máx.' : formatQuantity(product.maxStock)}
  </span>
)

/**
 * Productos (HU-204, business_rules.md §6.4). Todos los roles consultan; ADMIN o superior crea,
 * edita y desactiva. El código se sugiere según la categoría y la unidad se bloquea cuando el
 * producto ya tiene movimientos. Tabla en escritorio y tarjetas en el móvil.
 */
export function ProductsPage() {
  const canManage = useAuthStore((s) => s.hasHierarchy(HIERARCHY.ADMIN))
  const [statusId, setStatusId] = useState('active')
  const [categoryId, setCategoryId] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebounced(search.trim())
  const [form, setForm] = useState({ open: false, product: null })
  const [toDeactivate, setToDeactivate] = useState(null)

  const { data: tree = [] } = useCategoryTree()
  const categories = useMemo(() => flattenTree(tree), [tree])

  // Un filtro nuevo vuelve a la primera página.
  useEffect(() => setPage(1), [statusId, categoryId, debouncedSearch])

  const params = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      sort: 'code',
      search: debouncedSearch,
      categoryId,
      isActive: STATUS.find((s) => s.id === statusId).isActive,
    }),
    [page, debouncedSearch, categoryId, statusId]
  )
  const { data, isLoading, isError, error, isPlaceholderData } = useProducts(params)
  const products = data?.data ?? []
  const pagination = data?.meta?.pagination

  const deactivate = useDeactivateProduct()
  const activate = useActivateProduct()
  const menu = {
    onEdit: (product) => setForm({ open: true, product }),
    onDeactivate: setToDeactivate,
    onActivate: (product) => activate.mutate(product.id),
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
            <h1 className='text-[1.75rem] font-semibold tracking-tight'>Productos</h1>
            <p className='mt-0.5 text-sm text-ink-500'>
              {isLoading ? '—' : `${pagination?.totalItems ?? 0} ${pagination?.totalItems === 1 ? 'producto' : 'productos'} en esta vista`}
            </p>
          </div>
          {canManage && (
            <motion.button
              type='button'
              whileTap={{ scale: 0.97 }}
              onClick={() => setForm({ open: true, product: null })}
              className='inline-flex h-10 items-center gap-2 rounded-md bg-forest-700 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-forest-800'
            >
              <Plus className='size-4' aria-hidden />
              Nuevo producto
            </motion.button>
          )}
        </motion.header>

        <div className='mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
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
                  <motion.span layoutId='product-status' className='absolute inset-0 rounded-full bg-ink-900' transition={{ type: 'spring', stiffness: 500, damping: 38 }} />
                )}
                <span className='relative'>{s.label}</span>
              </button>
            ))}
          </div>
          <div className='flex flex-col gap-2 sm:flex-row'>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              aria-label='Filtrar por categoría (incluye subcategorías)'
              className='h-9 w-full cursor-pointer rounded-md border border-line bg-white px-3 text-sm outline-none transition focus:border-forest-700 focus:ring-4 focus:ring-forest-700/10 sm:w-60'
            >
              <option value=''>Todas las categorías</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {'   '.repeat(c.depth)}
                  {c.depth > 0 ? '└ ' : ''}
                  {c.code} · {c.name}
                </option>
              ))}
            </select>
            <div className='relative'>
              <Search className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-500' aria-hidden />
              <input
                type='search'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder='Buscar por código o nombre'
                aria-label='Buscar productos'
                className='h-9 w-full rounded-md border border-line bg-white pl-9 pr-3 text-sm outline-none transition focus:border-forest-700 focus:ring-4 focus:ring-forest-700/10 sm:w-64'
              />
            </div>
          </div>
        </div>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05, ease: EASE_OUT }}
          className={cn(
            'mt-5 overflow-hidden rounded-xl border border-line/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-opacity',
            isPlaceholderData && 'opacity-60'
          )}
        >
          {/* Escritorio: tabla */}
          <table className='hidden w-full text-sm md:table'>
            <thead className='border-b border-line/60 bg-sand-50/60 text-left text-xs font-medium uppercase tracking-wide text-ink-500'>
              <tr>
                <th className='px-5 py-3 font-medium'>Código</th>
                <th className='px-3 py-3 font-medium'>Producto</th>
                <th className='px-3 py-3 font-medium'>Categoría</th>
                <th className='px-3 py-3 font-medium'>Mín – Máx</th>
                <th className='px-3 py-3 text-right font-medium'>Existencia</th>
                {canManage && <th className='w-12 px-3 py-3' aria-label='Acciones' />}
              </tr>
            </thead>
            <tbody>
              {isLoading &&
                [0, 1, 2, 3, 4].map((i) => (
                  <tr key={i} className='border-t border-line/50'>
                    <td colSpan={6} className='px-5 py-3.5'>
                      <div className='h-4 w-2/3 animate-pulse rounded bg-sand-50' />
                    </td>
                  </tr>
                ))}
              {products.map((p) => (
                <tr key={p.id} className={cn('border-t border-line/50 first:border-t-0 hover:bg-sand-50/50', !p.isActive && 'text-ink-500')}>
                  <td className='px-5 py-3 font-mono text-xs font-semibold tracking-wide'>{p.code}</td>
                  <td className='px-3 py-3'>
                    <p className='font-medium'>{p.name}</p>
                    <p className='text-xs text-ink-500'>
                      {p.unit.name}
                      {!p.isActive && ' · Inactivo'}
                    </p>
                  </td>
                  <td className='px-3 py-3 text-ink-500'>
                    <span className='font-mono text-xs'>{p.category.code}</span> {p.category.name}
                  </td>
                  <td className='px-3 py-3'>
                    <Range product={p} />
                  </td>
                  <td className='px-3 py-3 text-right'>
                    <StockCell product={p} />
                  </td>
                  {canManage && (
                    <td className='px-3 py-3'>
                      <ProductMenu product={p} {...menu} />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Móvil: tarjetas */}
          <ul className='md:hidden'>
            {isLoading && [0, 1, 2].map((i) => <li key={i} className='h-20 animate-pulse border-t border-line/50 bg-sand-50/40 first:border-t-0' />)}
            {products.map((p) => (
              <li key={p.id} className={cn('flex items-start gap-3 border-t border-line/50 px-4 py-3.5 first:border-t-0', !p.isActive && 'text-ink-500')}>
                <div className='min-w-0 flex-1'>
                  <p className='font-mono text-xs font-semibold tracking-wide'>
                    {p.code}
                    {!p.isActive && <span className='ml-2 font-plex font-normal'>Inactivo</span>}
                  </p>
                  <p className='truncate text-sm font-medium'>{p.name}</p>
                  <p className='mt-0.5 truncate text-xs text-ink-500'>
                    {p.category.name} · <Range product={p} />
                  </p>
                </div>
                <div className='shrink-0 text-right text-sm'>
                  <StockCell product={p} />
                </div>
                {canManage && <ProductMenu product={p} {...menu} />}
              </li>
            ))}
          </ul>

          {!isLoading && !isError && products.length === 0 && (
            <div className='flex flex-col items-center px-6 py-14 text-center'>
              <span className='grid size-11 place-items-center rounded-full bg-sand-50 text-ink-500'>
                <Package className='size-5' aria-hidden />
              </span>
              <p className='mt-3 text-sm font-medium'>No hay productos en esta vista</p>
            </div>
          )}
          {isError && <p className='px-6 py-10 text-center text-sm text-red-600'>{error?.message ?? 'No se pudieron cargar los productos'}</p>}
        </motion.section>

        {pagination && pagination.totalPages > 1 && (
          <nav className='mt-4 flex items-center justify-between text-sm text-ink-500' aria-label='Paginación'>
            <span>
              Página {pagination.page} de {pagination.totalPages}
            </span>
            <div className='flex gap-2'>
              <button
                type='button'
                disabled={!pagination.hasPrevPage}
                onClick={() => setPage((p) => p - 1)}
                aria-label='Página anterior'
                className='grid size-9 place-items-center rounded-md border border-line bg-white hover:text-ink-900 disabled:opacity-40'
              >
                <ChevronLeft className='size-4' />
              </button>
              <button
                type='button'
                disabled={!pagination.hasNextPage}
                onClick={() => setPage((p) => p + 1)}
                aria-label='Página siguiente'
                className='grid size-9 place-items-center rounded-md border border-line bg-white hover:text-ink-900 disabled:opacity-40'
              >
                <ChevronRight className='size-4' />
              </button>
            </div>
          </nav>
        )}
      </div>

      {canManage && (
        <>
          <ProductFormPanel open={form.open} product={form.product} onClose={() => setForm({ open: false, product: null })} />
          <ConfirmDialog
            open={Boolean(toDeactivate)}
            onOpenChange={(open) => !open && setToDeactivate(null)}
            loading={deactivate.isPending}
            title={toDeactivate ? `¿Desactivar ${toDeactivate.code}?` : ''}
            description='No podrá usarse en movimientos nuevos. Su historial y su kardex se conservan.'
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
