import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
import { ArrowLeft, CheckCircle2, FileText, Minus, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EASE_OUT } from '@/features/auth/components/AuthUI'
import { useWarehouses } from '@/features/warehouses/warehousesApi'
import { useAvailability } from '@/features/stock/stockApi'
import { useCreateAdjustment } from './movementsApi'
import {
  Banner,
  Card,
  Field,
  FormFooter,
  NextButton,
  ProductPicker,
  Steps,
  WarehouseChoice,
  firstIssue,
  firstLineIssue,
  fmt,
  fmtMilli,
  inputClass,
  isoDay,
  newKey,
  normalizeQuantity,
  toMilli,
  typedQuantity,
  visibleHeaderErrors,
  visibleLineErrors,
} from './movementForm'

// Ajuste por conteo físico (HU-404, user_flow.md §8), solo ADMIN y SUPERADMIN.
// 1. Datos del conteo · 2. Productos · 3. Revisar → Confirmar.
// Un ajuste va en un solo sentido: SOBRANTE suma (el conteo encontró más) y FALTANTE resta (encontró
// menos, sin dejar la existencia negativa). Las validaciones de aquí son una ayuda; el backend las repite.

const KINDS = [
  { id: 'FALTANTE', label: 'Faltante', hint: 'El conteo encontró menos de lo registrado: resta', icon: Minus },
  { id: 'SOBRANTE', label: 'Sobrante', hint: 'El conteo encontró más de lo registrado: suma', icon: Plus },
]
const KIND_LABELS = { FALTANTE: 'Faltante', SOBRANTE: 'Sobrante' }

let lineSeq = 0
const emptyLine = () => ({ key: ++lineSeq, product: null, quantity: '', note: '', showNote: false })
const EMPTY_HEADER = { warehouseId: '', kind: 'FALTANTE', reference: '', date: isoDay(new Date()), note: '' }

/** Acta de conteo: el prefijo CF- es fijo y se escribe AAAA-NNN (2026-004). */
const REFERENCE_TYPING = /^\d{0,4}(-\d{0,6})?$/
const typedReference = (previous, next) => {
  const value = next.toUpperCase().replace(/^CF-?/, '').replace(/\s+/g, '')
  return REFERENCE_TYPING.test(value) ? value : previous
}
/** "2026-4" → "CF-2026-004" (como lo guarda el backend); null si aún no es válida. */
const fullReference = (value) => {
  const match = /^(\d{4})-(\d{1,6})$/.exec(value)
  return match ? `CF-${match[1]}-${match[2].padStart(3, '0')}` : null
}

// --- Paso 1 -------------------------------------------------------------------------

function HeaderStep({ footer, header, setHeader, errors, warehouses }) {
  const set = (field) => (e) => setHeader((h) => ({ ...h, [field]: e.target.value }))
  return (
    <Card className='space-y-6'>
      <Field label='Almacén contado' required error={errors.warehouseId}>
        <WarehouseChoice warehouses={warehouses} value={header.warehouseId} label='Almacén contado' onChange={(id) => setHeader((h) => ({ ...h, warehouseId: id }))} />
      </Field>

      <Field label='Tipo de ajuste' required>
        <div className='grid gap-2 sm:grid-cols-2' role='radiogroup' aria-label='Tipo de ajuste'>
          {KINDS.map(({ id, label, hint, icon: Icon }) => (
            <button
              key={id}
              type='button'
              role='radio'
              aria-checked={header.kind === id}
              onClick={() => setHeader((h) => ({ ...h, kind: id }))}
              className={cn(
                'flex items-start gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors',
                header.kind === id ? 'border-forest-700 bg-forest-50 ring-1 ring-forest-700' : 'border-line hover:border-ink-500/40'
              )}
            >
              <span className='mt-0.5 grid size-7 shrink-0 place-items-center rounded-md bg-white ring-1 ring-line'>
                <Icon className='size-4' aria-hidden />
              </span>
              <span>
                <span className='block text-sm font-medium'>{label}</span>
                <span className='block text-xs text-ink-500'>{hint}</span>
              </span>
            </button>
          ))}
        </div>
      </Field>

      <div className='grid gap-5 sm:grid-cols-2'>
        <Field label='Acta de conteo físico' htmlFor='reference' required error={errors.reference} hint='Número del acta (ej. CF-2026-004)'>
          <div className='relative'>
            <span className='pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-[15px] text-ink-500'>CF-</span>
            <input
              id='reference'
              value={header.reference}
              onChange={(e) => setHeader((h) => ({ ...h, reference: typedReference(h.reference, e.target.value) }))}
              maxLength={11}
              placeholder='2026-004'
              autoComplete='off'
              inputMode='numeric'
              aria-invalid={Boolean(errors.reference)}
              className={cn(inputClass, 'pl-11 font-mono')}
            />
          </div>
        </Field>
        <Field label='Fecha' htmlFor='movement-date' required error={errors.date} hint='Fecha del conteo'>
          <input
            id='movement-date'
            type='date'
            value={header.date}
            max={isoDay(new Date())}
            onChange={set('date')}
            aria-invalid={Boolean(errors.date)}
            className={inputClass}
          />
        </Field>
        <div className='sm:col-span-2'>
          <Field label='Observación' htmlFor='note' required error={errors.note} hint='Causa de la diferencia: merma, error de registro, derrame…'>
            <textarea
              id='note'
              value={header.note}
              onChange={set('note')}
              maxLength={1000}
              rows={2}
              aria-invalid={Boolean(errors.note)}
              className={cn(inputClass, 'h-auto min-h-11 py-2.5')}
            />
          </Field>
        </div>
      </div>
      {footer}
    </Card>
  )
}

