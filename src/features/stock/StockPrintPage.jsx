import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PrintSheet, printTable as t } from '@/components/print/PrintSheet'
import { flattenTree, useCategoryOptions } from '@/features/product-categories/productCategoriesApi'
import { useWarehouses } from '@/features/warehouses/warehousesApi'
import { useAllStock } from './stockApi'

// Hoja imprimible de Existencias (HU-407 / HU-503): los mismos filtros de /stock (los toma de la URL),
// con todas las filas, el resumen por estado y el estado siempre escrito. Carta apaisada.

const numberFormat = new Intl.NumberFormat('es', { minimumFractionDigits: 0, maximumFractionDigits: 3 })
const qty = (value) => numberFormat.format(Number(value))
const STATUS = { NORMAL: 'Normal', BAJO_MINIMO: 'Bajo mínimo', SOBRE_MAXIMO: 'Sobre máximo' }
const ALERT_LABELS = { CON_ALERTA: 'Con alguna alerta', BAJO_MINIMO: 'Bajo mínimo', SOBRE_MAXIMO: 'Sobre máximo' }

export function StockPrintPage() {
  const [params] = useSearchParams()
  const warehouseId = Number(params.get('warehouseId')) || undefined
  const categoryId = Number(params.get('categoryId')) || undefined
  const rawAlert = params.get('alert')
  const alert = rawAlert === 'true' ? 'CON_ALERTA' : ALERT_LABELS[rawAlert] ? rawAlert : undefined
  const groupBy = params.get('groupBy') === 'warehouse' ? 'warehouse' : 'product'
  const search = params.get('search') || undefined

  const { data, isLoading, isError, error } = useAllStock({ warehouseId, categoryId, alert, groupBy, search })
  const { data: warehousesData } = useWarehouses({ limit: 100, sort: 'code' })
  const { data: tree = [] } = useCategoryOptions()
  const warehouse = warehousesData?.data?.find((w) => w.id === warehouseId)
  const category = useMemo(() => flattenTree(tree).find((c) => c.id === categoryId), [tree, categoryId])

  const rows = data?.rows ?? []
  const summary = data?.meta?.summary
  const showWarehouse = groupBy === 'warehouse' || Boolean(warehouseId)
  const filters = [
    { label: 'Almacén', value: warehouse ? `${warehouse.code} · ${warehouse.name}` : 'Todos' },
    { label: 'Categoría', value: category ? category.name : 'Todas' },
    { label: 'Estado', value: alert ? ALERT_LABELS[alert] : 'Todos' },
    { label: 'Vista', value: groupBy === 'warehouse' ? 'Por almacén' : 'Por producto' },
    ...(search ? [{ label: 'Búsqueda', value: search }] : []),
  ]

  return (
    <PrintSheet
      backTo={`/stock?${new URLSearchParams([...params].filter(([k]) => k !== 'auto')).toString()}`}
      backLabel='Volver a Existencias'
      title='Reporte de existencias'
      subtitle={`Al ${new Date().toLocaleString('es', { dateStyle: 'long', timeStyle: 'short' })}`}
      filters={filters}
      orientation='landscape'
      ready={Boolean(data)}
      autoPrint={params.get('auto') === '1'}
    >
      {isError && <p className='text-sm text-red-600'>{error?.message ?? 'No se pudieron cargar las existencias'}</p>}
      {isLoading && <p className='text-sm text-[#58695E]'>Cargando todas las filas…</p>}
      {data && (
        <>
          {summary && (
            <p className='mb-3 text-[11px]'>
              <strong>{summary.total}</strong> productos · <strong>{summary.bajoMinimo}</strong> bajo mínimo · <strong>{summary.sobreMaximo}</strong> sobre máximo ·{' '}
              <strong>{summary.normal}</strong> normales <span className='text-[#58695E]'>(el estado compara el total de todos los almacenes con el mínimo y el máximo)</span>
            </p>
          )}
          {data.truncated && <p className='mb-2 text-[11px] font-semibold text-[#8A6836]'>La hoja muestra las primeras 10 000 filas: filtra para ver el resto.</p>}
          <table className={t.table}>
            <thead>
              <tr className={t.headRow}>
                <th className={t.th}>Código</th>
                <th className={t.th}>Producto</th>
                <th className={t.th}>Categoría</th>
                <th className={t.th}>{showWarehouse ? 'Almacén' : 'Dónde está'}</th>
                <th className={`${t.th} text-right`}>Existencia</th>
                <th className={t.th}>Und.</th>
                {showWarehouse && <th className={`${t.th} text-right`}>Total</th>}
                <th className={`${t.th} text-right`}>Mínimo</th>
                <th className={`${t.th} text-right`}>Máximo</th>
                <th className={t.th}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={`${r.product.id}|${r.warehouse?.id ?? ''}`}>
                  <td className={`${t.td} font-mono`}>{r.product.code}</td>
                  <td className={t.td}>{r.product.name}</td>
                  <td className={t.td}>{r.category.name}</td>
                  <td className={t.td}>
                    {showWarehouse
                      ? `${r.warehouse.code} · ${r.warehouse.name}`
                      : r.warehouses.length
                        ? r.warehouses.map((w) => `${w.code} ${qty(w.quantity)}`).join(' · ')
                        : 'Sin existencia'}
                  </td>
                  <td className={`${t.td} text-right font-semibold tabular-nums`}>{qty(r.quantity)}</td>
                  <td className={t.td}>{r.product.unitCode}</td>
                  {showWarehouse && <td className={`${t.td} text-right tabular-nums`}>{qty(r.total)}</td>}
                  <td className={`${t.td} text-right tabular-nums`}>{qty(r.minStock)}</td>
                  <td className={`${t.td} text-right tabular-nums`}>{r.maxStock === null ? '—' : qty(r.maxStock)}</td>
                  <td className={`${t.td} ${r.status === 'NORMAL' ? '' : 'font-semibold'}`}>{STATUS[r.status]}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={showWarehouse ? 10 : 9} className={`${t.td} py-4 text-center text-[#58695E]`}>
                    Ningún producto con estos filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <p className='mt-2 text-right text-[10px] text-[#58695E]'>{rows.length} filas</p>
        </>
      )}
    </PrintSheet>
  )
}
