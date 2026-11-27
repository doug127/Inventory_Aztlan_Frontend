import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
import { AlertTriangle, ArrowLeft, Check, CheckCircle2, Copy, FileText, Info, Plus, Trash2 } from 'lucide-react'
import { SearchPicker } from '@/components/common/SearchPicker'
import { useAuthStore } from '@/stores/authStore'
import { HIERARCHY } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { EASE_OUT } from '@/features/auth/components/AuthUI'
import { useWarehouses } from '@/features/warehouses/warehousesApi'
import { useProducts } from '@/features/products/productsApi'
import { categoryPathLabel, useAssets } from '@/features/assets/assetsApi'
import { useAssetCategoryTree } from '@/features/asset-categories/assetCategoriesApi'
import { useAvailability } from '@/features/stock/stockApi'
import { REASON_LABELS, useCreateWithdrawal } from './movementsApi'
import {
  Banner,
  Card,
  Field,
  NextButton,
  ProductPicker,
  Steps,
  daysAgo,
  fmt,
  firstIssue,
  firstLineIssue,
  fmtMilli,
  inputClass,
  isoDay,
  newKey,
  normalizeQuantity,
  toMilli,
  typedQuantity,
  useDebounced,
  visibleHeaderErrors,
  visibleLineErrors,
} from './movementForm'

// Orden de retiro (HU-401, user_flow.md §5): 1. Datos · 2. Líneas · 3. Revisar → Confirmar.
// Las validaciones de aquí son una ayuda; el backend las repite todas con el stock bloqueado.

const REASONS = [
  { id: 'CONSUMO', hint: 'Combustible, lubricantes o insumos que gasta un activo' },
  { id: 'PRESTAMO', hint: 'Herramientas o equipos que deben volver al almacén' },
  { id: 'DESECHO', hint: 'Producto vencido, dañado o contaminado' },
  { id: 'VENTA', hint: 'Venta a un tercero' },
  { id: 'OTRO', hint: 'Cualquier otro retiro, explicado en la observación' },
]
const ASSET_REQUIRED = ['CONSUMO', 'PRESTAMO']
const NOTE_REQUIRED = ['DESECHO', 'OTRO']
const BACKDATE_DAYS = 3

let lineSeq = 0
const emptyLine = (product = null) => ({ key: ++lineSeq, product, quantity: '', asset: null, note: '', showNote: false })
const EMPTY_HEADER = { warehouseId: '', reason: 'CONSUMO', date: isoDay(new Date()), receivedBy: '', workOrder: '', note: '' }

/**
 * Orden de trabajo del taller: el prefijo OT- es fijo y se escribe el resto (2026-0153). Solo letras,
 * números y guiones, en mayúsculas, hasta 27 caracteres (OT-2026-0153 en total).
 */
const WORK_ORDER_TYPING = /^[A-Z0-9][A-Z0-9-]{0,26}$/
const typedWorkOrder = (previous, next) => {
  const value = next.toUpperCase().replace(/^OT-?/, '')
  return value === '' || WORK_ORDER_TYPING.test(value) ? value : previous
}

/** Referencia que asignará el backend: {almacén}-{año de la fecha}-{correlativo de 6 dígitos}. */
const referencePreview = (warehouseCode, date) => `${warehouseCode ?? 'ALMA'}-${(date || isoDay(new Date())).slice(0, 4)}-······`

// --- Paso 1 -------------------------------------------------------------------------

