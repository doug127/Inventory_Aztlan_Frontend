import { useAuthStore } from '@/stores/authStore'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LogOut, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export const Topbar = () => {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className='h-14 border-b bg-background flex items-center justify-end px-4 shrink-0'>
      <DropdownMenu>
        <DropdownMenuTrigger className='flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-muted cursor-pointer select-none outline-none'>
          <div className='h-7 w-7 rounded-full bg-muted flex items-center justify-center border'>
            <User className='h-3.5 w-3.5 text-muted-foreground' />
          </div>
          <span className='text-sm text-foreground'>{user?.full_name ?? 'Usuario'}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-48'>
          <DropdownMenuLabel className='text-xs text-muted-foreground font-normal'>
            {user?.username}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleLogout}
            className='text-destructive gap-2 cursor-pointer'
          >
            <LogOut className='h-3.5 w-3.5' />
            Cerrar sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
