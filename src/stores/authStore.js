import { create } from 'zustand'
import { queryClient } from '../lib/queryClient'

// Estado de la sesión. El access token vive SOLO en memoria (nunca en localStorage): al recargar
// la página, AuthProvider recupera la sesión con la cookie httpOnly del refresh token.
//
// status: 'checking'      → verificando la sesión al arrancar
//         'authenticated' → hay usuario y access token
//         'anonymous'     → sin sesión
//
// user (lo que devuelve el backend):
//   { id, username, email, fullName, role: { code, name, hierarchy }, mustChangePassword, lastLoginAt }
//   role.hierarchy: 0 = SUPERADMIN (mayor rango), 1 = ADMIN, 2 = ALMACENISTA, 3 = USUARIO
export const useAuthStore = create((set, get) => ({
  user: null,
  accessToken: null,
  status: 'checking',

  // Compatibilidad con los componentes que esperaban la hidratación de localStorage.
  _hasHydrated: true,

  setSession: ({ accessToken, user }) => set({ accessToken, user, status: 'authenticated' }),

  setAccessToken: (accessToken) => set({ accessToken }),

  setUser: (user) => set({ user }),

  clearSession: () => {
    set({ user: null, accessToken: null, status: 'anonymous' })
    queryClient.clear()
  },

  /** Cierra la sesión en el servidor (revoca el refresh token) y limpia el estado local. */
  logout: async () => {
    try {
      const { authService } = await import('@/features/auth/authService')
      await authService.logout()
    } catch {
      // Aunque el servidor no responda, la sesión local se cierra igual.
    } finally {
      get().clearSession()
    }
  },

  /** ¿El usuario tiene al menos ese rango? (hierarchy menor = mayor rango) */
  hasHierarchy: (minHierarchy) => {
    const hierarchy = get().user?.role?.hierarchy
    return Number.isInteger(hierarchy) && hierarchy <= minHierarchy
  },
}))
