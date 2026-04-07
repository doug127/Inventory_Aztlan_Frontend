import { useAuthStore } from '@/stores/authStore'
import { HIERARCHY } from '@/lib/constants'

export const useHierarchy = (minHierarchy) => {
    return useAuthStore((s) => s.hasHierarchy(minHierarchy))
}

export const useIsAdmin = () => {
    return useAuthStore((s) => s.hasHierarchy(HIERARCHY.ADMIN))
}

export const useIsSuperAdmin = () => {    
  return useAuthStore((s) => s.hasHierarchy(HIERARCHY.SUPERADMIN))
}

export const useHierarchyLevel = () => {
  return useAuthStore((s) => s.hierarchyLevel)
}
