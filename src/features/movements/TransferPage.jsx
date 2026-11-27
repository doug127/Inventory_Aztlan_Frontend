import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, CheckCircle2, FileText, Plus, Trash2 } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { HIERARCHY } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { EASE_OUT } from '@/features/auth/components/AuthUI'
import { useWarehouses } from '@/features/warehouses/warehousesApi'
import { useAvailability } from '@/features/stock/stockApi'
import { useCreateTransfer } from './movementsApi'
import {
  Banner,
  Card,
  Field,
  NextButton,
  ProductPicker,
  Steps,
  WarehouseChoice,
  daysAgo,
  fmt,
  firstIssue,
  firstLineIssue,
  visibleHeaderErrors,
  visibleLineErrors,
  fmtMilli,
  inputClass,
  isoDay,
  newKey,
  normalizeQuantity,
  toMilli,
  typedQuantity,
} from './movementForm'

// Traslado entre almacenes (HU-403, user_flow.md §7): 1. Datos · 2. Productos · 3. Revisar → Confirmar.
// Resta en el origen y suma en el destino en un solo paso (sin "en tránsito", business_rules.md §2.4).
// Las validaciones de aquí son una ayuda; el backend las repite con el stock bloqueado.

const BACKDATE_DAYS = 3

let lineSeq = 0
const emptyLine = () => ({ key: ++lineSeq, product: null, quantity: '', note: '', showNote: false })
const EMPTY_HEADER = { fromId: '', toId: '', date: isoDay(new Date()), receivedBy: '', note: '' }

// --- Paso 1 -------------------------------------------------------------------------

function HeaderStep({ header, setHeader, errors, warehouses, canBackdate }) {
  const set = (field) => (e) => setHeader((h) => ({ ...h, [field]: e.target.value }))
  const backdated = header.date < daysAgo(BACKDATE_DAYS)
  const destinations = warehouses.filter((w) => w.id !== header.fromId)
  return (
    <Card className='space-y-6'>
      <Field label='Almacén de origen' required error={errors.fromId} hint='De donde sale la mercancía'>
        <WarehouseChoice
          warehouses={warehouses}
          value={header.fromId}
          label='Almacén de origen'
          // Si el destino era el nuevo origen, se limpia: no pueden ser el mismo.
          onChange={(id) => setHeader((h) => ({ ...h, fromId: id, toId: h.toId === id ? '' : h.toId }))}
        />
      </Field>

      <Field label='Almacén de destino' required error={errors.toId} hint={header.fromId ? 'Adonde llega; no puede ser el mismo' : 'Elige primero el origen'}>
        {header.fromId ? (
          <WarehouseChoice warehouses={destinations} value={header.toId} label='Almacén de destino' onChange={(id) => setHeader((h) => ({ ...h, toId: id }))} />
        ) : (
          <div className='rounded-lg border border-dashed border-line px-3 py-4 text-center text-sm text-ink-500'>Sin origen elegido</div>
        )}
      </Field>

      <div className='grid gap-5 sm:grid-cols-2'>
        <Field
          label='Fecha'
          htmlFor='movement-date'
          required
          error={errors.date}
          hint={canBackdate ? 'Con más de 3 días de atraso, explica en la observación por qué' : 'Hasta 3 días de atraso'}
        >
          <input
            id='movement-date'
            type='date'
            value={header.date}
            max={isoDay(new Date())}
            min={canBackdate ? undefined : daysAgo(BACKDATE_DAYS)}
            onChange={set('date')}
            aria-invalid={Boolean(errors.date)}
            className={inputClass}
          />
        </Field>
        <Field label='Trasladado por' htmlFor='received-by' hint='Quien lleva la mercancía: chofer, ayudante…'>
          <input id='received-by' value={header.receivedBy} onChange={set('receivedBy')} maxLength={150} className={inputClass} />
        </Field>
        <Field label='Observación' htmlFor='note' required={canBackdate && backdated} error={errors.note}>
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
    </Card>
  )
}

