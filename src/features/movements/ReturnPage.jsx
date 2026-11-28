import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
import { ArrowLeft, Check, CheckCircle2, FileText, Plus, Search, Undo2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDateTime } from '@/lib/format'
import { useAuthStore } from '@/stores/authStore'
import { HIERARCHY } from '@/lib/constants'
import { Pager } from '@/components/common/Pager'
import { TABLE_PAGE_SIZE } from '@/lib/pagination'
import { EASE_OUT } from '@/features/auth/components/AuthUI'
import { useWarehouses } from '@/features/warehouses/warehousesApi'
import { useCreateEntry, usePendingLoans } from './movementsApi'
import {
  Banner,
  Card,
  Field,
  FormFooter,
  NextButton,
  Steps,
  WarehouseChoice,
  daysAgo,
  firstIssue,
  fmt,
  fmtMilli,
  inputClass,
  isoDay,
  newKey,
  normalizeQuantity,
  toMilli,
  typedQuantity,
  useDebounced,
  visibleHeaderErrors,
} from './movementForm'

// Devolución de préstamos (HU-405, user_flow.md §6 "Devolución de un préstamo"). Es una entrada con
// motivo DEVOLUCION: 1. Qué se devuelve (de los préstamos pendientes) · 2. Datos · 3. Revisar.
// Desde un préstamo (?loan=ID) o desde un activo (?asset=ID) llegan sus pendientes ya marcados; el
// usuario solo ajusta las cantidades. Lo devuelto por activo y producto no supera lo pendiente: aquí
// se ayuda y el backend lo valida con los préstamos del activo bloqueados.

const BACKDATE_DAYS = 3
const pairKey = (loan) => `${loan.asset.id}|${loan.product.id}`
const EMPTY_HEADER = { warehouseId: '', date: isoDay(new Date()), receivedBy: '', reference: '', note: '' }

/** Error de cantidad de un pendiente marcado, o null. */
const quantityIssue = ({ loan, quantity }) => {
  const milli = toMilli(quantity)
  if (milli === null) return quantity ? 'Hasta 3 decimales' : 'Indica cuánto devuelve'
  if (milli <= 0n) return 'Debe ser mayor que 0'
  if (milli > toMilli(loan.pending)) return `Pendiente: ${fmt(loan.pending)} ${loan.product.unitCode}`
  return null
}

// --- Paso 1: qué se devuelve -----------------------------------------------------------

