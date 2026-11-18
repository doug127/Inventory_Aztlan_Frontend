import { useEffect, useId, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AnimatePresence, motion } from 'framer-motion'
import { Info } from 'lucide-react'
import { SidePanel } from '@/components/common/SidePanel'
import { FieldError, FormAlert, SubmitButton, TextField } from '@/features/auth/components/AuthUI'
import { cn } from '@/lib/utils'
import { useCreateUnit, useUpdateUnit } from './unitsApi'

const FACTOR = /^\d{1,12}(\.\d{1,6})?$/

// Mismas reglas que el backend (business_rules.md §6.3, naming_conventions.md §5).
const schema = z
  .object({
    name: z.string().trim().min(2, 'Mínimo 2 caracteres').max(50, 'Máximo 50 caracteres'),
    code: z.string().trim().toUpperCase().regex(/^[A-Z]{1,10}$/, 'De 1 a 10 letras, sin números ni espacios (ej. L, KG, TAMB)'),
    kind: z.enum(['base', 'derived']),
    baseUnitId: z.string(),
    conversionFactor: z.string().trim(),
  })
  .superRefine((v, ctx) => {
    if (v.kind !== 'derived') return
    if (!v.baseUnitId) ctx.addIssue({ code: 'custom', path: ['baseUnitId'], message: 'Elige la unidad base' })
    if (!FACTOR.test(v.conversionFactor) || Number(v.conversionFactor) <= 0) {
      ctx.addIssue({ code: 'custom', path: ['conversionFactor'], message: 'Número mayor que 0, con hasta 6 decimales' })
    }
  })

const EMPTY = { name: '', code: '', kind: 'base', baseUnitId: '', conversionFactor: '' }

const selectClass =
  'h-11 w-full cursor-pointer rounded-md border border-line bg-white px-3 text-[15px] text-ink-900 outline-none transition focus:border-forest-700 focus:ring-4 focus:ring-forest-700/10 disabled:cursor-not-allowed disabled:bg-sand-50 disabled:text-ink-500 aria-[invalid=true]:border-red-500'

/**
 * Alta y edición de una unidad. Al editar, lo que cambiaría la lectura del historial (código y
 * unidad base) se bloquea si algún producto usa la unidad; el backend también lo impide.
 */