function HeaderStep({ header, setHeader, errors, warehouses, canBackdate }) {
  const set = (field) => (e) => setHeader((h) => ({ ...h, [field]: e.target.value }))
  const minDate = canBackdate ? undefined : daysAgo(BACKDATE_DAYS)
  const backdated = header.date < daysAgo(BACKDATE_DAYS)
  return (
    <Card className='space-y-6'>
      <Field label='Almacén de origen' required error={errors.warehouseId}>
        <div className='grid gap-2 sm:grid-cols-2' role='radiogroup' aria-label='Almacén de origen'>
          {warehouses.map((w) => (
            <button
              key={w.id}
              type='button'
              role='radio'
              aria-checked={header.warehouseId === w.id}
              onClick={() => setHeader((h) => ({ ...h, warehouseId: w.id }))}
              className={cn(
                'flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors',
                header.warehouseId === w.id ? 'border-forest-700 bg-forest-50 ring-1 ring-forest-700' : 'border-line hover:border-ink-500/40'
              )}
            >
              <span className='rounded bg-white px-1.5 py-0.5 font-mono text-xs font-semibold ring-1 ring-line'>{w.code}</span>
              <span className='truncate text-sm'>{w.name}</span>
            </button>
          ))}
        </div>
      </Field>

      <Field label='Motivo' required>
        <div className='grid gap-2 sm:grid-cols-5' role='radiogroup' aria-label='Motivo'>
          {REASONS.map((r) => (
            <button
              key={r.id}
              type='button'
              role='radio'
              aria-checked={header.reason === r.id}
              onClick={() => setHeader((h) => ({ ...h, reason: r.id }))}
              title={r.hint}
              className={cn(
                'h-10 rounded-lg border text-sm transition-colors',
                header.reason === r.id ? 'border-ink-900 bg-ink-900 text-white' : 'border-line bg-white hover:border-ink-500/40'
              )}
            >
              {REASON_LABELS[r.id]}
            </button>
          ))}
        </div>
        <p className='mt-1.5 text-xs text-ink-500'>{REASONS.find((r) => r.id === header.reason).hint}</p>
      </Field>

      <div className='grid gap-5 sm:grid-cols-2'>
        <Field
          label='Recibido por'
          htmlFor='received-by'
          required={header.reason === 'PRESTAMO'}
          error={errors.receivedBy}
          hint={header.reason === 'PRESTAMO' ? 'Responsable de devolverlo' : 'Quien retira físicamente: chofer, operador…'}
        >
          <input
            id='received-by'
            value={header.receivedBy}
            onChange={set('receivedBy')}
            maxLength={150}
            aria-invalid={Boolean(errors.receivedBy)}
            className={inputClass}
          />
        </Field>
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
            min={minDate}
            onChange={set('date')}
            aria-invalid={Boolean(errors.date)}
            className={inputClass}
          />
        </Field>
        <Field label='Orden de trabajo' htmlFor='work-order' hint='Del taller, si la hay (ej. OT-2026-0153)' error={errors.workOrder}>
          <div className='relative'>
            <span className='pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-[15px] text-ink-500'>OT-</span>
            <input
              id='work-order'
              value={header.workOrder}
              onChange={(e) => setHeader((h) => ({ ...h, workOrder: typedWorkOrder(h.workOrder, e.target.value.trim()) }))}
              maxLength={27}
              placeholder='2026-0153'
              autoComplete='off'
              aria-invalid={Boolean(errors.workOrder)}
              className={cn(inputClass, 'pl-12 font-mono uppercase')}
            />
          </div>
        </Field>
        <Field label='Referencia' htmlFor='reference' hint='Se asigna al confirmar: correlativo del almacén en el año'>
          <output id='reference' className={cn(inputClass, 'flex items-center bg-sand-50 font-mono text-ink-500')}>
            {referencePreview(warehouses.find((w) => w.id === header.warehouseId)?.code, header.date)}
          </output>
        </Field>
        <Field label='Observación' htmlFor='note' required={NOTE_REQUIRED.includes(header.reason) || (canBackdate && backdated)} error={errors.note}>
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

function AssetPicker({ value, onChange, invalid, categoryId, required }) {
  const [search, setSearch] = useState('')
  const debounced = useDebounced(search)
  const { data, isFetching } = useAssets({
    search: debounced || undefined,
    isActive: true,
    limit: 12,
    sort: 'code',
    categoryId: categoryId || undefined,
  })
  const options = (data?.data ?? []).map((a) => ({ id: a.id, label: `${a.code} · ${a.name}`, hint: categoryPathLabel(a.category.path), asset: a }))
  return (
    <SearchPicker
      ariaLabel='Activo destino'
      value={value ? { id: value.id, label: `${value.code} · ${value.name}` } : null}
      onChange={(option) => onChange(option?.asset ?? null)}
      onSearch={setSearch}
      options={options}
      loading={isFetching}
      invalid={invalid}
      placeholder={required ? 'Activo destino (tractor, tablón, personal…)' : 'Activo destino (opcional)'}
      emptyText='Ningún activo activo coincide'
    />
  )
}

/** Categorías de activos aplanadas con sangría, para filtrar los buscadores de activos de la orden. */
const flattenTree = (nodes, depth = 0) =>
  nodes
    .filter((n) => n.isActive)
    .flatMap((n) => [{ id: n.id, label: `${'  '.repeat(depth)}${n.name}`, count: n.assetsInSubtree }, ...flattenTree(n.children, depth + 1)])

function LinesStep({ header, warehouseCode, lines, setLines, errors, availability, assetFilter, setAssetFilter }) {
  const { data: tree = [] } = useAssetCategoryTree({ isActive: true })
  const assetRequired = ASSET_REQUIRED.includes(header.reason)
  const update = (key, patch) => setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)))
  const remove = (key) => setLines((ls) => (ls.length > 1 ? ls.filter((l) => l.key !== key) : [emptyLine()]))
  const duplicate = (line) =>
    setLines((ls) => {
      const index = ls.findIndex((l) => l.key === line.key)
      return [...ls.slice(0, index + 1), emptyLine(line.product), ...ls.slice(index + 1)]
    })

  return (
    <div className='space-y-4'>
      <Card className='flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-4'>
        <p className='text-sm text-ink-500'>
          {assetRequired
            ? 'Cada línea va a un activo. Para repartir un producto entre varios activos, usa una línea por activo.'
            : 'El activo destino es opcional con este motivo.'}
        </p>
        <label className='flex items-center gap-2 text-sm'>
          <span className='shrink-0 text-ink-500'>Activos de</span>
          <select
            value={assetFilter}
            onChange={(e) => setAssetFilter(e.target.value)}
            className='h-9 max-w-56 rounded-md border border-line bg-white px-2 text-sm outline-none focus:border-forest-700'
            aria-label='Filtrar los activos por categoría'
          >
            <option value=''>Todas las categorías</option>
            {flattenTree(tree).map((c) => (
              <option key={c.id} value={c.id}>
                {c.label} ({c.count})
              </option>
            ))}
          </select>
        </label>
      </Card>

      <ol className='space-y-3'>
        {lines.map((line, index) => {
          const e = errors.lines?.[line.key] ?? {}
          const available = line.product ? availability.get(line.product.id) : undefined
          const unit = line.product?.unit.code
          return (
            <motion.li
              key={line.key}
              layout
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: EASE_OUT }}
            >
              <Card className={cn('p-4 sm:p-4', (e.product || e.quantity || e.asset || e.stock) && 'ring-1 ring-red-300')}>
                <div className='mb-3 flex items-center justify-between'>
                  <span className='text-xs font-semibold uppercase tracking-wide text-ink-500'>Línea {index + 1}</span>
                  <div className='flex gap-1'>
                    <button
                      type='button'
                      onClick={() => duplicate(line)}
                      disabled={!line.product}
                      title='Mismo producto para otro activo'
                      className='inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs text-ink-500 hover:bg-sand-50 hover:text-ink-900 disabled:opacity-40'
                    >
                      <Copy className='size-3.5' aria-hidden />
                      <span className='hidden sm:inline'>Duplicar</span>
                    </button>
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
                </div>
                <div className='grid gap-3 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)_minmax(0,1.3fr)]'>
                  <div>
                    <ProductPicker
                      value={line.product}
                      onChange={(product) => update(line.key, { product })}
                      invalid={Boolean(e.product)}
                      withStockIn={header.warehouseId}
                      emptyText={`Ningún producto con existencia en ${warehouseCode ?? 'el almacén'} coincide`}
                    />
                    {e.product && <p className='mt-1 text-xs text-red-600'>{e.product}</p>}
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
                      available !== undefined && (
                        <p className='mt-1 text-right text-xs text-ink-500'>
                          Disponible: {fmt(available)} {unit}
                        </p>
                      )
                    )}
                  </div>
                  <div>
                    <AssetPicker
                      value={line.asset}
                      onChange={(asset) => update(line.key, { asset })}
                      invalid={Boolean(e.asset)}
                      categoryId={assetFilter}
                      required={assetRequired}
                    />
                    {e.asset && <p className='mt-1 text-xs text-red-600'>{e.asset}</p>}
                    {e.merge && <p className='mt-1 text-xs text-amber-700'>{e.merge}</p>}
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

      {errors.general && <Banner>{errors.general}</Banner>}

      <button
        type='button'
        onClick={() => setLines((ls) => [...ls, emptyLine()])}
        className='inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-line bg-white text-sm font-medium text-ink-900 hover:border-forest-700 hover:text-forest-800'
      >
        <Plus className='size-4' aria-hidden />
        Agregar línea
      </button>
    </div>
  )
}

