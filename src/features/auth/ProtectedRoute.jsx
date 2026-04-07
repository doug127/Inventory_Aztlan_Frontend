import { useEffect, useState } from 'react'
import { authService } from '@/features/auth/authService'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

export const ProtectedRoute = ({ minHierarchy }) => {
  const user = useAuthStore((s) => s.user)
  const setAuth = useAuthStore((s) => s.setAuth)
  const logout = useAuthStore((s) => s.logout)

  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const data = await authService.me()
        setAuth(data) // actualizamos el store con el usuario real
        setIsAuthenticated(true)
      } catch (error) {
        logout()
        setIsAuthenticated(false)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />
  
  if (minHierarchy && (user?.hierarchy_level ?? 0) < minHierarchy) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
