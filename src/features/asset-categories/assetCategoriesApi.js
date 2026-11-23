import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/lib/api'

// Endpoints de /api/asset-categories (HU-301). Consultar: todos los roles; el resto, ADMIN+.
const unwrap = (envelope) => envelope?.data

export const assetCategoriesService = {
  /**
   * Árbol completo. Nodo: { id, code, name, icon, displayIcon, isActive, parent, isLeaf,
   * acceptsChildren, usage: { activeChildren, totalChildren, activeAssets, totalAssets }, depth,
   * assetsInSubtree, children }
   */
  tree: (params) => api.get('/asset-categories/tree', { params }).then(unwrap),
  /**
   * HU-303. Activos de la rama (incluye subcategorías) y desglose por subcategoría directa; sin
   * categoryId, por raíz. { category: { id, code, name, displayIcon, isLeaf, path } | null,
   * assets: { active, inactive, total }, breakdown: [{ id, code, name, isActive, displayIcon, isLeaf, assets }] }
   */
  assetCounts: (categoryId) => api.get('/asset-categories/asset-counts', { params: categoryId ? { categoryId } : {} }).then(unwrap),
  create: (body) => api.post('/asset-categories', body).then(unwrap),
  update: (id, body) => api.patch(`/asset-categories/${id}`, body).then(unwrap),
  deactivate: (id) => api.post(`/asset-categories/${id}/deactivate`).then(unwrap),
  activate: (id) => api.post(`/asset-categories/${id}/activate`).then(unwrap),
}

const KEY = ['asset-categories']

/** Árbol de categorías de activos. { isActive: true } omite las ramas inactivas (selectores). */
export const useAssetCategoryTree = (params = {}) =>
  useQuery({
    queryKey: [...KEY, 'tree', params],
    queryFn: () => assetCategoriesService.tree(params),
  })

/** Cuántos activos hay en la categoría (con sus subcategorías), o en la finca si no se indica. */
export const useAssetCounts = (categoryId) =>
  useQuery({
    queryKey: [...KEY, 'asset-counts', categoryId ?? null],
    queryFn: () => assetCategoriesService.assetCounts(categoryId),
    placeholderData: keepPreviousData,
  })

const useAssetCategoryMutation =(mutationFn, { success, silentErrors = false } = {}) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: (category) => {
      qc.invalidateQueries({ queryKey: KEY })
      // Los activos (HU-302) muestran el icono y la ruta de su categoría.
      qc.invalidateQueries({ queryKey: ['assets'] })
      if (success) toast.success(success(category))
    },
    onError: (error) => {
      if (!silentErrors) toast.error(error?.message ?? 'No se pudo completar la acción')
    },
  })
}

export const useCreateAssetCategory = () =>
  useAssetCategoryMutation(assetCategoriesService.create, { success: (c) => `Categoría ${c.code} creada`, silentErrors: true })

export const useUpdateAssetCategory = () =>
  useAssetCategoryMutation(({ id, body }) => assetCategoriesService.update(id, body), {
    success: (c) => `Categoría ${c.code} actualizada`,
    silentErrors: true,
  })

/** Cambiar de padre (arrastrar y soltar). Los errores (CATEGORY_CYCLE, CATEGORY_HAS_ASSETS…) se muestran como aviso. */
export const useMoveAssetCategory = () =>
  useAssetCategoryMutation(({ id, parentId }) => assetCategoriesService.update(id, { parentId }), {
    success: (c) => (c.parent ? `${c.code} ahora está dentro de ${c.parent.code}` : `${c.code} ahora es una categoría raíz`),
  })

export const useDeactivateAssetCategory = () =>
  useAssetCategoryMutation(assetCategoriesService.deactivate, { success: (c) => `${c.code} fue desactivada` })

export const useActivateAssetCategory = () =>
  useAssetCategoryMutation(assetCategoriesService.activate, { success: (c) => `${c.code} fue reactivada` })
