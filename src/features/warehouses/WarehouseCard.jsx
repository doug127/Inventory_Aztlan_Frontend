import { motion } from 'framer-motion'
import { MoreHorizontal, Package, Pencil, Power, PowerOff } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

const MenuItem = ({ icon: Icon, children, danger, disabled, hint, ...props }) => (
  <DropdownMenuItem
    disabled={disabled}
    className={cn(
      'items-start gap-2.5 rounded-md px-2.5 py-2 text-sm outline-none focus:bg-sand-50 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50',
      danger ? 'text-red-600 hover:bg-red-50' : 'text-ink-900 hover:bg-sand-50'
    )}
    {...props}
  >
    <Icon className='mt-0.5 size-4 shrink-0' aria-hidden />
    <span>
      {children}
      {hint && <span className='mt-0.5 block text-xs text-ink-500'>{hint}</span>}
    </span>
  </DropdownMenuItem>
)

/**
 * Tarjeta de almacén (diseño 07). Muestra solo datos reales del esquema: nombre, código, estado y
 * cuántos productos tienen existencias. [Desactivar] solo se habilita con el almacén vacío.
 */
export function WarehouseCard({ warehouse, canManage, onEdit, onDeactivate, onActivate, index = 0 }) {
  const { productsWithStock, isEmpty } = warehouse.stock
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0, transition: { delay: Math.min(index, 9) * 0.035, duration: 0.3 } }}
      exit={{ opacity: 0, scale: 0.97 }}
      whileHover={{ y: -2 }}
      className={cn(
        'flex flex-col rounded-xl border bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-shadow hover:shadow-[0_8px_24px_-12px_rgba(0,0,0,0.15)]',
        warehouse.isActive ? 'border-line/80' : 'border-dashed border-line'
      )}
    >
      <header className='flex items-start justify-between gap-3'>
        <div className='min-w-0'>
          <h2 className={cn('truncate text-base font-semibold', !warehouse.isActive && 'text-ink-500')}>{warehouse.name}</h2>
          <p className='mt-0.5 font-mono text-xs tracking-wider text-ink-500'>{warehouse.code}</p>
        </div>
        <div className='flex shrink-0 items-center gap-1'>
          <span
            className={cn(
              'rounded px-2 py-0.5 text-xs font-medium',
              warehouse.isActive ? 'bg-forest-100 text-forest-800' : 'bg-sand-50 text-ink-500 ring-1 ring-line'
            )}
          >
            {warehouse.isActive ? 'Activo' : 'Inactivo'}
          </span>
          {canManage && (
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger
                aria-label={`Acciones para ${warehouse.name}`}
                className='grid size-7 place-items-center rounded-md text-ink-500 outline-none transition-colors hover:bg-sand-50 hover:text-ink-900 focus-visible:ring-2 focus-visible:ring-forest-700/30'
              >
                <MoreHorizontal className='size-4' />
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='w-60 border-line/80 p-1.5 font-plex shadow-lg'>
                <MenuItem icon={Pencil} onSelect={() => onEdit(warehouse)}>
                  Editar
                </MenuItem>
                {warehouse.isActive ? (
                  <MenuItem
                    icon={PowerOff}
                    danger
                    disabled={!isEmpty}
                    hint={!isEmpty ? 'Tiene existencias: trasládalas o ajústalas a 0 primero' : undefined}
                    onSelect={() => onDeactivate(warehouse)}
                  >
                    Desactivar
                  </MenuItem>
                ) : (
                  <MenuItem icon={Power} onSelect={() => onActivate(warehouse)}>
                    Activar
                  </MenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>

      <div className='mt-5 flex items-center gap-3 border-t border-line/60 pt-4'>
        <span className={cn('grid size-9 place-items-center rounded-md', isEmpty ? 'bg-sand-50 text-ink-500' : 'bg-forest-50 text-forest-700')}>
          <Package className='size-[18px]' aria-hidden />
        </span>
        <div>
          <p className='text-xl font-semibold tabular-nums leading-tight'>{productsWithStock}</p>
          <p className='text-xs text-ink-500'>{productsWithStock === 1 ? 'producto con existencias' : 'productos con existencias'}</p>
        </div>
      </div>
    </motion.article>
  )
}
