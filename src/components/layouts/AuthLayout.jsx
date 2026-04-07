import { Outlet } from 'react-router-dom'
import { Toaster } from 'sonner'

export const AuthLayout = () => {
  return (
    <div className='min-h-screen bg-muted/40 flex items-center justify-center p-4'>
      <div className='w-full max-w-sm'>
        <Outlet />
      </div>
      <Toaster richColors position='top-right' />
    </div>
  )
}