// --- Validación en el cliente (el backend repite todo) ------------------------------

const validateHeader = (header, canBackdate) => {
  const errors = {}
  if (!header.warehouseId) errors.warehouseId = 'Elige el almacén'
  if (header.reason === 'PRESTAMO' && !header.receivedBy.trim()) errors.receivedBy = 'En un préstamo indica quién lo recibe y lo devolverá'
  if (NOTE_REQUIRED.includes(header.reason) && !header.note.trim()) {
    errors.note = header.reason === 'DESECHO' ? 'Explica por qué se desecha' : 'Explica el motivo del retiro'
  }
  const today = isoDay(new Date())
  if (!header.date) errors.date = 'Indica la fecha'
  else if (header.date > today) errors.date = 'La fecha no puede ser futura'
  else if (header.date < daysAgo(BACKDATE_DAYS)) {
    if (!canBackdate) errors.date = `Hasta ${BACKDATE_DAYS} días de atraso`
    else if (!header.note.trim()) errors.note = `Con más de ${BACKDATE_DAYS} días de atraso, explica por qué se registra tarde`
  }
  return errors
}

/** Errores por línea y la suma por producto frente a la existencia del almacén. */
const validateLines = (lines, header, availability) => {
  const byLine = {}
  const add = (key, field, message) => {
    byLine[key] = { ...byLine[key], [field]: message }
  }
  const assetRequired = ASSET_REQUIRED.includes(header.reason)
  const totals = new Map()
  const seen = new Map()
  lines.forEach((line, i) => {
    if (!line.product) add(line.key, 'product', 'Elige el producto')
    const milli = toMilli(line.quantity)
    if (milli === null) add(line.key, 'quantity', line.quantity ? 'Hasta 3 decimales' : 'Indica la cantidad')
    else if (milli <= 0n) add(line.key, 'quantity', 'Debe ser mayor que 0')
    if (assetRequired && !line.asset) add(line.key, 'asset', 'Indica el activo destino')
    if (line.product && milli) totals.set(line.product.id, (totals.get(line.product.id) ?? 0n) + milli)
    if (line.product) {
      const combo = `${line.product.id}|${line.asset?.id ?? ''}`
      if (seen.has(combo)) add(line.key, 'merge', `Esta combinación ya está en la línea ${seen.get(combo) + 1}: se sumará a ella`)
      else seen.set(combo, i)
    }
  })
  for (const line of lines) {
    if (!line.product) continue
    const available = availability.get(line.product.id)
    if (available === undefined) continue
    const total = totals.get(line.product.id) ?? 0n
    if (total > toMilli(available))
      add(line.key, 'stock', `Disponible: ${fmt(available)} ${line.product.unit.code} (la orden suma ${fmtMilli(total)})`)
  }
  const blocking = Object.values(byLine).some((e) => e.product || e.quantity || e.asset || e.stock)
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
        byLine[line.key] = { stock: `Disponible: ${fmt(d.available)} ${line.product.unit.code}, la orden pide ${fmt(d.requested)}` }
      }
    }
    return { step: 2, header, lines: byLine }
  }
  for (const d of details) {
    const match = /^lines\.(\d+)\.(\w+)$/.exec(d.path ?? '')
    if (match) {
      const line = lines[Number(match[1])]
      if (line) byLine[line.key] = { [match[2] === 'assetId' ? 'asset' : match[2] === 'productId' ? 'product' : 'quantity']: d.message }
    } else if (d.path) {
      header[d.path === 'movementDate' ? 'date' : d.path] = d.message
    }
  }
  if (error?.code === 'MOVEMENT_DATE_INVALID' && !header.date) header.date = error.message
  if (Object.keys(byLine).length || error?.code === 'ASSET_REQUIRED' || error?.code === 'EMPTY_MOVEMENT') return { step: 2, header, lines: byLine }
  return { step: Object.keys(header).length ? 1 : 3, header, lines: byLine }
}

