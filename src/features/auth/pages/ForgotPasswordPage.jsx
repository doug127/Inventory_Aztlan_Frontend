import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft } from 'lucide-react'
import { authService } from '../authService'
import { forgotPasswordSchema } from '../authSchemas'
import { genericErrorMessage, maskEmail } from '../authErrors'
import { AuthCardLayout } from '../components/AuthCardLayout'
import { FormAlert, SubmitButton, TextField } from '../components/AuthUI'

const RESEND_COOLDOWN_SECONDS = 60

export function ForgotPasswordPage() {
  const [sentTo, setSentTo] = useState('')
  const [error, setError] = useState('')
  const [cooldown, setCooldown] = useState(0)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(forgotPasswordSchema), defaultValues: { email: '' } })

  // Cuenta regresiva para reenviar: el backend acepta 3 solicitudes por hora.
  useEffect(() => {
    if (!cooldown) return
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  const onSubmit = async ({ email }) => {
    setError('')
    try {
      await authService.forgotPassword(email)
      // El backend responde lo mismo exista o no el correo: el mensaje tampoco lo revela.
      setSentTo(email)
      setCooldown(RESEND_COOLDOWN_SECONDS)
    } catch (err) {
      setSentTo('')
      setError(genericErrorMessage(err))
    }
  }

  return (
    <AuthCardLayout title='Recuperar contraseña' description='Te enviaremos un enlace para crear una nueva contraseña.'>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className='space-y-5'>
        <TextField
          label='Correo electrónico'
          type='email'
          placeholder='nombre@aztlan.mx'
          autoComplete='email'
          autoFocus
          error={errors.email?.message}
          {...register('email')}
        />

        <SubmitButton loading={isSubmitting} loadingText='Enviando…' disabled={cooldown > 0}>
          {cooldown > 0 ? `Reenviar en ${cooldown} s` : sentTo ? 'Reenviar enlace' : 'Enviar enlace'}
        </SubmitButton>

        <FormAlert
          variant='success'
          message={sentTo ? `Si el correo está registrado, enviamos un enlace a ${maskEmail(sentTo)}. Vence en 30 minutos.` : ''}
        />
        <FormAlert variant='error' message={error} />

        <div className='pt-1 text-center'>
          <Link
            to='/login'
            className='group inline-flex items-center gap-1.5 rounded text-sm font-semibold text-forest-700 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-700/30'
          >
            <ArrowLeft className='size-4 transition-transform group-hover:-translate-x-0.5' aria-hidden />
            Volver a iniciar sesión
          </Link>
        </div>
      </form>
    </AuthCardLayout>
  )
}
