import { useEffect, useId, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Info, Sparkles } from 'lucide-react'
import { SidePanel } from '@/components/common/SidePanel'
import { FieldError, FormAlert, SubmitButton, TextField } from '@/features/auth/components/AuthUI'
import { useUnitOptions } from '@/features/units/unitsApi'
import { flattenTree, useCategoryOptions } from '@/features/product-categories/productCategoriesApi'
import { useCreateProduct, useNextProductCode, useUpdateProduct } from './productsApi'

const QUANTITY = /^\d{1,11}(\.\d{1,3})?$/

// Mismas reglas que el backend (business_rules.md §6.4, naming_conventions.md §6.2).
const schema = z
  .object({
    name: z.string().trim().min(2, 'Mínimo 2 caracteres').max(150, 'Máximo 150 caracteres'),
    categoryId: z.string().min(1, 'Elige la categoría'),
    unitId: z.string().min(1, 'Elige la unidad'),
    code: z.string().trim().toUpperCase().refine((v) => v === '' || /^[A-Z]{4}-\d{4}$/.test(v), 'Formato CATE-0001'),
    minStock: z.string().trim().regex(QUANTITY, 'Número ≥ 0 con hasta 3 decimales'),
    maxStock: z.string().trim().refine((v) => v === '' || QUANTITY.test(v), 'Número ≥ 0 con hasta 3 decimales'),
  })
  .superRefine((v, ctx) => {
    if (v.maxStock !== '' && QUANTITY.test(v.minStock) && Number(v.maxStock) < Number(v.minStock)) {
      ctx.addIssue({ code: 'custom', path: ['maxStock'], message: 'No puede ser menor que el mínimo' })
    }
  })

const EMPTY = { name: '', categoryId: '', unitId: '', code: '', minStock: '0', maxStock: '' }

const selectClass =
  'h-11 w-full cursor-pointer rounded-md border border-line bg-white px-3 text-[15px] text-ink-900 outline-none transition focus:border-forest-700 focus:ring-4 focus:ring-forest-700/10 disabled:cursor-not-allowed disabled:bg-sand-50 disabled:text-ink-500 aria-[invalid=true]:border-red-500'

/** "50.000" → "50" para el campo de texto. */
const trimQuantity = (value) => (value === null || value === undefined ? '' : String(Number(value)))

/**
 * Alta y edición de un producto. El código se sugiere según la categoría (LUBR-0003) y, si no se
 * toca, lo asigna el backend al guardar (así dos altas simultáneas no chocan). Si el producto ya
 * tiene movimientos, la unidad, la categoría y el código quedan bloqueados.
 */
