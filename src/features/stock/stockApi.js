import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

// Endpoints de /api/stock: la existencia por almacén que usan los formularios de movimientos (HU-401)
// y la consulta de existencias con alertas (HU-407).
const unwrap = (envelope) => envelope?.data

const clean = (params) => Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== null))

export const stockService = {
  /**
   * Existencias (HU-407). Sobre completo: { data: StockRow[], meta: { pagination, filters, summary } }.
   * StockRow: { product, category, warehouse, quantity, total, minStock, maxStock, status, warehouses }.
   * summary: { total, normal, bajoMinimo, sobreMaximo }. params: { page, limit, search, warehouseId,
   * categoryId, alert (BAJO_MINIMO | SOBRE_MAXIMO | CON_ALERTA), groupBy (product | warehouse) }.
   */
  list: (params) => api.get('/stock', { params: clean(params) }),
  /** { warehouse: { id, code, name }, items: [{ productId, code, unitCode, available }] } (cantidades en texto) */
  availability: (warehouseId, productIds) =>
    api.get('/stock/availability', { params: { warehouseId, productIds: productIds.join(',') } }).then(unwrap),
}

export const useStock = (params) =>
  useQuery({ queryKey: ['stock', 'list', params], queryFn: () => stockService.list(params), placeholderData: keepPreviousData })

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
