import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

/**
 * Rutas de la aplicación: exigen sesión. Con la contraseña temporal pendiente
 * (mustChangePassword) solo se permite /change-password, igual que en el backend.
 */
export const ProtectedRoute = () => {
  const status = useAuthStore((s) => s.status)
  const user = useAuthStore((s) => s.user)
  const location = useLocation()

  if (status !== 'authenticated') {
    return <Navigate to='/login' replace state={{ from: location.pathname + location.search }} />
  }
  if (user?.mustChangePassword) return <Navigate to='/change-password' replace />

  return <Outlet />
}

/** Rutas que solo necesitan sesión, aunque falte cambiar la contraseña (p. ej. /change-password). */
export const SessionRoute = () => {
  const status = useAuthStore((s) => s.status)
  if (status !== 'authenticated') return <Navigate to='/login' replace />
  return <Outlet />
}
