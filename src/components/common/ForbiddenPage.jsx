import { useNavigate } from 'react-router-dom'
import { ShieldX } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ForbiddenPage() {
  const navigate = useNavigate()
  return (
    <div className='min-h-screen flex flex-col items-center justify-center gap-4 text-center p-4'>
      <div className='rounded-full bg-destructive/10 p-4'>
        <ShieldX className='h-10 w-10 text-destructive' />
      </div>
      <h1 className='text-xl font-semibold'>Acceso denegado</h1>
      <p className='text-sm text-muted-foreground max-w-sm'>
        No tienes permisos para ver esta página.
      </p>
      <Button variant='outline' onClick={() => navigate('/')}>
        Volver al inicio
      </Button>
    </div>
  )
}