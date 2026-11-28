import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
import { ArrowLeft, CheckCircle2, FileText, Loader2, Paperclip, Plus, Trash2 } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { HIERARCHY } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { EASE_OUT } from '@/features/auth/components/AuthUI'
import { useWarehouses } from '@/features/warehouses/warehousesApi'
import { useAvailability } from '@/features/stock/stockApi'
import { RECEIPT_DOCUMENT_LABELS, REASON_LABELS, movementsService, useCreateEntry } from './movementsApi'
import {
  AttachFileButton,
  DocumentsEditor,
  DocumentsList,
  OpenFileButton,
  documentLabel,
  documentsBody,
  emptyDocument,
  formatAmount,
  formatBytes,
  validateDocuments,
} from './receiptDocuments'
import {
  Banner,
  Card,
  Field,
  FormFooter,
  NextButton,
  ProductPicker,
  Steps,
  WarehouseChoice,
  daysAgo,
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

// Entrada (HU-402, user_flow.md §6): 1. Datos y documentos · 2. Productos · 3. Revisar → Confirmar.
// Motivos Compra y Otro; la Devolución de un préstamo tiene su pantalla (ReturnPage, HU-405). Al recibir una compra se
// registran sus documentos (factura, vale, recibo…): los datos viajan con la entrada y, ya registrada,
// se sube el escaneo de cada uno. Las validaciones de aquí son una ayuda: el backend las repite todas.

const REASONS = [
  { id: 'COMPRA', hint: 'Mercancía recibida de un proveedor' },
  { id: 'OTRO', hint: 'Cualquier otro ingreso, explicado en la observación' },
]
const BACKDATE_DAYS = 3

let lineSeq = 0
const emptyLine = () => ({ key: ++lineSeq, product: null, quantity: '', note: '', showNote: false })
// Una compra empieza con una factura vacía; quitarla deja la entrada sin documentos.
const emptyHeader = () => ({
  warehouseId: '',
  reason: 'COMPRA',
  date: isoDay(new Date()),
  documents: [emptyDocument()],
  receivedBy: '',
  note: '',
})

/** Un documento sin número ni datos ni archivo no cuenta: es la fila que se dejó en blanco. */
const isBlankDocument = (d) => !d.documentNumber && !d.supplierName.trim() && !d.supplierTaxId && !d.issueDate && !d.totalAmount && !d.file
const filledDocuments = (documents) => documents.filter((d) => !isBlankDocument(d))

const validateHeader = (header, canBackdate) => {
  const errors = { ...validateDocuments(filledDocuments(header.documents)) }
  if (!header.warehouseId) errors.warehouseId = 'Elige el almacén que recibe'
  if (header.reason === 'OTRO' && !header.note.trim()) errors.note = 'Explica el motivo de la entrada'
  const today = isoDay(new Date())
  if (!header.date) errors.date = 'Indica la fecha'
  else if (header.date > today) errors.date = 'La fecha no puede ser futura'
  else if (header.date < daysAgo(BACKDATE_DAYS)) {
    if (!canBackdate) errors.date = `Hasta ${BACKDATE_DAYS} días de atraso`
    else if (!header.note.trim()) errors.note = `Con más de ${BACKDATE_DAYS} días de atraso, explica por qué se registra tarde`
  }
  return errors
}

/** Errores por línea, el total por producto y el aviso de producto repetido (se sumará). */
const validateLines = (lines) => {
  const byLine = {}
  const totals = new Map()
  const seen = new Map()
  lines.forEach((line, i) => {
    const errors = {}
    if (!line.product) errors.product = 'Elige el producto'
    const milli = toMilli(line.quantity)
    if (milli === null) errors.quantity = line.quantity ? 'Hasta 3 decimales' : 'Indica la cantidad'
    else if (milli <= 0n) errors.quantity = 'Debe ser mayor que 0'
    if (line.product) {
      if (milli) totals.set(line.product.id, (totals.get(line.product.id) ?? 0n) + milli)
      if (seen.has(line.product.id)) errors.merge = `Este producto ya está en la línea ${seen.get(line.product.id) + 1}: se sumará a ella`
      else seen.set(line.product.id, i)
    }
    if (Object.keys(errors).length) byLine[line.key] = errors
  })
  const blocking = Object.values(byLine).some((e) => e.product || e.quantity)
  return { lines: byLine, blocking, totals }
}

/** Traduce un error del backend al paso donde se corrige. */
const fromServerError = (error, lines, documents) => {
  const details = Array.isArray(error?.details) ? error.details : []
  const header = {}
  const byLine = {}
  for (const d of details) {
    const match = /^lines\.(\d+)\.(\w+)$/.exec(d.path ?? '')
    const doc = /^documents\.(\d+)\.(\w+)$/.exec(d.path ?? '')
    if (match) {
      const line = lines[Number(match[1])]
      if (line) byLine[line.key] = { [match[2] === 'productId' ? 'product' : 'quantity']: d.message }
    } else if (doc) {
      const sent = documents[Number(doc[1])]
      if (sent) header[`${sent.key}.${doc[2]}`] = d.message
    } else if (d.path) {
      header[d.path === 'movementDate' ? 'date' : d.path] = d.message
    }
  }
  if (error?.code === 'MOVEMENT_DATE_INVALID' && !header.date) header.date = error.message
  if (Object.keys(byLine).length || error?.code === 'EMPTY_MOVEMENT') return { step: 2, header, lines: byLine }
  return { step: Object.keys(header).length ? 1 : 3, header, lines: byLine }
}

function HeaderStep({ footer, header, setHeader, errors, warehouses, canBackdate }) {
  const set = (field) => (e) => setHeader((h) => ({ ...h, [field]: e.target.value }))
  const backdated = header.date < daysAgo(BACKDATE_DAYS)
  return (
    <div className='space-y-4'>
      <Card className='space-y-6'>
        <Field label='Almacén que recibe' required error={errors.warehouseId}>
          <WarehouseChoice
            warehouses={warehouses}
            value={header.warehouseId}
            onChange={(warehouseId) => setHeader((h) => ({ ...h, warehouseId }))}
            label='Almacén que recibe'
          />
        </Field>

        <Field label='Motivo' required>
          <div className='grid gap-2 sm:grid-cols-3' role='radiogroup' aria-label='Motivo'>
            {REASONS.map((r) => (
              <button
                key={r.id}
                type='button'
                role='radio'
                aria-checked={header.reason === r.id}
                onClick={() => setHeader((h) => ({ ...h, reason: r.id }))}
                className={cn(
                  'h-10 rounded-lg border text-sm transition-colors',
                  header.reason === r.id ? 'border-ink-900 bg-ink-900 text-white' : 'border-line bg-white hover:border-ink-500/40'
                )}
              >
                {REASON_LABELS[r.id]}
              </button>
            ))}
            {/* La devolución de un préstamo tiene su propia pantalla: parte de los préstamos pendientes. */}
            <Link
              to='/movements/new/return'
              className='grid h-10 place-items-center rounded-lg border border-dashed border-line text-sm text-ink-900 hover:border-forest-700 hover:text-forest-800'
              title='Registra lo que regresa de un préstamo pendiente'
            >
              Devolución →
            </Link>
          </div>
          <p className='mt-1.5 text-xs text-ink-500'>{REASONS.find((r) => r.id === header.reason).hint}</p>
        </Field>

        <div className='grid gap-5 sm:grid-cols-2'>
          <Field
            label='Fecha'
            htmlFor='entry-date'
            required
            error={errors.date}
            hint={canBackdate ? 'Con más de 3 días de atraso, explica en la observación por qué' : 'Hasta 3 días de atraso'}
          >
            <input
              id='entry-date'
              type='date'
              value={header.date}
              max={isoDay(new Date())}
              min={canBackdate ? undefined : daysAgo(BACKDATE_DAYS)}
              onChange={set('date')}
              aria-invalid={Boolean(errors.date)}
              className={inputClass}
            />
          </Field>
          <Field label='Entregado por' htmlFor='delivered-by' hint='Chofer o representante del proveedor'>
            <input id='delivered-by' value={header.receivedBy} onChange={set('receivedBy')} maxLength={150} className={inputClass} />
          </Field>
          <Field label='Observación' htmlFor='entry-note' required={header.reason === 'OTRO' || (canBackdate && backdated)} error={errors.note}>
            <textarea
              id='entry-note'
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
      <DocumentsEditor
        documents={header.documents}
        setDocuments={(update) => setHeader((h) => ({ ...h, documents: typeof update === 'function' ? update(h.documents) : update }))}
        errors={errors}
        reason={header.reason}
        footer={footer}
      />
    </div>
  )
}

function LinesStep({ footer, lines, setLines, errors, current }) {
  const update = (key, patch) => setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)))
  const remove = (key) => setLines((ls) => (ls.length > 1 ? ls.filter((l) => l.key !== key) : [emptyLine()]))
  return (
    <div className='space-y-3'>
      <ol className='space-y-3'>
        {lines.map((line, index) => {
          const e = errors[line.key] ?? {}
          const unit = line.product?.unit.code
          const now = line.product ? current.get(line.product.id) : undefined
          const milli = toMilli(line.quantity)
          return (
            <motion.li
              key={line.key}
              layout
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: EASE_OUT }}
            >
              <Card className={cn('p-4 sm:p-4', (e.product || e.quantity) && 'ring-1 ring-red-300')}>
                <div className='mb-3 flex items-center justify-between'>
                  <span className='text-xs font-semibold uppercase tracking-wide text-ink-500'>Producto {index + 1}</span>
                  <button
                    type='button'
                    onClick={() => remove(line.key)}
                    aria-label={`Quitar el producto ${index + 1}`}
                    className='inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs text-ink-500 hover:bg-red-50 hover:text-red-700'
                  >
                    <Trash2 className='size-3.5' aria-hidden />
                    <span className='hidden sm:inline'>Quitar</span>
                  </button>
                </div>
                <div className='grid gap-3 sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]'>
                  <div>
                    <ProductPicker value={line.product} onChange={(product) => update(line.key, { product })} invalid={Boolean(e.product)} />
                    {e.product && <p className='mt-1 text-xs text-red-600'>{e.product}</p>}
                    {e.merge && <p className='mt-1 text-xs text-amber-700'>{e.merge}</p>}
                  </div>
                  <div>
                    <div className='relative'>
                      <input
                        inputMode='decimal'
                        value={line.quantity}
                        onChange={(ev) => update(line.key, { quantity: typedQuantity(line.quantity, ev.target.value.trim()) })}
                        placeholder='Cantidad recibida'
                        aria-label={`Cantidad del producto ${index + 1}`}
                        aria-invalid={Boolean(e.quantity)}
                        className={cn(inputClass, 'pr-14 text-right tabular-nums')}
                      />
                      {unit && <span className='pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-ink-500'>{unit}</span>}
                    </div>
                    {e.quantity ? (
                      <p className='mt-1 text-xs text-red-600'>{e.quantity}</p>
                    ) : (
                      now !== undefined && (
                        <p className='mt-1 text-right text-xs text-ink-500'>
                          En el almacén: {fmt(now)} {unit}
                          {milli > 0n && ` → quedará en ${fmtMilli(toMilli(now) + milli)}`}
                        </p>
                      )
                    )}
                  </div>
                </div>
                {line.showNote ? (
                  <input
                    value={line.note}
                    onChange={(ev) => update(line.key, { note: ev.target.value })}
                    maxLength={500}
                    placeholder='Observación (lote, vencimiento, presentación…)'
                    aria-label={`Observación del producto ${index + 1}`}
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

function ReviewStep({ footer, header, lines, warehouse, totals, documents }) {
  const products = new Map(lines.filter((l) => l.product).map((l) => [l.product.id, l.product]))
  // Aviso de sobre máximo (business_rules.md §7): existencia total de todos los almacenes + lo que entra.
  const aboveMaximum = [...totals.entries()]
    .map(([id, milli]) => ({ product: products.get(id), after: toMilli(products.get(id).stock?.total ?? '0') + milli }))
    .filter(({ product, after }) => product.maxStock !== null && product.maxStock !== undefined && after > toMilli(product.maxStock))
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
            <dt className='text-xs text-ink-500'>Motivo</dt>
            <dd className='font-medium'>{REASON_LABELS[header.reason]}</dd>
          </div>
          <div>
            <dt className='text-xs text-ink-500'>Fecha</dt>
            <dd className='font-medium'>{new Date(`${header.date}T12:00:00`).toLocaleDateString('es', { dateStyle: 'long' })}</dd>
          </div>
          <div>
            <dt className='text-xs text-ink-500'>Referencia</dt>
            <dd className='font-mono font-medium'>
              {documents.length ? documentLabel(documents[0]) : <span className='font-sans text-ink-500'>Sin documento</span>}
            </dd>
          </div>
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
      {documents.length > 0 && (
        <Card className='p-0 sm:p-0'>
          <h2 className='border-b border-line/60 px-4 py-3 text-sm font-semibold sm:px-6'>Documentos de recepción</h2>
          <ul className='divide-y divide-line/60'>
            {documents.map((doc) => (
              <li key={doc.key} className='flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 px-4 py-3 sm:px-6'>
                <span className='min-w-0'>
                  <span className='block text-sm'>
                    <span className='font-medium'>{RECEIPT_DOCUMENT_LABELS[doc.documentType]}</span>{' '}
                    <span className='font-mono'>{documentLabel(doc)}</span>
                  </span>
                  <span className='block truncate text-xs text-ink-500'>
                    {[
                      doc.supplierName.trim(),
                      doc.supplierTaxId,
                      doc.issueDate && new Date(`${doc.issueDate}T12:00:00`).toLocaleDateString('es', { dateStyle: 'medium' }),
                      doc.totalAmount && formatAmount(doc.totalAmount.replace(',', '.'), doc.currency),
                    ]
                      .filter(Boolean)
                      .join(' · ') || 'Sin más datos'}
                  </span>
                </span>
                <span className='inline-flex shrink-0 items-center gap-1.5 text-xs text-ink-500'>
                  <Paperclip className='size-3.5' aria-hidden />
                  {doc.file ? `${doc.file.name} · ${formatBytes(doc.file.size)}` : 'Sin archivo'}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
      {aboveMaximum.length > 0 && (
        <Banner tone='warning'>
          {aboveMaximum.map(({ product, after }) => (
            <p key={product.id}>
              <strong>{product.name}</strong> quedará sobre su máximo: {fmtMilli(after)} de {fmt(product.maxStock)} {product.unit.code} en todos los
              almacenes. Puedes confirmar igual.
            </p>
          ))}
        </Banner>
      )}

      <Card className='p-0 sm:p-0'>
        <h2 className='border-b border-line/60 px-4 py-3 text-sm font-semibold sm:px-6'>Productos que entran</h2>
        <ul className='divide-y divide-line/60'>
          {[...totals.entries()].map(([id, milli]) => {
            const product = products.get(id)
            return (
              <li key={id} className='flex items-baseline justify-between gap-3 px-4 py-3 sm:px-6'>
                <span className='min-w-0'>
                  <span className='block truncate font-medium'>{product.name}</span>
                  <span className='font-mono text-xs text-ink-500'>{product.code}</span>
                </span>
                <span className='shrink-0 text-lg font-semibold tabular-nums text-forest-800'>
                  +{fmtMilli(milli)} <span className='text-sm font-normal text-ink-500'>{product.unit.code}</span>
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

/** Estado del archivo de cada documento tras registrar la entrada: subiendo, listo o con error (reintentar). */
function DocumentUploads({ movement, uploads, onUploaded }) {
  const failed = Object.values(uploads).filter((u) => u.status === 'error').length
  return (
    <div className='mt-5 overflow-hidden rounded-lg border border-line/80 text-left'>
      <h2 className='border-b border-line/60 bg-sand-50/60 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-ink-500'>
        Documentos de recepción
      </h2>
      <DocumentsList
        movementId={movement.id}
        documents={movement.documents}
        renderStatus={(doc) => {
          const upload = uploads[doc.id]
          if (doc.file) return <OpenFileButton movementId={movement.id} document={doc} />
          if (upload?.status === 'uploading') {
            return (
              <span className='inline-flex items-center gap-1.5 text-xs text-ink-500'>
                <Loader2 className='size-3.5 animate-spin' aria-hidden />
                Subiendo archivo…
              </span>
            )
          }
          if (upload?.status === 'error') {
            return (
              <span className='inline-flex flex-col items-end gap-1'>
                <span className='text-xs text-red-600'>{upload.error}</span>
                <AttachFileButton movementId={movement.id} document={doc} file={upload.file} label='Reintentar' onUploaded={onUploaded} />
              </span>
            )
          }
          return <AttachFileButton movementId={movement.id} document={doc} onUploaded={onUploaded} />
        }}
      />
      {failed > 0 && (
        <p className='border-t border-line/60 px-4 py-2.5 text-xs text-ink-500'>
          La entrada ya quedó registrada. Puedes reintentar la subida aquí o adjuntar el archivo luego desde el detalle.
        </p>
      )}
    </div>
  )
}

function DoneStep({ result, onNew, onUploaded }) {
  const { movement, meta, uploads } = result
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
      <p className='mt-4 text-sm text-ink-500'>{meta?.duplicated ? 'Esta entrada ya estaba registrada' : 'Entrada registrada'}</p>
      <p className='mt-1 font-mono text-3xl font-semibold tracking-wide'>{movement.documentNumber}</p>
      {movement.reference && <p className='mt-1 font-mono text-sm text-ink-500'>{movement.reference}</p>}
      <p className='mt-2 text-sm text-ink-500'>
        {movement.lines.length} {movement.lines.length === 1 ? 'producto' : 'productos'} · {movement.toWarehouse?.name}
      </p>
      {movement.documents.length > 0 && <DocumentUploads movement={movement} uploads={uploads} onUploaded={onUploaded} />}
      {above.length > 0 && (
        <div className='mt-4 text-left'>
          <Banner tone='warning'>
            {above.map((a) => (
              <p key={a.productId}>
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
          Nueva entrada
        </button>
      </div>
    </Card>
  )
}

export function EntryPage() {
  const navigate = useNavigate()
  const canBackdate = useAuthStore((s) => s.hasHierarchy(HIERARCHY.ADMIN))
  const [step, setStep] = useState(1)
  const [header, setHeader] = useState(emptyHeader)
  const [lines, setLines] = useState(() => [emptyLine()])
  const [headerErrors, setHeaderErrors] = useState({})
  const [lineErrors, setLineErrors] = useState({})
  const [serverError, setServerError] = useState(null)
  const [result, setResult] = useState(null)
  // Una clave por borrador: el doble clic o un reintento con mala señal no duplican la entrada (P6).
  const [idempotencyKey, setIdempotencyKey] = useState(newKey)

  const { data: warehousesData } = useWarehouses({ isActive: true, limit: 100, sort: 'code' })
  const warehouses = warehousesData?.data ?? []
  const warehouse = warehouses.find((w) => w.id === header.warehouseId)
  const productIds = lines.filter((l) => l.product).map((l) => l.product.id)
  const { data: availabilityData } = useAvailability(header.warehouseId, productIds)
  const current = useMemo(() => new Map((availabilityData?.items ?? []).map((i) => [i.productId, i.available])), [availabilityData])
  const create = useCreateEntry()

  // Los documentos que se enviarán: los que quedaron en blanco no cuentan.
  const documents = useMemo(() => filledDocuments(header.documents), [header.documents])
  const live = useMemo(() => validateLines(lines), [lines])
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
      const now = validateHeader(header, canBackdate)
      return Object.fromEntries(
        Object.keys(prev)
          .filter((k) => now[k])
          .map((k) => [k, now[k]])
      )
    })
  }, [header, canBackdate])
  const liveHeader = useMemo(() => validateHeader(header, canBackdate), [header, canBackdate])
  // Errores en vivo: los de las líneas ya llenas, los de los documentos y la fecha; lo que falta llenar no.
  const shownLineErrors = useMemo(() => visibleLineErrors(lines, lineErrors, live.lines), [lines, lineErrors, live])
  const shownHeaderErrors = useMemo(() => visibleHeaderErrors(headerErrors, liveHeader, ['warehouseId', 'note']), [headerErrors, liveHeader])

  // Los botones se habilitan solo si el paso está completo; el motivo se muestra al lado.
  // Los errores de un documento llegan como "{key}.campo": en el botón se dice cuál ("Documento 2: Indica el número").
  const headerBlocked = useMemo(() => {
    const [key, message] = Object.entries(liveHeader)[0] ?? []
    const doc = key && /^(.+)\.\w+$/.exec(key)
    if (!doc) return firstIssue(liveHeader)
    return `Documento ${header.documents.findIndex((d) => String(d.key) === doc[1]) + 1}: ${message}`
  }, [liveHeader, header.documents])
  const linesBlocked = firstLineIssue(lines, live.lines, ['product', 'quantity'])

  const goToLines = () => {
    if (!headerBlocked) setStep(2)
  }
  const goToReview = () => {
    if (!linesBlocked) setStep(3)
  }
  const reset = () => {
    setStep(1)
    setHeader({ ...emptyHeader(), warehouseId: header.warehouseId })
    setLines([emptyLine()])
    setHeaderErrors({})
    setLineErrors({})
    setServerError(null)
    setResult(null)
    setIdempotencyKey(newKey())
  }

  /** Marca el estado de subida de un documento y, si quedó adjunto, lo reemplaza en el resultado. */
  const setUpload = (docId, upload, uploadedDoc) =>
    setResult((r) =>
      r && {
        ...r,
        uploads: { ...r.uploads, [docId]: upload },
        movement: uploadedDoc ? { ...r.movement, documents: r.movement.documents.map((d) => (d.id === docId ? uploadedDoc : d)) } : r.movement,
      }
    )
  const onUploaded = (doc) => setUpload(doc.id, { status: 'done' }, doc)

  /**
   * Ya registrada la entrada, sube el archivo de cada documento, uno tras otro. El backend devuelve
   * los documentos en el orden en que se enviaron. Un reintento con la misma Idempotency-Key devuelve
   * la entrada original: los documentos que ya tienen archivo se saltan.
   */
  const uploadFiles = async (movement, sent) => {
    for (const [i, doc] of movement.documents.entries()) {
      const file = sent[i]?.file
      if (!file || doc.file) continue
      setUpload(doc.id, { status: 'uploading', file })
      try {
        const uploaded = await movementsService.uploadDocumentFile({ movementId: movement.id, documentId: doc.id, file })
        setUpload(doc.id, { status: 'done' }, uploaded)
      } catch (error) {
        setUpload(doc.id, { status: 'error', file, error: error.message ?? 'No se pudo subir el archivo' })
      }
    }
  }

  const confirm = () => {
    setServerError(null)
    const body = {
      warehouseId: header.warehouseId,
      reason: header.reason,
      movementDate: header.date === isoDay(new Date()) ? undefined : new Date(`${header.date}T12:00:00`).toISOString(),
      // La referencia la arma el backend con el primer documento (FAC-0012345).
      documents: documentsBody(documents),
      receivedBy: header.receivedBy.trim() || null,
      note: header.note.trim() || null,
      lines: lines.map((l) => ({ productId: l.product.id, quantity: normalizeQuantity(l.quantity), note: l.note.trim() || null })),
    }
    create.mutate(
      { body, idempotencyKey },
      {
        onSuccess: (envelope) => {
          setResult({ movement: envelope.data, meta: envelope.meta, uploads: {} })
          setStep('done')
          uploadFiles(envelope.data, documents)
        },
        onError: (error) => {
          const mapped = fromServerError(error, lines, documents)
          setHeaderErrors(mapped.header)
          setLineErrors(mapped.lines)
          setServerError(error)
          setStep(mapped.step)
        },
      }
    )
  }

  const footerButton =
    'inline-flex h-11 items-center justify-center gap-2 rounded-md px-5 text-sm font-semibold transition-colors disabled:opacity-60'

  // Botones del paso: cada paso los muestra al final de su última tarjeta.
  const footer = (
    <FormFooter>
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
          Revisar la entrada
        </NextButton>
      )}
      {step === 3 && (
        <NextButton onClick={confirm} blockedReason={headerBlocked ?? linesBlocked} pending={create.isPending} pendingLabel='Registrando…' tone='confirm'>
          Confirmar entrada
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
            <h1 className='text-[1.75rem] font-semibold tracking-tight'>Nueva entrada</h1>
            <p className='mt-0.5 text-sm text-ink-500'>Mercancía que llega al almacén y suma a sus existencias</p>
          </div>
          {step !== 'done' && <Steps step={step} items={['Datos de la entrada', 'Productos', 'Revisar']} />}
        </header>

        {serverError && step !== 'done' && (
          <div className='mt-5'>
            <Banner>{serverError.message ?? 'No se pudo registrar la entrada'}</Banner>
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
              <HeaderStep footer={footer} header={header} setHeader={setHeader} errors={shownHeaderErrors} warehouses={warehouses} canBackdate={canBackdate} />
            )}
            {step === 2 && <LinesStep footer={footer} lines={lines} setLines={setLines} errors={shownLineErrors} current={current} />}
            {step === 3 && <ReviewStep footer={footer} header={header} lines={lines} warehouse={warehouse} totals={live.totals} documents={documents} />}
            {step === 'done' && result && <DoneStep result={result} onNew={reset} onUploaded={onUploaded} />}
          </motion.div>
        </AnimatePresence>

      </div>
    </MotionConfig>
  )
}
