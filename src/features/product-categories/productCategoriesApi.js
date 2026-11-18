import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/lib/api'

// Endpoints de /api/product-categories (HU-203). Consultar: todos los roles; el resto, ADMIN+.
const unwrap = (envelope) => envelope?.data

export const productCategoriesService = {
  /** Árbol completo. Nodo: { id, code, name, description, isActive, parent, isLeaf, usage, depth, productsInSubtree, children } */
  tree: (params) => api.get('/product-categories/tree', { params }).then(unwrap),
  create: (body) => api.post('/product-categories', body).then(unwrap),
  update: (id, body) => api.patch(`/product-categories/${id}`, body).then(unwrap),
  deactivate: (id) => api.post(`/product-categories/${id}/deactivate`).then(unwrap),
  activate: (id) => api.post(`/product-categories/${id}/activate`).then(unwrap),
}

const KEY = ['product-categories']

/** Árbol de categorías. { isActive: true } omite las ramas inactivas (selectores de productos). */
export const useCategoryTree = (params = {}) =>
  useQuery({
    queryKey: [...KEY, 'tree', params],
    queryFn: () => productCategoriesService.tree(params),
  })

/** Árbol de categorías activas, para elegir la categoría de un producto. */
export const useCategoryOptions = () => useCategoryTree({ isActive: true })

const useCategoryMutation = (mutationFn, { success, silentErrors = false } = {}) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: (category, variables) => {
      qc.invalidateQueries({ queryKey: KEY })
      if (success) toast.success(success(category, variables))
    },
    onError: (error) => {
      if (!silentErrors) toast.error(error?.message ?? 'No se pudo completar la acción')
    },
  })
}

export const useCreateCategory = () =>
  useCategoryMutation(productCategoriesService.create, { success: (c) => `Categoría ${c.code} creada`, silentErrors: true })

export const useUpdateCategory = () =>
  useCategoryMutation(({ id, body }) => productCategoriesService.update(id, body), {
    success: (c) => `Categoría ${c.code} actualizada`,
    silentErrors: true,
  })

/** Cambiar de padre (arrastrar y soltar). Los errores (CATEGORY_CYCLE…) se muestran como aviso. */
export const useMoveCategory = () =>
  useCategoryMutation(({ id, parentId }) => productCategoriesService.update(id, { parentId }), {
    success: (c) => (c.parent ? `${c.code} ahora está dentro de ${c.parent.code}` : `${c.code} ahora es una categoría raíz`),
  })

export const useDeactivateCategory = () => useCategoryMutation(productCategoriesService.deactivate, { success: (c) => `${c.code} fue desactivada` })

export const useActivateCategory = () => useCategoryMutation(productCategoriesService.activate, { success: (c) => `${c.code} fue reactivada` })

// --- Utilidades del árbol ---------------------------------------------------------

/** Recorre el árbol en profundidad, en el orden en que se muestra. */
export const flattenTree = (nodes, out = []) => {
  for (const node of nodes) {
    out.push(node)
    flattenTree(node.children, out)
  }
  return out
}

/** Ids de un nodo y de toda su rama (no puede moverse dentro de ninguno de ellos). */
export const subtreeIds = (node) => new Set(flattenTree([node]).map((n) => n.id))

/**
 * Filtra el árbol: queda un nodo si cumple el criterio o si alguna descendiente lo cumple (así se
 * ve la ruta hasta cada resultado).
 */
export const filterTree = (nodes, matches) =>
  nodes.flatMap((node) => {
    const children = filterTree(node.children, matches)
    return matches(node) || children.length ? [{ ...node, children }] : []
  })
