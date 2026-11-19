import { useEffect, useId, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Info } from 'lucide-react'
import { SidePanel } from '@/components/common/SidePanel'
import { IconPicker } from '@/components/common/IconPicker'
import { CategoryIcon, getCategoryIcon } from '@/components/common/categoryIcons'
import { FieldError, FormAlert, SubmitButton, TextField } from '@/features/auth/components/AuthUI'
import { flattenTree, optionIndent, subtreeIds } from './treeUtils'

const FIELDS = ['code', 'name', 'parentId', 'description', 'icon']
const EMPTY = { name: '', code: '', parentId: '', description: '', icon: null }

const fieldClass =
  'w-full rounded-md border border-line bg-white px-3 text-[15px] text-ink-900 outline-none transition focus:border-forest-700 focus:ring-4 focus:ring-forest-700/10 disabled:cursor-not-allowed disabled:bg-sand-50 disabled:text-ink-500 aria-[invalid=true]:border-red-500'

/**
 * Alta y edición de una categoría de cualquiera de los dos árboles. El selector de padre ofrece las
 * categorías activas en orden de árbol, sin la propia ni su rama (evita ciclos; el backend también
 * los rechaza), así también se mueve desde el móvil. Solo las raíces eligen icono; una subcategoría
 * muestra el de su raíz.
 *
 * form: {
 *   useCreate, useUpdate,
 *   code: { pattern, message, maxLength, placeholder, sanitize(v), hint?(code), className },
 *   namePlaceholder, description?: { placeholder } (si no hay, no se muestra el campo),
 *   codeLock?(category) → texto | null, childBlocker?(node) → texto | null,
 * }
 */
