import { create } from 'zustand'

// Tema de la app: 'light' o 'dark'. Se recuerda en este navegador; si nunca se eligió, sigue la
// preferencia del sistema. El almacenamiento puede fallar (navegación privada): se ignora.
const THEME_KEY = 'aztlan.theme'

const initialTheme = () => {
  try {
    const saved = localStorage.getItem(THEME_KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    /* sin almacenamiento: se usa la preferencia del sistema */
  }
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export const useUiStore = create((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  // Grupos desplegables del menú lateral abiertos (p. ej. { catalog: true }).
  openGroups: {},
  setGroupOpen: (id, open) => set((s) => ({ openGroups: { ...s.openGroups, [id]: open } })),

  theme: initialTheme(),
  toggleTheme: () =>
    set((s) => {
      const theme = s.theme === 'dark' ? 'light' : 'dark'
      try {
        localStorage.setItem(THEME_KEY, theme)
      } catch {
        /* no se recuerda, pero el cambio aplica en esta sesión */
      }
      return { theme }
    }),
}))
