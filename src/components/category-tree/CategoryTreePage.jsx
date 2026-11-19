import { useMemo, useState } from 'react'
import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
import {
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  CornerLeftUp,
  FolderPlus,
  FolderTree,
  GripVertical,
  MoreHorizontal,
  Pencil,
  Plus,
  Power,
  PowerOff,
  Search,
} from 'lucide-react'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { CategoryIcon } from '@/components/common/categoryIcons'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useAuthStore } from '@/stores/authStore'
import { HIERARCHY } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { EASE_OUT } from '@/features/auth/components/AuthUI'
import { filterTree, flattenTree, plural, subtreeIds } from './treeUtils'

const STATUS = [
  { id: 'active', label: 'Activas', isActive: true },
  { id: 'inactive', label: 'Inactivas', isActive: false },
  { id: 'all', label: 'Todas', isActive: undefined },
]

/** Por qué no se puede desactivar (business_rules.md §6.2 regla 3), o null si se puede. */
const deactivateBlocker = (node, items) => {
  if (node.usage.activeChildren > 0) return `Tiene ${plural(node.usage.activeChildren, 'subcategoría activa', 'subcategorías activas')}`
  const active = items.active(node)
  if (active > 0) return `Tiene ${plural(active, items.activeOne, items.activeMany)}`
  return null
}

const menuItem =
  'items-start gap-2.5 rounded-md px-2.5 py-2 text-sm outline-none focus:bg-sand-50 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50'

