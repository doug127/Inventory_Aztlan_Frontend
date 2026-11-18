import { useEffect, useId, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Info } from 'lucide-react'
import { SidePanel } from '@/components/common/SidePanel'
import { FieldError, FormAlert, SubmitButton, TextField } from '@/features/auth/components/AuthUI'
import { flattenTree, subtreeIds, useCreateCategory, useUpdateCategory } from './productCategoriesApi'

// Mismas reglas que el backend (business_rules.md §6.2, naming_conventions.md §6.1).
const schema = z.object({
  name: z.string().trim().min(2, 'Mínimo 2 caracteres').max(100, 'Máximo 100 caracteres'),
  code: z.string().trim().toUpperCase().regex(/^[A-Z]{4}$/, 'Exactamente 4 letras (ej. LUBR, FERT)'),
  parentId: z.string(),
  description: z.string().trim().max(500, 'Máximo 500 caracteres'),
})

const EMPTY = { name: '', code: '', parentId: '', description: '' }

const fieldClass =
  'w-full rounded-md border border-line bg-white px-3 text-[15px] text-ink-900 outline-none transition focus:border-forest-700 focus:ring-4 focus:ring-forest-700/10 disabled:cursor-not-allowed disabled:bg-sand-50 disabled:text-ink-500 aria-[invalid=true]:border-red-500'

/**
 * Alta y edición de una categoría. El selector de padre ofrece el árbol de categorías activas, sin
 * la propia categoría ni su rama (evita ciclos; el backend también los rechaza). Así se puede mover
 * una categoría también desde el móvil, donde no hay arrastrar y soltar.
 *
 * category: la categoría a editar (o null). defaultParentId: padre sugerido al crear una subcategoría.
 */