// --- Paso 2 -------------------------------------------------------------------------

/** "300 → 180 L": existencia actual y cómo queda en un almacén. */
function StockChange({ code, current, delta, unit }) {
  if (current === undefined) return null
  const after = toMilli(current) + delta
  return (
    <p className='text-xs text-ink-500 tabular-nums'>
      <span className='font-mono'>{code}</span> {fmt(current)} → <span className={cn('font-medium', after < 0n ? 'text-red-600' : 'text-ink-900')}>{fmtMilli(after)}</span> {unit}
    </p>
  )
}

function LinesStep({ lines, setLines, errors, from, to, fromStock, toStock, totals }) {
  const update = (key, patch) => setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)))
  const remove = (key) => setLines((ls) => (ls.length > 1 ? ls.filter((l) => l.key !== key) : [emptyLine()]))

  return (
    <div className='space-y-4'>
      <Card className='flex items-center gap-3 p-4 text-sm sm:p-4'>
        <span className='rounded bg-white px-1.5 py-0.5 font-mono text-xs font-semibold ring-1 ring-line'>{from?.code}</span>
        <ArrowRight className='size-4 text-ink-500' aria-hidden />
        <span className='rounded bg-white px-1.5 py-0.5 font-mono text-xs font-semibold ring-1 ring-line'>{to?.code}</span>
        <span className='truncate text-ink-500'>
          {from?.name} hacia {to?.name}
        </span>
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
                    <ProductPicker
                      value={line.product}
                      onChange={(product) => update(line.key, { product })}
                      invalid={Boolean(e.product)}
                      withStockIn={from?.id}
                      emptyText={`Ningún producto con existencia en ${from?.code ?? 'el origen'} coincide`}
                    />
                    {e.product && <p className='mt-1 text-xs text-red-600'>{e.product}</p>}
                    {e.merge && <p className='mt-1 text-xs text-amber-700'>{e.merge}</p>}
                  </div>
                  <div>
                    <div className='relative'>
                      <input
                        inputMode='decimal'
                        value={line.quantity}
                        onChange={(ev) => update(line.key, { quantity: typedQuantity(line.quantity, ev.target.value.trim()) })}
                        placeholder='Cantidad'
                        aria-label={`Cantidad de la línea ${index + 1}`}
                        aria-invalid={Boolean(e.quantity || e.stock)}
                        className={cn(inputClass, 'pr-14 text-right tabular-nums')}
                      />
                      {unit && <span className='pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-ink-500'>{unit}</span>}
                    </div>
                    {e.quantity || e.stock ? (
                      <p className='mt-1 text-xs text-red-600'>{e.quantity ?? e.stock}</p>
                    ) : (
                      line.product && (
                        <div className='mt-1 space-y-0.5 text-right'>
                          <StockChange code={from?.code} current={fromStock.get(line.product.id)} delta={-total} unit={unit} />
                          <StockChange code={to?.code} current={toStock.get(line.product.id)} delta={total} unit={unit} />
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

      <button
        type='button'
        onClick={() => setLines((ls) => [...ls, emptyLine()])}
        className='inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-line bg-white text-sm font-medium text-ink-900 hover:border-forest-700 hover:text-forest-800'
      >
        <Plus className='size-4' aria-hidden />
        Agregar producto
      </button>
    </div>
  )
}

// --- Validación en el cliente (el backend repite todo) ------------------------------

const validateHeader = (header, canBackdate) => {
  const errors = {}
  if (!header.fromId) errors.fromId = 'Elige el almacén de origen'
  if (!header.toId) errors.toId = 'Elige el almacén de destino'
  else if (header.toId === header.fromId) errors.toId = 'El destino no puede ser el mismo almacén'
  const today = isoDay(new Date())
  if (!header.date) errors.date = 'Indica la fecha'
  else if (header.date > today) errors.date = 'La fecha no puede ser futura'
  else if (header.date < daysAgo(BACKDATE_DAYS)) {
    if (!canBackdate) errors.date = `Hasta ${BACKDATE_DAYS} días de atraso`
    else if (!header.note.trim()) errors.note = `Con más de ${BACKDATE_DAYS} días de atraso, explica por qué se registra tarde`
  }
  return errors
}

/** Errores por línea y la suma por producto frente a la existencia del origen. */
const validateLines = (lines, fromStock) => {
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
  for (const line of lines) {
    if (!line.product) continue
    const available = fromStock.get(line.product.id)
    if (available === undefined) continue
    const total = totals.get(line.product.id) ?? 0n
    if (total > toMilli(available)) add(line.key, 'stock', `Disponible en origen: ${fmt(available)} ${line.product.unit.code} (el traslado suma ${fmtMilli(total)})`)
  }
  const blocking = Object.values(byLine).some((e) => e.product || e.quantity || e.stock)
  return { lines: byLine, blocking, totals }
}

/** Traduce un error del backend a errores de campo y al paso donde se corrigen. */
const fromServerError = (error, lines) => {
  const details = Array.isArray(error?.details) ? error.details : []
  const header = {}
  const byLine = {}
  if (error?.code === 'INSUFFICIENT_STOCK') {
    for (const d of details) {
      for (const line of lines.filter((l) => l.product?.id === d.productId)) {
        byLine[line.key] = { stock: `Disponible en ${d.warehouseCode}: ${fmt(d.available)} ${line.product.unit.code}, el traslado pide ${fmt(d.requested)}` }
      }
    }
    return { step: 2, header, lines: byLine }
  }
  const HEADER_FIELDS = { movementDate: 'date', warehouseFromId: 'fromId', warehouseToId: 'toId' }
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

function ReviewStep({ header, lines, from, to, totals, fromStock, toStock }) {
  const products = new Map(lines.filter((l) => l.product).map((l) => [l.product.id, l.product]))
  return (
    <div className='space-y-4'>
      <Card>
        <dl className='grid gap-x-6 gap-y-3 text-sm sm:grid-cols-3'>
          <div>
            <dt className='text-xs text-ink-500'>Origen</dt>
            <dd className='font-medium'>
              {from?.code} · {from?.name}
            </dd>
          </div>
          <div>
            <dt className='text-xs text-ink-500'>Destino</dt>
            <dd className='font-medium'>
              {to?.code} · {to?.name}
            </dd>
          </div>
          <div>
            <dt className='text-xs text-ink-500'>Fecha</dt>
            <dd className='font-medium'>{new Date(`${header.date}T12:00:00`).toLocaleDateString('es', { dateStyle: 'long' })}</dd>
          </div>
          {header.receivedBy && (
            <div>
              <dt className='text-xs text-ink-500'>Trasladado por</dt>
              <dd className='font-medium'>{header.receivedBy}</dd>
            </div>
          )}
          {header.note && (
            <div className='sm:col-span-3'>
              <dt className='text-xs text-ink-500'>Observación</dt>
              <dd>{header.note}</dd>
            </div>
          )}
        </dl>
      </Card>

      <Card className='p-0 sm:p-0'>
        <h2 className='border-b border-line/60 px-4 py-3 text-sm font-semibold sm:px-6'>Lo que se traslada</h2>
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
                    {fmtMilli(milli)} <span className='text-sm font-normal text-ink-500'>{product.unit.code}</span>
                  </span>
                  <StockChange code={from?.code} current={fromStock.get(id)} delta={-milli} unit={product.unit.code} />
                  <StockChange code={to?.code} current={toStock.get(id)} delta={milli} unit={product.unit.code} />
                </span>
              </li>
            )
          })}
        </ul>
      </Card>
    </div>
  )
}

