import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

/** Exige un rango mínimo (HIERARCHY.ADMIN, etc.; menor número = mayor rango). */
export const PermissionRoute = ({ minHierarchy }) => {
  const hasHierarchy = useAuthStore((s) => s.hasHierarchy)

  if (minHierarchy != null && !hasHierarchy(minHierarchy)) {
    return <Navigate to='/403' replace />
  }

  return <Outlet />
}