// --- Paso 3 y resultado -------------------------------------------------------------

function ReviewStep({ header, lines, warehouse, totals }) {
  const products = new Map(lines.filter((l) => l.product).map((l) => [l.product.id, l.product]))
  const belowMinimum = [...totals.entries()]
    .map(([id, milli]) => ({ product: products.get(id), after: toMilli(products.get(id).stock?.total ?? '0') - milli }))
    .filter(({ product, after }) => after < toMilli(product.minStock ?? '0'))
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
            <dt className='text-xs text-ink-500'>Motivo</dt>
            <dd className='font-medium'>{REASON_LABELS[header.reason]}</dd>
          </div>
          <div>
            <dt className='text-xs text-ink-500'>Fecha</dt>
            <dd className='font-medium'>{new Date(`${header.date}T12:00:00`).toLocaleDateString('es', { dateStyle: 'long' })}</dd>
          </div>
          {header.receivedBy && (
            <div>
              <dt className='text-xs text-ink-500'>Recibido por</dt>
              <dd className='font-medium'>{header.receivedBy}</dd>
            </div>
          )}
          {header.workOrder && (
            <div>
              <dt className='text-xs text-ink-500'>Orden de trabajo</dt>
              <dd className='font-mono font-medium'>OT-{header.workOrder}</dd>
            </div>
          )}
          <div>
            <dt className='text-xs text-ink-500'>Referencia</dt>
            <dd className='font-mono font-medium'>
              {referencePreview(warehouse?.code, header.date)} <span className='font-sans text-xs font-normal text-ink-500'>(al confirmar)</span>
            </dd>
          </div>
          {header.note && (
            <div className='sm:col-span-3'>
              <dt className='text-xs text-ink-500'>Observación</dt>
              <dd>{header.note}</dd>
            </div>
          )}
        </dl>
      </Card>

      <Card className='p-0 sm:p-0'>
        <h2 className='border-b border-line/60 px-4 py-3 text-sm font-semibold sm:px-6'>Total por producto</h2>
        <ul className='divide-y divide-line/60'>
          {[...totals.entries()].map(([id, milli]) => {
            const product = products.get(id)
            const breakdown = lines.filter((l) => l.product?.id === id)
            return (
              <li key={id} className='px-4 py-3 sm:px-6'>
                <div className='flex items-baseline justify-between gap-3'>
                  <span className='min-w-0'>
                    <span className='block truncate font-medium'>{product.name}</span>
                    <span className='font-mono text-xs text-ink-500'>{product.code}</span>
                  </span>
                  <span className='shrink-0 text-lg font-semibold tabular-nums'>
                    {fmtMilli(milli)} <span className='text-sm font-normal text-ink-500'>{product.unit.code}</span>
                  </span>
                </div>
                {breakdown.length > 1 || breakdown[0]?.asset ? (
                  <ul className='mt-1.5 space-y-0.5 text-sm text-ink-500'>
                    {breakdown.map((l) => (
                      <li key={l.key} className='flex justify-between gap-3'>
                        <span className='truncate'>{l.asset ? `${l.asset.code} · ${l.asset.name}` : 'Sin activo'}</span>
                        <span className='shrink-0 tabular-nums'>
                          {fmtMilli(toMilli(l.quantity))} {product.unit.code}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            )
          })}
        </ul>
      </Card>

      {belowMinimum.length > 0 && (
        <Banner tone='warning'>
          {belowMinimum.map(({ product, after }) => (
            <p key={product.id}>
              <strong>{product.name}</strong> quedará bajo su mínimo: {fmtMilli(after < 0n ? 0n : after)} de {fmt(product.minStock)}{' '}
              {product.unit.code} en todos los almacenes. Puedes confirmar igual.
            </p>
          ))}
        </Banner>
      )}
    </div>
  )
}

function DoneStep({ result, onNew }) {
  const { movement, meta } = result
  const below = meta?.warnings?.belowMinimum ?? []
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
      <p className='mt-4 text-sm text-ink-500'>{meta?.duplicated ? 'Esta orden ya estaba registrada' : 'Orden registrada'}</p>
      <p className='mt-1 font-mono text-3xl font-semibold tracking-wide'>{movement.documentNumber}</p>
      {movement.reference && <p className='mt-1 font-mono text-sm text-ink-500'>Referencia {movement.reference}</p>}
      {movement.workOrder && <p className='font-mono text-sm text-ink-500'>Orden de trabajo {movement.workOrder}</p>}
      <p className='mt-2 text-sm text-ink-500'>
        {movement.lines.length} {movement.lines.length === 1 ? 'línea' : 'líneas'} · {movement.fromWarehouse?.name}
      </p>
      {below.length > 0 && (
        <div className='mt-4 text-left'>
          <Banner tone='warning'>
            {below.map((b) => (
              <p key={b.productId}>
                {b.productName} quedó bajo su mínimo: {fmt(b.total)} de {fmt(b.minStock)} {b.unitCode}.
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
          Nueva orden
        </button>
      </div>
    </Card>
  )
}

// --- Página ---------------------------------------------------------------------------

export function WithdrawalPage() {
  const navigate = useNavigate()
  const canBackdate = useAuthStore((s) => s.hasHierarchy(HIERARCHY.ADMIN))
  const [step, setStep] = useState(1)
  const [header, setHeader] = useState(EMPTY_HEADER)
  const [lines, setLines] = useState(() => [emptyLine()])
  const [assetFilter, setAssetFilter] = useState('')
  const [headerErrors, setHeaderErrors] = useState({})
  const [lineErrors, setLineErrors] = useState({})
  const [serverError, setServerError] = useState(null)
  const [result, setResult] = useState(null)
  // Una clave por borrador: el doble clic o un reintento con mala señal no duplican la orden (P6).
  const [idempotencyKey, setIdempotencyKey] = useState(newKey)

  const { data: warehousesData } = useWarehouses({ isActive: true, limit: 100, sort: 'code' })
  const warehouses = warehousesData?.data ?? []
  const warehouse = warehouses.find((w) => w.id === header.warehouseId)
  const productIds = lines.filter((l) => l.product).map((l) => l.product.id)
  const { data: availabilityData, isError: availabilityError } = useAvailability(header.warehouseId, productIds)
  const availability = useMemo(() => new Map((availabilityData?.items ?? []).map((i) => [i.productId, i.available])), [availabilityData])
  const create = useCreateWithdrawal()

  const live = useMemo(() => validateLines(lines, header, availability), [lines, header, availability])
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
      return Object.fromEntries(
        Object.keys(prev)
          .filter((k) => current[k])
          .map((k) => [k, current[k]])
      )
    })
  }, [header, canBackdate])
  const liveHeader = useMemo(() => validateHeader(header, canBackdate), [header, canBackdate])
  // Errores en vivo: los de las líneas ya llenas y los de la cabecera, salvo lo que falta llenar.
  const shownLineErrors = useMemo(() => visibleLineErrors(lines, lineErrors, live.lines), [lines, lineErrors, live])
  const shownHeaderErrors = useMemo(() => visibleHeaderErrors(headerErrors, liveHeader, ['warehouseId', 'receivedBy', 'note']), [headerErrors, liveHeader])

  // Los botones se habilitan solo si el paso está completo; el motivo se muestra al lado.
  const headerBlocked = firstIssue(liveHeader)
  // La existencia del almacén se espera antes de avanzar (si la consulta falla, el backend valida igual).
  const stockPending = Boolean(header.warehouseId) && !availabilityError && productIds.some((id) => !availability.has(id))
  const linesBlocked = stockPending ? 'Consultando la existencia del almacén…' : firstLineIssue(lines, live.lines, ['product', 'quantity', 'asset', 'stock'])

  const goToLines = () => {
    if (!headerBlocked) setStep(2)
  }
  const goToReview = () => {
    if (!linesBlocked) setStep(3)
  }
  const reset = () => {
    setStep(1)
    setHeader({ ...EMPTY_HEADER, warehouseId: header.warehouseId, date: isoDay(new Date()) })
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
      warehouseId: header.warehouseId,
      reason: header.reason,
      movementDate: header.date === today ? undefined : new Date(`${header.date}T12:00:00`).toISOString(),
      receivedBy: header.receivedBy.trim() || null,
      workOrder: header.workOrder.replace(/-+$/, '') ? `OT-${header.workOrder.replace(/-+$/, '')}` : null,
      note: header.note.trim() || null,
      lines: lines.map((l) => ({
        productId: l.product.id,
        quantity: normalizeQuantity(l.quantity),
        assetId: l.asset?.id ?? null,
        note: l.note.trim() || null,
      })),
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

  const footerButton =
    'inline-flex h-11 items-center justify-center gap-2 rounded-md px-5 text-sm font-semibold transition-colors disabled:opacity-60'

  return (
    <MotionConfig reducedMotion='user'>
      <div className='mx-auto max-w-4xl font-plex text-ink-900'>
        <Link to='/movements' className='inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900'>
          <ArrowLeft className='size-4' aria-hidden />
          Movimientos
        </Link>
        <header className='mt-3 flex flex-wrap items-end justify-between gap-4'>
          <div>
            <h1 className='text-[1.75rem] font-semibold tracking-tight'>Nueva orden de retiro</h1>
            <p className='mt-0.5 text-sm text-ink-500'>Salida de productos del almacén hacia los activos que los consumen</p>
          </div>
          {step !== 'done' && <Steps step={step} items={['Datos de la orden', 'Líneas', 'Revisar']} />}
        </header>

        {serverError && step !== 'done' && (
          <div className='mt-5'>
            <Banner>{serverError.message ?? 'No se pudo registrar la orden'}</Banner>
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
              <HeaderStep header={header} setHeader={setHeader} errors={shownHeaderErrors} warehouses={warehouses} canBackdate={canBackdate} />
            )}
            {step === 2 && (
              <LinesStep
                header={header}
                warehouseCode={warehouse?.code}
                lines={lines}
                setLines={setLines}
                errors={{ lines: shownLineErrors }}
                availability={availability}
                assetFilter={assetFilter}
                setAssetFilter={setAssetFilter}
              />
            )}
            {step === 3 && <ReviewStep header={header} lines={lines} warehouse={warehouse} totals={live.totals} />}
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
                Continuar con las líneas
              </NextButton>
            )}
            {step === 2 && (
              <NextButton onClick={goToReview} blockedReason={linesBlocked}>
                Revisar la orden
              </NextButton>
            )}
            {step === 3 && (
              <NextButton onClick={confirm} blockedReason={headerBlocked ?? linesBlocked} pending={create.isPending} pendingLabel='Registrando…' tone='confirm'>
                Confirmar orden
              </NextButton>
            )}
          </div>
        )}
      </div>
    </MotionConfig>
  )
}
