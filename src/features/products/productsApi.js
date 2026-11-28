import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/lib/api'

// Endpoints de /api/products (HU-204). Consultar: todos los roles; el resto, ADMIN+.
const unwrap = (envelope) => envelope?.data
const clean = (params) => Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ''))

export const productsService = {
  /**
   * { data: ProductDto[], meta: { pagination, filters, search, sort } }
   * ProductDto: { id, code, name, category, unit, minStock, maxStock, isActive, stock, hasMovements }
   */
  list: (params) => api.get('/products', { params: clean(params) }),
  get: (id) => api.get(`/products/${id}`).then(unwrap),
  nextCode: (categoryId) => api.get('/products/next-code', { params: { categoryId } }).then(unwrap),
  create: (body) => api.post('/products', body).then(unwrap),
  update: (id, body) => api.patch(`/products/${id}`, body).then(unwrap),
  deactivate: (id) => api.post(`/products/${id}/deactivate`).then(unwrap),
  activate: (id) => api.post(`/products/${id}/activate`).then(unwrap),
}

const KEY = ['products']

export const useProducts = (params) =>
  useQuery({
    queryKey: [...KEY, 'list', params],
    queryFn: () => productsService.list(params),
    placeholderData: keepPreviousData,
  })

/** Un producto por id (precarga de la orden de retiro desde Existencias). */
export const useProduct = (id) => useQuery({ queryKey: [...KEY, 'detail', id], queryFn: () => productsService.get(id), enabled: Boolean(id) })

/** Código sugerido para la categoría elegida (LUBR-0003). */
export const useNextProductCode = (categoryId, { enabled = true } = {}) =>
  useQuery({
    queryKey: [...KEY, 'next-code', categoryId],
    queryFn: () => productsService.nextCode(categoryId),
    enabled: Boolean(categoryId) && enabled,
    staleTime: 0,
    retry: false,
  })

const useProductMutation = (mutationFn, { success, silentErrors = false } = {}) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: (product) => {
      qc.invalidateQueries({ queryKey: KEY })
      // Las categorías y unidades muestran cuántos productos tienen.
      qc.invalidateQueries({ queryKey: ['product-categories'] })
      qc.invalidateQueries({ queryKey: ['units'] })
      if (success) toast.success(success(product))
    },
    onError: (error) => {
      if (!silentErrors) toast.error(error?.message ?? 'No se pudo completar la acción')
    },
  })
}

export const useCreateProduct = () => useProductMutation(productsService.create, { success: (p) => `Producto ${p.code} creado`, silentErrors: true })

export const useUpdateProduct = () =>
  useProductMutation(({ id, body }) => productsService.update(id, body), { success: (p) => `Producto ${p.code} actualizado`, silentErrors: true })

export const useDeactivateProduct = () => useProductMutation(productsService.deactivate, { success: (p) => `${p.code} fue desactivado` })

export const useActivateProduct = () => useProductMutation(productsService.activate, { success: (p) => `${p.code} fue reactivado` })

/** "350.000" → "350"; "12.500" → "12,5". Para mostrar; el backend siempre recibe texto con punto. */
export const formatQuantity = (value) => (value === null || value === undefined ? '—' : Number(value).toLocaleString('es', { maximumFractionDigits: 3 }))