// --- Paso 2 -------------------------------------------------------------------------

/** "300 → 280 L": existencia registrada y cómo queda con el ajuste. */
function StockChange({ current, delta, unit }) {
  if (current === undefined) return null
  const after = toMilli(current) + delta
  return (
    <p className='text-xs text-ink-500 tabular-nums'>
      En sistema {fmt(current)} → <span className={cn('font-medium', after < 0n ? 'text-red-600' : 'text-ink-900')}>{fmtMilli(after)}</span> {unit}
    </p>
  )
}

function LinesStep({ footer, header, warehouse, lines, setLines, errors, stock, totals }) {
  const surplus = header.kind === 'SOBRANTE'
  const update = (key, patch) => setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)))
  const remove = (key) => setLines((ls) => (ls.length > 1 ? ls.filter((l) => l.key !== key) : [emptyLine()]))

  return (
    <div className='space-y-4'>
      <Card className='p-4 text-sm text-ink-500 sm:p-4'>
        <span className='font-medium text-ink-900'>{KIND_LABELS[header.kind]}</span> en <span className='font-mono'>{warehouse?.code}</span> ·{' '}
        {surplus
          ? 'Indica cuánto encontró el conteo de más: se suma a la existencia.'
          : 'Indica cuánto falta según el conteo: se resta y no puede superar lo registrado.'}
      </Card>

      <ol className='space-y-3'>
        {lines.map((line, index) => {
          const e = errors[line.key] ?? {}
          const unit = line.product?.unit.code
          const total = line.product ? (totals.get(line.product.id) ?? 0n) : 0n
          return (
            <motion.li key={line.key} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: EASE_OUT }}>
              <Card className={cn('p-4 sm:p-4', (e.product || e.quantity || e.stock) && 'ring-1 ring-red-300')}>
                <div className='mb-3 flex items-center justify-between'>
                  <span className='text-xs font-semibold uppercase tracking-wide text-ink-500'>Línea {index + 1}</span>
                  <button
                    type='button'
                    onClick={() => remove(line.key)}
                    aria-label={`Quitar la línea ${index + 1}`}
                    className='inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs text-ink-500 hover:bg-red-50 hover:text-red-700'
                  >
                    <Trash2 className='size-3.5' aria-hidden />
                    <span className='hidden sm:inline'>Quitar</span>
                  </button>
                </div>
                <div className='grid gap-3 sm:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]'>
                  <div>
                    {/* Un faltante solo puede ser de lo que hay en el almacén; un sobrante, de cualquier producto. */}
                    <ProductPicker
                      value={line.product}
                      onChange={(product) => update(line.key, { product })}
                      invalid={Boolean(e.product)}
                      withStockIn={surplus ? undefined : warehouse?.id}
                      emptyText={surplus ? 'Ningún producto activo coincide' : `Ningún producto con existencia en ${warehouse?.code ?? 'el almacén'} coincide`}
                    />
                    {e.product && <p className='mt-1 text-xs text-red-600'>{e.product}</p>}
                    {e.merge && <p className='mt-1 text-xs text-aviso'>{e.merge}</p>}
                  </div>
                  <div>
                    <div className='relative'>
                      <span className='pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-ink-500'>{surplus ? '+' : '−'}</span>
                      <input
                        inputMode='decimal'
                        value={line.quantity}
                        onChange={(ev) => update(line.key, { quantity: typedQuantity(line.quantity, ev.target.value.trim()) })}
                        placeholder={surplus ? 'Sobrante' : 'Faltante'}
                        aria-label={`Cantidad de la línea ${index + 1}`}
                        aria-invalid={Boolean(e.quantity || e.stock)}
                        className={cn(inputClass, 'pl-7 pr-14 text-right tabular-nums')}
                      />
                      {unit && <span className='pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-ink-500'>{unit}</span>}
                    </div>
                    {e.quantity || e.stock ? (
                      <p className='mt-1 text-xs text-red-600'>{e.quantity ?? e.stock}</p>
                    ) : (
                      line.product && (
                        <div className='mt-1 text-right'>
                          <StockChange current={stock.get(line.product.id)} delta={surplus ? total : -total} unit={unit} />
                        </div>
                      )
                    )}
                  </div>
                </div>
                {line.showNote ? (
                  <input
                    value={line.note}
                    onChange={(ev) => update(line.key, { note: ev.target.value })}
                    maxLength={500}
                    placeholder='Observación de la línea'
                    aria-label={`Observación de la línea ${index + 1}`}
                    className={cn(inputClass, 'mt-3 h-10 text-sm')}
                  />
                ) : (
                  <button type='button' onClick={() => update(line.key, { showNote: true })} className='mt-2 text-xs text-ink-500 hover:text-ink-900'>
                    + Observación
                  </button>
                )}
              </Card>
            </motion.li>
          )
        })}
      </ol>

      <Card className='p-4 sm:p-4'>
        <button
          type='button'
          onClick={() => setLines((ls) => [...ls, emptyLine()])}
          className='inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-line bg-white text-sm font-medium text-ink-900 hover:border-forest-700 hover:text-forest-800'
        >
          <Plus className='size-4' aria-hidden />
          Agregar producto
        </button>
        {footer}
      </Card>
    </div>
  )
}

