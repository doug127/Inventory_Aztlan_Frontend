import { useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useUiStore } from '@/stores/uiStore'
import { useAuthStore } from '@/stores/authStore'
import { HIERARCHY } from '@/lib/constants.js'
import {
  ArrowLeftRight,
  BarChart2,
  BookOpen,
  ChevronDown,
  ChevronLeft,
  FolderTree,
  LayoutDashboard,
  Package,
  Ruler,
  ShieldCheck,
  Truck,
  Network,
  Users,
  Warehouse,
} from 'lucide-react'

// Un elemento con `children` es un grupo desplegable. minHierarchy: rango mínimo (menor = más alto).
const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, minHierarchy: null },
  { to: '/movements', label: 'Movimientos', icon: ArrowLeftRight, minHierarchy: HIERARCHY.USER },
  { to: '/stock', label: 'Stock', icon: BarChart2, minHierarchy: HIERARCHY.USER },
  { to: '/products', label: 'Productos', icon: Package, minHierarchy: HIERARCHY.USER },
  {
    id: 'catalog',
    label: 'Catálogo',
    icon: BookOpen,
    children: [
      { to: '/warehouses', label: 'Almacenes', icon: Warehouse, minHierarchy: HIERARCHY.USER },
      { to: '/units', label: 'Unidades', icon: Ruler, minHierarchy: HIERARCHY.USER },
      { to: '/product-categories', label: 'Categorías de productos', icon: FolderTree, minHierarchy: HIERARCHY.USER },
      { to: '/asset-categories', label: 'Categorías de activos', icon: Network, minHierarchy: HIERARCHY.USER },
      { to: '/assets', label: 'Activos', icon: Truck, minHierarchy: HIERARCHY.USER },
    ],
  },
  { to: '/users', label: 'Usuarios', icon: Users, minHierarchy: HIERARCHY.ADMIN },
  { to: '/admin/security-log', label: 'Bitácora', icon: ShieldCheck, minHierarchy: HIERARCHY.SUPERADMIN },
]

const linkClass = ({ isActive }) =>
  cn(
    'flex items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors',
    'text-muted-foreground hover:bg-muted',
    isActive && 'bg-muted font-medium text-foreground'
  )

function NavItem({ item, collapsed, nested = false }) {
  const Icon = item.icon
  return (
    <NavLink to={item.to} end={item.to === '/'} title={collapsed ? item.label : undefined} className={linkClass}>
      <Icon className={cn('shrink-0', nested ? 'h-[15px] w-[15px]' : 'h-4 w-4')} />
      {!collapsed && <span className='truncate'>{item.label}</span>}
    </NavLink>
  )
}

/** Grupo desplegable. Se abre solo al entrar en una de sus páginas. */
function NavGroup({ group, collapsed }) {
  const { pathname } = useLocation()
  const open = useUiStore((s) => s.openGroups[group.id] ?? false)
  const setGroupOpen = useUiStore((s) => s.setGroupOpen)
  const containsActive = group.children.some((c) => pathname === c.to || pathname.startsWith(`${c.to}/`))
  const Icon = group.icon

  useEffect(() => {
    if (containsActive) setGroupOpen(group.id, true)
  }, [containsActive, group.id, setGroupOpen])

  // Con el menú contraído no hay espacio para el submenú: se muestran sus íconos directamente.
  if (collapsed) {
    return (
      <div className='space-y-0.5 border-y border-border/60 py-1'>
        {group.children.map((child) => (
          <NavItem key={child.to} item={child} collapsed />
        ))}
      </div>
    )
  }

  return (
    <div>
      <button
        type='button'
        onClick={() => setGroupOpen(group.id, !open)}
        aria-expanded={open}
        className={cn(
          'flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted',
          containsActive && !open && 'font-medium text-foreground'
        )}
      >
        <Icon className='h-4 w-4 shrink-0' />
        <span className='flex-1 truncate text-left'>{group.label}</span>
        <motion.span animate={{ rotate: open ? 0 : -90 }} transition={{ duration: 0.2 }}>
          <ChevronDown className='h-4 w-4' />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className='overflow-hidden'
          >
            <div className='ml-4 mt-0.5 space-y-0.5 border-l border-border pl-2'>
              {group.children.map((child) => (
                <NavItem key={child.to} item={child} nested />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export const Sidebar = () => {
  const { sidebarOpen, toggleSidebar } = useUiStore()
  const hasHierarchy = useAuthStore((s) => s.hasHierarchy)
  // Se suscribe al usuario para recalcular el menú cuando cambie la sesión.
  useAuthStore((s) => s.user)

  const allowed = (item) => item.minHierarchy == null || hasHierarchy(item.minHierarchy)
  const visibleItems = NAV_ITEMS.map((item) => (item.children ? { ...item, children: item.children.filter(allowed) } : item)).filter(
    (item) => (item.children ? item.children.length > 0 : allowed(item))
  )

  return (
    <aside
      className={cn(
        'sticky top-0 flex h-screen flex-col border-r bg-background transition-all duration-200',
        sidebarOpen ? 'w-60' : 'w-14'
      )}
    >
      {/* Logo */}
      <div className='flex h-14 shrink-0 items-center justify-between border-b px-3'>
        {sidebarOpen && <span className='truncate text-sm font-semibold tracking-tight'>Inventario Aztlán</span>}
        <button
          onClick={toggleSidebar}
          aria-label={sidebarOpen ? 'Contraer menú' : 'Expandir menú'}
          className='ml-auto rounded-md p-1.5 text-muted-foreground hover:bg-muted'
        >
          <ChevronLeft className={cn('h-4 w-4 transition-transform', !sidebarOpen && 'rotate-180')} />
        </button>
      </div>

      {/* Nav */}
      <nav className='flex-1 space-y-0.5 overflow-y-auto px-2 py-3'>
        {visibleItems.map((item) =>
          item.children ? (
            <NavGroup key={item.id} group={item} collapsed={!sidebarOpen} />
          ) : (
            <NavItem key={item.to} item={item} collapsed={!sidebarOpen} />
          )
        )}
      </nav>
    </aside>
  )
}