function LoansStep({ footer, selected, setSelected, filters, setFilters, serverErrors }) {
  const [search, setSearch] = useState(filters.search ?? '')
  const debounced = useDebounced(search)
  const [page, setPage] = useState(1)
  useEffect(() => {
    setFilters((f) => (f.search === (debounced || undefined) ? f : { ...f, search: debounced || undefined }))
    setPage(1)
  }, [debounced, setFilters])
  const { data, isLoading, isPlaceholderData } = usePendingLoans({ ...filters, page, limit: TABLE_PAGE_SIZE })
  const loans = data?.data ?? []

  const toggle = (loan) =>
    setSelected((prev) => {
      const next = new Map(prev)
      if (next.has(pairKey(loan))) next.delete(pairKey(loan))
      else next.set(pairKey(loan), { loan, quantity: String(Number(loan.pending)) })
      return next
    })
  const setQuantity = (loan, quantity) =>
    setSelected((prev) => new Map(prev).set(pairKey(loan), { ...prev.get(pairKey(loan)), quantity: typedQuantity(prev.get(pairKey(loan)).quantity, quantity) }))
  const scope = filters.movementId ? 'de este préstamo' : filters.assetId ? 'de este activo' : null

  return (
    <Card className='p-0 sm:p-0'>
      <div className='flex flex-col gap-3 border-b border-line/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5'>
        <div>
          <h2 className='text-sm font-semibold'>Préstamos pendientes {scope}</h2>
          <p className='text-xs text-ink-500'>Marca lo que regresa y ajusta la cantidad si es una devolución parcial.</p>
        </div>
        <div className='flex items-center gap-2'>
          {scope && (
            <button
              type='button'
              onClick={() => {
                setFilters({ search: filters.search })
                setPage(1)
              }}
              className='h-9 shrink-0 rounded-md px-2 text-xs text-ink-500 hover:bg-sand-50 hover:text-ink-900'
            >
              Ver todos
            </button>
          )}
          <div className='relative'>
            <Search className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-500' aria-hidden />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder='Activo, producto o persona'
              aria-label='Buscar préstamos pendientes'
              className='h-9 w-full rounded-md border border-line bg-white pl-9 pr-3 text-sm outline-none focus:border-forest-700 sm:w-64'
            />
          </div>
        </div>
      </div>

      <ul className={cn('divide-y divide-line/60 transition-opacity', isPlaceholderData && 'opacity-60')}>
        {isLoading && Array.from({ length: 3 }, (_, i) => <li key={i} className='mx-4 my-3 h-12 animate-pulse rounded-lg bg-sand-50' />)}
        {!isLoading && loans.length === 0 && (
          <li className='px-6 py-10 text-center text-sm text-ink-500'>{filters.search ? 'Ningún préstamo pendiente coincide.' : 'No hay préstamos pendientes de devolver.'}</li>
        )}
        {loans.map((loan) => {
          const key = pairKey(loan)
          const chosen = selected.get(key)
          const issue = chosen && (serverErrors[key] ?? (chosen.quantity && quantityIssue(chosen)))
          return (
            <li key={key} className={cn('flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:px-5', chosen && 'bg-forest-50/60')}>
              <label className='flex min-w-0 flex-1 cursor-pointer items-start gap-3'>
                <span
                  className={cn(
                    'mt-0.5 grid size-5 shrink-0 place-items-center rounded border transition-colors',
                    chosen ? 'border-forest-700 bg-forest-700 text-white' : 'border-line bg-white'
                  )}
                >
                  {chosen && <Check className='size-3.5' aria-hidden />}
                </span>
                <input type='checkbox' className='sr-only' checked={Boolean(chosen)} onChange={() => toggle(loan)} />
                <span className='min-w-0'>
                  <span className='block truncate text-sm font-medium'>
                    {loan.product.name} <span className='font-mono text-xs font-normal text-ink-500'>{loan.product.code}</span>
                  </span>
                  <span className='block truncate text-xs text-ink-500'>
                    <span className='font-mono'>{loan.asset.code}</span> · {loan.asset.name}
                    {loan.lastLoan.receivedBy && <> · {loan.lastLoan.receivedBy}</>}
                  </span>
                  <span className='block truncate text-xs text-ink-500'>
                    <span className='font-mono'>{loan.lastLoan.documentNumber}</span> · {formatDateTime(loan.lastLoan.movementDate)} · {loan.lastLoan.warehouse.code}
                  </span>
                </span>
              </label>
              <div className='flex items-center gap-3 sm:w-64 sm:justify-end'>
                <span className='shrink-0 text-right text-xs text-ink-500 tabular-nums'>
                  Pendiente
                  <span className='block text-sm font-semibold text-ink-900'>
                    {fmt(loan.pending)} {loan.product.unitCode}
                  </span>
                </span>
                {chosen && (
                  <div className='w-32'>
                    <div className='relative'>
                      <input
                        inputMode='decimal'
                        value={chosen.quantity}
                        onChange={(e) => setQuantity(loan, e.target.value.trim())}
                        aria-label={`Cantidad devuelta de ${loan.product.name} por ${loan.asset.code}`}
                        aria-invalid={Boolean(issue)}
                        className={cn(inputClass, 'h-10 pr-10 text-right tabular-nums')}
                      />
                      <span className='pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-500'>{loan.product.unitCode}</span>
                    </div>
                    {issue && <p className='mt-1 text-right text-xs text-red-600'>{issue}</p>}
                  </div>
                )}
              </div>
            </li>
          )
        })}
      </ul>
      <div className='border-t border-line/60 px-4 py-2 empty:hidden sm:px-5'>
        <Pager pagination={data?.meta?.pagination} onPage={setPage} label='Páginas de préstamos pendientes' />
      </div>
      <div className='px-4 pb-4 sm:px-5'>{footer}</div>
    </Card>
  )
}

// --- Paso 2: datos de la devolución ---------------------------------------------------