export function UnitFormPanel({ open, unit, units, onClose }) {
  const editing = Boolean(unit)
  const baseSelectId = useId()
  const create = useCreateUnit()
  const update = useUpdateUnit()
  const [formError, setFormError] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema), defaultValues: EMPTY })

  useEffect(() => {
    if (!open) return
    setFormError('')
    reset(
      editing
        ? {
            name: unit.name,
            code: unit.code,
            kind: unit.isBase ? 'base' : 'derived',
            baseUnitId: unit.baseUnit ? String(unit.baseUnit.id) : '',
            conversionFactor: unit.isBase ? '' : unit.conversionFactor,
          }
        : EMPTY
    )
  }, [open, unit, editing, reset])

  const usedByProducts = editing ? unit.usage.totalProducts : 0
  const structureLocked = usedByProducts > 0
  const hasDerived = editing && unit.isBase && unit.usage.totalDerivedUnits > 0

  const kind = watch('kind')
  const code = watch('code')
  const baseUnitId = watch('baseUnitId')
  const factor = watch('conversionFactor')
  const baseOptions = useMemo(() => units.filter((u) => u.isBase && u.isActive && u.id !== unit?.id), [units, unit])
  const selectedBase = baseOptions.find((u) => String(u.id) === baseUnitId) ?? unit?.baseUnit
  const preview =
    kind === 'derived' && code && selectedBase && FACTOR.test(factor) && Number(factor) > 0
      ? `1 ${code.toUpperCase()} = ${Number(factor).toLocaleString('es', { maximumFractionDigits: 6 })} ${selectedBase.code}`
      : null

  const buildBody = (values) => {
    const baseId = values.kind === 'base' ? null : Number(values.baseUnitId)
    if (!editing) {
      return {
        code: values.code,
        name: values.name,
        baseUnitId: baseId,
        ...(values.kind === 'derived' && { conversionFactor: values.conversionFactor }),
      }
    }
    // Solo lo que cambió.
    const body = {}
    if (values.name !== unit.name) body.name = values.name
    if (values.code !== unit.code) body.code = values.code
    if (baseId !== (unit.baseUnit?.id ?? null)) body.baseUnitId = baseId
    if (values.kind === 'derived' && Number(values.conversionFactor) !== Number(unit.conversionFactor)) {
      body.conversionFactor = values.conversionFactor
    }
    return body
  }

  const onSubmit = async (values) => {
    setFormError('')
    try {
      const body = buildBody(values)
      if (!editing) await create.mutateAsync(body)
      else if (Object.keys(body).length) await update.mutateAsync({ id: unit.id, body })
      onClose()
    } catch (error) {
      const fields = ['code', 'name', 'baseUnitId', 'conversionFactor']
      const issues = Array.isArray(error?.details) ? error.details.filter((d) => fields.includes(d.path)) : []
      issues.forEach((issue) => setError(issue.path, { message: issue.message }))
      if (!issues.length) setFormError(error?.message ?? 'No se pudo guardar la unidad')
    }
  }

  const codeField = register('code')

  return (
    <SidePanel
      open={open}
      onClose={onClose}
      title={editing ? 'Editar unidad' : 'Nueva unidad'}
      subtitle={editing ? (unit.equivalence ?? `${unit.code} · unidad base`) : undefined}
      footer={
        <>
          <button
            type='button'
            onClick={onClose}
            className='h-11 rounded-md border border-line bg-white text-[15px] font-semibold text-ink-900 transition-colors hover:bg-sand-50'
          >
            Cancelar
          </button>
          <SubmitButton form='unit-form' loading={isSubmitting} loadingText='Guardando…'>
            {editing ? 'Guardar cambios' : 'Crear unidad'}
          </SubmitButton>
        </>
      }
    >
      <form id='unit-form' onSubmit={handleSubmit(onSubmit)} noValidate className='space-y-5'>
        {structureLocked && (
          <div className='flex gap-2.5 rounded-md bg-sand-50 px-3.5 py-3 text-sm text-ink-900 ring-1 ring-line'>
            <Info className='mt-0.5 size-4 shrink-0 text-forest-700' aria-hidden />
            <span>
              La usan {usedByProducts} {usedByProducts === 1 ? 'producto' : 'productos'}: el código y la unidad base ya no se pueden
              cambiar. El nombre y el factor sí.
            </span>
          </div>
        )}

        <TextField label='Nombre' placeholder='Tambor (208 L)' autoFocus error={errors.name?.message} {...register('name')} />

        <TextField
          label='Código'
          placeholder='TAMB'
          maxLength={10}
          autoComplete='off'
          spellCheck={false}
          disabled={structureLocked}
          className='[&_input]:font-mono [&_input]:uppercase [&_input]:tracking-[0.15em]'
          error={errors.code?.message}
          {...codeField}
          onChange={(e) => {
            e.target.value = e.target.value.toUpperCase().replace(/[^A-Z]/g, '')
            codeField.onChange(e)
          }}
        />

        {/* Tipo: base o derivada */}
        <fieldset disabled={structureLocked}>
          <legend className='mb-1.5 text-[13px] font-medium text-ink-900'>Tipo</legend>
          <div className='grid grid-cols-2 gap-2'>
            {[
              { value: 'base', label: 'Unidad base', hint: 'Factor 1 (L, KG, UND)' },
              { value: 'derived', label: 'Derivada', hint: hasDerived ? 'Es base de otras unidades' : 'Equivale a una base' },
            ].map((option) => {
              const disabled = structureLocked || (option.value === 'derived' && hasDerived)
              const checked = kind === option.value
              return (
                <label
                  key={option.value}
                  className={cn(
                    'relative cursor-pointer rounded-md border px-3.5 py-2.5 transition-colors',
                    checked ? 'border-forest-700 bg-forest-50' : 'border-line bg-white hover:border-ink-500/40',
                    disabled && 'cursor-not-allowed opacity-60'
                  )}
                >
                  <input
                    type='radio'
                    value={option.value}
                    disabled={disabled}
                    className='sr-only'
                    {...register('kind', {
                      onChange: (e) => e.target.value === 'base' && setValue('conversionFactor', ''),
                    })}
                  />
                  <span className='block text-sm font-medium text-ink-900'>{option.label}</span>
                  <span className='block text-xs text-ink-500'>{option.hint}</span>
                </label>
              )
            })}
          </div>
        </fieldset>

        <AnimatePresence initial={false}>
          {kind === 'derived' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className='overflow-hidden'
            >
              <div className='grid grid-cols-[1fr_1.2fr] gap-3 pt-0.5'>
                <div>
                  <TextField
                    label='Equivale a'
                    placeholder='208'
                    inputMode='decimal'
                    autoComplete='off'
                    className='[&_input]:tabular-nums'
                    error={errors.conversionFactor?.message}
                    {...register('conversionFactor')}
                  />
                </div>
                <div>
                  <label htmlFor={baseSelectId} className='mb-1.5 block text-[13px] font-medium text-ink-900'>
                    Unidad base
                  </label>
                  <select
                    id={baseSelectId}
                    disabled={structureLocked}
                    aria-invalid={Boolean(errors.baseUnitId)}
                    className={selectClass}
                    {...register('baseUnitId')}
                  >
                    <option value=''>Elige…</option>
                    {/* La base actual aparece aunque esté inactiva, para no perderla al editar. */}
                    {unit?.baseUnit && !baseOptions.some((b) => b.id === unit.baseUnit.id) && (
                      <option value={unit.baseUnit.id}>
                        {unit.baseUnit.code} · {unit.baseUnit.name}
                      </option>
                    )}
                    {baseOptions.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.code} · {b.name}
                      </option>
                    ))}
                  </select>
                  <FieldError message={errors.baseUnitId?.message} />
                </div>
              </div>

              <AnimatePresence initial={false} mode='wait'>
                {preview && (
                  <motion.p
                    key={preview}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className='mt-3 rounded-md bg-forest-50 px-3.5 py-2.5 font-mono text-sm text-forest-800'
                  >
                    {preview}
                  </motion.p>
                )}
              </AnimatePresence>
              {editing && !unit.isBase && usedByProducts > 0 && (
                <p className='mt-2 text-xs text-ink-500'>
                  Cambiar el factor solo afecta las conversiones futuras: las existencias se guardan en la unidad de cada producto.
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <FormAlert variant='error' message={formError} />
      </form>
    </SidePanel>
  )
}
