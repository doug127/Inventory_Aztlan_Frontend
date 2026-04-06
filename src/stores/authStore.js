import { User } from '@hugeicons/core-free-icons'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      _hasHydrated: false,

      setHasHydrated: (val) => set({ _hasHydrated: val }),

      setAuth: ( user ) => set({ user }),

      logout: () => set({ user: null }),

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
