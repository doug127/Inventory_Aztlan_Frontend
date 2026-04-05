import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      permissions: [],
      _hasHydrated: false,

      setHasHydrated: (val) => set({ _hasHydrated: val }),
      setAuth: ({ user, permissions }) => set({ user, permissions }),
      logout: () => set({ user: null, permissions: [] }),
      hasPermission: (privilege) => get().permissions.includes(privilege),
    }),
    {
      name: 'auth-storage', // key en localStorage
      partialize: (state) => ({ user: state.user, permissions: state.permissions }), // solo guardamos lo esencial
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      }
    }
  )
)
