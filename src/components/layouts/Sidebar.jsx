import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useUiStore } from '@/stores/uiStore'
import {
  LayoutDashboard,
  Package,
  Warehouse,
  ArrowLeftRight,
  BarChart2,
  Users,
  Truck,
  ChevronLeft,
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/movements', label: 'Movimientos', icon: ArrowLeftRight },
  { to: '/stock', label: 'Stock', icon: BarChart2 },
  { to: '/products', label: 'Productos', icon: Package },
  { to: '/warehouses', label: 'Almacenes', icon: Warehouse },
  { to: '/assets', label: 'Activos', icon: Truck },
  { to: '/users', label: 'Usuarios', icon: Users },
]

export const Sidebar = () => {
  const { sidebarOpen, toggleSidebar } = useUiStore()

  return (
    <aside
      className={cn(
        'h-screen sticky top-0 flex flex-col border-r bg-background transition-all duration-200',
        sidebarOpen ? 'w-56' : 'w-14'
      )}
    >
      {/* Logo */}
      <div className='h-14 flex items-center justify-between px-3 border-b shrink-0'>
        {sidebarOpen && (
          <span className='text-sm font-semibold tracking-tight truncate'>Inventario Aztlán</span>
        )}
        <button
          onClick={toggleSidebar}
          className='p-1.5 rounded-md hover:bg-muted text-muted-foreground ml-auto'
        >
          <ChevronLeft
            className={cn('h-4 w-4 transition-transform', !sidebarOpen && 'rotate-180')}
          />
        </button>
      </div>

      {/* Nav */}
      <nav className='flex-1 py-3 px-2 space-y-0.5 overflow-y-auto'>
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-2 py-2 rounded-md text-sm transition-colors',
                'hover:bg-muted text-muted-foreground',
                isActive && 'bg-muted text-foreground font-medium'
              )
            }
          >
            <Icon className='h-4 w-4 shrink-0' />
            {sidebarOpen && <span className='truncate'>{label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