function DoneStep({ result, onNew }) {
  const { movement, meta } = result
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
      <p className='mt-4 text-sm text-ink-500'>{meta?.duplicated ? 'Este traslado ya estaba registrado' : 'Traslado registrado'}</p>
      <p className='mt-1 font-mono text-3xl font-semibold tracking-wide'>{movement.documentNumber}</p>
      <p className='mt-2 text-sm text-ink-500'>
        {movement.lines.length} {movement.lines.length === 1 ? 'producto' : 'productos'} · {movement.fromWarehouse?.code} → {movement.toWarehouse?.code}
      </p>
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
          Nuevo traslado
        </button>
      </div>
    </Card>
  )
}

// --- Página ---------------------------------------------------------------------------

const toStockMap = (data) => new Map((data?.items ?? []).map((i) => [i.productId, i.available]))

export function TransferPage() {
  const navigate = useNavigate()
  const canBackdate = useAuthStore((s) => s.hasHierarchy(HIERARCHY.ADMIN))
  const [step, setStep] = useState(1)
  const [header, setHeader] = useState(EMPTY_HEADER)
  const [lines, setLines] = useState(() => [emptyLine()])
  const [headerErrors, setHeaderErrors] = useState({})
  const [lineErrors, setLineErrors] = useState({})
  const [serverError, setServerError] = useState(null)
  const [result, setResult] = useState(null)
  // Una clave por borrador: el doble clic o un reintento con mala señal no duplican el traslado (P6).
  const [idempotencyKey, setIdempotencyKey] = useState(newKey)

  const { data: warehousesData } = useWarehouses({ isActive: true, limit: 100, sort: 'code' })
  const warehouses = warehousesData?.data ?? []
  const from = warehouses.find((w) => w.id === header.fromId)
  const to = warehouses.find((w) => w.id === header.toId)
  const productIds = lines.filter((l) => l.product).map((l) => l.product.id)
  const { data: fromData, isError: fromError } = useAvailability(header.fromId, productIds)
  const { data: toData } = useAvailability(header.toId, productIds)
  const fromStock = useMemo(() => toStockMap(fromData), [fromData])
  const toStock = useMemo(() => toStockMap(toData), [toData])
  const create = useCreateTransfer()

  const live = useMemo(() => validateLines(lines, fromStock), [lines, fromStock])
  // Una vez señalados, los errores se recalculan al editar: desaparecen en cuanto se corrigen.
  useEffect(() => {
    setLineErrors((prev) => {
      const keys = Object.keys(prev)
      if (!keys.length) return prev
      return Object.fromEntries(keys.filter((k) => live.lines[k]).map((k) => [k, live.lines[k]]))
    })
  }, [live])
  useEffect(() => {
    setHeaderErrors((prev) => {
      if (!Object.keys(prev).length) return prev
      const current = validateHeader(header, canBackdate)
      return Object.fromEntries(Object.keys(prev).filter((k) => current[k]).map((k) => [k, current[k]]))
    })
  }, [header, canBackdate])
  const liveHeader = useMemo(() => validateHeader(header, canBackdate), [header, canBackdate])
  // Errores en vivo: los de las líneas ya empezadas y los de la cabecera, salvo "elige el almacén".
  const shownLineErrors = useMemo(() => visibleLineErrors(lines, lineErrors, live.lines), [lines, lineErrors, live])
  const shownHeaderErrors = useMemo(() => visibleHeaderErrors(headerErrors, liveHeader, ['fromId', 'toId', 'note']), [headerErrors, liveHeader])

  // Los botones se habilitan solo si el paso está completo; el motivo se muestra al lado.
  const headerBlocked = firstIssue(liveHeader)
  // La existencia del origen se espera antes de avanzar (si la consulta falla, el backend valida igual).
  const stockPending = Boolean(header.fromId) && !fromError && productIds.some((id) => !fromStock.has(id))
  const linesBlocked = stockPending ? 'Consultando la existencia en el origen…' : firstLineIssue(lines, live.lines, ['product', 'quantity', 'stock'])

  const goToLines = () => {
    if (!headerBlocked) setStep(2)
  }
  const goToReview = () => {
    if (!linesBlocked) setStep(3)
  }
  const reset = () => {
    setStep(1)
    setHeader({ ...EMPTY_HEADER, fromId: header.fromId, toId: header.toId, date: isoDay(new Date()) })
    setLines([emptyLine()])
    setHeaderErrors({})
    setLineErrors({})
    setServerError(null)
    setResult(null)
    setIdempotencyKey(newKey())
  }

  const confirm = () => {
    setServerError(null)
    const today = isoDay(new Date())
    const body = {
      warehouseFromId: header.fromId,
      warehouseToId: header.toId,
      movementDate: header.date === today ? undefined : new Date(`${header.date}T12:00:00`).toISOString(),
      receivedBy: header.receivedBy.trim() || null,
      note: header.note.trim() || null,
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

  const footerButton = 'inline-flex h-11 items-center justify-center gap-2 rounded-md px-5 text-sm font-semibold transition-colors disabled:opacity-60'

  return (
    <MotionConfig reducedMotion='user'>
      <div className='mx-auto max-w-4xl font-plex text-ink-900'>
        <Link to='/movements' className='inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900'>
          <ArrowLeft className='size-4' aria-hidden />
          Movimientos
        </Link>
        <header className='mt-3 flex flex-wrap items-end justify-between gap-4'>
          <div>
            <h1 className='text-[1.75rem] font-semibold tracking-tight'>Nuevo traslado</h1>
            <p className='mt-0.5 text-sm text-ink-500'>Mercancía que pasa de un almacén a otro en un solo paso</p>
          </div>
          {step !== 'done' && <Steps step={step} items={['Almacenes', 'Productos', 'Revisar']} />}
        </header>

        {serverError && step !== 'done' && (
          <div className='mt-5'>
            <Banner>{serverError.message ?? 'No se pudo registrar el traslado'}</Banner>
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
            {step === 1 && <HeaderStep header={header} setHeader={setHeader} errors={shownHeaderErrors}warehouses={warehouses} canBackdate={canBackdate} />}
            {step === 2 && (
              <LinesStep lines={lines} setLines={setLines} errors={shownLineErrors} from={from} to={to} fromStock={fromStock} toStock={toStock} totals={live.totals} />
            )}
            {step === 3 && <ReviewStep header={header} lines={lines} from={from} to={to} totals={live.totals} fromStock={fromStock} toStock={toStock} />}
            {step === 'done' && result && <DoneStep result={result} onNew={reset} />}
          </motion.div>
        </AnimatePresence>

        {step !== 'done' && (
          <div className='sticky bottom-0 -mx-6 mt-6 flex flex-col-reverse gap-2 border-t border-line/70 bg-white/90 px-6 py-3 backdrop-blur sm:flex-row sm:justify-between'>
            <button
              type='button'
              onClick={() => (step === 1 ? navigate('/movements') : setStep(step - 1))}
              className={cn(footerButton, 'border border-line bg-white text-ink-900 hover:border-ink-500/40')}
            >
              {step === 1 ? 'Cancelar' : step === 3 ? 'Volver a editar' : 'Atrás'}
            </button>
            {step === 1 && (
              <NextButton onClick={goToLines} blockedReason={headerBlocked}>
                Continuar con los productos
              </NextButton>
            )}
            {step === 2 && (
              <NextButton onClick={goToReview} blockedReason={linesBlocked}>
                Revisar el traslado
              </NextButton>
            )}
            {step === 3 && (
              <NextButton onClick={confirm} blockedReason={headerBlocked ?? linesBlocked} pending={create.isPending} pendingLabel='Registrando…' tone='confirm'>
                Confirmar traslado
              </NextButton>
            )}
          </div>
        )}
      </div>
    </MotionConfig>
  )
}
