import { MotionConfig, motion } from 'framer-motion'
import { BrandMark, EASE_OUT } from './AuthUI'

/**
 * Pantalla de acceso con tarjeta centrada sobre fondo arena (diseño "Recuperar contraseña").
 * La usan recuperar, restablecer y cambiar contraseña.
 */
export function AuthCardLayout({ title, description, children, footer }) {
  return (
    <MotionConfig reducedMotion='user'>
      <div className='flex min-h-svh flex-col items-center justify-center bg-sand-50 px-4 py-10 font-plex text-ink-900'>
        <BrandMark className='mb-8' />
        <motion.section
          initial={{ opacity: 0, y: 16, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: EASE_OUT }}
          className='w-full max-w-[460px] rounded-xl border border-line/80 bg-white px-6 py-8 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.08)] sm:px-9 sm:py-10'
        >
          <h1 className='text-2xl font-semibold tracking-tight'>{title}</h1>
          {description && <p className='mt-1.5 text-[15px] text-ink-500'>{description}</p>}
          <div className='mt-7'>{children}</div>
        </motion.section>
        {footer && <div className='mt-6 text-sm'>{footer}</div>}
        <p className='mt-10 text-xs text-ink-500'>© {new Date().getFullYear()} Agrícola Aztlán</p>
      </div>
    </MotionConfig>
  )
}
