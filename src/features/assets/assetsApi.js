import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/lib/api'

// Endpoints de /api/assets (HU-302). Consultar: todos los roles; el resto, ADMIN+.
const unwrap = (envelope) => envelope?.data
const clean = (params) => Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ''))

export const assetsService = {
  /**
   * { data: AssetDto[], meta: { pagination, filters, search, sort } }
   * AssetDto: { id, code, name, category: { id, code, name, isActive, path, displayIcon }, isActive, hasMovements, pendingLoans }
   */
  list: (params) => api.get('/assets', { params: clean(params) }),
  /**
   * Agrupados por categoría hoja (un lote con sus tablones), con los mismos filtros de la lista.
   * { data: [{ category: { id, code, name, isActive, path, displayIcon }, assets, active, firstCode, lastCode }], meta }
   */
  groups: (params) => api.get('/assets/groups', { params: clean(params) }),
  /** { categoryId, categoryCode, prefix, code } — code null si no hay correlativo que continuar. */
  nextCode: (categoryId) => api.get('/assets/next-code', { params: { categoryId } }).then(unwrap),
  /**
   * HU-304. Ficha: { asset, period, activity: { lines, firstMovementAt, lastMovementAt },
   * consumption: [{ product: { id, code, name, unitCode }, consumed, corrected, net, lines, lastConsumedAt }],
   * pendingLoans: [{ product, pending }] }. Cantidades como texto con 3 decimales.
   */
  consumption: (id, params) => api.get(`/assets/${id}/consumption`, { params: clean(params) }).then(unwrap),
  /** { data: [{ id, kind, movement, product, quantity, consumptionEffect, note }], meta } */
  history: (id, params) => api.get(`/assets/${id}/history`, { params: clean(params) }),
  create: (body) => api.post('/assets', body).then(unwrap),
  update: (id, body) => api.patch(`/assets/${id}`, body).then(unwrap),
  deactivate: (id) => api.post(`/assets/${id}/deactivate`).then(unwrap),
  activate: (id) => api.post(`/assets/${id}/activate`).then(unwrap),
}

const KEY = ['assets']

export const useAssets = (params, { enabled = true } = {}) =>
  useQuery({
    queryKey: [...KEY, 'list', params],
    queryFn: () => assetsService.list(params),
    placeholderData: keepPreviousData,
    enabled,
  })

/** Grupos por categoría hoja para las ramas con muchos activos (CAMPO: un grupo por lote). */
export const useAssetGroups = (params, { enabled = true } = {}) =>
  useQuery({
    queryKey: [...KEY, 'groups', params],
    queryFn: () => assetsService.groups(params),
    placeholderData: keepPreviousData,
    enabled,
  })

/** Ficha del activo con su consumo neto por producto en el período (from/to AAAA-MM-DD). */
export const useAssetConsumption = (id, params) =>
  useQuery({
    queryKey: [...KEY, 'consumption', id, params],
    queryFn: () => assetsService.consumption(id, params),
    placeholderData: keepPreviousData,
    enabled: Boolean(id),
    retry: (count, error) => error?.status !== 404 && count < 2,
  })

/** Historial de movimientos del activo, paginado. kind: 'CONSUMO,CORRECCION'… */
export const useAssetHistory = (id, params) =>
  useQuery({
    queryKey: [...KEY, 'history', id, params],
    queryFn: () => assetsService.history(id, params),
    placeholderData: keepPreviousData,
    enabled: Boolean(id),
  })

/** Código sugerido para la categoría hoja elegida (T-03, TB-201). */
export const useNextAssetCode = (categoryId, { enabled = true } = {}) =>
  useQuery({
    queryKey: [...KEY, 'next-code', categoryId],
    queryFn: () => assetsService.nextCode(categoryId),
    enabled: Boolean(categoryId) && enabled,
    staleTime: 0,
    retry: false,
  })

const useAssetMutation = (mutationFn, { success, silentErrors = false } = {}) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: (asset) => {
      qc.invalidateQueries({ queryKey: KEY })
      // El árbol de categorías cuenta los activos de cada rama.
      qc.invalidateQueries({ queryKey: ['asset-categories'] })
      if (success) toast.success(success(asset))
    },
    onError: (error) => {
      if (!silentErrors) toast.error(error?.message ?? 'No se pudo completar la acción')
    },
  })
}

export const useCreateAsset = () =>
  useAssetMutation(assetsService.create, {
    success: (a) => `Activo ${a.code} creado`,
    silentErrors: true,
  })

export const useUpdateAsset = () =>
  useAssetMutation(({ id, body }) => assetsService.update(id, body), {
    success: (a) => `Activo ${a.code} actualizado`,
    silentErrors: true,
  })

export const useDeactivateAsset = () =>
  useAssetMutation(assetsService.deactivate, {
    success: (a) => `${a.code} fue desactivado`,
  })

export const useActivateAsset = () =>
  useAssetMutation(assetsService.activate, {
    success: (a) => `${a.code} fue reactivado`,
  })

/** "Vehículos › Maquinaria agrícola › Tractor" */
export const categoryPathLabel = (path) => path.map((c) => c.name).join(' › ')
