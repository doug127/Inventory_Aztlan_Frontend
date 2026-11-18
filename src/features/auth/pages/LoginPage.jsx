import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { MotionConfig, motion } from 'framer-motion'
import { useAuthStore } from '@/stores/authStore'
import { authService } from '../authService'
import { loginSchema } from '../authSchemas'
import { loginErrorMessage } from '../authErrors'
import { BrandMark, Checkbox, EASE_OUT, FadeIn, FormAlert, PasswordField, SubmitButton, TextField } from '../components/AuthUI'

const headline = ['Control de combustible,', 'fertilizantes e insumos', 'del rancho.']

/** Panel verde de la izquierda (solo en pantallas anchas). */
function BrandPanel() {
  return (
    <aside className='relative hidden flex-col justify-between overflow-hidden bg-forest-900 p-10 text-white lg:flex xl:p-14'>
      {/* Luz suave de fondo: da profundidad sin competir con el texto. */}
      <div
        aria-hidden
        className='pointer-events-none absolute -left-40 -top-40 size-[520px] rounded-full bg-[radial-gradient(circle,rgba(169,196,108,0.16),transparent_65%)]'
      />
      <FadeIn>
        <BrandMark tone='light' />
      </FadeIn>

      <div className='relative max-w-md'>
        <h2 className='text-[2.6rem] font-semibold leading-[1.12] tracking-tight xl:text-5xl'>
          {headline.map((line, i) => (
            <motion.span
              key={line}
              className='block'
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.08, ease: EASE_OUT }}
            >
              {line}
            </motion.span>
          ))}
        </h2>
        <FadeIn delay={0.4}>
          <p className='mt-5 text-base leading-relaxed text-white/80'>
            Registra cada retiro, consulta existencias por almacén y conoce el consumo de cada activo.
          </p>
        </FadeIn>
      </div>

      <p className='relative text-sm text-white/70'>© {new Date().getFullYear()} Agrícola Aztlán</p>
    </aside>
  )
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const setSession = useAuthStore((s) => s.setSession)
  const [error, setError] = useState('')
  // Aviso que deja otra pantalla al redirigir aquí (p. ej., contraseña restablecida).
  const notice = location.state?.notice

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: '', password: '', remember: true },
  })

  const onSubmit = async (values) => {
    setError('')
    try {
      const session = await authService.login(values)
      setSession(session)
      if (session.user.mustChangePassword) {
        navigate('/change-password', { replace: true })
      } else {
        navigate(location.state?.from ?? '/', { replace: true })
      }
    } catch (err) {
      setError(loginErrorMessage(err))
    }
  }

  return (
    <MotionConfig reducedMotion='user'>
      <div className='grid min-h-svh bg-white font-plex text-ink-900 lg:grid-cols-[minmax(0,7fr)_minmax(0,9fr)]'>
        <BrandPanel />

        <main className='flex flex-col px-6 py-10 sm:px-12'>
          <BrandMark className='lg:hidden' />

          <div className='flex flex-1 items-center justify-center'>
            <FadeIn delay={0.05} className='w-full max-w-[380px] py-10'>
              <h1 className='text-[1.75rem] font-semibold tracking-tight'>Iniciar sesión</h1>
              <p className='mt-1.5 text-[15px] text-ink-500'>Usa el correo que te asignó el administrador.</p>

              <form onSubmit={handleSubmit(onSubmit)} noValidate className='mt-8 space-y-5'>
                <FormAlert variant='success' message={!error ? notice : ''} />

                <TextField
                  label='Correo electrónico'
                  placeholder='nombre@aztlan.mx'
                  autoComplete='username'
                  inputMode='email'
                  autoFocus
                  error={errors.identifier?.message}
                  {...register('identifier')}
                />

                <PasswordField
                  label='Contraseña'
                  placeholder='••••••••'
                  autoComplete='current-password'
                  error={errors.password?.message}
                  {...register('password')}
                />

                <div className='flex items-center justify-between gap-3'>
                  <Checkbox label='Mantener sesión' {...register('remember')} />
                  <Link
                    to='/forgot-password'
                    className='rounded text-sm font-semibold text-forest-700 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-700/30'
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>

                <FormAlert variant='error' message={error} />

                <SubmitButton loading={isSubmitting} loadingText='Iniciando sesión…'>
                  Iniciar sesión
                </SubmitButton>
              </form>
            </FadeIn>
          </div>

          <p className='text-center text-xs text-ink-500 lg:hidden'>© {new Date().getFullYear()} Agrícola Aztlán</p>
        </main>
      </div>
    </MotionConfig>
  )
}
