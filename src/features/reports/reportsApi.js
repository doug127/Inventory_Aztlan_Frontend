import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { fetchAllPages } from '@/lib/fetchAllPages'

// Endpoints de /api/reports (Sprint 7). HU-501: consumo por activo y por categoría de activo.

const clean = (params) => Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== null))

export const reportsService = {
  /**
   * Consumo neto (HU-501). Sobre completo: { data: Row[], meta: { pagination, filters, summary } }.
   * Row: { asset | assetCategory, product, consumed, corrected, net, lines, assets, lastConsumedAt }.
   * summary: { groups, lines, products: [{ product, consumed, corrected, net, lines, assets }], assetCategory }.
   * params: { groupBy (asset | assetCategory), from, to, productId, productCategoryId, assetId, assetCategoryId, page, limit }.
   */
  consumption: (params) => api.get('/reports/consumption', { params: clean(params) }),
}

export const useConsumptionReport = (params) =>
  useQuery({ queryKey: ['reports', 'consumption', params], queryFn: () => reportsService.consumption(params), placeholderData: keepPreviousData })

/** Todas las filas del reporte de consumo, para la hoja imprimible. */
export const useAllConsumption = (params) =>
  useQuery({ queryKey: ['reports', 'consumption', 'print', params], queryFn: () => fetchAllPages(reportsService.consumption, params) })

// --- Filtros del reporte de consumo (viven en la URL) ----------------------------------------------

/** Lee los filtros de la URL: la pantalla y la hoja imprimible usan los mismos. */
export const readConsumptionFilters = (params) => ({
  groupBy: params.get('groupBy') === 'assetCategory' ? 'assetCategory' : 'asset',
  from: params.get('from') || undefined,
  to: params.get('to') || undefined,
  productId: Number(params.get('product')) || undefined,
  productCategoryId: Number(params.get('productCategory')) || undefined,
  assetId: Number(params.get('asset')) || undefined,
  assetCategoryId: Number(params.get('assetCategory')) || undefined,
})

/** Los filtros que van al backend (el activo no aplica en la vista por categoría). */
export const consumptionQuery = (filters) => ({
  ...filters,
  assetId: filters.groupBy === 'asset' ? filters.assetId : undefined,
})

const pad = (n) => String(n).padStart(2, '0')
const isoDay = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

/** Atajos de período: el mes en curso, el anterior, el año en curso y toda la historia. */
export const PERIOD_PRESETS = [
  {
    key: 'month',
    label: 'Este mes',
    range: (now) => ({ from: isoDay(new Date(now.getFullYear(), now.getMonth(), 1)), to: isoDay(now) }),
  },
  {
    key: 'lastMonth',
    label: 'Mes anterior',
    range: (now) => ({ from: isoDay(new Date(now.getFullYear(), now.getMonth() - 1, 1)), to: isoDay(new Date(now.getFullYear(), now.getMonth(), 0)) }),
  },
  { key: 'year', label: 'Este año', range: (now) => ({ from: isoDay(new Date(now.getFullYear(), 0, 1)), to: isoDay(now) }) },
  { key: 'all', label: 'Todo', range: () => ({ from: undefined, to: undefined }) },
]

const dayLabel = (value) => new Date(`${value}T12:00:00`).toLocaleDateString('es', { dateStyle: 'long' })

/** "Del 1 de noviembre de 2026 al 27 de noviembre de 2026", "Desde…", "Hasta…" o "Toda la historia". */
export const periodLabel = ({ from, to }) =>
  from && to ? `Del ${dayLabel(from)} al ${dayLabel(to)}` : from ? `Desde el ${dayLabel(from)}` : to ? `Hasta el ${dayLabel(to)}` : 'Toda la historia'

const numberFormat = new Intl.NumberFormat('es', { minimumFractionDigits: 0, maximumFractionDigits: 3 })
/** Cantidad con signo menos tipográfico: el neto es negativo si se corrigió un consumo de antes del período. */
export const qty = (value) => {
  const n = Number(value)
  return n < 0 ? `−${numberFormat.format(-n)}` : numberFormat.format(n)
}
