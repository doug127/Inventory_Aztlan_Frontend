import { useEffect, useState } from 'react'
import { AlertTriangle, Check, Info } from 'lucide-react'
import { SearchPicker } from '@/components/common/SearchPicker'
import { cn } from '@/lib/utils'
import { useProducts } from '@/features/products/productsApi'

// Piezas comunes a los formularios de movimientos: orden de retiro (HU-401) y entrada (HU-402).
// Cantidades como texto en milésimas enteras (BigInt), igual que NUMERIC(14,3) del backend.

export const pad = (n) => String(n).padStart(2, '0')
export const isoDay = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const daysAgo = (n) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return isoDay(d)
}

/** Cantidad en milésimas enteras (BigInt): sumas exactas, como NUMERIC(14,3) del backend. */
/** "12,5" → "12.5"; ".5" → "0.5"; "12." → "12". Lo que se envía al backend. */
export const normalizeQuantity = (value) =>
  String(value ?? '')
    .trim()
    .replace(',', '.')
    .replace(/^\./, '0.')
    .replace(/\.$/, '')

export const toMilli = (value) => {
  const text = normalizeQuantity(value)
  if (!/^\d{1,11}(\.\d{1,3})?$/.test(text)) return null
  const [int, dec = ''] = text.split('.')
  return BigInt(int) * 1000n + BigInt(dec.padEnd(3, '0'))
}
export const numberFormat = new Intl.NumberFormat('es', { maximumFractionDigits: 3 })
export const fmtMilli = (milli) => numberFormat.format(Number(milli) / 1000)
export const fmt = (text) => numberFormat.format(Number(text))

