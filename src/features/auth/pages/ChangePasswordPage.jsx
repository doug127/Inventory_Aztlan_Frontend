import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { LogOut } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { authService } from '../authService'
import { changePasswordSchema } from '../authSchemas'
import { fieldErrorsFrom, genericErrorMessage } from '../authErrors'
import { AuthCardLayout } from '../components/AuthCardLayout'
import { FormAlert, PasswordField, SubmitButton } from '../components/AuthUI'
import { PasswordChecklist } from '../components/PasswordChecklist'

/**
 * Cambio de contraseña. Obligatorio en el primer ingreso (must_change_password): mientras no se
 * complete, el backend solo deja usar esta pantalla. También sirve para un cambio voluntario.
 */
export function ChangePasswordPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const setSession = useAuthStore((s) => s.setSession)
  const logout = useAuthStore((s) => s.logout)
  const required = Boolean(user?.mustChangePassword)
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    setError: setFieldError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })

  const onSubmit = async ({ currentPassword, newPassword }) => {
    setError('')
    try {
      // El backend devuelve una sesión nueva para este dispositivo y cierra las demás.
      const session = await authService.changePassword({ currentPassword, newPassword })
      setSession(session)
      navigate('/', { replace: true })
    } catch (err) {
      const fields = fieldErrorsFrom(err)
      if (fields.currentPassword) setFieldError('currentPassword', { message: fields.currentPassword })
      if (fields.newPassword) setFieldError('newPassword', { message: fields.newPassword })
      if (!fields.currentPassword && !fields.newPassword) setError(genericErrorMessage(err))
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <AuthCardLayout
      title={required ? 'Crea tu contraseña' : 'Cambiar contraseña'}
      description={
        required
          ? `Hola${user?.fullName ? `, ${user.fullName.split(' ')[0]}` : ''}. Por seguridad, cambia la contraseña temporal antes de continuar.`
          : 'Al guardarla se cerrarán tus sesiones en otros dispositivos.'
      }
      footer={
        required ? (
          <button
            type='button'
            onClick={handleLogout}
            className='inline-flex items-center gap-1.5 font-semibold text-ink-500 transition-colors hover:text-forest-700'
          >
            <LogOut className='size-4' aria-hidden />
            Cerrar sesión
          </button>
        ) : (
          <Link to='/' className='font-semibold text-forest-700 underline-offset-4 hover:underline'>
            Cancelar
          </Link>
        )
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className='space-y-5'>
        <PasswordField
          label={required ? 'Contraseña temporal' : 'Contraseña actual'}
          autoComplete='current-password'
          autoFocus
          error={errors.currentPassword?.message}
          {...register('currentPassword')}
        />

        <div>
          <PasswordField
            label='Nueva contraseña'
            autoComplete='new-password'
            error={errors.newPassword?.message}
            {...register('newPassword')}
          />
          <PasswordChecklist value={watch('newPassword')} />
        </div>

        <PasswordField
          label='Confirmar contraseña'
          autoComplete='new-password'
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <FormAlert variant='error' message={error} />

        <SubmitButton loading={isSubmitting} loadingText='Guardando…'>
          {required ? 'Guardar y continuar' : 'Guardar contraseña'}
        </SubmitButton>
      </form>
    </AuthCardLayout>
  )
}
