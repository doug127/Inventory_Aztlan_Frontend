import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { MotionConfig, motion } from 'framer-motion'
import { ArrowLeft, Check, CheckCircle2, FileText, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDateTime } from '@/lib/format'
import { EASE_OUT } from '@/features/auth/components/AuthUI'
import { MOVEMENT_TYPE_LABELS, REASON_LABELS, useCreateCorrection, useMovement } from './movementsApi'
import { Banner, Card, Field, FormFooter, NextButton, fmt, fmtMilli, inputClass, isoDay, newKey, normalizeQuantity, toMilli, typedQuantity } from './movementForm'

// Corrección de un movimiento con su inverso (HU-406, business_rules.md §5; user_flow.md §9), solo
// ADMIN y SUPERADMIN. No edita el original: registra un movimiento inverso con la referencia
// REV-{documento}. Se eligen las líneas y cuánto revertir (como máximo lo que queda por corregir).
// El backend decide el tipo del inverso y repite todas las validaciones.

/** Qué registrará la corrección según el original (mismo criterio que el backend). */
const inverseDescription = (m) => {
  if (m.movementType === 'OUT') {
    return m.reason === 'PRESTAMO'
      ? `Una devolución a ${m.fromWarehouse.code} con el mismo activo: baja lo pendiente del préstamo.`
      : `Una entrada (motivo Otro) a ${m.fromWarehouse.code} con el mismo activo: el consumo del activo queda neto.`
  }
  if (m.movementType === 'IN') {
    return m.reason === 'DEVOLUCION'
      ? `Un préstamo desde ${m.toWarehouse.code} al mismo activo: lo devuelto de más vuelve a quedar pendiente.`
      : `Una salida (motivo Otro) desde ${m.toWarehouse.code}: necesita que la existencia siga en el almacén.`
  }
  if (m.movementType === 'TRANSFER') return `Un traslado de ${m.toWarehouse.code} de vuelta a ${m.fromWarehouse.code}.`
  return `Un ajuste ${m.toWarehouse ? 'faltante' : 'sobrante'} en ${(m.toWarehouse ?? m.fromWarehouse).code}, en sentido contrario.`
}

const remainingOf = (line) => toMilli(line.quantity) - toMilli(line.corrected)
/** Milésimas → texto para el campo de cantidad: 150500n → "150.5". */
const milliText = (milli) => {
  const decimals = String(milli % 1000n).padStart(3, '0').replace(/0+$/, '')
  return decimals ? `${milli / 1000n}.${decimals}` : String(milli / 1000n)
}

