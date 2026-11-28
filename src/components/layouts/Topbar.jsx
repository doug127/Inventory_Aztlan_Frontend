import { useAuthStore } from '@/stores/authStore'
import { KeyRound, LogOut, Moon, Sun, User } from 'lucide-react'
import { useUiStore } from '@/stores/uiStore'
import { 
  DropdownMenu, DropdownMenuContent, 
  DropdownMenuItem, DropdownMenuLabel, 
  DropdownMenuSeparator, DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { useNavigate } from 'react-router-dom'

import logoImage from '@/assets/image/logo.jpeg' 

export const Topbar = () => {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const theme = useUiStore((s) => s.theme)
  const toggleTheme = useUiStore((s) => s.toggleTheme)
  const dark = theme === 'dark'
  
  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className='h-14 border-b bg-background flex items-center justify-between px-4 shrink-0'>

      {/* El logotipo se mantiene original: en modo oscuro va sobre una placa blanca. */}
      <div className='flex items-center h-full py-1.5 dark:rounded-md dark:bg-blanco dark:px-1.5'>
        <img 
          src={logoImage} 
          alt="Logo" 
          className='h-full w-auto object-contain'
        />
      </div>

      <div className='flex items-center gap-1'>
      <button
        type='button'
        onClick={toggleTheme}
        aria-label={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        aria-pressed={dark}
        title={dark ? 'Modo claro' : 'Modo oscuro'}
        className='grid size-9 place-items-center rounded-md text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground'
      >
        {dark ? <Sun className='h-[18px] w-[18px]' aria-hidden /> : <Moon className='h-[18px] w-[18px]' aria-hidden />}
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger className='flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-muted cursor-pointer select-none outline-none transition-colors duration-200'>
          <div className='h-7 w-7 rounded-full bg-muted flex items-center justify-center border'>
            <User className='h-4 w-4 text-muted-foreground' />
          </div>
          <span className='text-sm text-foreground font-medium'>
            {user?.fullName ?? 'Usuario'}
          </span>
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
            onClick={() => navigate('/change-password')}
            className='flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer select-none hover:bg-muted transition-colors duration-200'
          >
            <KeyRound className='h-4 w-4' />
            Cambiar contraseña
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={handleLogout}
            className='flex items-center gap-2 px-3 py-2 rounded-md text-destructive cursor-pointer select-none hover:bg-destructive/10 hover:text-destructive transition-colors duration-200'
          >
            <LogOut className='h-4 w-4' />
            Cerrar sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      </div>
    </header>
  )
}