// --- Validación en el cliente (el backend repite todo) ------------------------------

const validateHeader = (header) => {
  const errors = {}
  if (!header.warehouseId) errors.warehouseId = 'Elige el almacén contado'
  const reference = fullReference(header.reference)
  if (!header.reference) errors.reference = 'Indica el acta de conteo físico'
  else if (!reference) errors.reference = 'El acta es CF-AAAA-NNN (ej. CF-2026-004)'
  else if (header.date && Number(reference.slice(3, 7)) > Number(header.date.slice(0, 4))) errors.reference = 'El acta es de un año posterior a la fecha'
  if (!header.date) errors.date = 'Indica la fecha'
  else if (header.date > isoDay(new Date())) errors.date = 'La fecha no puede ser futura'
  if (!header.note.trim()) errors.note = 'Explica la causa del ajuste'
  return errors
}

/** Errores por línea y la suma por producto; un faltante no puede superar la existencia registrada. */
const validateLines = (lines, header, stock) => {
  const byLine = {}
  const add = (key, field, message) => {
    byLine[key] = { ...byLine[key], [field]: message }
  }
  const totals = new Map()
  const seen = new Map()
  lines.forEach((line, i) => {
    if (!line.product) add(line.key, 'product', 'Elige el producto')
    const milli = toMilli(line.quantity)
    if (milli === null) add(line.key, 'quantity', line.quantity ? 'Hasta 3 decimales' : 'Indica la cantidad')
    else if (milli <= 0n) add(line.key, 'quantity', 'Debe ser mayor que 0')
    if (line.product && milli) totals.set(line.product.id, (totals.get(line.product.id) ?? 0n) + milli)
    if (line.product) {
      if (seen.has(line.product.id)) add(line.key, 'merge', `Este producto ya está en la línea ${seen.get(line.product.id) + 1}: se sumará a ella`)
      else seen.set(line.product.id, i)
    }
  })
  if (header.kind === 'FALTANTE') {
    for (const line of lines) {
      if (!line.product) continue
      const available = stock.get(line.product.id)
      if (available === undefined) continue
      const total = totals.get(line.product.id) ?? 0n
      if (total > toMilli(available)) add(line.key, 'stock', `En sistema hay ${fmt(available)} ${line.product.unit.code}: el faltante no puede ser mayor (suma ${fmtMilli(total)})`)
    }
  }
  return { lines: byLine, totals }
}

