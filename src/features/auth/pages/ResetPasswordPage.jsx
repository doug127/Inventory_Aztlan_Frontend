import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { Link2Off, Loader2 } from 'lucide-react'
import { authService } from '../authService'
import { resetPasswordSchema } from '../authSchemas'
import { fieldErrorsFrom, genericErrorMessage } from '../authErrors'
import { AuthCardLayout } from '../components/AuthCardLayout'
import { FormAlert, PasswordField, SubmitButton } from '../components/AuthUI'
import { PasswordChecklist } from '../components/PasswordChecklist'

/** Enlace vencido, usado o inexistente. */
function InvalidLink() {
  return (
    <AuthCardLayout title='Enlace no válido' description='El enlace de recuperación venció o ya se usó.'>
      <div className='space-y-5'>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className='grid size-12 place-items-center rounded-full bg-red-50 text-red-600'
        >
          <Link2Off className='size-6' aria-hidden />
        </motion.div>
        <p className='text-[15px] text-ink-500'>
          Cada enlace sirve una sola vez y vence a los 30 minutos. Solicita uno nuevo para continuar.
        </p>
        <Link
          to='/forgot-password'
          className='flex h-11 w-full items-center justify-center rounded-md bg-forest-700 text-[15px] font-semibold text-white transition-colors hover:bg-forest-800'
        >
          Solicitar un enlace nuevo
        </Link>
        <div className='text-center'>
          <Link to='/login' className='text-sm font-semibold text-forest-700 underline-offset-4 hover:underline'>
            Volver a iniciar sesión
          </Link>
        </div>
      </div>
    </AuthCardLayout>
  )
}

/** Pantalla del enlace del correo: /reset-password?token=… */
export function ResetPasswordPage() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const navigate = useNavigate()
  const [state, setState] = useState(token ? 'checking' : 'invalid') // checking | ready | invalid
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    setError: setFieldError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(resetPasswordSchema), defaultValues: { newPassword: '', confirmPassword: '' } })

  // Antes de pedir la contraseña se verifica que el enlace siga sirviendo.
  useEffect(() => {
    if (!token) return
    let cancelled = false
    authService
      .validateResetToken(token)
      .then(() => !cancelled && setState('ready'))
      .catch(() => !cancelled && setState('invalid'))
    return () => {
      cancelled = true
    }
  }, [token])

  const onSubmit = async ({ newPassword }) => {
    setError('')
    try {
      await authService.resetPassword({ token, newPassword })
      navigate('/login', {
        replace: true,
        state: { notice: 'Contraseña actualizada. Inicia sesión con tu nueva contraseña.' },
      })
    } catch (err) {
      if (err.code === 'AUTH_RESET_TOKEN_INVALID') return setState('invalid')
      const fields = fieldErrorsFrom(err)
      if (fields.newPassword) return setFieldError('newPassword', { message: fields.newPassword })
      setError(genericErrorMessage(err))
    }
  }

  if (state === 'invalid') return <InvalidLink />

  if (state === 'checking') {
    return (
      <AuthCardLayout title='Verificando enlace' description='Un momento, por favor.'>
        <div className='flex justify-center py-6 text-forest-700'>
          <Loader2 className='size-7 animate-spin' aria-label='Verificando' />
        </div>
      </AuthCardLayout>
    )
  }

  return (
    <AuthCardLayout title='Crea una nueva contraseña' description='Al guardarla se cerrarán tus sesiones abiertas en otros dispositivos.'>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className='space-y-5'>
        <div>
          <PasswordField
            label='Nueva contraseña'
            autoComplete='new-password'
            autoFocus
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
          Guardar contraseña
        </SubmitButton>
      </form>
    </AuthCardLayout>
  )
}
