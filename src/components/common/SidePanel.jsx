import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { EASE_OUT } from '@/features/auth/components/AuthUI'

/**
 * Panel lateral derecho (diseño "Nuevo usuario"): entra deslizándose, se cierra con Escape, con
 * el botón "Cerrar" o al pulsar fuera. En móvil ocupa todo el ancho.
 */
export function SidePanel({ open, onClose, title, subtitle, children, footer }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className='fixed inset-0 z-40 font-plex' role='dialog' aria-modal='true' aria-label={title}>
          <motion.div
            className='absolute inset-0 bg-ink-900/25'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.aside
            className='absolute inset-y-0 right-0 flex w-full max-w-[440px] flex-col bg-white shadow-[-12px_0_32px_-12px_rgba(0,0,0,0.18)]'
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.32, ease: EASE_OUT }}
          >
            <header className='flex items-start justify-between gap-4 px-7 pb-2 pt-7'>
              <div className='min-w-0'>
                <h2 className='text-xl font-semibold tracking-tight text-ink-900'>{title}</h2>
                {subtitle && <p className='mt-0.5 truncate text-sm text-ink-500'>{subtitle}</p>}
              </div>
              <button
                type='button'
                onClick={onClose}
                className='rounded px-1 text-sm text-ink-500 transition-colors hover:text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-700/30'
              >
                Cerrar
              </button>
            </header>
            <div className='scroll-stable flex-1 overflow-y-auto px-7 py-5'>{children}</div>
            {footer && <footer className='grid grid-cols-[2fr_3fr] gap-3 border-t border-line/60 px-7 py-5'>{footer}</footer>}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body
  )
}