/** Traduce un error del backend a errores de campo y al paso donde se corrigen. */
const fromServerError = (error, lines) => {
  const details = Array.isArray(error?.details) ? error.details : []
  const header = {}
  const byLine = {}
  if (error?.code === 'INSUFFICIENT_STOCK') {
    for (const d of details) {
      for (const line of lines.filter((l) => l.product?.id === d.productId)) {
        byLine[line.key] = { stock: `En sistema hay ${fmt(d.available)} ${line.product.unit.code}, el faltante es ${fmt(d.requested)}` }
      }
    }
    return { step: 2, header, lines: byLine }
  }
  const HEADER_FIELDS = { movementDate: 'date' }
  for (const d of details) {
    const match = /^lines\.(\d+)\.(\w+)$/.exec(d.path ?? '')
    if (match) {
      const line = lines[Number(match[1])]
      if (line) byLine[line.key] = { [match[2] === 'productId' ? 'product' : 'quantity']: d.message }
    } else if (d.path) {
      header[HEADER_FIELDS[d.path] ?? d.path] = d.message
    }
  }
  if (error?.code === 'MOVEMENT_DATE_INVALID' && !header.date) header.date = error.message
  if (Object.keys(byLine).length || error?.code === 'EMPTY_MOVEMENT') return { step: 2, header, lines: byLine }
  return { step: Object.keys(header).length || error?.code === 'INACTIVE_RESOURCE' ? 1 : 3, header, lines: byLine }
}

// --- Paso 3 y resultado -------------------------------------------------------------

function ReviewStep({ footer, header, lines, warehouse, totals, stock }) {
  const surplus = header.kind === 'SOBRANTE'
  const products = new Map(lines.filter((l) => l.product).map((l) => [l.product.id, l.product]))
  return (
    <div className='space-y-4'>
      <Card>
        <dl className='grid gap-x-6 gap-y-3 text-sm sm:grid-cols-3'>
          <div>
            <dt className='text-xs text-ink-500'>Almacén</dt>
            <dd className='font-medium'>
              {warehouse?.code} · {warehouse?.name}
            </dd>
          </div>
          <div>
            <dt className='text-xs text-ink-500'>Tipo de ajuste</dt>
            <dd className='font-medium'>{KIND_LABELS[header.kind]}</dd>
          </div>
          <div>
            <dt className='text-xs text-ink-500'>Acta de conteo</dt>
            <dd className='font-mono font-medium'>{fullReference(header.reference)}</dd>
          </div>
          <div>
            <dt className='text-xs text-ink-500'>Fecha</dt>
            <dd className='font-medium'>{new Date(`${header.date}T12:00:00`).toLocaleDateString('es', { dateStyle: 'long' })}</dd>
          </div>
          <div className='sm:col-span-2'>
            <dt className='text-xs text-ink-500'>Observación</dt>
            <dd>{header.note}</dd>
          </div>
        </dl>
      </Card>

      <Card className='p-0 sm:p-0'>
        <h2 className='border-b border-line/60 px-4 py-3 text-sm font-semibold sm:px-6'>{surplus ? 'Lo que se suma' : 'Lo que se resta'}</h2>
        <ul className='divide-y divide-line/60'>
          {[...totals.entries()].map(([id, milli]) => {
            const product = products.get(id)
            return (
              <li key={id} className='flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6'>
                <span className='min-w-0'>
                  <span className='block truncate font-medium'>{product.name}</span>
                  <span className='font-mono text-xs text-ink-500'>{product.code}</span>
                </span>
                <span className='flex flex-col items-start sm:items-end'>
                  <span className='text-lg font-semibold tabular-nums'>
                    {surplus ? '+' : '−'}
                    {fmtMilli(milli)} <span className='text-sm font-normal text-ink-500'>{product.unit.code}</span>
                  </span>
                  <StockChange current={stock.get(id)} delta={surplus ? milli : -milli} unit={product.unit.code} />
                </span>
              </li>
            )
          })}
        </ul>
        <div className='px-4 pb-4 sm:px-6'>{footer}</div>
      </Card>
    </div>
  )
}

