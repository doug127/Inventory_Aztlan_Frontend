import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      permissions: [],

      setAuth: ({ user, token, permissions }) => set({ user, token, permissions }),
      logout: () => set({ user: null, token: null, permissions: [] }),

      hasPermission: (privilege) => {
        const permissions = useAuthStore.getState().permissions
        return permissions.includes(privilege)
      },
    }),
    {
      name: 'auth-storage', // key en localStorage
      getStorage: () => localStorage, // solo persiste el token
    }
  )
)
