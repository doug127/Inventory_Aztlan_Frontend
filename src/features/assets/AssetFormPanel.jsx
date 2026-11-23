import { useEffect, useId, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Info, Sparkles } from 'lucide-react'
import { SidePanel } from '@/components/common/SidePanel'
import { CategoryIcon } from '@/components/common/categoryIcons'
import { FieldError, FormAlert, SubmitButton, TextField } from '@/features/auth/components/AuthUI'
import { useAssetCategoryTree } from '@/features/asset-categories/assetCategoriesApi'
import { useCreateAsset, useNextAssetCode, useUpdateAsset } from './assetsApi'

const CODE = /^[A-Z]{1,4}-[A-Z0-9]{1,5}$/

// Mismas reglas que el backend (business_rules.md §6.5, naming_conventions.md §7.2).
const schema = z.object({
  name: z.string().trim().min(2, 'Mínimo 2 caracteres').max(100, 'Máximo 100 caracteres'),
  categoryId: z.string().min(1, 'Elige la categoría'),
  code: z.string().trim().toUpperCase().refine((v) => v === '' || CODE.test(v), 'Formato PREFIJO-ID: T-01, TB-100, PE-TAL'),
})

const EMPTY = { name: '', categoryId: '', code: '' }
const FIELDS = ['name', 'categoryId', 'code']

const selectClass =
  'h-11 w-full cursor-pointer rounded-md border border-line bg-white px-3 text-[15px] text-ink-900 outline-none transition focus:border-forest-700 focus:ring-4 focus:ring-forest-700/10 disabled:cursor-not-allowed disabled:bg-sand-50 aria-[invalid=true]:border-red-500'

/**
 * Categorías hoja activas agrupadas por raíz, con su ruta ("Maquinaria agrícola › Tractor"). Solo
 * las hojas reciben activos (business_rules.md §6.2 regla 4).
 */
const leafGroups = (tree) =>
  tree
    .filter((root) => root.isActive)
    .map((root) => {
      const leaves = []
      const walk = (node, trail) => {
        if (!node.isActive) return
        if (node.isLeaf) leaves.push({ ...node, label: trail.length ? [...trail, node.name].join(' › ') : node.name })
        node.children.forEach((child) => walk(child, node === root ? [] : [...trail, node.name]))
      }
      walk(root, [])
      return { root, leaves }
    })
    .filter((g) => g.leaves.length)

/**
 * Alta y edición de un activo: código, nombre y categoría hoja. Al elegir la categoría se sugiere
 * el siguiente correlativo de su prefijo (T-03); si no se toca, lo asigna el backend al guardar.
 * Con movimientos el código queda bloqueado (aparece en órdenes impresas).
 */
