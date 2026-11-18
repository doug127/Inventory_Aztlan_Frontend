import { useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { authService } from './authService'

/**
 * Al cargar la app recupera la sesión con la cookie httpOnly del refresh token (el access token
 * no se guarda en el navegador). Mientras tanto muestra un indicador de carga.
 * refreshSession comparte la petición si se llama dos veces (StrictMode), así no se rota el
 * mismo token dos veces.
 */
export function AuthProvider({ children }) {
  const status = useAuthStore((s) => s.status)

  useEffect(() => {
    authService.refresh().catch(() => useAuthStore.getState().clearSession())
  }, [])

  if (status === 'checking') {
    return (
      <div className='flex min-h-svh items-center justify-center bg-sand-50'>
        <LoadingSpinner />
      </div>
    )
  }

  return children
}
