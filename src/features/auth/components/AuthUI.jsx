// Piezas visuales de las pantallas de acceso, según el diseño "Flujo de Usuario".
import { forwardRef, useId, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, CheckCircle2, Eye, EyeOff, Info, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export const EASE_OUT = [0.22, 1, 0.36, 1]

/** Logo: cuadro verde lima con la "A" y el nombre. `tone="light"` para fondos oscuros. */
export function BrandMark({ tone = 'dark', className }) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <span className='grid size-9 place-items-center rounded-lg bg-lime-badge text-base font-bold text-forest-950'>A</span>
      <span className={cn('text-lg font-semibold tracking-tight', tone === 'light' ? 'text-white' : 'text-ink-900')}>
        Aztlán Inventario
      </span>
    </div>
  )
}

const inputClass =
  'h-11 w-full rounded-md border border-line bg-white px-3.5 text-[15px] text-ink-900 shadow-xs outline-none ' +
  'transition-[border-color,box-shadow] duration-150 placeholder:text-ink-500/60 ' +
  'focus:border-forest-700 focus:ring-4 focus:ring-forest-700/10 ' +
  'aria-[invalid=true]:border-red-500 aria-[invalid=true]:focus:ring-red-500/10 disabled:opacity-60'

/** Mensaje de error de un campo, con una entrada suave. */
export function FieldError({ id, message }) {
  return (
    <AnimatePresence initial={false}>
      {message && (
        <motion.p
          id={id}
          role='alert'
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
          className='mt-1.5 text-[13px] text-red-600'
        >
          {message}
        </motion.p>
      )}
    </AnimatePresence>
  )
}

/** Etiqueta + input + error. Se integra con react-hook-form vía {...register('campo')}. */
export const TextField = forwardRef(function TextField({ label, error, className, ...props }, ref) {
  const id = useId()
  return (
    <div className={className}>
      <label htmlFor={id} className='mb-1.5 block text-[13px] font-medium text-ink-900'>
        {label}
      </label>
      <input
        ref={ref}
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={inputClass}
        {...props}
      />
      <FieldError id={`${id}-error`} message={error} />
    </div>
  )
})

/** Campo de contraseña con botón para mostrarla u ocultarla. */
export const PasswordField = forwardRef(function PasswordField({ label, error, className, ...props }, ref) {
  const id = useId()
  const [visible, setVisible] = useState(false)
  return (
    <div className={className}>
      <label htmlFor={id} className='mb-1.5 block text-[13px] font-medium text-ink-900'>
        {label}
      </label>
      <div className='relative'>
        <input
          ref={ref}
          id={id}
          type={visible ? 'text' : 'password'}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(inputClass, 'pr-11')}
          {...props}
        />
        <button
          type='button'
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          className='absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-md text-ink-500 transition-colors hover:text-forest-700 focus-visible:outline-none focus-visible:text-forest-700'
        >
          <AnimatePresence mode='wait' initial={false}>
            <motion.span
              key={visible ? 'hide' : 'show'}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.12 }}
            >
              {visible ? <EyeOff className='size-[18px]' /> : <Eye className='size-[18px]' />}
            </motion.span>
          </AnimatePresence>
        </button>
      </div>
      <FieldError id={`${id}-error`} message={error} />
    </div>
  )
})

/** Botón principal verde, con indicador de carga. */
export function SubmitButton({ loading, loadingText, children, className, ...props }) {
  return (
    <motion.button
      type='submit'
      disabled={loading || props.disabled}
      whileTap={{ scale: 0.985 }}
      className={cn(
        'relative flex h-11 w-full items-center justify-center gap-2 rounded-md bg-forest-700 px-4 text-[15px] font-semibold text-white',
        'shadow-sm transition-colors duration-150 hover:bg-forest-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-forest-700/25',
        'disabled:cursor-not-allowed disabled:opacity-70',
        className
      )}
      {...props}
    >
      {loading && <Loader2 className='size-4 animate-spin' aria-hidden />}
      {loading ? loadingText ?? children : children}
    </motion.button>
  )
}

const ALERT_STYLES = {
  success: { box: 'bg-forest-100 text-forest-800', Icon: CheckCircle2 },
  error: { box: 'bg-red-50 text-red-700', Icon: AlertCircle },
  info: { box: 'bg-sand-50 text-ink-900 border border-line', Icon: Info },
}

/** Aviso dentro del formulario. Se anima al aparecer y desaparecer (pasa `message` vacío para ocultarlo). */
export function FormAlert({ variant = 'error', message, className }) {
  const { box, Icon } = ALERT_STYLES[variant]
  return (
    <AnimatePresence initial={false}>
      {message && (
        <motion.div
          key={message}
          role={variant === 'error' ? 'alert' : 'status'}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2, ease: EASE_OUT }}
          className='overflow-hidden'
        >
          <div className={cn('flex items-start gap-2.5 rounded-md px-3.5 py-3 text-sm leading-snug', box, className)}>
            <Icon className='mt-px size-4 shrink-0' aria-hidden />
            <span>{message}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** Checkbox cuadrado verde del diseño ("Mantener sesión"). */
export const Checkbox = forwardRef(function Checkbox({ label, className, ...props }, ref) {
  const id = useId()
  return (
    <label htmlFor={id} className={cn('inline-flex cursor-pointer select-none items-center gap-2.5 text-sm text-ink-900', className)}>
      <span className='relative grid size-[18px] place-items-center'>
        <input
          ref={ref}
          id={id}
          type='checkbox'
          className='peer size-[18px] cursor-pointer appearance-none rounded-[4px] border border-line bg-white transition-colors checked:border-forest-700 checked:bg-forest-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-forest-700/20'
          {...props}
        />
        <svg
          viewBox='0 0 12 12'
          className='pointer-events-none absolute size-3 text-white opacity-0 transition-opacity peer-checked:opacity-100'
          aria-hidden
        >
          <path d='M2.5 6.2 5 8.5l4.5-5' fill='none' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round' />
        </svg>
      </span>
      {label}
    </label>
  )
})

/** Contenedor que entra con un leve desplazamiento hacia arriba. */
export function FadeIn({ delay = 0, className, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: EASE_OUT }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
