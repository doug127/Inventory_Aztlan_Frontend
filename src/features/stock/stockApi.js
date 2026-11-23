import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

// Endpoints de /api/stock. Por ahora, la existencia por almacén que usa la orden de retiro (HU-401);
// la consulta completa con alertas llega en HU-407.
const unwrap = (envelope) => envelope?.data

export const stockService = {
  /** { warehouse: { id, code, name }, items: [{ productId, code, unitCode, available }] } (cantidades en texto) */
  availability: (warehouseId, productIds) =>
    api.get('/stock/availability', { params: { warehouseId, productIds: productIds.join(',') } }).then(unwrap),
}

/** Existencia de esos productos en el almacén. productIds vacío o sin almacén: no consulta. */
export const useAvailability = (warehouseId, productIds) => {
  const ids = [...new Set(productIds)].sort((a, b) => a - b)
  return useQuery({
    queryKey: ['stock', 'availability', warehouseId, ids],
    queryFn: () => stockService.availability(warehouseId, ids),
    enabled: Boolean(warehouseId) && ids.length > 0,
    placeholderData: keepPreviousData,
    staleTime: 10_000,
  })
}
