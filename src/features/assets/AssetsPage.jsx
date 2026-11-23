import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { MotionConfig, motion } from 'framer-motion'
import { ChevronDown, FolderOpen, Layers, List, MoreHorizontal, Pencil, Plus, Power, PowerOff, Search, Truck } from 'lucide-react'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Pager } from '@/components/common/Pager'
import { CategoryIcon } from '@/components/common/categoryIcons'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useAuthStore } from '@/stores/authStore'
import { HIERARCHY } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { EASE_OUT } from '@/features/auth/components/AuthUI'
import { useAssetCategoryTree, useAssetCounts } from '@/features/asset-categories/assetCategoriesApi'
import { categoryPathLabel, useActivateAsset, useAssetGroups, useAssets, useDeactivateAsset } from './assetsApi'
import { AssetFormPanel } from './AssetFormPanel'

const STATUS = [
  { id: 'active', label: 'Activos', isActive: true },
  { id: 'inactive', label: 'Inactivos', isActive: false },
  { id: 'all', label: 'Todos', isActive: undefined },
]
const PAGE_SIZE = 20

const useDebounced = (value, delay = 300) => {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

/** Por qué no se puede desactivar (business_rules.md §6.5 regla 4) o reactivar, o null si se puede. */
const blockerOf = (asset) => {
  if (asset.isActive) {
    return asset.pendingLoans > 0
      ? `Tiene préstamos sin devolver (${asset.pendingLoans} ${asset.pendingLoans === 1 ? 'producto' : 'productos'})`
      : null
  }
  return asset.category.isActive ? null : `Activa primero la categoría ${asset.category.code}`
}

export function AssetMenu({ asset, onEdit, onDeactivate, onActivate }) {
  const blocker = blockerOf(asset)
  const item =
    'items-start gap-2.5 rounded-md px-2.5 py-2 text-sm outline-none focus:bg-sand-50 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50'
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        aria-label={`Acciones para ${asset.code}`}
        className='grid size-7 shrink-0 place-items-center rounded-md text-ink-500 outline-none transition-colors hover:bg-sand-50 hover:text-ink-900 focus-visible:ring-2 focus-visible:ring-forest-700/30'
      >
        <MoreHorizontal className='size-4' />
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-64 border-line/80 p-1.5 font-plex shadow-lg'>
        <DropdownMenuItem className={cn(item, 'text-ink-900 hover:bg-sand-50')} onSelect={() => onEdit(asset)}>
          <Pencil className='mt-0.5 size-4' aria-hidden />
          Editar
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={Boolean(blocker)}
          className={cn(item, asset.isActive ? 'text-red-600 hover:bg-red-50' : 'text-ink-900 hover:bg-sand-50')}
          onSelect={() => (asset.isActive ? onDeactivate(asset) : onActivate(asset))}
        >
          {asset.isActive ? <PowerOff className='mt-0.5 size-4' aria-hidden /> : <Power className='mt-0.5 size-4' aria-hidden />}
          <span>
            {asset.isActive ? 'Desactivar' : 'Activar'}
            {blocker && <span className='mt-0.5 block text-xs text-ink-500'>{blocker}</span>}
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Icono de la raíz de su categoría: así se distingue de un vistazo un tractor de un tablón. */
export const AssetIcon = ({ asset, size = 'md' }) => (
  <span
    className={cn(
      'grid shrink-0 place-items-center rounded-lg',
      size === 'md' ? 'size-10' : 'size-9',
      asset.isActive ? 'bg-forest-50 text-forest-800 ring-1 ring-forest-700/10' : 'bg-sand-50 text-ink-500'
    )}
  >
    <CategoryIcon name={asset.category.displayIcon} className='size-[18px]' />
  </span>
)

const Chip = ({ active, onClick, icon, label, count }) => (
  <button
    type='button'
    onClick={onClick}
    aria-pressed={active}
    className={cn(
      'inline-flex h-9 shrink-0 items-center gap-2 rounded-full border px-3 text-sm transition-colors',
      active ? 'border-forest-700 bg-forest-700 text-white shadow-sm' : 'border-line bg-white text-ink-900 hover:border-ink-500/40'
    )}
  >
    {icon}
    <span>{label}</span>
    {count !== undefined && <span className={cn('tabular-nums text-xs', active ? 'text-white/80' : 'text-ink-500')}>{count}</span>}
  </button>
)

/**
 * HU-303: cuántos activos hay en la categoría elegida contando sus subcategorías (o en la finca), y
 * cuántos aporta cada subcategoría directa. Un clic en una fila baja a esa subcategoría.
 */
function AssetCountSummary({ categoryId, onSelect }) {
  const { data, isPlaceholderData } = useAssetCounts(categoryId)
  if (!data) return null
  const { category, assets, breakdown } = data
  const groups = breakdown.filter((g) => g.isActive || g.assets.total > 0)
  const max = Math.max(1, ...groups.map((g) => g.assets.active))
  const scope = category ? category.name : 'la finca'
  return (
    <section
      aria-label='Activos por categoría'
      className={cn(
        'rounded-xl border border-line/80 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-opacity',
        isPlaceholderData && 'opacity-60'
      )}
    >
      <div className='flex flex-wrap items-baseline gap-x-3 gap-y-1'>
        <p className='text-2xl font-semibold tabular-nums tracking-tight'>{assets.active}</p>
        <p className='text-sm text-ink-900'>
          {assets.active === 1 ? 'activo en servicio' : 'activos en servicio'} en {scope}
          {category && !category.isLeaf && <span className='text-ink-500'>, con sus subcategorías</span>}
        </p>
        {assets.inactive > 0 && (
          <p className='text-xs text-ink-500'>
            + {assets.inactive} {assets.inactive === 1 ? 'inactivo' : 'inactivos'}
          </p>
        )}
      </div>
      {groups.length > 0 && (
        <ul className='mt-3 grid gap-x-6 gap-y-1.5 sm:grid-cols-2 lg:grid-cols-3'>
          {groups.map((g) => (
            <li key={g.id}>
              <button
                type='button'
                onClick={() => onSelect(g.id)}
                className='group flex w-full items-center gap-2.5 rounded-md py-1 text-left text-sm outline-none focus-visible:ring-2 focus-visible:ring-forest-700/30'
              >
                <CategoryIcon name={g.displayIcon} className='size-4 shrink-0 text-ink-500' />
                <span className='min-w-0 flex-1'>
                  <span className='flex items-baseline justify-between gap-2'>
                    <span className='truncate group-hover:underline'>{g.name}</span>
                    <span className='shrink-0 tabular-nums text-ink-900'>{g.assets.active}</span>
                  </span>
                  <span className='mt-1 block h-1 overflow-hidden rounded-full bg-sand-50'>
                    <span className='block h-full rounded-full bg-forest-700/70' style={{ width: `${(g.assets.active / max) * 100}%` }} />
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

/**
 * Filtro por categoría que baja por el árbol: primero las raíces (con su icono); al elegir una,
 * aparecen sus subcategorías, y así hasta la hoja. Cada nivel incluye los activos de su rama.
 */
function CategoryDrilldown({ tree, path, onChange }) {
  const rows = [tree]
  path.forEach((id, level) => {
    const node = rows[level].find((n) => n.id === id)
    if (node?.children.length) rows.push(node.children)
  })
  const rootIcon = tree.find((n) => n.id === path[0])?.displayIcon
  return (
    <div className='space-y-2'>
      {rows.map((nodes, level) => (
        <div key={level} className='-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0'>
          <Chip
            active={path.length === level}
            onClick={() => onChange(path.slice(0, level))}
            icon={level === 0 ? <Layers className='size-4' aria-hidden /> : null}
            label={level === 0 ? 'Todas' : 'Todas en esta rama'}
          />
          {nodes
            .filter((n) => n.isActive || path[level] === n.id)
            .map((n) => (
              <Chip
                key={n.id}
                active={path[level] === n.id}
                onClick={() => onChange([...path.slice(0, level), n.id])}
                icon={<CategoryIcon name={level === 0 ? n.displayIcon : rootIcon} className='size-4' />}
                label={n.name}
                count={n.assetsInSubtree}
              />
            ))}
        </div>
      ))}
    </div>
  )
}

/**
 * Cuándo agrupar. La vista abarca varias categorías hoja con activos (CAMPO tiene un lote por
 * hoja) y tiene más activos de los que caben en una página: 20 lotes de 40 tablones son 800 filas
 * sueltas, mientras que agrupados son 20 filas que se abren. VEHICULOS, con 7 activos, sigue en lista.
 */
const leavesWithAssets = (nodes) =>
  nodes.reduce((sum, n) => sum + (n.children.length ? leavesWithAssets(n.children) : n.usage.totalAssets > 0 ? 1 : 0), 0)

const groupingOf = (scope) => {
  const canGroup = leavesWithAssets(scope) > 1
  const total = scope.reduce((sum, n) => sum + n.assetsInSubtree, 0)
  return { canGroup, autoGroup: canGroup && total > PAGE_SIZE }
}

const StatusTags = ({ asset }) => (
  <>
    {!asset.isActive && <span className='rounded-full bg-sand-50 px-2 py-0.5 text-xs ring-1 ring-line'>Inactivo</span>}
    {asset.pendingLoans > 0 && (
      <span className='rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-800 ring-1 ring-amber-200'>Préstamo pendiente</span>
    )}
  </>
)

const GROUP_PAGE_SIZE = 60

/** Los activos de un grupo abierto (los tablones de un lote), en orden natural de código. */
function GroupAssets({ group, filters, canManage, menu }) {
  const [page, setPage] = useState(1)
  const { data, isLoading, isPlaceholderData } = useAssets({
    ...filters,
    categoryId: group.category.id,
    page,
    limit: GROUP_PAGE_SIZE,
    sort: 'code',
  })
  const assets = data?.data ?? []
  return (
    <div className={cn('border-t border-line/50 bg-sand-50/40 px-4 py-3 transition-opacity sm:px-5', isPlaceholderData && 'opacity-60')}>
      {isLoading ? (
        <div className='h-14 animate-pulse rounded-lg bg-white/70' />
      ) : (
        <ul className='grid gap-2 sm:grid-cols-2 lg:grid-cols-3'>
          {assets.map((a) => (
            <li
              key={a.id}
              className={cn('flex items-center gap-3 rounded-lg border border-line/70 bg-white px-3 py-2', !a.isActive && 'text-ink-500')}
            >
              <div className='min-w-0 flex-1'>
                <p className='font-mono text-xs font-semibold tracking-wide text-ink-900'>{a.code}</p>
                <p className='truncate text-sm'>
                  <Link to={`/assets/${a.id}`} className='hover:underline focus-visible:underline focus-visible:outline-none'>
                    {a.name}
                  </Link>
                </p>
                {(!a.isActive || a.pendingLoans > 0) && (
                  <p className='mt-1 flex flex-wrap gap-1.5'>
                    <StatusTags asset={a} />
                  </p>
                )}
              </div>
              {canManage && <AssetMenu asset={a} {...menu} />}
            </li>
          ))}
        </ul>
      )}
      <div className='mt-3 empty:hidden'>
        <Pager pagination={data?.meta?.pagination} onPage={setPage} label={`Páginas de ${group.category.name}`} />
      </div>
    </div>
  )
}

/**
 * Vista agrupada: una fila por categoría hoja (un lote) con cuántos activos tiene y su rango de
 * códigos (TB-100 … TB-139). Al abrirla se listan sus activos. Se pueden abrir varias a la vez.
 */
function AssetGroups({ filters, canManage, menu }) {
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(() => new Set())
  useEffect(() => {
    setPage(1)
    setOpen(new Set())
  }, [filters.categoryId, filters.isActive, filters.search])

  const { data, isLoading, isError, error, isPlaceholderData } = useAssetGroups({ ...filters, page, limit: 50 })
  const groups = data?.data ?? []
  // Con un solo grupo (una búsqueda que cae en un lote) se abre directamente.
  const isOpen = (id) => open.has(id) || groups.length === 1
  const toggle = (id) =>
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <>
      <section
        aria-label='Activos agrupados por categoría'
        className={cn(
          'mt-4 overflow-hidden rounded-xl border border-line/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-opacity',
          isPlaceholderData && 'opacity-60'
        )}
      >
        {isLoading && [0, 1, 2, 3].map((i) => <div key={i} className='h-16 animate-pulse border-t border-line/50 bg-sand-50/40 first:border-t-0' />)}
        <ul>
          {groups.map((g) => {
            const expanded = isOpen(g.category.id)
            const parents = g.category.path.slice(0, -1)
            const inactive = g.assets - g.active
            return (
              <li key={g.category.id} className='border-t border-line/50 first:border-t-0'>
                <button
                  type='button'
                  onClick={() => toggle(g.category.id)}
                  aria-expanded={expanded}
                  className='flex w-full items-center gap-3 px-4 py-3 text-left outline-none transition-colors hover:bg-sand-50/60 focus-visible:bg-sand-50 sm:px-5'
                >
                  <span className='grid size-10 shrink-0 place-items-center rounded-lg bg-forest-50 text-forest-800 ring-1 ring-forest-700/10'>
                    <CategoryIcon name={g.category.displayIcon} className='size-[18px]' />
                  </span>
                  <span className='min-w-0 flex-1'>
                    <span className='block truncate font-medium'>
                      {g.category.name}
                      {parents.length > 0 && <span className='font-normal text-ink-500'> · {categoryPathLabel(parents)}</span>}
                    </span>
                    <span className='block truncate text-xs text-ink-500'>
                      <span className='font-mono font-semibold text-ink-900'>
                        {g.firstCode === g.lastCode ? g.firstCode : `${g.firstCode} … ${g.lastCode}`}
                      </span>
                      {inactive > 0 && ` · ${inactive} ${inactive === 1 ? 'inactivo' : 'inactivos'}`}
                    </span>
                  </span>
                  <span className='shrink-0 text-right text-sm tabular-nums'>
                    <span className='font-semibold'>{g.assets}</span>
                    <span className='hidden text-ink-500 sm:inline'> {g.assets === 1 ? 'activo' : 'activos'}</span>
                  </span>
                  <ChevronDown className={cn('size-4 shrink-0 text-ink-500 transition-transform', expanded && 'rotate-180')} aria-hidden />
                </button>
                {expanded && <GroupAssets group={g} filters={filters} canManage={canManage} menu={menu} />}
              </li>
            )
          })}
        </ul>
        {!isLoading && !isError && groups.length === 0 && (
          <div className='flex flex-col items-center px-6 py-14 text-center'>
            <span className='grid size-11 place-items-center rounded-full bg-sand-50 text-ink-500'>
              <Truck className='size-5' aria-hidden />
            </span>
            <p className='mt-3 text-sm font-medium'>No hay activos en esta vista</p>
          </div>
        )}
        {isError && <p className='px-6 py-10 text-center text-sm text-red-600'>{error?.message ?? 'No se pudieron cargar los grupos'}</p>}
      </section>
      <div className='mt-4 empty:hidden'>
        <Pager pagination={data?.meta?.pagination} onPage={setPage} />
      </div>
    </>
  )
}

/** Lista o agrupado. Solo aparece cuando la vista abarca varias categorías hoja con activos. */
function ViewToggle({ grouped, onChange }) {
  const option = (active) =>
    cn(
      'inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-sm transition-colors',
      active ? 'bg-white text-ink-900 shadow-sm ring-1 ring-line' : 'text-ink-500 hover:text-ink-900'
    )
  return (
    <div className='inline-flex rounded-lg bg-sand-50 p-0.5' role='group' aria-label='Forma de ver los activos'>
      <button type='button' aria-pressed={!grouped} onClick={() => onChange('list')} className={option(!grouped)}>
        <List className='size-4' aria-hidden />
        Lista
      </button>
      <button
        type='button'
        aria-pressed={grouped}
        onClick={() => onChange('groups')}
        className={option(grouped)}
        title='Un grupo por categoría: los tablones dentro de su lote'
      >
        <FolderOpen className='size-4' aria-hidden />
        Agrupado
      </button>
    </div>
  )
}

/**
 * Activos (HU-302, business_rules.md §6.5): los destinos de los consumos. Todos los roles
 * consultan; ADMIN o superior crea, edita y desactiva. Solo código, nombre y categoría hoja; el
 * código se sugiere según el prefijo de la categoría. Tabla en escritorio y tarjetas en el móvil.
 */
export function AssetsPage() {
  const canManage = useAuthStore((s) => s.hasHierarchy(HIERARCHY.ADMIN))
  const [statusId, setStatusId] = useState('active')
  const [categoryPath, setCategoryPath] = useState([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebounced(search.trim())
  const [form, setForm] = useState({ open: false, asset: null })
  const [toDeactivate, setToDeactivate] = useState(null)
  // 'auto' agrupa según groupingOf; 'list' o 'groups' cuando el usuario elige.
  const [view, setView] = useState('auto')

  const { data: tree = [] } = useAssetCategoryTree()
  const categoryId = categoryPath.at(-1)

  // Un filtro nuevo vuelve a la primera página; otra categoría vuelve a la vista automática.
  useEffect(() => setPage(1), [statusId, categoryId, debouncedSearch])
  useEffect(() => setView('auto'), [categoryId])

  const isActive = STATUS.find((s) => s.id === statusId).isActive

  // Si el filtro es una hoja, el alta la propone como categoría.
  const selectedNode = useMemo(() => {
    let nodes = tree
    let node = null
    for (const id of categoryPath) {
      node = nodes.find((n) => n.id === id)
      nodes = node?.children ?? []
    }
    return node
  }, [tree, categoryPath])

  const { canGroup, autoGroup } = useMemo(() => groupingOf(selectedNode ? [selectedNode] : tree), [selectedNode, tree])
  const grouped = canGroup && (view === 'auto' ? autoGroup : view === 'groups')
  const filters = useMemo(() => ({ search: debouncedSearch, categoryId, isActive }), [debouncedSearch, categoryId, isActive])

  const params = useMemo(() => ({ ...filters, page, limit: PAGE_SIZE, sort: 'code' }), [filters, page])
  const { data, isLoading, isError, error, isPlaceholderData } = useAssets(params, { enabled: !grouped })
  const assets = data?.data ?? []
  const pagination = data?.meta?.pagination

  const deactivate = useDeactivateAsset()
  const activate = useActivateAsset()
  const menu = {
    onEdit: (asset) => setForm({ open: true, asset }),
    onDeactivate: setToDeactivate,
    onActivate: (asset) => activate.mutate(asset.id),
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
            <h1 className='text-[1.75rem] font-semibold tracking-tight'>Activos</h1>
            <p className='mt-0.5 text-sm text-ink-500'>
              {grouped
                ? 'Agrupados por categoría: abre un grupo para ver sus activos'
                : isLoading
                  ? '—'
                  : `${pagination?.totalItems ?? 0} ${pagination?.totalItems === 1 ? 'activo' : 'activos'} en esta vista`}
            </p>
          </div>
          {canManage && (
            <motion.button
              type='button'
              whileTap={{ scale: 0.97 }}
              onClick={() => setForm({ open: true, asset: null })}
              className='inline-flex h-10 items-center gap-2 rounded-md bg-forest-700 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-forest-800'
            >
              <Plus className='size-4' aria-hidden />
              Nuevo activo
            </motion.button>
          )}
        </motion.header>

        <div className='mt-6'>
          <CategoryDrilldown tree={tree} path={categoryPath} onChange={setCategoryPath} />
        </div>

        <div className='mt-4'>
          <AssetCountSummary categoryId={categoryId} onSelect={(id) => setCategoryPath([...categoryPath, id])} />
        </div>

        <div className='mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex flex-wrap items-center gap-2'>
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
                    <motion.span
                      layoutId='asset-status'
                      className='absolute inset-0 rounded-full bg-ink-900'
                      transition={{
                        type: 'spring',
                        stiffness: 500,
                        damping: 38,
                      }}
                    />
                  )}
                  <span className='relative'>{s.label}</span>
                </button>
              ))}
            </div>
            {canGroup && <ViewToggle grouped={grouped} onChange={setView} />}
          </div>
          <div className='relative'>
            <Search className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-500' aria-hidden />
            <input
              type='search'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder='Buscar por código o nombre'
              aria-label='Buscar activos'
              className='h-9 w-full rounded-md border border-line bg-white pl-9 pr-3 text-sm outline-none transition focus:border-forest-700 focus:ring-4 focus:ring-forest-700/10 sm:w-64'
            />
          </div>
        </div>

        {grouped ? (
          <AssetGroups filters={filters} canManage={canManage} menu={menu} />
        ) : (
          <>
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05, ease: EASE_OUT }}
              className={cn(
                'mt-4 overflow-hidden rounded-xl border border-line/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-opacity',
                isPlaceholderData && 'opacity-60'
              )}
            >
              {/* Escritorio: tabla */}
              <table className='hidden w-full text-sm md:table'>
                <thead className='border-b border-line/60 bg-sand-50/60 text-left text-xs font-medium uppercase tracking-wide text-ink-500'>
                  <tr>
                    <th className='px-5 py-3 font-medium'>Activo</th>
                    <th className='px-3 py-3 font-medium'>Código</th>
                    <th className='px-3 py-3 font-medium'>Categoría</th>
                    <th className='px-3 py-3 font-medium'>Estado</th>
                    {canManage && <th className='w-12 px-3 py-3' aria-label='Acciones' />}
                  </tr>
                </thead>
                <tbody>
                  {isLoading &&
                    [0, 1, 2, 3, 4].map((i) => (
                      <tr key={i} className='border-t border-line/50'>
                        <td colSpan={5} className='px-5 py-3.5'>
                          <div className='h-4 w-2/3 animate-pulse rounded bg-sand-50' />
                        </td>
                      </tr>
                    ))}
                  {assets.map((a) => (
                    <tr key={a.id} className={cn('border-t border-line/50 first:border-t-0 hover:bg-sand-50/50', !a.isActive && 'text-ink-500')}>
                      <td className='px-5 py-2.5'>
                        <div className='flex items-center gap-3'>
                          <AssetIcon asset={a} />
                          <span className='font-medium'>
                            <Link to={`/assets/${a.id}`} className='hover:underline focus-visible:underline focus-visible:outline-none'>
                              {a.name}
                            </Link>
                          </span>
                        </div>
                      </td>
                      <td className='px-3 py-2.5 font-mono text-xs font-semibold tracking-wide'>{a.code}</td>
                      <td className='px-3 py-2.5 text-ink-500'>{categoryPathLabel(a.category.path)}</td>
                      <td className='px-3 py-2.5'>
                        <span className='flex flex-wrap gap-1.5'>
                          {!a.isActive && <span className='rounded-full bg-sand-50 px-2 py-0.5 text-xs ring-1 ring-line'>Inactivo</span>}
                          {a.pendingLoans > 0 && (
                            <span className='rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-800 ring-1 ring-amber-200'>
                              Préstamo pendiente
                            </span>
                          )}
                          {a.isActive && !a.pendingLoans && <span className='text-xs text-ink-500'>Disponible</span>}
                        </span>
                      </td>
                      {canManage && (
                        <td className='px-3 py-2.5'>
                          <AssetMenu asset={a} {...menu} />
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Móvil: tarjetas */}
              <ul className='md:hidden'>
                {isLoading &&
                  [0, 1, 2].map((i) => <li key={i} className='h-16 animate-pulse border-t border-line/50 bg-sand-50/40 first:border-t-0' />)}
                {assets.map((a) => (
                  <li
                    key={a.id}
                    className={cn('flex items-center gap-3 border-t border-line/50 px-4 py-3 first:border-t-0', !a.isActive && 'text-ink-500')}
                  >
                    <AssetIcon asset={a} size='sm' />
                    <div className='min-w-0 flex-1'>
                      <p className='truncate text-sm font-medium'>
                        <Link to={`/assets/${a.id}`} className='hover:underline focus-visible:underline focus-visible:outline-none'>
                          {a.name}
                        </Link>
                      </p>
                      <p className='truncate text-xs text-ink-500'>
                        <span className='font-mono font-semibold text-ink-900'>{a.code}</span> · {a.category.name}
                        {!a.isActive && ' · Inactivo'}
                        {a.pendingLoans > 0 && <span className='text-amber-700'> · Préstamo pendiente</span>}
                      </p>
                    </div>
                    {canManage && <AssetMenu asset={a} {...menu} />}
                  </li>
                ))}
              </ul>

              {!isLoading && !isError && assets.length === 0 && (
                <div className='flex flex-col items-center px-6 py-14 text-center'>
                  <span className='grid size-11 place-items-center rounded-full bg-sand-50 text-ink-500'>
                    <Truck className='size-5' aria-hidden />
                  </span>
                  <p className='mt-3 text-sm font-medium'>No hay activos en esta vista</p>
                </div>
              )}
              {isError && <p className='px-6 py-10 text-center text-sm text-red-600'>{error?.message ?? 'No se pudieron cargar los activos'}</p>}
            </motion.section>

            <div className='mt-4 empty:hidden'>
              <Pager pagination={pagination} onPage={setPage} />
            </div>
          </>
        )}
      </div>

      {canManage && (
        <>
          <AssetFormPanel
            open={form.open}
            asset={form.asset}
            defaultCategoryId={!form.asset && selectedNode?.isLeaf && selectedNode.isActive ? selectedNode.id : null}
            onClose={() => setForm({ open: false, asset: null })}
          />
          <ConfirmDialog
            open={Boolean(toDeactivate)}
            onOpenChange={(open) => !open && setToDeactivate(null)}
            loading={deactivate.isPending}
            title={toDeactivate ? `¿Desactivar ${toDeactivate.code}?` : ''}
            description='No podrá recibir consumos ni préstamos nuevos. Su historial de consumos se conserva.'
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