function DoneStep({ result, onNew }) {
  const { movement, meta } = result
  const below = meta?.warnings?.belowMinimum ?? []
  const above = meta?.warnings?.aboveMaximum ?? []
  return (
    <Card className='mx-auto max-w-xl text-center'>
      <motion.span
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 22 }}
        className='mx-auto grid size-14 place-items-center rounded-full bg-forest-100 text-forest-800'
      >
        <CheckCircle2 className='size-7' aria-hidden />
      </motion.span>
      <p className='mt-4 text-sm text-ink-500'>{meta?.duplicated ? 'Este ajuste ya estaba registrado' : 'Ajuste registrado'}</p>
      <p className='mt-1 font-mono text-3xl font-semibold tracking-wide'>{movement.documentNumber}</p>
      <p className='mt-1 font-mono text-sm text-ink-500'>Acta {movement.reference}</p>
      <p className='mt-2 text-sm text-ink-500'>
        {movement.toWarehouse ? 'Sobrante' : 'Faltante'} · {movement.lines.length} {movement.lines.length === 1 ? 'producto' : 'productos'} ·{' '}
        {(movement.toWarehouse ?? movement.fromWarehouse)?.name}
      </p>
      {(below.length > 0 || above.length > 0) && (
        <div className='mt-4 text-left'>
          <Banner tone='warning'>
            {below.map((b) => (
              <p key={`b${b.productId}`}>
                {b.productName} quedó bajo su mínimo: {fmt(b.total)} de {fmt(b.minStock)} {b.unitCode}.
              </p>
            ))}
            {above.map((a) => (
              <p key={`a${a.productId}`}>
                {a.productName} quedó sobre su máximo: {fmt(a.total)} de {fmt(a.maxStock)} {a.unitCode}.
              </p>
            ))}
          </Banner>
        </div>
      )}
      <div className='mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center'>
        <Link
          to={`/movements/${movement.id}`}
          className='inline-flex h-10 items-center justify-center gap-2 rounded-md bg-forest-700 px-4 text-sm font-semibold text-white hover:bg-forest-800'
        >
          <FileText className='size-4' aria-hidden />
          Ver detalle
        </Link>
        <button
          type='button'
          onClick={onNew}
          className='inline-flex h-10 items-center justify-center gap-2 rounded-md border border-line bg-white px-4 text-sm font-medium hover:border-ink-500/40'
        >
          <Plus className='size-4' aria-hidden />
          Nuevo ajuste
        </button>
      </div>
    </Card>
  )
}

// --- Página ---------------------------------------------------------------------------

const toStockMap = (data) => new Map((data?.items ?? []).map((i) => [i.productId, i.available]))

