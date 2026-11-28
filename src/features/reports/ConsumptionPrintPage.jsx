import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PrintSheet, printTable as t } from '@/components/print/PrintSheet'
import { useProduct } from '@/features/products/productsApi'
import { flattenTree, useCategoryOptions } from '@/features/product-categories/productCategoriesApi'
import { useAsset } from '@/features/assets/assetsApi'
import { consumptionQuery, periodLabel, qty, readConsumptionFilters, useAllConsumption } from './reportsApi'

// Hoja imprimible del reporte de consumo (HU-501 / HU-503): los mismos filtros de /reports/consumption
// (los toma de la URL), con todas las filas y los totales por producto, que son los mismos de la
// pantalla. Carta apaisada; "Guardar como PDF" del diálogo sirve de exportación.

const dateTime = (value) => (value ? new Date(value).toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' }) : '—')

export function ConsumptionPrintPage() {
  const [params] = useSearchParams()
  const filters = readConsumptionFilters(params)
  const byCategory = filters.groupBy === 'assetCategory'

  const { data, isLoading, isError, error } = useAllConsumption(consumptionQuery(filters))
  const { data: product } = useProduct(filters.productId)
  const { data: asset } = useAsset(byCategory ? undefined : filters.assetId)
  const { data: tree = [] } = useCategoryOptions()
  const productCategory = useMemo(() => flattenTree(tree).find((c) => c.id === filters.productCategoryId), [tree, filters.productCategoryId])

  const rows = data?.rows ?? []
  const summary = data?.meta?.summary
  const title = byCategory ? 'Consumo por categoría de activo' : 'Consumo por activo'
  const sheetFilters = [
    { label: 'Período', value: periodLabel(filters) },
    { label: 'Categoría de activo', value: summary?.assetCategory ? summary.assetCategory.name : 'Todas' },
    ...(!byCategory ? [{ label: 'Activo', value: asset ? `${asset.code} · ${asset.name}` : 'Todos' }] : []),
    { label: 'Categoría de producto', value: productCategory ? productCategory.name : 'Todas' },
    { label: 'Producto', value: product ? `${product.code} · ${product.name}` : 'Todos' },
  ]

  return (
    <PrintSheet
      backTo={`/reports/consumption?${new URLSearchParams([...params].filter(([k]) => k !== 'auto')).toString()}`}
      backLabel='Volver al reporte'
      title={title}
      subtitle='Consumo neto: consumido − corregido'
      filters={sheetFilters}
      orientation='landscape'
      ready={Boolean(data)}
      autoPrint={params.get('auto') === '1'}
    >
      {isError && <p className='text-sm text-red-600'>{error?.message ?? 'No se pudo generar el reporte'}</p>}
      {isLoading && <p className='text-sm text-[#58695E]'>Cargando todas las filas…</p>}
      {data && summary && (
        <>
          <p className='mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#58695E]'>Totales por producto</p>
          <table className={`${t.table} mb-5`}>
            <thead>
              <tr className={t.headRow}>
                <th className={t.th}>Código</th>
                <th className={t.th}>Producto</th>
                <th className={`${t.th} text-right`}>Activos</th>
                <th className={`${t.th} text-right`}>Consumido</th>
                <th className={`${t.th} text-right`}>Corregido</th>
                <th className={`${t.th} text-right`}>Neto</th>
                <th className={t.th}>Und.</th>
              </tr>
            </thead>
            <tbody>
              {summary.products.map((p) => (
                <tr key={p.product.id}>
                  <td className={`${t.td} font-mono`}>{p.product.code}</td>
                  <td className={t.td}>{p.product.name}</td>
                  <td className={`${t.td} text-right tabular-nums`}>{p.assets}</td>
                  <td className={`${t.td} text-right tabular-nums`}>{qty(p.consumed)}</td>
                  <td className={`${t.td} text-right tabular-nums`}>{qty(p.corrected)}</td>
                  <td className={`${t.td} text-right font-semibold tabular-nums`}>{qty(p.net)}</td>
                  <td className={t.td}>{p.product.unitCode}</td>
                </tr>
              ))}
              {summary.products.length === 0 && (
                <tr>
                  <td colSpan={7} className={`${t.td} py-4 text-center text-[#58695E]`}>
                    Sin consumos con estos filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {rows.length > 0 && (
            <>
              <p className='mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#58695E]'>
                Detalle {byCategory ? 'por categoría' : 'por activo'} · {summary.groups} {byCategory ? 'categorías' : 'activos'} · {summary.lines} líneas
              </p>
              {data.truncated && <p className='mb-2 text-[11px] font-semibold text-[#8A6836]'>La hoja muestra las primeras 10 000 filas: acota el período para ver el resto.</p>}
              <table className={t.table}>
                <thead>
                  <tr className={t.headRow}>
                    <th className={t.th}>{byCategory ? 'Categoría' : 'Activo'}</th>
                    {!byCategory && <th className={t.th}>Categoría</th>}
                    <th className={t.th}>Producto</th>
                    {byCategory && <th className={`${t.th} text-right`}>Activos</th>}
                    <th className={`${t.th} text-right`}>Consumido</th>
                    <th className={`${t.th} text-right`}>Corregido</th>
                    <th className={`${t.th} text-right`}>Neto</th>
                    {!byCategory && <th className={t.th}>Último consumo</th>}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={`${(r.asset ?? r.assetCategory).id}|${r.product.id}`}>
                      <td className={t.td}>{r.asset ? `${r.asset.code} · ${r.asset.name}` : r.assetCategory.name}</td>
                      {!byCategory && <td className={t.td}>{r.asset.category.name}</td>}
                      <td className={t.td}>
                        <span className='font-mono'>{r.product.code}</span> · {r.product.name}
                      </td>
                      {byCategory && <td className={`${t.td} text-right tabular-nums`}>{r.assets}</td>}
                      <td className={`${t.td} text-right tabular-nums`}>{qty(r.consumed)}</td>
                      <td className={`${t.td} text-right tabular-nums`}>{qty(r.corrected)}</td>
                      <td className={`${t.td} whitespace-nowrap text-right font-semibold tabular-nums`}>
                        {qty(r.net)} {r.product.unitCode}
                      </td>
                      {!byCategory && <td className={`${t.td} whitespace-nowrap`}>{dateTime(r.lastConsumedAt)}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className='mt-2 text-right text-[10px] text-[#58695E]'>
                {rows.length} filas
              </p>
            </>
          )}
        </>
      )}
    </PrintSheet>
  )
}
