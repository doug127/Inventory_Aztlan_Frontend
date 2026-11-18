import { create } from 'zustand'

export const useUiStore = create((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  // Grupos desplegables del menú lateral abiertos (p. ej. { catalog: true }).
  openGroups: {},
  setGroupOpen: (id, open) => set((s) => ({ openGroups: { ...s.openGroups, [id]: open } })),
}))
