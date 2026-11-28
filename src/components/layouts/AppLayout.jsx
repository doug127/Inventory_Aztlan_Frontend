import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useUiStore } from '@/stores/uiStore'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { Toaster } from '@/components/ui/sonner'

export const AppLayout = () => {
  const theme = useUiStore((s) => s.theme)
  // El modo oscuro va en <html> para que también lo tomen los diálogos y menús (se montan en <body>).
  // Solo dentro de la app: al salir (login, recuperar contraseña) vuelve el modo claro.
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    return () => document.documentElement.classList.remove('dark')
  }, [theme])

  return (
    <div className='flex h-screen overflow-hidden bg-background'>
      <Sidebar />
      <div className='flex flex-col flex-1 overflow-hidden'>
        <Topbar />
        {/* relative: los elementos absolute de las páginas (inputs sr-only, por ejemplo) se ubican dentro
            del área con scroll; sin esto se ubican respecto a la página y la alargan (doble scroll). */}
        <main className='scroll-stable relative flex-1 overflow-y-auto bg-background p-6'>
          <Outlet />
        </main>
        <Toaster richColors position='top-right' theme={theme} />
      </div>
    </div>
  )
}
