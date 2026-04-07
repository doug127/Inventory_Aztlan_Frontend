import { useAuthStore } from '@/stores/authStore'
import { LogOut, User } from 'lucide-react'
import { 
  DropdownMenu, DropdownMenuContent, 
  DropdownMenuItem, DropdownMenuLabel, 
  DropdownMenuSeparator, DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { useNavigate } from 'react-router-dom'

export const Topbar = () => {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  
  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <header className='h-14 border-b bg-background flex items-center justify-end px-4 shrink-0'>
      <DropdownMenu>
        <DropdownMenuTrigger className='flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-muted cursor-pointer select-none outline-none transition-colors duration-200'>
          <div className='h-7 w-7 rounded-full bg-muted flex items-center justify-center border'>
            <User className='h-4 w-4 text-muted-foreground' />
          </div>
          <span className='text-sm text-foreground font-medium'>{user?.full_name ?? 'Usuario'}</span>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align='end'
          className='w-52 bg-popover shadow-lg rounded-lg p-1'
        >
          <DropdownMenuLabel className='text-xs text-muted-foreground px-3 py-2'>
            {user?.username}
          </DropdownMenuLabel>

          <DropdownMenuSeparator className='border-border/50 my-1' />

          <DropdownMenuItem
            onClick={handleLogout}
            className='flex items-center gap-2 px-3 py-2 rounded-md text-destructive cursor-pointer select-none hover:bg-destructive/10 hover:text-destructive transition-colors duration-200'
          >
            <LogOut className='h-4 w-4' />
            Cerrar sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
