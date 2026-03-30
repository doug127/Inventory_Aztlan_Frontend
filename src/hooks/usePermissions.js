import { useAuthStore } from '@/stores/authStore'

export const usePermission = (privilege) => {
  const permissions = useAuthStore((s) => s.permissions)
  return permissions.includes(privilege)
}
