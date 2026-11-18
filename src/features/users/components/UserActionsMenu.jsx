import { History, KeyRound, LogOut, MonitorSmartphone, MoreHorizontal, Pencil, Power, PowerOff, Unlock } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

const Item = ({ icon: Icon, children, danger, ...props }) => (
  <DropdownMenuItem
    className={cn('gap-2.5 rounded-md px-2.5 py-2 text-sm outline-none focus:bg-sand-50', danger ? 'text-red-600 hover:bg-red-50' : 'text-ink-900 hover:bg-sand-50')}
    {...props}
  >
    <Icon className='size-4' aria-hidden />
    {children}
  </DropdownMenuItem>
)

/**
 * Acciones sobre un usuario. `onAction(tipo, user)` decide si pide confirmación.
 * tipos: edit | sessions | activity | unlock | reset-password | revoke-sessions | deactivate | activate
 * `showActivity`: enlace a la bitácora de seguridad (solo SUPERADMIN).
 */
export function UserActionsMenu({ user, onAction, showActivity = false }) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        aria-label={`Acciones para ${user.fullName}`}
        className='grid size-8 place-items-center rounded-md text-ink-500 outline-none transition-colors hover:bg-sand-50 hover:text-ink-900 focus-visible:ring-2 focus-visible:ring-forest-700/30 data-[state=open]:bg-sand-50'
      >
        <MoreHorizontal className='size-[18px]' />
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-56 border-line/80 p-1.5 font-plex shadow-lg'>
        <Item icon={Pencil} onSelect={() => onAction('edit', user)}>
          Editar datos y rol
        </Item>
        <Item icon={MonitorSmartphone} onSelect={() => onAction('sessions', user)}>
          Ver sesiones
        </Item>
        {showActivity && (
          <Item icon={History} onSelect={() => onAction('activity', user)}>
            Ver actividad
          </Item>
        )}

        {user.isActive && (
          <>
            <DropdownMenuSeparator className='my-1 h-px bg-line/60' />
            {user.isLocked && (
              <Item icon={Unlock} onSelect={() => onAction('unlock', user)}>
                Desbloquear cuenta
              </Item>
            )}
            <Item icon={KeyRound} onSelect={() => onAction('reset-password', user)}>
              Restablecer contraseña
            </Item>
            {user.sessions.active > 0 && (
              <Item icon={LogOut} onSelect={() => onAction('revoke-sessions', user)}>
                Cerrar sesiones
              </Item>
            )}
          </>
        )}

        <DropdownMenuSeparator className='my-1 h-px bg-line/60' />
        {user.isActive ? (
          <Item icon={PowerOff} danger onSelect={() => onAction('deactivate', user)}>
            Desactivar
          </Item>
        ) : (
          <Item icon={Power} onSelect={() => onAction('activate', user)}>
            Activar
          </Item>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