function HeaderStep({ footer, header, setHeader, errors, warehouses, canBackdate }) {
  const set = (field) => (e) => setHeader((h) => ({ ...h, [field]: e.target.value }))
  const backdated = header.date < daysAgo(BACKDATE_DAYS)
  return (
    <Card className='space-y-6'>
      <Field label='Almacén que recibe' required error={errors.warehouseId} hint='Por defecto, el almacén del que salió el préstamo'>
        <WarehouseChoice warehouses={warehouses} value={header.warehouseId} label='Almacén que recibe' onChange={(id) => setHeader((h) => ({ ...h, warehouseId: id }))} />
      </Field>
      <div className='grid gap-5 sm:grid-cols-2'>
        <Field label='Fecha' htmlFor='movement-date' required error={errors.date} hint={canBackdate ? 'Con más de 3 días de atraso, explica en la observación por qué' : 'Hasta 3 días de atraso'}>
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
        <Field label='Entregado por' htmlFor='received-by' hint='Quien trae de vuelta lo prestado'>
          <input id='received-by' value={header.receivedBy} onChange={set('receivedBy')} maxLength={150} className={inputClass} />
        </Field>
        <Field label='Préstamo de referencia' htmlFor='reference' error={errors.reference} hint='Documento del préstamo (ej. RET-000145)'>
          <input
            id='reference'
            value={header.reference}
            onChange={(e) => setHeader((h) => ({ ...h, reference: e.target.value.toUpperCase().replace(/\s+/g, '') }))}
            maxLength={45}
            placeholder='RET-000145'
            autoComplete='off'
            aria-invalid={Boolean(errors.reference)}
            className={cn(inputClass, 'font-mono')}
          />
        </Field>
        <Field label='Observación' htmlFor='note' required={canBackdate && backdated} error={errors.note} hint='Estado en que regresa, faltantes…'>
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
      {footer}
    </Card>
  )
}

// --- Validación en el cliente (el backend repite todo) ------------------------------

const REFERENCE_PATTERN = /^[A-Z]{2,4}-[A-Z0-9][A-Z0-9-]{0,40}$/

const validateHeader = (header, canBackdate) => {
  const errors = {}
  if (!header.warehouseId) errors.warehouseId = 'Elige el almacén que recibe'
  if (header.reference && !REFERENCE_PATTERN.test(header.reference)) errors.reference = 'Es PREFIJO-número (ej. RET-000145)'
  if (!header.date) errors.date = 'Indica la fecha'
  else if (header.date > isoDay(new Date())) errors.date = 'La fecha no puede ser futura'
  else if (header.date < daysAgo(BACKDATE_DAYS)) {
    if (!canBackdate) errors.date = `Hasta ${BACKDATE_DAYS} días de atraso`
    else if (!header.note.trim()) errors.note = `Con más de ${BACKDATE_DAYS} días de atraso, explica por qué se registra tarde`
  }
  return errors
}

const selectionIssue = (selected) => {
  if (!selected.size) return 'Marca al menos un préstamo pendiente'
  for (const item of selected.values()) {
    const issue = quantityIssue(item)
    if (issue) return `${item.loan.product.name} (${item.loan.asset.code}): ${issue}`
  }
  return null
}

// --- Paso 3 y resultado -------------------------------------------------------------