export function CategoryTreeFormPanel({ form, open, category, defaultParentId = null, tree, onClose }) {
  const editing = Boolean(category)
  const parentSelectId = useId()
  const descriptionId = useId()
  const create = form.useCreate()
  const update = form.useUpdate()
  const [formError, setFormError] = useState('')

  const schema = useMemo(
    () =>
      z.object({
        name: z.string().trim().min(2, 'Mínimo 2 caracteres').max(100, 'Máximo 100 caracteres'),
        code: z.string().trim().toUpperCase().regex(form.code.pattern, form.code.message),
        parentId: z.string(),
        description: z.string().trim().max(500, 'Máximo 500 caracteres'),
        icon: z.string().nullable(),
      }),
    [form.code.pattern, form.code.message]
  )

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    clearErrors,
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
            icon: category.icon ?? null,
          }
        : { ...EMPTY, parentId: defaultParentId ? String(defaultParentId) : '' }
    )
  }, [open, category, editing, defaultParentId, reset])

  const nodes = useMemo(() => flattenTree(tree), [tree])
  // Opciones de padre: activas, sin la propia rama. Las que no admiten hijas aparecen deshabilitadas.
  const parentOptions = useMemo(() => {
    const excluded = editing ? subtreeIds(category) : new Set()
    return nodes.filter((n) => n.isActive && !excluded.has(n.id))
  }, [nodes, editing, category])

  const parentValue = watch('parentId')
  const isRoot = parentValue === ''
  const parentNode = nodes.find((n) => String(n.id) === parentValue)
  const icon = watch('icon')
  const codeLock = editing ? form.codeLock?.(category) : null
  const losesIcon = editing && !category.parent && category.icon && !isRoot

  const buildBody = (values) => {
    const parentId = values.parentId ? Number(values.parentId) : null
    const description = values.description || null
    const iconValue = parentId === null ? values.icon : undefined
    if (!editing) {
      return {
        code: values.code,
        name: values.name,
        parentId,
        ...(form.description && { description }),
        ...(iconValue && { icon: iconValue }),
      }
    }
    // Solo lo que cambió.
    const body = {}
    if (values.name !== category.name) body.name = values.name
    if (values.code !== category.code) body.code = values.code
    if (parentId !== (category.parent?.id ?? null)) body.parentId = parentId
    if (form.description && description !== (category.description ?? null)) body.description = description
    if (iconValue !== undefined && iconValue !== (category.icon ?? null)) body.icon = iconValue
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
      const issues = Array.isArray(error?.details) ? error.details.filter((d) => FIELDS.includes(d.path)) : []
      issues.forEach((issue) => setError(issue.path, { message: issue.message }))
      if (!issues.length) setFormError(error?.message ?? 'No se pudo guardar la categoría')
    }
  }

  const codeField = register('code')
  const inherited = parentNode ? getCategoryIcon(parentNode.displayIcon) : null

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
          <SubmitButton form='category-tree-form' loading={isSubmitting} loadingText='Guardando…'>
            {editing ? 'Guardar cambios' : 'Crear categoría'}
          </SubmitButton>
        </>
      }
    >
      <form id='category-tree-form' onSubmit={handleSubmit(onSubmit)} noValidate className='space-y-5'>
        {codeLock && (
          <div className='flex gap-2.5 rounded-md bg-sand-50 px-3.5 py-3 text-sm text-ink-900 ring-1 ring-line'>
            <Info className='mt-0.5 size-4 shrink-0 text-forest-700' aria-hidden />
            <span>{codeLock}</span>
          </div>
        )}

        <TextField label='Nombre' placeholder={form.namePlaceholder} autoFocus error={errors.name?.message} {...register('name')} />

        <div>
          <TextField
            label='Código'
            placeholder={form.code.placeholder}
            maxLength={form.code.maxLength}
            autoComplete='off'
            spellCheck={false}
            disabled={Boolean(codeLock)}
            className={form.code.className}
            error={errors.code?.message}
            {...codeField}
            onChange={(e) => {
              e.target.value = form.code.sanitize(e.target.value)
              codeField.onChange(e)
            }}
          />
          {!codeLock && form.code.hint && <p className='mt-1.5 text-xs text-ink-500'>{form.code.hint(watch('code'))}</p>}
        </div>

        <div>
          <label htmlFor={parentSelectId} className='mb-1.5 block text-[13px] font-medium text-ink-900'>
            Categoría padre
          </label>
          <select
            id={parentSelectId}
            aria-invalid={Boolean(errors.parentId)}
            className={`${fieldClass} h-11 cursor-pointer`}
            {...register('parentId', { onChange: () => clearErrors(['parentId', 'icon']) })}
          >
            <option value=''>— Ninguna (categoría raíz)</option>
            {/* El padre actual aparece aunque esté inactivo, para no perderlo al editar. */}
            {category?.parent && !parentOptions.some((p) => p.id === category.parent.id) && (
              <option value={category.parent.id}>
                {category.parent.code} · {category.parent.name}
              </option>
            )}
            {parentOptions.map((p) => {
              const blocker = form.childBlocker?.(p)
              return (
                <option key={p.id} value={p.id} disabled={Boolean(blocker) && String(p.id) !== parentValue}>
                  {optionIndent(p.depth)}
                  {p.code} · {p.name}
                  {blocker ? ` — ${blocker.toLowerCase()}` : ''}
                </option>
              )
            })}
          </select>
          <FieldError message={errors.parentId?.message} />
        </div>

        {isRoot ? (
          <IconPicker
            value={icon}
            onChange={(key) => setValue('icon', key, { shouldDirty: true })}
            error={errors.icon?.message}
            hint='Lo muestran la categoría y todas sus subcategorías.'
          />
        ) : (
          <div>
            <div className='flex items-center gap-3 rounded-md bg-sand-50 px-3.5 py-3 text-sm ring-1 ring-line'>
              <span className='grid size-8 shrink-0 place-items-center rounded-md bg-forest-50 text-forest-800'>
                <CategoryIcon name={parentNode?.displayIcon} className='size-4' />
              </span>
              <span className='text-ink-900'>
                {losesIcon ? 'Al moverla dentro de otra categoría pierde su icono propio y usa' : 'Las subcategorías usan'} el icono de su
                raíz{inherited ? ` (${inherited.label.toLowerCase()})` : ''}.
              </span>
            </div>
            <FieldError message={errors.icon?.message} />
          </div>
        )}

        {form.description && (
          <div>
            <label htmlFor={descriptionId} className='mb-1.5 block text-[13px] font-medium text-ink-900'>
              Descripción <span className='font-normal text-ink-500'>(opcional)</span>
            </label>
            <textarea
              id={descriptionId}
              rows={3}
              maxLength={500}
              placeholder={form.description.placeholder}
              aria-invalid={Boolean(errors.description)}
              className={`${fieldClass} resize-none py-2.5`}
              {...register('description')}
            />
            <FieldError message={errors.description?.message} />
          </div>
        )}

        <FormAlert variant='error' message={formError} />
      </form>
    </SidePanel>
  )
}
