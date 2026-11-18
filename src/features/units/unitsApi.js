import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/lib/api'

// Endpoints de /api/units (HU-202). Consultar y convertir: todos los roles; el resto, ADMIN+.
const unwrap = (envelope) => envelope?.data
const clean = (params) => Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ''))

export const unitsService = {
  /** { data: UnitDto[], meta } — UnitDto: { id, code, name, isActive, isBase, baseUnit, conversionFactor, equivalence, usage } */
  list: (params) => api.get('/units', { params: clean(params) }),
  convert: (params) => api.get('/units/convert', { params }).then(unwrap),
  create: (body) => api.post('/units', body).then(unwrap),
  update: (id, body) => api.patch(`/units/${id}`, body).then(unwrap),
  deactivate: (id) => api.post(`/units/${id}/deactivate`).then(unwrap),
  activate: (id) => api.post(`/units/${id}/activate`).then(unwrap),
}

const KEY = ['units']

/** Todas las unidades (son pocas: el catálogo cabe en una página de 100). */
export const useUnits = (params = {}) =>
  useQuery({
    queryKey: [...KEY, 'list', params],
    queryFn: () => unitsService.list({ limit: 100, sort: 'code', ...params }),
    select: (envelope) => envelope?.data ?? [],
    placeholderData: keepPreviousData,
  })

/** Unidades activas para los selectores (p. ej. el formulario de productos). */
export const useUnitOptions = () => useUnits({ isActive: true })

/** Conversión en el servidor (decimal.js). Solo consulta con una cantidad válida. */
export const useConversion = ({ from, to, quantity }) =>
  useQuery({
    queryKey: [...KEY, 'convert', from, to, quantity],
    queryFn: () => unitsService.convert({ from, to, quantity }),
    enabled: Boolean(from && to && /^\d{1,12}(\.\d{1,6})?$/.test(quantity) && Number(quantity) > 0),
    staleTime: Infinity,
    retry: false,
  })

const useUnitMutation = (mutationFn, { success, silentErrors = false } = {}) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: (unit) => {
      qc.invalidateQueries({ queryKey: KEY })
      if (success) toast.success(success(unit))
    },
    onError: (error) => {
      if (!silentErrors) toast.error(error?.message ?? 'No se pudo completar la acción')
    },
  })
}

export const useCreateUnit = () => useUnitMutation(unitsService.create, { success: (u) => `Unidad ${u.code} creada`, silentErrors: true })

export const useUpdateUnit = () =>
  useUnitMutation(({ id, body }) => unitsService.update(id, body), { success: (u) => `Unidad ${u.code} actualizada`, silentErrors: true })

export const useDeactivateUnit = () => useUnitMutation(unitsService.deactivate, { success: (u) => `${u.code} fue desactivada` })

export const useActivateUnit = () => useUnitMutation(unitsService.activate, { success: (u) => `${u.code} fue reactivada` })
