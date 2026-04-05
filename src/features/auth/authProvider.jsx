import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { authService } from './authService'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'

export function AuthProvider({ children }) {
  const _hasHydrated = useAuthStore((s) => s._hasHydrated)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Esperamos a que Zustand termine de leer el localStorage
    if (!_hasHydrated) return

    let cancelled = false

    const verifySession = async () => {
      const currentUser = useAuthStore.getState().user

      try {
        if (!currentUser) {
          if (!cancelled) setReady(true)
          return
        }

        const me = await authService.me()

        if (!cancelled) {
          useAuthStore.getState().setAuth({
            user: { id: me.id, username: me.username, role: me.role },
            permissions: me.privilege ?? []
        })
          setReady(true)
        }
      } catch {
        if (!cancelled) {
          useAuthStore.getState().logout()
          setReady(true)
        }
      }
    }

    verifySession()
    return () => { cancelled = true }

  }, [_hasHydrated]) // ← se dispara solo cuando Zustand termina de hidratar

  if (!ready) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <LoadingSpinner />
      </div>
    )
  }

  return children
}