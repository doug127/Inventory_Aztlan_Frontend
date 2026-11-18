import { useAuthStore } from '@/stores/authStore'

/** Muestra `children` solo si el usuario tiene al menos ese rango (menor número = mayor rango). */
export const PermissionGate = ({ minHierarchy, fallback = null, children }) => {
  const hasHierarchy = useAuthStore((s) => s.hasHierarchy)

  if (minHierarchy != null && !hasHierarchy(minHierarchy)) return fallback

  return children
}
