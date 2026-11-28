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
  /**
   * Kardex de un producto (HU-409). Sobre completo: { data: KardexRow[], meta: { pagination, summary } }.
   * KardexRow: { movement, warehouse, asset, in, out, balance }. summary: { product, warehouse, opening, in, out, closing }.
   */
  kardex: (params) => api.get('/stock/kardex', { params: clean(params) }),
  /** { warehouse: { id, code, name }, items: [{ productId, code, unitCode, available }] } (cantidades en texto) */
  availability: (warehouseId, productIds) =>
    api.get('/stock/availability', { params: { warehouseId, productIds: productIds.join(',') } }).then(unwrap),
}

export const useKardex = (params, { enabled = true } = {}) =>
  useQuery({ queryKey: ['stock', 'kardex', params], queryFn: () => stockService.kardex(params), placeholderData: keepPreviousData, enabled })

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

// --- Hojas imprimibles: todas las filas, no solo una página ------------------------------------

/** Máximo de páginas de 100 filas que trae una hoja imprimible (10 000 filas). */
const PRINT_MAX_PAGES = 100

/**
 * Recorre las páginas de un listado (de 100 en 100) y devuelve { rows, meta, truncated }: todas las
 * filas, el meta de la primera página (resumen y filtros) y si se cortó por el máximo.
 */
const fetchAllPages = async (fetchPage, params) => {
  const first = await fetchPage({ ...params, page: 1, limit: 100 })
  const rows = [...(first.data ?? [])]
  const totalPages = first.meta?.pagination?.totalPages ?? 1
  const last = Math.min(totalPages, PRINT_MAX_PAGES)
  for (let page = 2; page <= last; page += 1) {
    const next = await fetchPage({ ...params, page, limit: 100 })
    rows.push(...(next.data ?? []))
  }
  return { rows, meta: first.meta, truncated: totalPages > PRINT_MAX_PAGES }
}

/** Existencias completas con los filtros de la pantalla (hoja /stock/print). */
export const useAllStock = (params) =>
  useQuery({ queryKey: ['stock', 'print', params], queryFn: () => fetchAllPages(stockService.list, params) })

/** Kardex completo de un producto con los filtros de la pantalla (hoja /kardex/print). */
export const useAllKardex = (params, { enabled = true } = {}) =>
  useQuery({ queryKey: ['stock', 'kardex', 'print', params], queryFn: () => fetchAllPages(stockService.kardex, params), enabled })