export function AssetFormPanel({ open, asset, defaultCategoryId = null, onClose }) {
  const editing = Boolean(asset)
  const categoryFieldId = useId()
  const create = useCreateAsset()
  const update = useUpdateAsset()
  const [formError, setFormError] = useState('')
  const [codeTouched, setCodeTouched] = useState(false)

  const { data: tree = [] } = useAssetCategoryTree({ isActive: true })
  const groups = useMemo(() => leafGroups(tree), [tree])
  const leaves = useMemo(() => groups.flatMap((g) => g.leaves.map((leaf) => ({ ...leaf, root: g.root }))), [groups])

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
        ? { name: asset.name, categoryId: String(asset.category.id), code: asset.code }
        : { ...EMPTY, categoryId: defaultCategoryId ? String(defaultCategoryId) : '' }
    )
  }, [open, asset, editing, defaultCategoryId, reset])

  const locked = editing && asset.hasMovements
  const categoryId = watch('categoryId')
  const code = watch('code')
  const selected = leaves.find((l) => String(l.id) === categoryId)

  // Sugerencia solo al crear: al reclasificar un activo, su código no cambia.
  const { data: suggestion, isFetching: suggesting } = useNextAssetCode(categoryId ? Number(categoryId) : null, {
    enabled: open && !editing,
  })
  useEffect(() => {
    if (editing || codeTouched) return
    setValue('code', suggestion?.code ?? '')
  }, [suggestion, editing, codeTouched, setValue])

  // Sin correlativo que continuar, el código se escribe a mano.
  const codeRequired = !editing && suggestion && !suggestion.code

  const onSubmit = async (values) => {
    setFormError('')
    if (codeRequired && !values.code) {
      setError('code', { message: suggestion.prefix ? `Escribe el identificador: ${suggestion.prefix}-…` : 'Escribe el código: prefijo de 1 a 4 letras, guion e identificador' })
      return
    }
    try {
      if (!editing) {
        // El código solo viaja si el usuario lo cambió; si no, el backend asigna el siguiente.
        const manual = values.code && values.code !== suggestion?.code ? values.code : undefined
        await create.mutateAsync({ name: values.name, categoryId: Number(values.categoryId), ...(manual && { code: manual }) })
      } else {
        const body = {}
        if (values.name !== asset.name) body.name = values.name
        if (Number(values.categoryId) !== asset.category.id) body.categoryId = Number(values.categoryId)
        if (!locked && values.code && values.code !== asset.code) body.code = values.code
        if (Object.keys(body).length) await update.mutateAsync({ id: asset.id, body })
      }
      onClose()
    } catch (error) {
      const issues = Array.isArray(error?.details) ? error.details.filter((d) => FIELDS.includes(d.path)) : []
      issues.forEach((issue) => setError(issue.path, { message: issue.message }))
      if (!issues.length) setFormError(error?.message ?? 'No se pudo guardar el activo')
    }
  }

  const codeField = register('code')
  const codeHint = () => {
    if (locked || editing || !suggestion) return null
    if (suggesting) return 'Buscando el siguiente código…'
    if (suggestion.code) {
      return codeTouched && code !== suggestion.code ? (
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
      ) : (
        `Siguiente correlativo del prefijo ${suggestion.prefix}.`
      )
    }
    return suggestion.prefix
      ? `Los activos de ${suggestion.categoryCode} usan ${suggestion.prefix}- con un identificador propio (ej. ${suggestion.prefix}-TAL).`
      : `${suggestion.categoryCode} aún no tiene activos: elige un prefijo de 1 a 4 letras que no usen otras categorías.`
  }

  return (
    <SidePanel
      open={open}
      onClose={onClose}
      title={editing ? 'Editar activo' : 'Nuevo activo'}
      subtitle={editing ? `${asset.code} · ${asset.category.name}` : undefined}
      footer={
        <>
          <button
            type='button'
            onClick={onClose}
            className='h-11 rounded-md border border-line bg-white text-[15px] font-semibold text-ink-900 transition-colors hover:bg-sand-50'
          >
            Cancelar
          </button>
          <SubmitButton form='asset-form' loading={isSubmitting} loadingText='Guardando…'>
            {editing ? 'Guardar cambios' : 'Crear activo'}
          </SubmitButton>
        </>
      }
    >
      <form id='asset-form' onSubmit={handleSubmit(onSubmit)} noValidate className='space-y-5'>
        {locked && (
          <div className='flex gap-2.5 rounded-md bg-sand-50 px-3.5 py-3 text-sm text-ink-900 ring-1 ring-line'>
            <Info className='mt-0.5 size-4 shrink-0 text-forest-700' aria-hidden />
            <span>Ya tiene movimientos: el código no se puede cambiar porque aparece en órdenes impresas. El nombre y la categoría sí.</span>
          </div>
        )}

        <div>
          <label htmlFor={categoryFieldId} className='mb-1.5 block text-[13px] font-medium text-ink-900'>
            Categoría
          </label>
          <div className='flex gap-2'>
            <span className='grid size-11 shrink-0 place-items-center rounded-md bg-forest-700 text-white'>
              <CategoryIcon name={selected?.displayIcon ?? (editing ? asset.category.displayIcon : null)} className='size-5' />
            </span>
            <select
              id={categoryFieldId}
              aria-invalid={Boolean(errors.categoryId)}
              className={selectClass}
              {...register('categoryId', { onChange: () => setCodeTouched(false) })}
            >
              <option value=''>Elige…</option>
              {/* La categoría actual aparece aunque esté inactiva, para no perderla al editar. */}
              {editing && !leaves.some((l) => l.id === asset.category.id) && (
                <option value={asset.category.id}>{asset.category.name}</option>
              )}
              {groups.map(({ root, leaves: options }) => (
                <optgroup key={root.id} label={root.name}>
                  {options.map((leaf) => (
                    <option key={leaf.id} value={leaf.id}>
                      {leaf.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <FieldError message={errors.categoryId?.message} />
          <p className='mt-1.5 text-xs text-ink-500'>Solo aparecen las categorías sin subcategorías: la más específica (Tractor, no Vehículos).</p>
        </div>

        <TextField label='Nombre' placeholder='John Deere 6110' error={errors.name?.message} {...register('name')} />

        <div>
          <TextField
            label='Código'
            placeholder={categoryId ? (suggestion?.prefix ? `${suggestion.prefix}-…` : 'T-01') : 'Elige primero la categoría'}
            maxLength={10}
            autoComplete='off'
            spellCheck={false}
            disabled={locked || (!editing && !categoryId)}
            className='[&_input]:font-mono [&_input]:uppercase [&_input]:tracking-[0.12em]'
            error={errors.code?.message}
            {...codeField}
            onChange={(e) => {
              e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '')
              setCodeTouched(true)
              codeField.onChange(e)
            }}
          />
          {codeHint() && (
            <p className='mt-1.5 flex items-center gap-1.5 text-xs text-ink-500'>
              <Sparkles className='size-3.5 shrink-0 text-forest-700' aria-hidden />
              <span>{codeHint()}</span>
            </p>
          )}
        </div>

        <FormAlert variant='error' message={formError} />
      </form>
    </SidePanel>
  )
}