export function AdjustmentPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [header, setHeader] = useState(EMPTY_HEADER)
  const [lines, setLines] = useState(() => [emptyLine()])
  const [headerErrors, setHeaderErrors] = useState({})
  const [lineErrors, setLineErrors] = useState({})
  const [serverError, setServerError] = useState(null)
  const [result, setResult] = useState(null)
  // Una clave por borrador: el doble clic o un reintento con mala señal no duplican el ajuste (P6).
  const [idempotencyKey, setIdempotencyKey] = useState(newKey)

  const { data: warehousesData } = useWarehouses({ isActive: true, limit: 100, sort: 'code' })
  const warehouses = warehousesData?.data ?? []
  const warehouse = warehouses.find((w) => w.id === header.warehouseId)
  const productIds = lines.filter((l) => l.product).map((l) => l.product.id)
  const { data: stockData, isError: stockError } = useAvailability(header.warehouseId, productIds)
  const stock = useMemo(() => toStockMap(stockData), [stockData])
  const create = useCreateAdjustment()

  const live = useMemo(() => validateLines(lines, header, stock), [lines, header, stock])
  // Una vez señalados (por el servidor), los errores desaparecen en cuanto se corrigen.
  useEffect(() => {
    setLineErrors((prev) => {
      const keys = Object.keys(prev)
      if (!keys.length) return prev
      return Object.fromEntries(keys.filter((k) => live.lines[k]).map((k) => [k, live.lines[k]]))
    })
  }, [live])
  const liveHeader = useMemo(() => validateHeader(header), [header])
  useEffect(() => {
    setHeaderErrors((prev) => (Object.keys(prev).length ? Object.fromEntries(Object.keys(prev).filter((k) => liveHeader[k]).map((k) => [k, liveHeader[k]])) : prev))
  }, [liveHeader])
  // Errores en vivo: los de las líneas ya llenas y los de la cabecera, salvo lo que falta llenar.
  const shownLineErrors = useMemo(() => visibleLineErrors(lines, lineErrors, live.lines), [lines, lineErrors, live])
  const hiddenWhileEmpty = ['warehouseId', 'note', ...(header.reference ? [] : ['reference'])]
  const shownHeaderErrors = visibleHeaderErrors(headerErrors, liveHeader, hiddenWhileEmpty)

  // Los botones se habilitan solo si el paso está completo; el motivo se muestra al lado.
  const headerBlocked = firstIssue(liveHeader)
  // La existencia registrada se espera antes de avanzar (si la consulta falla, el backend valida igual).
  const stockPending = Boolean(header.warehouseId) && !stockError && productIds.some((id) => !stock.has(id))
  const linesBlocked = stockPending ? 'Consultando la existencia del almacén…' : firstLineIssue(lines, live.lines, ['product', 'quantity', 'stock'])

  const reset = () => {
    setStep(1)
    setHeader({ ...EMPTY_HEADER, warehouseId: header.warehouseId, reference: header.reference, date: isoDay(new Date()) })
    setLines([emptyLine()])
    setHeaderErrors({})
    setLineErrors({})
    setServerError(null)
    setResult(null)
    setIdempotencyKey(newKey())
  }

  const confirm = () => {
    setServerError(null)
    const body = {
      warehouseId: header.warehouseId,
      kind: header.kind,
      movementDate: header.date === isoDay(new Date()) ? undefined : new Date(`${header.date}T12:00:00`).toISOString(),
      reference: fullReference(header.reference),
      note: header.note.trim(),
      lines: lines.map((l) => ({ productId: l.product.id, quantity: normalizeQuantity(l.quantity), note: l.note.trim() || null })),
    }
    create.mutate(
      { body, idempotencyKey },
      {
        onSuccess: (envelope) => {
          setResult({ movement: envelope.data, meta: envelope.meta })
          setStep('done')
        },
        onError: (error) => {
          const mapped = fromServerError(error, lines)
          setHeaderErrors(mapped.header)
          setLineErrors(mapped.lines)
          setServerError(error)
          setStep(mapped.step)
        },
      }
    )
  }

  const backButton =
    'inline-flex h-11 items-center justify-center gap-2 rounded-md border border-line bg-white px-5 text-sm font-semibold text-ink-900 transition-colors hover:border-ink-500/40'
  // Botones del paso: cada paso los muestra al final de su última tarjeta.
  const footer = (
    <FormFooter>
      <button type='button' onClick={() => (step === 1 ? navigate('/movements') : setStep(step - 1))} className={backButton}>
        {step === 1 ? 'Cancelar' : step === 3 ? 'Volver a editar' : 'Atrás'}
      </button>
      {step === 1 && (
        <NextButton onClick={() => !headerBlocked && setStep(2)} blockedReason={headerBlocked}>
          Continuar con los productos
        </NextButton>
      )}
      {step === 2 && (
        <NextButton onClick={() => !linesBlocked && setStep(3)} blockedReason={linesBlocked}>
          Revisar el ajuste
        </NextButton>
      )}
      {step === 3 && (
        <NextButton onClick={confirm} blockedReason={headerBlocked ?? linesBlocked} pending={create.isPending} pendingLabel='Registrando…' tone='confirm'>
          Confirmar ajuste
        </NextButton>
      )}
    </FormFooter>
  )

  return (
    <MotionConfig reducedMotion='user'>
      <div className='mx-auto max-w-4xl font-plex text-ink-900'>
        <Link to='/movements' className='inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900'>
          <ArrowLeft className='size-4' aria-hidden />
          Movimientos
        </Link>
        <header className='mt-3 flex flex-wrap items-end justify-between gap-4'>
          <div>
            <h1 className='text-[1.75rem] font-semibold tracking-tight'>Nuevo ajuste</h1>
            <p className='mt-0.5 text-sm text-ink-500'>Corrige la existencia con el resultado de un conteo físico</p>
          </div>
          {step !== 'done' && <Steps step={step} items={['Datos del conteo', 'Productos', 'Revisar']} />}
        </header>

        {serverError && step !== 'done' && (
          <div className='mt-5'>
            <Banner>{serverError.message ?? 'No se pudo registrar el ajuste'}</Banner>
          </div>
        )}

        <AnimatePresence mode='wait'>
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: EASE_OUT }}
            className='mt-5'
          >
            {step === 1 && <HeaderStep footer={footer} header={header} setHeader={setHeader} errors={shownHeaderErrors} warehouses={warehouses} />}
            {step === 2 && (
              <LinesStep footer={footer} header={header} warehouse={warehouse} lines={lines} setLines={setLines} errors={shownLineErrors} stock={stock} totals={live.totals} />
            )}
            {step === 3 && <ReviewStep footer={footer} header={header} lines={lines} warehouse={warehouse} totals={live.totals} stock={stock} />}
            {step === 'done' && result && <DoneStep result={result} onNew={reset} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </MotionConfig>
  )
}