export function CategoryFormPanel({ open, category, defaultParentId = null, tree, onClose }) {
  const editing = Boolean(category)
  const parentSelectId = useId()
  const descriptionId = useId()
  const create = useCreateCategory()
  const update = useUpdateCategory()
  const [formError, setFormError] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema), defaultValues: EMPTY })

  useEffect(() => {
    if (!open) return
    setFormError('')
    reset(
      editing
        ? {
            name: category.name,
            code: category.code,
            parentId: category.parent ? String(category.parent.id) : '',
            description: category.description ?? '',
          }
        : { ...EMPTY, parentId: defaultParentId ? String(defaultParentId) : '' }
    )
  }, [open, category, editing, defaultParentId, reset])

  // Opciones de padre: categorías activas en orden de árbol, sangradas por nivel.
  const parentOptions = useMemo(() => {
    const excluded = editing ? subtreeIds(category) : new Set()
    return flattenTree(tree).filter((n) => n.isActive && !excluded.has(n.id))
  }, [tree, editing, category])

  const totalProducts = editing ? category.usage.totalProducts : 0
  const codeLocked = totalProducts > 0

  const buildBody = (values) => {
    const parentId = values.parentId ? Number(values.parentId) : null
    const description = values.description || null
    if (!editing) return { code: values.code, name: values.name, parentId, description }
    // Solo lo que cambió.
    const body = {}
    if (values.name !== category.name) body.name = values.name
    if (values.code !== category.code) body.code = values.code
    if (parentId !== (category.parent?.id ?? null)) body.parentId = parentId
    if (description !== (category.description ?? null)) body.description = description
    return body
  }

  const onSubmit = async (values) => {
    setFormError('')
    try {
      const body = buildBody(values)
      if (!editing) await create.mutateAsync(body)
      else if (Object.keys(body).length) await update.mutateAsync({ id: category.id, body })
      onClose()
    } catch (error) {
      const fields = ['code', 'name', 'parentId', 'description']
      const issues = Array.isArray(error?.details) ? error.details.filter((d) => fields.includes(d.path)) : []
      issues.forEach((issue) => setError(issue.path, { message: issue.message }))
      if (!issues.length) setFormError(error?.message ?? 'No se pudo guardar la categoría')
    }
  }

  const codeField = register('code')

  return (
    <SidePanel
      open={open}
      onClose={onClose}
      title={editing ? 'Editar categoría' : defaultParentId ? 'Nueva subcategoría' : 'Nueva categoría'}
      subtitle={editing ? `${category.code} · ${category.parent ? `dentro de ${category.parent.name}` : 'categoría raíz'}` : undefined}
      footer={
        <>
          <button
            type='button'
            onClick={onClose}
            className='h-11 rounded-md border border-line bg-white text-[15px] font-semibold text-ink-900 transition-colors hover:bg-sand-50'
          >
            Cancelar
          </button>
          <SubmitButton form='category-form' loading={isSubmitting} loadingText='Guardando…'>
            {editing ? 'Guardar cambios' : 'Crear categoría'}
          </SubmitButton>
        </>
      }
    >
      <form id='category-form' onSubmit={handleSubmit(onSubmit)} noValidate className='space-y-5'>
        {codeLocked && (
          <div className='flex gap-2.5 rounded-md bg-sand-50 px-3.5 py-3 text-sm text-ink-900 ring-1 ring-line'>
            <Info className='mt-0.5 size-4 shrink-0 text-forest-700' aria-hidden />
            <span>
              Tiene {totalProducts} {totalProducts === 1 ? 'producto' : 'productos'} ({category.code}-0001…): el código ya no se puede
              cambiar. El nombre, la descripción y la categoría padre sí.
            </span>
          </div>
        )}

        <TextField label='Nombre' placeholder='Fertilizantes' autoFocus error={errors.name?.message} {...register('name')} />

        <TextField
          label='Código'
          placeholder='FERT'
          maxLength={4}
          autoComplete='off'
          spellCheck={false}
          disabled={codeLocked}
          className='[&_input]:font-mono [&_input]:uppercase [&_input]:tracking-[0.15em]'
          error={errors.code?.message}
          {...codeField}
          onChange={(e) => {
            e.target.value = e.target.value.toUpperCase().replace(/[^A-Z]/g, '')
            codeField.onChange(e)
          }}
        />
        {!codeLocked && <p className='-mt-3 text-xs text-ink-500'>Es el prefijo de los códigos de producto: FERT → FERT-0001.</p>}

        <div>
          <label htmlFor={parentSelectId} className='mb-1.5 block text-[13px] font-medium text-ink-900'>
            Categoría padre
          </label>
          <select id={parentSelectId} aria-invalid={Boolean(errors.parentId)} className={`${fieldClass} h-11 cursor-pointer`} {...register('parentId')}>
            <option value=''>— Ninguna (categoría raíz)</option>
            {/* El padre actual aparece aunque esté inactivo, para no perderlo al editar. */}
            {category?.parent && !parentOptions.some((p) => p.id === category.parent.id) && (
              <option value={category.parent.id}>
                {category.parent.code} · {category.parent.name}
              </option>
            )}
            {parentOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {'   '.repeat(p.depth)}
                {p.depth > 0 ? '└ ' : ''}
                {p.code} · {p.name}
              </option>
            ))}
          </select>
          <FieldError message={errors.parentId?.message} />
        </div>

        <div>
          <label htmlFor={descriptionId} className='mb-1.5 block text-[13px] font-medium text-ink-900'>
            Descripción <span className='font-normal text-ink-500'>(opcional)</span>
          </label>
          <textarea
            id={descriptionId}
            rows={3}
            maxLength={500}
            placeholder='Qué productos agrupa'
            aria-invalid={Boolean(errors.description)}
            className={`${fieldClass} resize-none py-2.5`}
            {...register('description')}
          />
          <FieldError message={errors.description?.message} />
        </div>

        <FormAlert variant='error' message={formError} />
      </form>
    </SidePanel>
  )
}
