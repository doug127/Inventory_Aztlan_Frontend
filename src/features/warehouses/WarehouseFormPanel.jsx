import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { SidePanel } from '@/components/common/SidePanel'
import { FormAlert, SubmitButton, TextField } from '@/features/auth/components/AuthUI'
import { useCreateWarehouse, useUpdateWarehouse } from './warehousesApi'

// Mismas reglas que el backend (business_rules.md §6.1, naming_conventions.md §4).
const schema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{4}$/, 'Exactamente 4 caracteres: letras A-Z o números (ej. COMB)'),
  name: z.string().trim().min(3, 'Mínimo 3 caracteres').max(100, 'Máximo 100 caracteres'),
})

const EMPTY = { code: '', name: '' }

/** Alta y edición de un almacén en el panel lateral (ADMIN o superior). */
export function WarehouseFormPanel({ open, warehouse, onClose }) {
  const editing = Boolean(warehouse)
  const create = useCreateWarehouse()
  const update = useUpdateWarehouse()
  const [formError, setFormError] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm({ resolver: zodResolver(schema), defaultValues: EMPTY })

  useEffect(() => {
    if (!open) return
    setFormError('')
    reset(editing ? { code: warehouse.code, name: warehouse.name } : EMPTY)
  }, [open, warehouse, editing, reset])

  const onSubmit = async (values) => {
    setFormError('')
    try {
      if (editing) {
        const body = Object.fromEntries(Object.keys(dirtyFields).map((key) => [key, values[key]]))
        if (Object.keys(body).length) await update.mutateAsync({ id: warehouse.id, body })
      } else {
        await create.mutateAsync(values)
      }
      onClose()
    } catch (error) {
      // DUPLICATE_CODE, INVALID_CODE_FORMAT y HAS_DEPENDENCIES traen el campo en details.
      const issues = Array.isArray(error?.details) ? error.details.filter((d) => ['code', 'name'].includes(d.path)) : []
      issues.forEach((issue) => setError(issue.path, { message: issue.message }))
      if (!issues.length) setFormError(error?.message ?? 'No se pudo guardar el almacén')
    }
  }

  const codeField = register('code')

  return (
    <SidePanel
      open={open}
      onClose={onClose}
      title={editing ? 'Editar almacén' : 'Nuevo almacén'}
      subtitle={editing ? warehouse.code : undefined}
      footer={
        <>
          <button
            type='button'
            onClick={onClose}
            className='h-11 rounded-md border border-line bg-white text-[15px] font-semibold text-ink-900 transition-colors hover:bg-sand-50'
          >
            Cancelar
          </button>
          <SubmitButton form='warehouse-form' loading={isSubmitting} loadingText='Guardando…'>
            {editing ? 'Guardar cambios' : 'Crear almacén'}
          </SubmitButton>
        </>
      }
    >
      <form id='warehouse-form' onSubmit={handleSubmit(onSubmit)} noValidate className='space-y-5'>
        <TextField label='Nombre' placeholder='Almacén de Combustibles' autoFocus error={errors.name?.message} {...register('name')} />

        <div>
          <TextField
            label='Código'
            placeholder='COMB'
            maxLength={4}
            autoComplete='off'
            spellCheck={false}
            className='[&_input]:font-mono [&_input]:uppercase [&_input]:tracking-[0.2em]'
            error={errors.code?.message}
            {...codeField}
            onChange={(e) => {
              e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')
              codeField.onChange(e)
            }}
          />
          <p className='mt-1.5 text-xs leading-relaxed text-ink-500'>
            4 letras o números que identifiquen el almacén a simple vista: PRIN, COMB, AGRO, REPU, TALL.
            {editing && ' No se puede cambiar si el almacén ya tiene movimientos.'}
          </p>
        </div>

        <FormAlert variant='error' message={formError} />
      </form>
    </SidePanel>
  )
}
