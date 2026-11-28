import { useSearchParams } from 'react-router-dom'
import { PrintSheet, printTable as t } from '@/components/print/PrintSheet'
import { MOVEMENT_TYPE_LABELS, REASON_LABELS } from '@/features/movements/movementsApi'
import { useAllKardex } from './stockApi'

// Hoja imprimible del kardex (HU-409 / HU-503): el mismo producto, almacén y período de /kardex (los
// toma de la URL), con todas las filas, el resumen del período y el saldo acumulado real. Carta apaisada.

const numberFormat = new Intl.NumberFormat('es', { minimumFractionDigits: 0, maximumFractionDigits: 3 })
const qty = (value) => (value === null || value === undefined ? '' : numberFormat.format(Number(value)))
const day = (value) => new Date(`${value}T12:00:00`).toLocaleDateString('es', { dateStyle: 'long' })

export function KardexPrintPage() {
  const [params] = useSearchParams()
  const productId = Number(params.get('product')) || undefined
  const warehouseId = Number(params.get('warehouse')) || undefined
  const from = params.get('from') || undefined
  const to = params.get('to') || undefined

  const { data, isLoading, isError, error } = useAllKardex({ productId, warehouseId, from, to }, { enabled: Boolean(productId) })
  const rows = data?.rows ?? []
  const summary = data?.meta?.summary
  const unit = summary?.product.unitCode ?? ''
  const showWarehouse = !warehouseId
  const back = `/kardex?${new URLSearchParams([...params].filter(([k]) => k !== 'auto')).toString()}`

  const period = from && to ? `Del ${day(from)} al ${day(to)}` : from ? `Desde el ${day(from)}` : to ? `Hasta el ${day(to)}` : 'Toda la historia'
  const filters = summary
    ? [
        { label: 'Producto', value: `${summary.product.code} · ${summary.product.name}` },
        { label: 'Almacén', value: summary.warehouse ? `${summary.warehouse.code} · ${summary.warehouse.name}` : 'Todos' },
        { label: 'Período', value: period },
      ]
    : []

  if (!productId) {
    return (
      <PrintSheet backTo='/kardex' backLabel='Volver al kardex' title='Kardex' ready={false}>
        <p className='text-sm text-[#58695E]'>Elige un producto en el kardex antes de imprimir.</p>
      </PrintSheet>
    )
  }

  return (
    <PrintSheet
      backTo={back}
      backLabel='Volver al kardex'
      title='Kardex'
      subtitle={summary ? `${summary.product.code} · ${summary.product.name}` : undefined}
      filters={filters}
      orientation='landscape'
      ready={Boolean(data)}
      autoPrint={params.get('auto') === '1'}
    >
      {isError && <p className='text-sm text-red-600'>{error?.status === 404 ? 'El producto o el almacén no existe.' : (error?.message ?? 'No se pudo cargar el kardex')}</p>}
      {isLoading && <p className='text-sm text-[#58695E]'>Cargando todas las filas…</p>}
      {data && summary && (
        <>
          <table className='mb-4 text-[11px]'>
            <tbody>
              {[
                [from ? 'Saldo inicial (antes del período)' : 'Saldo inicial', summary.opening],
                ['Entradas del período', summary.in],
                ['Salidas del período', summary.out],
                [to ? 'Saldo al final del período' : 'Saldo final', summary.closing],
              ].map(([label, value]) => (
                <tr key={label}>
                  <td className='pr-6 text-[#58695E]'>{label}</td>
                  <td className='text-right font-semibold tabular-nums'>
                    {qty(value)} {unit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.truncated && <p className='mb-2 text-[11px] font-semibold text-[#8A6836]'>La hoja muestra las primeras 10 000 filas: acota el período para ver el resto.</p>}
          <table className={t.table}>
            <thead>
              <tr className={t.headRow}>
                <th className={t.th}>Fecha</th>
                <th className={t.th}>Documento</th>
                <th className={t.th}>Tipo · motivo</th>
                {showWarehouse && <th className={t.th}>Almacén</th>}
                <th className={t.th}>Activo</th>
                <th className={`${t.th} text-right`}>Entrada</th>
                <th className={`${t.th} text-right`}>Salida</th>
                <th className={`${t.th} text-right`}>Saldo</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={`${r.movement.id}|${r.warehouse.id}|${r.asset?.id ?? ''}|${i}`}>
                  <td className={`${t.td} whitespace-nowrap`}>{new Date(r.movement.movementDate).toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' })}</td>
                  <td className={`${t.td} font-mono`}>
                    {r.movement.documentNumber}
                    {r.movement.reference && <span className='block text-[9.5px] text-[#58695E]'>{r.movement.reference}</span>}
                  </td>
                  <td className={t.td}>
                    {MOVEMENT_TYPE_LABELS[r.movement.movementType]} · {r.movement.reference?.startsWith('REV-') ? 'Corrección' : (REASON_LABELS[r.movement.reason] ?? r.movement.reason)}
                  </td>
                  {showWarehouse && <td className={`${t.td} font-mono`}>{r.warehouse.code}</td>}
                  <td className={t.td}>{r.asset ? `${r.asset.code} · ${r.asset.name}` : '—'}</td>
                  <td className={`${t.td} text-right tabular-nums`}>{qty(r.in)}</td>
                  <td className={`${t.td} text-right tabular-nums`}>{qty(r.out)}</td>
                  <td className={`${t.td} text-right font-semibold tabular-nums`}>{qty(r.balance)}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={showWarehouse ? 8 : 7} className={`${t.td} py-4 text-center text-[#58695E]`}>
                    Sin movimientos en el período.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <p className='mt-2 text-right text-[10px] text-[#58695E]'>
            {rows.length} movimientos · cantidades en {unit}
          </p>
        </>
      )}
    </PrintSheet>
  )
}
