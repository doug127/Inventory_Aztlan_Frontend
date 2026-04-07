import { useAuthStore } from '@/stores/authStore'

export const PermissionGate = ({ minHierarchy, fallback = null, children }) => {
  const hasHierarchy = useAuthStore((s) => s.hasHierarchy)

  if (minHierarchy && !hasHierarchy(minHierarchy)) return fallback

  return children
}