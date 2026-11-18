import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

/**
 * Login y "olvidé mi contraseña": con sesión iniciada no tiene sentido mostrarlos. Al iniciar
 * sesión, este mismo guard lleva al usuario a la página que intentaba abrir (state.from).
 */
export function PublicRoute() {
  const status = useAuthStore((s) => s.status)
  const user = useAuthStore((s) => s.user)
  const location = useLocation()
  if (status === 'authenticated') {
    const target = user?.mustChangePassword ? '/change-password' : (location.state?.from ?? '/')
    return <Navigate to={target} replace />
  }
  return <Outlet />
}
