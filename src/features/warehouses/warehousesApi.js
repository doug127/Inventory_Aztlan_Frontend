import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/lib/api'

// Endpoints de /api/warehouses (HU-201). Consultar: todos los roles; crear, editar, desactivar: ADMIN+.
const unwrap = (envelope) => envelope?.data
const clean = (params) => Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ''))

export const warehousesService = {
  /** { data: WarehouseDto[], meta: { pagination, filters, search, sort } } */
  list: (params) => api.get('/warehouses', { params: clean(params) }),
  create: (body) => api.post('/warehouses', body).then(unwrap),
  update: (id, body) => api.patch(`/warehouses/${id}`, body).then(unwrap),
  deactivate: (id) => api.post(`/warehouses/${id}/deactivate`).then(unwrap),
  activate: (id) => api.post(`/warehouses/${id}/activate`).then(unwrap),
}

const KEY = ['warehouses']

export const useWarehouses = (params) =>
  useQuery({
    queryKey: [...KEY, params],
    queryFn: () => warehousesService.list(params),
    placeholderData: keepPreviousData,
  })

const useWarehouseMutation = (mutationFn, { success, silentErrors = false } = {}) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: (warehouse) => {
      qc.invalidateQueries({ queryKey: KEY })
      if (success) toast.success(success(warehouse))
    },
    onError: (error) => {
      if (!silentErrors) toast.error(error?.message ?? 'No se pudo completar la acción')
    },
  })
}

// Crear y editar muestran los errores dentro del formulario.
export const useCreateWarehouse = () =>
  useWarehouseMutation(warehousesService.create, { success: (w) => `Almacén ${w.code} creado`, silentErrors: true })

export const useUpdateWarehouse = () =>
  useWarehouseMutation(({ id, body }) => warehousesService.update(id, body), {
    success: (w) => `Almacén ${w.code} actualizado`,
    silentErrors: true,
  })

export const useDeactivateWarehouse = () =>
  useWarehouseMutation(warehousesService.deactivate, { success: (w) => `${w.name} fue desactivado` })

export const useActivateWarehouse = () =>
  useWarehouseMutation(warehousesService.activate, { success: (w) => `${w.name} fue reactivado` })
