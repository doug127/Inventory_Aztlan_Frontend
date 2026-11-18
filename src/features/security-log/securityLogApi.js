import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

// GET /api/security-events (HU-110). Solo el SUPERADMIN tiene acceso.
const clean = (params) =>
  Object.fromEntries(
    Object.entries(params)
      .map(([k, v]) => [k, Array.isArray(v) ? v.join(',') : v])
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
  )

/** { data: SecurityEventDto[], meta: { pagination, filters, sort } } */
export const listSecurityEvents = (params) => api.get('/security-events', { params: clean(params) })

/** Lista de eventos. Se refresca sola cada 30 s para ver los accesos casi en vivo. */
export const useSecurityEvents = (params) =>
  useQuery({
    queryKey: ['security-events', params],
    queryFn: () => listSecurityEvents(params),
    placeholderData: keepPreviousData,
    refetchInterval: 30_000,
  })

/** Solo el total de eventos que cumplen los filtros (para los contadores del día). */
export const useSecurityEventCount = (params) =>
  useQuery({
    queryKey: ['security-events', 'count', params],
    queryFn: () => listSecurityEvents({ ...params, limit: 1 }),
    select: (envelope) => envelope?.meta?.pagination?.totalItems ?? 0,
    refetchInterval: 30_000,
  })