function ReviewStep({ footer, header, selected, warehouse }) {
  return (
    <div className='space-y-4'>
      <Card>
        <dl className='grid gap-x-6 gap-y-3 text-sm sm:grid-cols-3'>
          <div>
            <dt className='text-xs text-ink-500'>Almacén que recibe</dt>
            <dd className='font-medium'>
              {warehouse?.code} · {warehouse?.name}
            </dd>
          </div>
          <div>
            <dt className='text-xs text-ink-500'>Fecha</dt>
            <dd className='font-medium'>{new Date(`${header.date}T12:00:00`).toLocaleDateString('es', { dateStyle: 'long' })}</dd>
          </div>
          {header.reference && (
            <div>
              <dt className='text-xs text-ink-500'>Préstamo de referencia</dt>
              <dd className='font-mono font-medium'>{header.reference}</dd>
            </div>
          )}
          {header.receivedBy && (
            <div>
              <dt className='text-xs text-ink-500'>Entregado por</dt>
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
        <h2 className='border-b border-line/60 px-4 py-3 text-sm font-semibold sm:px-6'>Lo que se devuelve</h2>
        <ul className='divide-y divide-line/60'>
          {[...selected.values()].map(({ loan, quantity }) => {
            const left = toMilli(loan.pending) - toMilli(quantity)
            return (
              <li key={pairKey(loan)} className='flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6'>
                <span className='min-w-0'>
                  <span className='block truncate font-medium'>{loan.product.name}</span>
                  <span className='text-xs text-ink-500'>
                    <span className='font-mono'>{loan.asset.code}</span> · {loan.asset.name}
                  </span>
                </span>
                <span className='flex flex-col items-start sm:items-end'>
                  <span className='text-lg font-semibold tabular-nums'>
                    {fmtMilli(toMilli(quantity))} <span className='text-sm font-normal text-ink-500'>{loan.product.unitCode}</span>
                  </span>
                  <span className='text-xs text-ink-500'>{left > 0n ? `Quedará pendiente: ${fmtMilli(left)} ${loan.product.unitCode}` : 'Préstamo saldado'}</span>
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
      <p className='mt-4 text-sm text-ink-500'>{meta?.duplicated ? 'Esta devolución ya estaba registrada' : 'Devolución registrada'}</p>
      <p className='mt-1 font-mono text-3xl font-semibold tracking-wide'>{movement.documentNumber}</p>
      {movement.reference && <p className='mt-1 font-mono text-sm text-ink-500'>Préstamo {movement.reference}</p>}
      <p className='mt-2 text-sm text-ink-500'>
        {movement.lines.length} {movement.lines.length === 1 ? 'línea' : 'líneas'} · {movement.toWarehouse?.name}
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
          Otra devolución
        </button>
      </div>
    </Card>
  )
}

// --- Página ---------------------------------------------------------------------------

export function ReturnPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const loanId = Number(params.get('loan')) || undefined
  const assetId = Number(params.get('asset')) || undefined
  const canBackdate = useAuthStore((s) => s.hasHierarchy(HIERARCHY.ADMIN))

  const [step, setStep] = useState(1)
  const [filters, setFilters] = useState(() => ({ movementId: loanId, assetId: loanId ? undefined : assetId }))
  const [selected, setSelected] = useState(() => new Map())
  const [header, setHeader] = useState(EMPTY_HEADER)
  const [headerErrors, setHeaderErrors] = useState({})
  const [serverLineErrors, setServerLineErrors] = useState({})
  const [serverError, setServerError] = useState(null)
  const [result, setResult] = useState(null)
  // Una clave por borrador: el doble clic o un reintento con mala señal no duplican la devolución (P6).
  const [idempotencyKey, setIdempotencyKey] = useState(newKey)

  const { data: warehousesData } = useWarehouses({ isActive: true, limit: 100, sort: 'code' })
  const warehouses = warehousesData?.data ?? []
  const warehouse = warehouses.find((w) => w.id === header.warehouseId)
  const create = useCreateEntry()

  // Desde un préstamo o un activo, sus pendientes llegan marcados con la cantidad completa (una vez).
  const preset = usePendingLoans({ movementId: loanId, assetId: loanId ? undefined : assetId, page: 1, limit: 100 }, { enabled: Boolean(loanId || assetId) })
  const [presetApplied, setPresetApplied] = useState(false)
  useEffect(() => {
    const loans = preset.data?.data
    if (presetApplied || !loans) return
    setSelected(new Map(loans.map((loan) => [pairKey(loan), { loan, quantity: String(Number(loan.pending)) }])))
    setPresetApplied(true)
  }, [preset.data, presetApplied])

  // Al pasar a los datos se proponen almacén, quien entrega y la referencia del préstamo.
  const goToHeader = () => {
    const items = [...selected.values()]
    const docs = new Set(items.map((i) => i.loan.lastLoan.documentNumber))
    const first = items[0]?.loan.lastLoan
    setHeader((h) => ({
      ...h,
      warehouseId: h.warehouseId || first?.warehouse.id || '',
      receivedBy: h.receivedBy || first?.receivedBy || '',
      reference: h.reference || (docs.size === 1 ? [...docs][0] : ''),
    }))
    setStep(2)
  }

  const liveHeader = useMemo(() => validateHeader(header, canBackdate), [header, canBackdate])
  useEffect(() => {
    setHeaderErrors((prev) => (Object.keys(prev).length ? Object.fromEntries(Object.keys(prev).filter((k) => liveHeader[k]).map((k) => [k, liveHeader[k]])) : prev))
  }, [liveHeader])
  const shownHeaderErrors = visibleHeaderErrors(headerErrors, liveHeader, ['warehouseId', 'note'])
  // Un error del servidor en una cantidad desaparece al cambiarla.
  const selectionKey = [...selected.entries()].map(([k, v]) => `${k}:${v.quantity}`).join(',')
  useEffect(() => setServerLineErrors({}), [selectionKey])

  const loansBlocked = selectionIssue(selected)
  const headerBlocked = firstIssue(liveHeader)

  const reset = () => {
    setStep(1)
    setFilters({})
    setSelected(new Map())
    setHeader({ ...EMPTY_HEADER, date: isoDay(new Date()) })
    setHeaderErrors({})
    setServerLineErrors({})
    setServerError(null)
    setResult(null)
    setIdempotencyKey(newKey())
    navigate('/movements/new/return', { replace: true })
  }

  const confirm = () => {
    setServerError(null)
    const items = [...selected.values()]
    const body = {
      warehouseId: header.warehouseId,
      reason: 'DEVOLUCION',
      movementDate: header.date === isoDay(new Date()) ? undefined : new Date(`${header.date}T12:00:00`).toISOString(),
      reference: header.reference || null,
      receivedBy: header.receivedBy.trim() || null,
      note: header.note.trim() || null,
      lines: items.map(({ loan, quantity }) => ({ productId: loan.product.id, assetId: loan.asset.id, quantity: normalizeQuantity(quantity) })),
    }
    create.mutate(
      { body, idempotencyKey },
      {
        onSuccess: (envelope) => {
          setResult({ movement: envelope.data, meta: envelope.meta })
          setStep('done')
        },
        onError: (error) => {
          setServerError(error)
          const details = Array.isArray(error?.details) ? error.details : []
          if (error?.code === 'RETURN_EXCEEDS_LOAN') {
            // Otro usuario devolvió parte mientras tanto: se marca la línea y la lista se refresca sola.
            setServerLineErrors(
              Object.fromEntries(details.map((d) => [`${d.assetId}|${d.productId}`, `Pendiente ahora: ${fmt(d.pending)}`]))
            )
            setStep(1)
            return
          }
          const header = Object.fromEntries(details.filter((d) => d.path && !d.path.startsWith('lines.')).map((d) => [d.path === 'movementDate' ? 'date' : d.path, d.message]))
          setHeaderErrors(header)
          setStep(Object.keys(header).length || error?.code === 'INACTIVE_RESOURCE' || error?.code === 'MOVEMENT_DATE_INVALID' ? 2 : 3)
        },
      }
    )
  }

  const backButton =
    'inline-flex h-11 items-center justify-center gap-2 rounded-md border border-line bg-white px-5 text-sm font-semibold text-ink-900 transition-colors hover:border-ink-500/40'
  const footer = (
    <FormFooter>
      <button type='button' onClick={() => (step === 1 ? navigate('/movements') : setStep(step - 1))} className={backButton}>
        {step === 1 ? 'Cancelar' : step === 3 ? 'Volver a editar' : 'Atrás'}
      </button>
      {step === 1 && (
        <NextButton onClick={() => !loansBlocked && goToHeader()} blockedReason={loansBlocked}>
          Continuar con los datos
        </NextButton>
      )}
      {step === 2 && (
        <NextButton onClick={() => !headerBlocked && setStep(3)} blockedReason={headerBlocked}>
          Revisar la devolución
        </NextButton>
      )}
      {step === 3 && (
        <NextButton onClick={confirm} blockedReason={loansBlocked ?? headerBlocked} pending={create.isPending} pendingLabel='Registrando…' tone='confirm'>
          Confirmar devolución
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
            <h1 className='flex items-center gap-2 text-[1.75rem] font-semibold tracking-tight'>
              <Undo2 className='size-6 text-forest-700' aria-hidden />
              Devolución de préstamos
            </h1>
            <p className='mt-0.5 text-sm text-ink-500'>Lo prestado regresa al almacén y deja de estar pendiente</p>
          </div>
          {step !== 'done' && <Steps step={step} items={['Qué se devuelve', 'Datos', 'Revisar']} />}
        </header>

        {serverError && step !== 'done' && (
          <div className='mt-5'>
            <Banner>{serverError.message ?? 'No se pudo registrar la devolución'}</Banner>
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
            {step === 1 && (
              <LoansStep footer={footer} selected={selected} setSelected={setSelected} filters={filters} setFilters={setFilters} serverErrors={serverLineErrors} />
            )}
            {step === 2 && <HeaderStep footer={footer} header={header} setHeader={setHeader} errors={shownHeaderErrors} warehouses={warehouses} canBackdate={canBackdate} />}
            {step === 3 && <ReviewStep footer={footer} header={header} selected={selected} warehouse={warehouse} />}
            {step === 'done' && result && <DoneStep result={result} onNew={reset} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </MotionConfig>
  )
}