export function CorrectionPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: movement, isLoading, isError, error } = useMovement(Number(id))
  const create = useCreateCorrection()
  const [selected, setSelected] = useState(() => new Map())
  const [date, setDate] = useState(isoDay(new Date()))
  const [note, setNote] = useState('')
  const [serverError, setServerError] = useState(null)
  const [result, setResult] = useState(null)
  // Una clave por borrador: el doble clic no registra dos correcciones (P6).
  const [idempotencyKey] = useState(newKey)

  const back = (
    <Link to={`/movements/${id}`} className='inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900'>
      <ArrowLeft className='size-4' aria-hidden />
      Volver al movimiento
    </Link>
  )

  const issues = useMemo(() => {
    const byLine = {}
    for (const [lineId, quantity] of selected) {
      const line = movement?.lines.find((l) => l.id === lineId)
      if (!line) continue
      const milli = toMilli(quantity)
      if (milli === null) byLine[lineId] = quantity ? 'Hasta 3 decimales' : 'Indica cuánto revertir'
      else if (milli <= 0n) byLine[lineId] = 'Debe ser mayor que 0'
      else if (milli > remainingOf(line)) byLine[lineId] = `Queda por corregir ${fmtMilli(remainingOf(line))} ${line.product.unitCode}`
    }
    return byLine
  }, [selected, movement])

  if (isError) {
    return (
      <div className='mx-auto max-w-4xl font-plex'>
        {back}
        <p className='mt-10 text-center text-sm text-red-600'>{error?.status === 404 ? 'Este movimiento no existe.' : (error?.message ?? 'No se pudo cargar')}</p>
      </div>
    )
  }
  if (isLoading || !movement) {
    return (
      <div className='mx-auto max-w-4xl font-plex'>
        {back}
        <div className='mt-6 h-40 animate-pulse rounded-xl bg-sand-50' />
      </div>
    )
  }

  const isCorrection = Boolean(movement.correctionOf)
  const correctable = movement.lines.filter((l) => remainingOf(l) > 0n)
  const today = isoDay(new Date())
  const minDate = isoDay(new Date(movement.movementDate))
  const blockedReason = isCorrection
    ? `Es una corrección de ${movement.correctionOf.documentNumber}: corrige el original`
    : !correctable.length
      ? 'Todas las líneas ya están corregidas por completo'
      : !selected.size
        ? 'Marca al menos una línea a revertir'
        : Object.values(issues)[0] ?? (!note.trim() ? 'Explica por qué se corrige' : !date ? 'Indica la fecha' : date > today ? 'La fecha no puede ser futura' : date < minDate ? 'No puede ser anterior al movimiento original' : null)

  const toggle = (line) =>
    setSelected((prev) => {
      const next = new Map(prev)
      if (next.has(line.id)) next.delete(line.id)
      else next.set(line.id, milliText(remainingOf(line)))
      return next
    })

  const confirm = () => {
    setServerError(null)
    const body = {
      movementDate: date === today ? undefined : new Date(`${date}T12:00:00`).toISOString(),
      note: note.trim(),
      lines: [...selected].map(([lineId, quantity]) => ({ lineId, quantity: normalizeQuantity(quantity) })),
    }
    create.mutate(
      { movementId: movement.id, body, idempotencyKey },
      { onSuccess: (envelope) => setResult({ movement: envelope.data, meta: envelope.meta }), onError: setServerError }
    )
  }

  if (result) {
    return (
      <div className='mx-auto max-w-4xl font-plex text-ink-900'>
        <Card className='mx-auto mt-6 max-w-xl text-center'>
          <motion.span
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            className='mx-auto grid size-14 place-items-center rounded-full bg-forest-100 text-forest-800'
          >
            <CheckCircle2 className='size-7' aria-hidden />
          </motion.span>
          <p className='mt-4 text-sm text-ink-500'>{result.meta?.duplicated ? 'Esta corrección ya estaba registrada' : 'Corrección registrada'}</p>
          <p className='mt-1 font-mono text-3xl font-semibold tracking-wide'>{result.movement.documentNumber}</p>
          <p className='mt-1 font-mono text-sm text-ink-500'>{result.movement.reference}</p>
          <p className='mt-2 text-sm text-ink-500'>
            {MOVEMENT_TYPE_LABELS[result.movement.movementType]} · {REASON_LABELS[result.movement.reason] ?? result.movement.reason}
          </p>
          <div className='mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center'>
            <Link
              to={`/movements/${result.movement.id}`}
              className='inline-flex h-10 items-center justify-center gap-2 rounded-md bg-forest-700 px-4 text-sm font-semibold text-white hover:bg-forest-800'
            >
              <FileText className='size-4' aria-hidden />
              Ver la corrección
            </Link>
            <Link
              to={`/movements/${movement.id}`}
              className='inline-flex h-10 items-center justify-center gap-2 rounded-md border border-line bg-white px-4 text-sm font-medium hover:border-ink-500/40'
            >
              Volver a {movement.documentNumber}
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <MotionConfig reducedMotion='user'>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: EASE_OUT }} className='mx-auto max-w-4xl font-plex text-ink-900'>
        {back}
        <header className='mt-3'>
          <h1 className='flex items-center gap-2 text-[1.75rem] font-semibold tracking-tight'>
            <RotateCcw className='size-6 text-forest-700' aria-hidden />
            Corregir <span className='font-mono'>{movement.documentNumber}</span>
          </h1>
          <p className='mt-0.5 text-sm text-ink-500'>
            {MOVEMENT_TYPE_LABELS[movement.movementType]} · {REASON_LABELS[movement.reason] ?? movement.reason} · {formatDateTime(movement.movementDate)}
          </p>
        </header>

        {serverError && (
          <div className='mt-5'>
            <Banner>{serverError.message ?? 'No se pudo registrar la corrección'}</Banner>
          </div>
        )}

        <div className='mt-5 space-y-4'>
          <Banner tone='info'>
            El movimiento original no se modifica. Se registrará <strong>{inverseDescription(movement)}</strong> Llevará la referencia{' '}
            <span className='font-mono'>REV-{movement.documentNumber}</span>.
          </Banner>

          <Card className='p-0 sm:p-0'>
            <h2 className='border-b border-line/60 px-4 py-3 text-sm font-semibold sm:px-6'>Líneas a revertir</h2>
            <ul className='divide-y divide-line/60'>
              {movement.lines.map((line) => {
                const remaining = remainingOf(line)
                const chosen = selected.has(line.id)
                const done = remaining <= 0n
                return (
                  <li key={line.id} className={cn('flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:px-6', chosen && 'bg-forest-50/60', done && 'opacity-60')}>
                    <label className={cn('flex min-w-0 flex-1 items-start gap-3', !done && 'cursor-pointer')}>
                      <span
                        className={cn(
                          'mt-0.5 grid size-5 shrink-0 place-items-center rounded border transition-colors',
                          chosen ? 'border-forest-700 bg-forest-700 text-white' : 'border-line bg-white'
                        )}
                      >
                        {chosen && <Check className='size-3.5' aria-hidden />}
                      </span>
                      <input type='checkbox' className='sr-only' checked={chosen} disabled={done || isCorrection} onChange={() => toggle(line)} />
                      <span className='min-w-0'>
                        <span className='block truncate text-sm font-medium'>
                          {line.product.name} <span className='font-mono text-xs font-normal text-ink-500'>{line.product.code}</span>
                        </span>
                        {line.asset && (
                          <span className='block truncate text-xs text-ink-500'>
                            <span className='font-mono'>{line.asset.code}</span> · {line.asset.name}
                          </span>
                        )}
                        <span className='block text-xs text-ink-500 tabular-nums'>
                          Registrado {fmt(line.quantity)} {line.product.unitCode}
                          {toMilli(line.corrected) > 0n && <> · ya corregido {fmt(line.corrected)}</>}
                          {done ? ' · corregida por completo' : <> · queda {fmtMilli(remaining)}</>}
                        </span>
                      </span>
                    </label>
                    {chosen && (
                      <div className='w-36 sm:shrink-0'>
                        <div className='relative'>
                          <input
                            inputMode='decimal'
                            value={selected.get(line.id)}
                            onChange={(e) => setSelected((prev) => new Map(prev).set(line.id, typedQuantity(prev.get(line.id), e.target.value.trim())))}
                            aria-label={`Cantidad a revertir de ${line.product.name}`}
                            aria-invalid={Boolean(issues[line.id])}
                            className={cn(inputClass, 'h-10 pr-10 text-right tabular-nums')}
                          />
                          <span className='pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-500'>{line.product.unitCode}</span>
                        </div>
                        {issues[line.id] && <p className='mt-1 text-right text-xs text-red-600'>{issues[line.id]}</p>}
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
            <div className='grid gap-5 border-t border-line/60 px-4 pt-4 sm:grid-cols-[12rem_1fr] sm:px-6'>
              <Field label='Fecha' htmlFor='correction-date' required>
                <input id='correction-date' type='date' value={date} min={minDate} max={today} onChange={(e) => setDate(e.target.value)} className={inputClass} />
              </Field>
              <Field label='Observación' htmlFor='correction-note' required hint='Por qué se corrige: cantidad equivocada, activo errado…'>
                <textarea
                  id='correction-note'
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={1000}
                  rows={2}
                  className={cn(inputClass, 'h-auto min-h-11 py-2.5')}
                />
              </Field>
            </div>
            <div className='px-4 pb-4 sm:px-6'>
              <FormFooter>
                <button
                  type='button'
                  onClick={() => navigate(`/movements/${movement.id}`)}
                  className='inline-flex h-11 items-center justify-center rounded-md border border-line bg-white px-5 text-sm font-semibold text-ink-900 hover:border-ink-500/40'
                >
                  Cancelar
                </button>
                <NextButton onClick={confirm} blockedReason={blockedReason} pending={create.isPending} pendingLabel='Registrando…' tone='confirm'>
                  Confirmar corrección
                </NextButton>
              </FormFooter>
            </div>
          </Card>
        </div>
      </motion.div>
    </MotionConfig>
  )
}