export const newKey = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`.replace(/\D/g, ''))
/**
 * Cantidad mientras se escribe: solo dígitos y un separador decimal (punto o coma), hasta 11 enteros y
 * 3 decimales. Cualquier otra tecla (letras, signos, el menos) se ignora.
 */
export const QUANTITY_TYPING = /^\d{0,11}([.,]\d{0,3})?$/
export const typedQuantity = (previous, next) => (QUANTITY_TYPING.test(next) ? next : previous)

export const useDebounced = (value, delay = 250) => {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

export const inputClass =
  'h-11 w-full rounded-md border border-line bg-white px-3 text-[15px] text-ink-900 outline-none transition placeholder:text-ink-500 focus:border-forest-700 focus:ring-4 focus:ring-forest-700/10 aria-[invalid=true]:border-red-500'
export const labelClass = 'mb-1.5 block text-[13px] font-medium text-ink-900'

export const Field = ({ label, required, hint, error, children, htmlFor }) => (
  <div>
    <label htmlFor={htmlFor} className={labelClass}>
      {label}
      {required && <span className='text-red-600'> *</span>}
    </label>
    {children}
    {error ? <p className='mt-1 text-xs text-red-600'>{error}</p> : hint ? <p className='mt-1 text-xs text-ink-500'>{hint}</p> : null}
  </div>
)

export const Card = ({ className, children }) => (
  <section className={cn('rounded-xl border border-line/80 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:p-6', className)}>{children}</section>
)

export function Steps({ step, items = ['Datos', 'Líneas', 'Revisar'] }) {
  return (
    <ol className='flex items-center gap-2 text-sm' aria-label='Pasos'>
      {items.map((label, i) => {
        const n = i + 1
        const state = step === n ? 'current' : step > n ? 'done' : 'todo'
        return (
          <li key={label} className='flex items-center gap-2' aria-current={state === 'current' ? 'step' : undefined}>
            <span
              className={cn(
                'grid size-6 shrink-0 place-items-center rounded-full text-xs font-semibold',
                state === 'done' && 'bg-forest-700 text-white',
                state === 'current' && 'bg-ink-900 text-white',
                state === 'todo' && 'bg-sand-50 text-ink-500 ring-1 ring-line'
              )}
            >
              {state === 'done' ? <Check className='size-3.5' /> : n}
            </span>
            <span className={cn('hidden sm:inline', state === 'current' ? 'font-medium text-ink-900' : 'text-ink-500')}>{label}</span>
            {n < items.length && <span className='mx-1 h-px w-6 bg-line sm:w-10' aria-hidden />}
          </li>
        )
      })}
    </ol>
  )
}

export function Banner({ tone = 'error', children }) {
  const styles = {
    error: 'bg-red-50 text-red-800 ring-red-200',
    warning: 'bg-amber-50 text-amber-900 ring-amber-200',
    info: 'bg-sand-50 text-ink-900 ring-line',
  }
  const Icon = tone === 'info' ? Info : AlertTriangle
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={cn('flex gap-2.5 rounded-lg px-3.5 py-3 text-sm ring-1', styles[tone])}>
      <Icon className='mt-0.5 size-4 shrink-0' aria-hidden />
      <div className='min-w-0'>{children}</div>
    </div>
  )
}

/** withStockIn: id de un almacén; solo lista los productos con existencia en él (origen de un traslado). */
export function ProductPicker({ value, onChange, invalid, withStockIn, emptyText = 'Ningún producto activo coincide' }) {
  const [search, setSearch] = useState('')
  const debounced = useDebounced(search)
  const { data, isFetching } = useProducts({ search: debounced || undefined, isActive: true, limit: 12, sort: 'code', withStockIn: withStockIn || undefined })
  const options = (data?.data ?? []).map((p) => ({ id: p.id, label: p.name, hint: `${p.code} · ${p.unit.code}`, product: p }))
  // Con almacén, cada opción muestra a la derecha lo disponible en él.
  const renderOption = withStockIn
    ? (option) => {
        const available = option.product.stock.inWarehouse?.quantity
        return (
          <span className='flex items-center justify-between gap-3'>
            <span className='min-w-0'>
              <span className='block truncate font-medium'>{option.label}</span>
              <span className='block truncate text-xs text-ink-500'>{option.hint}</span>
            </span>
            {available !== undefined && (
              <span className='shrink-0 text-right tabular-nums'>
                <span className='block text-sm font-semibold text-ink-900'>{fmt(available)}</span>
                <span className='block text-[11px] text-ink-500'>{option.product.unit.code} disp.</span>
              </span>
            )}
          </span>
        )
      }
    : undefined
  return (
    <SearchPicker
      ariaLabel='Producto'
      value={value ? { id: value.id, label: value.name, hint: value.code } : null}
      onChange={(option) => onChange(option?.product ?? null)}
      onSearch={setSearch}
      options={options}
      loading={isFetching}
      invalid={invalid}
      placeholder='Buscar producto por código o nombre'
      emptyText={emptyText}
      renderOption={renderOption}
    />
  )
}

/**
 * Primer problema de las líneas, en el orden en que se ven: "Línea 2: Indica la cantidad".
 * fields: los errores que bloquean, en orden de prioridad (los avisos como `merge` no bloquean).
 */
export const firstLineIssue = (lines, byLine, fields) => {
  for (const [i, line] of lines.entries()) {
    const e = byLine[line.key]
    const field = e && fields.find((f) => e[f])
    if (field) return `Línea ${i + 1}: ${e[field]}`
  }
  return null
}

/**
 * Errores de línea que se ven: los del servidor (shown), los avisos de existencia y de producto
 * repetido, y los de una línea con producto y cantidad ya puestos (por ejemplo, cantidad 0). Lo que
 * falta llenar no se marca en rojo: lo explica el botón deshabilitado.
 */
export const visibleLineErrors = (lines, shown, live) => {
  const merged = { ...shown }
  for (const line of lines) {
    const e = live[line.key]
    if (!e) continue
    const filled = Boolean(line.product && line.quantity)
    merged[line.key] = filled ? { ...merged[line.key], ...e } : { ...merged[line.key], ...(e.merge && { merge: e.merge }), ...(e.stock && { stock: e.stock }) }
  }
  return merged
}

/** Errores de cabecera que se ven en vivo: todos menos los de "falta llenar" (hidden), que solo explica el botón. */
export const visibleHeaderErrors = (shown, live, hidden) => ({
  ...shown,
  ...Object.fromEntries(Object.entries(live).filter(([k]) => !hidden.includes(k))),
})

/** Primer error de un objeto de errores de campo, o null. */
export const firstIssue = (errors) => Object.values(errors)[0] ?? null

/**
 * Botón para avanzar o confirmar. Con blockedReason queda deshabilitado y muestra el motivo al lado:
 * un botón gris sin explicación no dice qué falta.
 */
export function NextButton({ onClick, blockedReason, pending = false, pendingLabel, tone = 'next', children }) {
  const blocked = Boolean(blockedReason)
  return (
    <div className='flex flex-col items-stretch gap-1.5 sm:flex-row sm:items-center sm:gap-3'>
      {blocked && !pending && (
        <p role='status' aria-live='polite' className='flex items-start gap-1.5 text-xs text-ink-500 sm:max-w-sm sm:text-right'>
          <Info className='mt-px size-3.5 shrink-0' aria-hidden />
          <span>{blockedReason}</span>
        </p>
      )}
      <button
        type='button'
        onClick={onClick}
        disabled={blocked || pending}
        className={cn(
          'inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-md px-5 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50',
          tone === 'confirm' ? 'bg-forest-700 enabled:hover:bg-forest-800' : 'bg-ink-900 enabled:hover:bg-ink-900/90'
        )}
      >
        {pending ? pendingLabel : children}
      </button>
    </div>
  )
}

/**
 * Botones de un paso (Cancelar / Atrás a la izquierda, Continuar / Confirmar a la derecha). Van dentro
 * de la última tarjeta del paso, debajo de su último campo y separados por una línea.
 */
export function FormFooter({ children }) {
  return <div className='mt-6 flex flex-col-reverse gap-2 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between'>{children}</div>
}

/** Almacenes activos como tarjetas elegibles (origen de un retiro, destino de una entrada). */
export function WarehouseChoice({ warehouses, value, onChange, label }) {
  return (
    <div className='grid gap-2 sm:grid-cols-2' role='radiogroup' aria-label={label}>
      {warehouses.map((w) => (
        <button
          key={w.id}
          type='button'
          role='radio'
          aria-checked={value === w.id}
          onClick={() => onChange(w.id)}
          className={cn(
            'flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors',
            value === w.id ? 'border-forest-700 bg-forest-50 ring-1 ring-forest-700' : 'border-line hover:border-ink-500/40'
          )}
        >
          <span className='rounded bg-white px-1.5 py-0.5 font-mono text-xs font-semibold ring-1 ring-line'>{w.code}</span>
          <span className='truncate text-sm'>{w.name}</span>
        </button>
      ))}
    </div>
  )
}