function CategoryMenu({ node, config, actions }) {
  const blocker = deactivateBlocker(node, config.items)
  const childBlocker = config.childBlocker?.(node)
  const parentInactive = node.parent && !node.parent.isActive
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        aria-label={`Acciones para ${node.code}`}
        className='grid size-7 shrink-0 place-items-center rounded-md text-ink-500 outline-none transition-colors hover:bg-sand-50 hover:text-ink-900 focus-visible:ring-2 focus-visible:ring-forest-700/30'
      >
        <MoreHorizontal className='size-4' />
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-64 border-line/80 p-1.5 font-plex shadow-lg'>
        {node.isActive && (
          <DropdownMenuItem disabled={Boolean(childBlocker)} className={cn(menuItem, 'text-ink-900 hover:bg-sand-50')} onSelect={() => actions.onAddChild(node)}>
            <FolderPlus className='mt-0.5 size-4' aria-hidden />
            <span>
              Nueva subcategoría
              {childBlocker && <span className='mt-0.5 block text-xs text-ink-500'>{childBlocker}</span>}
            </span>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem className={cn(menuItem, 'text-ink-900 hover:bg-sand-50')} onSelect={() => actions.onEdit(node)}>
          <Pencil className='mt-0.5 size-4' aria-hidden />
          {node.parent ? 'Editar o mover' : 'Editar, mover o cambiar icono'}
        </DropdownMenuItem>
        {node.parent && (
          <DropdownMenuItem className={cn(menuItem, 'text-ink-900 hover:bg-sand-50')} onSelect={() => actions.onMove(node, null)}>
            <CornerLeftUp className='mt-0.5 size-4' aria-hidden />
            Convertir en raíz
          </DropdownMenuItem>
        )}
        {node.isActive ? (
          <DropdownMenuItem disabled={Boolean(blocker)} className={cn(menuItem, 'text-red-600 hover:bg-red-50')} onSelect={() => actions.onDeactivate(node)}>
            <PowerOff className='mt-0.5 size-4' aria-hidden />
            <span>
              Desactivar
              {blocker && <span className='mt-0.5 block text-xs text-ink-500'>{blocker}</span>}
            </span>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem disabled={parentInactive} className={cn(menuItem, 'text-ink-900 hover:bg-sand-50')} onSelect={() => actions.onActivate(node)}>
            <Power className='mt-0.5 size-4' aria-hidden />
            <span>
              Activar
              {parentInactive && <span className='mt-0.5 block text-xs text-ink-500'>Activa primero {node.parent.code}</span>}
            </span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Elementos de la categoría; si sus subcategorías suman más, se indica el total de la rama. */
function ItemsCount({ node, items }) {
  const own = items.own(node)
  const all = items.inSubtree(node)
  if (!all) return <span className='hidden shrink-0 text-xs text-ink-500 sm:inline'>{items.none}</span>
  return (
    <span className='shrink-0 text-xs tabular-nums text-ink-500' title={all !== own ? `${own} propios · ${all} con subcategorías` : undefined}>
      {plural(all, items.one, items.many)}
      {all !== own && <span className='hidden sm:inline'> en la rama</span>}
    </span>
  )
}

/** Una fila del árbol con sus hijas. El arrastre solo existe para ADMIN+ con puntero (escritorio). */
function TreeRow({ node, level, expanded, toggle, canManage, config, actions, dnd }) {
  const hasChildren = node.children.length > 0
  const open = hasChildren && expanded(node.id)
  const dragging = dnd.drag?.node.id === node.id
  const blocked = dnd.drag && dnd.drag.blocked.has(node.id)
  const isTarget = dnd.target === node.id
  const isRoot = level === 0

  return (
    <li role='treeitem' aria-expanded={hasChildren ? open : undefined} aria-level={level + 1}>
      <div
        draggable={canManage}
        onDragStart={(e) => dnd.start(e, node)}
        onDragEnd={dnd.end}
        onDragOver={(e) => dnd.over(e, node)}
        onDragLeave={() => dnd.leave(node)}
        onDrop={(e) => dnd.drop(e, node)}
        style={{ paddingLeft: `${level * 1.25 + 0.5}rem` }}
        className={cn(
          'group flex items-center gap-2 border-t border-line/50 py-2.5 pr-3 transition-colors sm:pr-4',
          canManage && 'cursor-grab active:cursor-grabbing',
          isTarget ? 'bg-forest-50 ring-2 ring-inset ring-forest-700/40' : 'hover:bg-sand-50/70',
          (dragging || blocked) && 'opacity-40',
          !node.isActive && !dragging && 'text-ink-500'
        )}
      >
        {canManage && <GripVertical className='hidden size-3.5 shrink-0 text-ink-500/50 group-hover:text-ink-500 md:block' aria-hidden />}
        {hasChildren ? (
          <button
            type='button'
            onClick={() => toggle(node.id)}
            aria-label={open ? `Contraer ${node.name}` : `Expandir ${node.name}`}
            className='grid size-6 shrink-0 place-items-center rounded text-ink-500 hover:bg-sand-50 hover:text-ink-900'
          >
            <ChevronRight className={cn('size-4 transition-transform', open && 'rotate-90')} />
          </button>
        ) : (
          <span className='size-6 shrink-0' />
        )}
        {/* La raíz muestra su icono en relleno; las subcategorías, el mismo icono heredado en tono suave. */}
        <span
          className={cn(
            'grid shrink-0 place-items-center rounded-md',
            isRoot ? 'size-9 bg-forest-700 text-white shadow-sm' : 'size-7 bg-forest-50 text-forest-800',
            !node.isActive && 'bg-sand-50 text-ink-500 shadow-none'
          )}
        >
          <CategoryIcon name={node.displayIcon} className={isRoot ? 'size-[18px]' : 'size-3.5'} />
        </span>
        <div className='min-w-0 flex-1'>
          <p className={cn('flex min-w-0 items-baseline gap-2 text-sm', isRoot && 'font-semibold')}>
            <span className='truncate'>{node.name}</span>
            <span className='hidden shrink-0 font-mono text-[11px] font-normal tracking-wide text-ink-500 sm:inline'>{node.code}</span>
            {!node.isActive && <span className='shrink-0 text-xs font-normal text-ink-500'>Inactiva</span>}
          </p>
          <p className='truncate font-mono text-[11px] text-ink-500 sm:hidden'>{node.code}</p>
          {node.description && <p className='hidden truncate text-xs text-ink-500 sm:block'>{node.description}</p>}
        </div>
        {config.badge?.(node)}
        <ItemsCount node={node} items={config.items} />
        {canManage && <CategoryMenu node={node} config={config} actions={actions} />}
      </div>
      {open && (
        <ul role='group'>
          {node.children.map((child) => (
            <TreeRow
              key={child.id}
              node={child}
              level={level + 1}
              expanded={expanded}
              toggle={toggle}
              canManage={canManage}
              config={config}
              actions={actions}
              dnd={dnd}
            />
          ))}
        </ul>
      )}
    </li>
  )
}

/**
 * Página de un árbol de categorías (productos HU-203, activos HU-301). ADMIN+ crea, edita y mueve
 * arrastrando una categoría sobre otra (o con el selector de padre del formulario, que también
 * funciona en el móvil). El backend rechaza los ciclos con CATEGORY_CYCLE; aquí, además, la rama
 * que se arrastra no acepta soltarse dentro de sí misma ni en una categoría que no admite hijas.
 *
 * config: { title, treeLabel, dragHint, deactivateDescription, items, childBlocker?, badge?, hooks, FormPanel }
 *  - items: { one, many, activeOne, activeMany, none, own(n), inSubtree(n), active(n) }
 *  - hooks: { useTree, useMove, useDeactivate, useActivate }
 */
export function CategoryTreePage({ config }) {
  const canManage = useAuthStore((s) => s.hasHierarchy(HIERARCHY.ADMIN))
  const [statusId, setStatusId] = useState('active')
  const [search, setSearch] = useState('')
  const [collapsed, setCollapsed] = useState(() => new Set())
  const [form, setForm] = useState({ open: false, category: null, parentId: null })
  const [toDeactivate, setToDeactivate] = useState(null)
  const [drag, setDrag] = useState(null)
  const [target, setTarget] = useState(null)

  const { useTree, useMove, useDeactivate, useActivate } = config.hooks
  const { data: tree = [], isLoading, isError, error } = useTree()
  const move = useMove()
  const deactivate = useDeactivate()
  const activate = useActivate()
  const { FormPanel } = config

  const all = useMemo(() => flattenTree(tree), [tree])
  // Los nodos filtrados pueden haber perdido hijas: editar y arrastrar usan siempre el nodo completo.
  const byId = useMemo(() => new Map(all.map((n) => [n.id, n])), [all])
  const full = (node) => byId.get(node.id) ?? node
  const term = search.trim().toLowerCase()
  const visible = useMemo(() => {
    const isActive = STATUS.find((s) => s.id === statusId).isActive
    return filterTree(
      tree,
      (n) =>
        (isActive === undefined || n.isActive === isActive) &&
        (!term || n.code.toLowerCase().includes(term) || n.name.toLowerCase().includes(term))
    )
  }, [tree, statusId, term])

  // Al buscar se expande todo, para ver cada resultado dentro de su rama.
  const expanded = (id) => Boolean(term) || !collapsed.has(id)
  const toggle = (id) =>
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  const withChildren = all.filter((n) => n.children.length)
  const allCollapsed = withChildren.length > 0 && withChildren.every((n) => collapsed.has(n.id))

  const moveTo = (node, parentId) => {
    if ((node.parent?.id ?? null) === parentId) return
    move.mutate({ id: node.id, parentId })
    if (parentId) setCollapsed((prev) => new Set([...prev].filter((id) => id !== parentId)))
  }

  const actions = {
    onAddChild: (node) => setForm({ open: true, category: null, parentId: node.id }),
    onEdit: (node) => setForm({ open: true, category: full(node), parentId: null }),
    onMove: moveTo,
    onDeactivate: setToDeactivate,
    onActivate: (node) => activate.mutate(node.id),
  }

  // No se suelta en la propia rama, en el padre actual, en una inactiva ni en una que no admite hijas.
  const canDropOn = (node) =>
    drag && !drag.blocked.has(node.id) && node.id !== drag.node.parent?.id && node.isActive && !config.childBlocker?.(node)
  const dnd = {
    drag,
    target,
    start: (e, node) => {
      if (!canManage) return
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', node.code)
      setDrag({ node, blocked: subtreeIds(full(node)) })
    },
    end: () => {
      setDrag(null)
      setTarget(null)
    },
    over: (e, node) => {
      if (!canDropOn(node)) return
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
      if (target !== node.id) setTarget(node.id)
    },
    leave: (node) => target === node.id && setTarget(null),
    drop: (e, node) => {
      e.preventDefault()
      if (canDropOn(node)) moveTo(drag.node, node.id)
      dnd.end()
    },
  }
  const canDropOnRoot = Boolean(drag?.node.parent)

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
            <h1 className='text-[1.75rem] font-semibold tracking-tight'>{config.title}</h1>
            <p className='mt-0.5 text-sm text-ink-500'>
              {isLoading ? '—' : `${plural(all.length, 'categoría', 'categorías')} · ${plural(tree.length, 'raíz', 'raíces')}`}
            </p>
          </div>
          {canManage && (
            <motion.button
              type='button'
              whileTap={{ scale: 0.97 }}
              onClick={() => setForm({ open: true, category: null, parentId: null })}
              className='inline-flex h-10 items-center gap-2 rounded-md bg-forest-700 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-forest-800'
            >
              <Plus className='size-4' aria-hidden />
              Nueva categoría
            </motion.button>
          )}
        </motion.header>

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
                  <motion.span layoutId='category-status' className='absolute inset-0 rounded-full bg-ink-900' transition={{ type: 'spring', stiffness: 500, damping: 38 }} />
                )}
                <span className='relative'>{s.label}</span>
              </button>
            ))}
          </div>
          <div className='flex gap-2'>
            <div className='relative flex-1 sm:flex-none'>
              <Search className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-500' aria-hidden />
              <input
                type='search'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder='Buscar por código o nombre'
                aria-label='Buscar categorías'
                className='h-9 w-full rounded-md border border-line bg-white pl-9 pr-3 text-sm outline-none transition focus:border-forest-700 focus:ring-4 focus:ring-forest-700/10 sm:w-64'
              />
            </div>
            <button
              type='button'
              disabled={Boolean(term) || !withChildren.length}
              onClick={() => setCollapsed(allCollapsed ? new Set() : new Set(withChildren.map((n) => n.id)))}
              aria-label={allCollapsed ? 'Expandir todo' : 'Contraer todo'}
              title={allCollapsed ? 'Expandir todo' : 'Contraer todo'}
              className='grid size-9 shrink-0 place-items-center rounded-md border border-line bg-white text-ink-500 transition-colors hover:text-ink-900 disabled:opacity-40'
            >
              {allCollapsed ? <ChevronsUpDown className='size-4' /> : <ChevronsDownUp className='size-4' />}
            </button>
          </div>
        </div>

        {canManage && <p className='mt-3 hidden text-xs text-ink-500 md:block'>{config.dragHint}</p>}

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05, ease: EASE_OUT }}
          className='mt-3 overflow-hidden rounded-xl border border-line/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]'
        >
          <AnimatePresence initial={false}>
            {canDropOnRoot && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                onDragOver={(e) => {
                  e.preventDefault()
                  if (target !== 'root') setTarget('root')
                }}
                onDragLeave={() => target === 'root' && setTarget(null)}
                onDrop={(e) => {
                  e.preventDefault()
                  moveTo(drag.node, null)
                  dnd.end()
                }}
                className={cn(
                  'flex items-center justify-center gap-2 border-b border-dashed border-line px-4 py-3 text-sm text-ink-500 transition-colors',
                  target === 'root' && 'bg-forest-50 text-forest-800'
                )}
              >
                <CornerLeftUp className='size-4' aria-hidden />
                Suelta aquí para convertir {drag.node.code} en categoría raíz
              </motion.div>
            )}
          </AnimatePresence>

          {isLoading && (
            <div className='space-y-px'>
              {[0, 1, 2, 1, 0, 0].map((level, i) => (
                <div key={i} className='flex items-center gap-3 border-t border-line/50 px-4 py-3 first:border-t-0' style={{ paddingLeft: `${level * 1.25 + 2.5}rem` }}>
                  <div className={cn('animate-pulse rounded-md bg-sand-50', level ? 'size-7' : 'size-9')} />
                  <div className='h-3.5 w-40 animate-pulse rounded bg-sand-50' />
                </div>
              ))}
            </div>
          )}

          {!isLoading && visible.length > 0 && (
            <ul role='tree' aria-label={config.treeLabel} className='[&>li:first-child>div]:border-t-0'>
              {visible.map((node) => (
                <TreeRow key={node.id} node={node} level={0} expanded={expanded} toggle={toggle} canManage={canManage} config={config} actions={actions} dnd={dnd} />
              ))}
            </ul>
          )}

          {!isLoading && !isError && visible.length === 0 && (
            <div className='flex flex-col items-center px-6 py-14 text-center'>
              <span className='grid size-11 place-items-center rounded-full bg-sand-50 text-ink-500'>
                <FolderTree className='size-5' aria-hidden />
              </span>
              <p className='mt-3 text-sm font-medium'>No hay categorías en esta vista</p>
            </div>
          )}

          {isError && <p className='px-6 py-10 text-center text-sm text-red-600'>{error?.message ?? 'No se pudieron cargar las categorías'}</p>}
        </motion.section>
      </div>

      {canManage && (
        <>
          <FormPanel
            open={form.open}
            category={form.category}
            defaultParentId={form.parentId}
            tree={tree}
            onClose={() => setForm({ open: false, category: null, parentId: null })}
          />
          <ConfirmDialog
            open={Boolean(toDeactivate)}
            onOpenChange={(open) => !open && setToDeactivate(null)}
            loading={deactivate.isPending}
            title={toDeactivate ? `¿Desactivar ${toDeactivate.code}?` : ''}
            description={config.deactivateDescription}
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