export function ProductFormPanel({ open, product, onClose }) {
  const editing = Boolean(product)
  const categoryFieldId = useId()
  const unitFieldId = useId()
  const create = useCreateProduct()
  const update = useUpdateProduct()
  const [formError, setFormError] = useState('')
  const [codeTouched, setCodeTouched] = useState(false)

  const { data: tree = [] } = useCategoryOptions()
  const { data: units = [] } = useUnitOptions()

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
    setCodeTouched(false)
    reset(
      editing
        ? {
            name: product.name,
            categoryId: String(product.category.id),
            unitId: String(product.unit.id),
            code: product.code,
            minStock: trimQuantity(product.minStock),
            maxStock: trimQuantity(product.maxStock),
          }
        : EMPTY
    )
  }, [open, product, editing, reset])

  const locked = editing && product.hasMovements
  const categoryId = watch('categoryId')
  const categoryChanged = editing ? categoryId !== String(product.category.id) : Boolean(categoryId)

  // Sugerencia del backend para la categoría elegida (al crear, o al mudar el producto de categoría).
  const { data: suggestion, isFetching: suggesting } = useNextProductCode(categoryId ? Number(categoryId) : null, {
    enabled: open && categoryChanged && !locked,
  })
  useEffect(() => {
    if (codeTouched) return
    if (categoryChanged && suggestion) setValue('code', suggestion.code)
    else if (editing && !categoryChanged) setValue('code', product.code)
  }, [suggestion, categoryChanged, codeTouched, editing, product, setValue])

  const categoryOptions = useMemo(() => flattenTree(tree), [tree])
  const selectedCategory = categoryOptions.find((c) => String(c.id) === categoryId)

  const buildBody = (values) => {
    const base = {
      name: values.name,
      categoryId: Number(values.categoryId),
      unitId: Number(values.unitId),
      minStock: values.minStock,
      maxStock: values.maxStock === '' ? null : values.maxStock,
    }
    // El código solo viaja si el usuario lo escribió; si no, el backend asigna el siguiente.
    const reference = categoryChanged ? suggestion?.code : product?.code
    const manualCode = codeTouched && values.code && values.code !== reference ? values.code : undefined
    if (!editing) return { ...base, ...(manualCode && { code: manualCode }) }

    const body = {}
    if (base.name !== product.name) body.name = base.name
    if (base.categoryId !== product.category.id) body.categoryId = base.categoryId
    if (base.unitId !== product.unit.id) body.unitId = base.unitId
    if (Number(base.minStock) !== Number(product.minStock)) body.minStock = base.minStock
    if ((base.maxStock === null) !== (product.maxStock === null) || Number(base.maxStock) !== Number(product.maxStock)) body.maxStock = base.maxStock
    if (manualCode && manualCode !== product.code) body.code = manualCode
    return body
  }

  const onSubmit = async (values) => {
    setFormError('')
    try {
      const body = buildBody(values)
      if (!editing) await create.mutateAsync(body)
      else if (Object.keys(body).length) await update.mutateAsync({ id: product.id, body })
      onClose()
    } catch (error) {
      const fields = ['name', 'categoryId', 'unitId', 'code', 'minStock', 'maxStock']
      const issues = Array.isArray(error?.details) ? error.details.filter((d) => fields.includes(d.path)) : []
      issues.forEach((issue) => setError(issue.path, { message: issue.message }))
      if (!issues.length) setFormError(error?.message ?? 'No se pudo guardar el producto')
    }
  }

  const codeField = register('code')
  const selectedUnit = units.find((u) => String(u.id) === watch('unitId')) ?? (editing ? product.unit : null)

  return (
    <SidePanel
      open={open}
      onClose={onClose}
      title={editing ? 'Editar producto' : 'Nuevo producto'}
      subtitle={editing ? `${product.code} · ${product.category.name}` : undefined}
      footer={
        <>
          <button
            type='button'
            onClick={onClose}
            className='h-11 rounded-md border border-line bg-white text-[15px] font-semibold text-ink-900 transition-colors hover:bg-sand-50'
          >
            Cancelar
          </button>
          <SubmitButton form='product-form' loading={isSubmitting} loadingText='Guardando…'>
            {editing ? 'Guardar cambios' : 'Crear producto'}
          </SubmitButton>
        </>
      }
    >
      <form id='product-form' onSubmit={handleSubmit(onSubmit)} noValidate className='space-y-5'>
        {locked && (
          <div className='flex gap-2.5 rounded-md bg-sand-50 px-3.5 py-3 text-sm text-ink-900 ring-1 ring-line'>
            <Info className='mt-0.5 size-4 shrink-0 text-forest-700' aria-hidden />
            <span>
              Ya tiene movimientos: la unidad, la categoría y el código no se pueden cambiar, porque cambiarían la lectura de su
              historial. El nombre y el mínimo/máximo sí.
            </span>
          </div>
        )}

        <TextField label='Nombre' placeholder='Aceite de motor 15W40' autoFocus error={errors.name?.message} {...register('name')} />

        <div>
          <label htmlFor={categoryFieldId} className='mb-1.5 block text-[13px] font-medium text-ink-900'>
            Categoría
          </label>
          <select id={categoryFieldId} disabled={locked} aria-invalid={Boolean(errors.categoryId)} className={selectClass} {...register('categoryId')}>
            <option value=''>Elige…</option>
            {/* La categoría actual aparece aunque esté inactiva, para no perderla al editar. */}
            {editing && !categoryOptions.some((c) => c.id === product.category.id) && (
              <option value={product.category.id}>
                {product.category.code} · {product.category.name}
              </option>
            )}
            {categoryOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {'   '.repeat(c.depth)}
                {c.depth > 0 ? '└ ' : ''}
                {c.code} · {c.name}
              </option>
            ))}
          </select>
          <FieldError message={errors.categoryId?.message} />
          {selectedCategory && !selectedCategory.isLeaf && (
            <p className='mt-1.5 text-xs text-ink-500'>
              {selectedCategory.code} tiene subcategorías: conviene usar la más específica (naming_conventions §6.1).
            </p>
          )}
        </div>

        <div>
          <TextField
            label='Código'
            placeholder={categoryId ? 'Calculando…' : 'Elige primero la categoría'}
            maxLength={9}
            autoComplete='off'
            spellCheck={false}
            disabled={locked || !categoryId}
            className='[&_input]:font-mono [&_input]:uppercase [&_input]:tracking-[0.12em]'
            error={errors.code?.message}
            {...codeField}
            onChange={(e) => {
              e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '')
              setCodeTouched(true)
              codeField.onChange(e)
            }}
          />
          {!locked && categoryChanged && suggestion && (
            <p className='mt-1.5 flex items-center gap-1.5 text-xs text-ink-500'>
              <Sparkles className='size-3.5 text-forest-700' aria-hidden />
              {suggesting
                ? 'Buscando el siguiente código…'
                : codeTouched && watch('code') !== suggestion.code
                  ? (
                    <>
                      Código manual.{' '}
                      <button
                        type='button'
                        className='font-semibold text-forest-700 hover:underline'
                        onClick={() => {
                          setCodeTouched(false)
                          setValue('code', suggestion.code)
                        }}
                      >
                        Usar {suggestion.code}
                      </button>
                    </>
                  )
                  : `Siguiente código libre de ${suggestion.categoryCode}${editing ? ': el producto cambia de código al moverlo' : ''}.`}
            </p>
          )}
        </div>

        <div>
          <label htmlFor={unitFieldId} className='mb-1.5 block text-[13px] font-medium text-ink-900'>
            Unidad
          </label>
          <select id={unitFieldId} disabled={locked} aria-invalid={Boolean(errors.unitId)} className={selectClass} {...register('unitId')}>
            <option value=''>Elige…</option>
            {editing && !units.some((u) => u.id === product.unit.id) && (
              <option value={product.unit.id}>
                {product.unit.code} · {product.unit.name}
              </option>
            )}
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.code} · {u.name}
              </option>
            ))}
          </select>
          <FieldError message={errors.unitId?.message} />
          {!locked && <p className='mt-1.5 text-xs text-ink-500'>Las existencias se guardan en esta unidad. Tras el primer movimiento ya no se puede cambiar.</p>}
        </div>

        <div className='grid grid-cols-2 gap-3'>
          <TextField
            label={`Mínimo${selectedUnit ? ` (${selectedUnit.code})` : ''}`}
            placeholder='0'
            inputMode='decimal'
            autoComplete='off'
            className='[&_input]:tabular-nums'
            error={errors.minStock?.message}
            {...register('minStock')}
          />
          <TextField
            label={`Máximo${selectedUnit ? ` (${selectedUnit.code})` : ''}`}
            placeholder='Sin máximo'
            inputMode='decimal'
            autoComplete='off'
            className='[&_input]:tabular-nums'
            error={errors.maxStock?.message}
            {...register('maxStock')}
          />
        </div>
        <p className='-mt-3 text-xs text-ink-500'>Por debajo del mínimo o por encima del máximo, el producto aparece en las alertas de existencias.</p>

        <FormAlert variant='error' message={formError} />
      </form>
    </SidePanel>
  )
}
