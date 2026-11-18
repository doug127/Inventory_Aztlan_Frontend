import { useEffect, useId, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mail } from 'lucide-react'
import { FieldError, FormAlert, SubmitButton, TextField } from '@/features/auth/components/AuthUI'
import { useAssignableRoles, useCreateUser, useUpdateUser } from '../hooks/useUsers'
import { suggestUsername, userFormSchema } from '../usersUtils'
import { SidePanel } from '@/components/common/SidePanel'

const EMPTY = { fullName: '', email: '', username: '', roleCode: '' }

/** Errores del backend por campo (DUPLICATE_CODE, VALIDATION_ERROR) → errores del formulario. */
const applyServerErrors = (error, setError) => {
  const issues = Array.isArray(error?.details) ? error.details : []
  let applied = false
  for (const issue of issues) {
    if (['fullName', 'email', 'username', 'roleCode'].includes(issue.path)) {
      setError(issue.path, { message: issue.message })
      applied = true
    }
  }
  return applied
}

/**
 * Alta y edición (HU-107). En el alta no se pide contraseña: el sistema envía la temporal por
 * correo y obliga a cambiarla en el primer ingreso. El rol solo ofrece los de rango inferior.
 */
export function UserFormPanel({ open, user, onClose }) {
  const editing = Boolean(user)
  const roleId = useId()
  const { data: roles = [], isLoading: rolesLoading } = useAssignableRoles()
  const createUser = useCreateUser()
  const updateUser = useUpdateUser()
  const [formError, setFormError] = useState('')
  const [usernameTouched, setUsernameTouched] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm({ resolver: zodResolver(userFormSchema), defaultValues: EMPTY })

  useEffect(() => {
    if (!open) return
    setFormError('')
    setUsernameTouched(editing)
    reset(editing ? { fullName: user.fullName, email: user.email, username: user.username, roleCode: user.role.code } : EMPTY)
  }, [open, user, editing, reset])

  // En el alta, rol por defecto: el de menor rango (cuando llegan los roles, sin tocar lo escrito).
  const roleCode = watch('roleCode')
  useEffect(() => {
    if (open && !editing && !roleCode && roles.length) setValue('roleCode', roles.at(-1).code)
  }, [open, editing, roleCode, roles, setValue])

  // Sugerencia nombre.apellido mientras no se escriba el username a mano.
  const fullName = watch('fullName')
  useEffect(() => {
    if (!editing && !usernameTouched) setValue('username', suggestUsername(fullName ?? ''))
  }, [fullName, editing, usernameTouched, setValue])

  const onSubmit = async (values) => {
    setFormError('')
    try {
      if (editing) {
        // Solo se envía lo que cambió.
        const body = Object.fromEntries(Object.keys(dirtyFields).map((key) => [key, values[key]]))
        if (Object.keys(body).length) await updateUser.mutateAsync({ id: user.id, body })
      } else {
        await createUser.mutateAsync(values)
      }
      onClose()
    } catch (error) {
      if (!applyServerErrors(error, setError)) setFormError(error?.message ?? 'No se pudo guardar el usuario')
    }
  }

  // El rol actual de un usuario siempre aparece, aunque el actor no pueda asignarlo.
  const roleOptions =
    editing && !roles.some((r) => r.code === user.role.code) ? [{ code: user.role.code, name: user.role.name }, ...roles] : roles
  const usernameField = register('username')

  return (
    <SidePanel
      open={open}
      onClose={onClose}
      title={editing ? 'Editar usuario' : 'Nuevo usuario'}
      subtitle={editing ? user.email : undefined}
      footer={
        <>
          <button
            type='button'
            onClick={onClose}
            className='h-11 rounded-md border border-line bg-white text-[15px] font-semibold text-ink-900 transition-colors hover:bg-sand-50'
          >
            Cancelar
          </button>
          <SubmitButton form='user-form' loading={isSubmitting} loadingText='Guardando…'>
            {editing ? 'Guardar cambios' : 'Crear usuario'}
          </SubmitButton>
        </>
      }
    >
      <form id='user-form' onSubmit={handleSubmit(onSubmit)} noValidate className='space-y-5'>
        <TextField label='Nombre completo' placeholder='Raúl Méndez' autoFocus error={errors.fullName?.message} {...register('fullName')} />

        <TextField
          label='Correo electrónico'
          type='email'
          placeholder='raul.mendez@aztlan.mx'
          error={errors.email?.message}
          {...register('email')}
        />

        <TextField
          label='Usuario'
          placeholder='raul.mendez'
          autoComplete='off'
          error={errors.username?.message}
          {...usernameField}
          onChange={(e) => {
            setUsernameTouched(true)
            usernameField.onChange(e)
          }}
        />

        <div>
          <label htmlFor={roleId} className='mb-1.5 block text-[13px] font-medium text-ink-900'>
            Rol
          </label>
          <select
            id={roleId}
            disabled={rolesLoading}
            aria-invalid={Boolean(errors.roleCode)}
            className='h-11 w-full cursor-pointer rounded-md border border-line bg-white px-3 text-[15px] text-ink-900 outline-none transition focus:border-forest-700 focus:ring-4 focus:ring-forest-700/10 aria-[invalid=true]:border-red-500'
            {...register('roleCode')}
          >
            {roleOptions.map((role) => (
              <option key={role.code} value={role.code}>
                {role.name}
              </option>
            ))}
          </select>
          <FieldError message={errors.roleCode?.message} />
          <p className='mt-1.5 text-xs text-ink-500'>Solo puedes asignar roles de rango inferior al tuyo.</p>
        </div>

        {!editing && (
          <div className='flex gap-3 rounded-md border border-line/70 bg-sand-50 px-4 py-3.5'>
            <Mail className='mt-0.5 size-4 shrink-0 text-forest-700' aria-hidden />
            <div>
              <p className='text-sm font-medium text-ink-900'>Invitación por correo</p>
              <p className='mt-0.5 text-xs leading-relaxed text-ink-500'>
                Recibirá su usuario y una contraseña temporal, que deberá cambiar en su primer ingreso.
              </p>
            </div>
          </div>
        )}

        <FormAlert variant='error' message={formError} />
      </form>
    </SidePanel>
  )
}
