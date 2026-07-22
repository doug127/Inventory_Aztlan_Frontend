import { User } from '@hugeicons/core-free-icons'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authService } from '@/features/auth/authService'
import { queryClient } from '../lib/queryClient'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      _hasHydrated: false,

      setHasHydrated: (val) => set({ _hasHydrated: val }),

      setAuth: ( user ) => set({ user }),

      logout: async () => {
        try {
          await authService.logout()
        } catch (e) {
          console.error(e)
        } finally {
          set({ user: null })
          queryClient.clear()
        }
      },

      hasHierarchy: (minLevel) => {
        const user = get().user
        if (!user) return false
        return (user.hierarchy_level ?? 0) >= minLevel
      },
    }),
    {
      name: 'auth-storage', // key en localStorage
      partialize: (state) => ({ user: state.user}), 
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      }
    }
  )
)
