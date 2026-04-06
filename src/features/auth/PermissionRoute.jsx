import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

export const PermissionRoute = ({ privilege, minHierarchy }) => {
  const hasHierarchy = useAuthStore((s) => s.hasHierarchy)
  const _hasHydrated = useAuthStore((s) => s._hasHydrated)

  if (!_hasHydrated) {
    // Mientras se hidrata, mostramos un spinner
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>
  }
  
  if (minHierarchy && !hasHierarchy(minHierarchy)) {
    return <Navigate to='/403' replace />
  }

  return <Outlet />
}