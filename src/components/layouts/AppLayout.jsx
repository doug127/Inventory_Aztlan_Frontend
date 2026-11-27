import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { Toaster } from '@/components/ui/sonner'

export const AppLayout = () => {
  return (
    <div className='flex h-screen overflow-hidden bg-background'>
      <Sidebar />
      <div className='flex flex-col flex-1 overflow-hidden'>
        <Topbar />
        {/* relative: los elementos absolute de las páginas (inputs sr-only, por ejemplo) se ubican dentro
            del área con scroll; sin esto se ubican respecto a la página y la alargan (doble scroll). */}
        <main className='scroll-stable relative flex-1 overflow-y-auto p-6 bg-muted/20'>
          <Outlet />
        </main>
        <Toaster richColors position='top-right' />
      </div>
    </div>
  )
}
