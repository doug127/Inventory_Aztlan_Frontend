import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PASSWORD_RULES } from '../authSchemas'

/** Requisitos de la contraseña que se van marcando mientras el usuario escribe. */
export function PasswordChecklist({ value = '' }) {
  return (
    <ul className='mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5' aria-label='Requisitos de la contraseña'>
      {PASSWORD_RULES.map((rule) => {
        const ok = rule.test(value)
        return (
          <li key={rule.id} className={cn('flex items-center gap-2 text-[13px] transition-colors', ok ? 'text-forest-700' : 'text-ink-500')}>
            <motion.span
              animate={{ scale: ok ? 1 : 0.85, backgroundColor: ok ? '#285C45' : '#FFFFFF' }}
              transition={{ type: 'spring', stiffness: 500, damping: 28 }}
              className={cn('grid size-4 shrink-0 place-items-center rounded-full border', ok ? 'border-forest-700' : 'border-line')}
            >
              <Check className={cn('size-2.5 text-white transition-opacity', ok ? 'opacity-100' : 'opacity-0')} strokeWidth={3} />
            </motion.span>
            <span>
              {rule.label}
              <span className='sr-only'>{ok ? ': cumplido' : ': pendiente'}</span>
            </span>
          </li>
        )
      })}
    </ul>
  )
}
