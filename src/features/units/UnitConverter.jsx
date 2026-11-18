import { useEffect, useId, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeftRight, Loader2 } from 'lucide-react'
import { useConversion } from './unitsApi'

const useDebounced = (value, delay = 300) => {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

const fieldClass =
  'h-10 rounded-md border border-line bg-white px-3 text-sm outline-none transition focus:border-forest-700 focus:ring-4 focus:ring-forest-700/10'

/**
 * Calculadora de conversión. El cálculo lo hace el backend con decimal.js (el mismo que usarán
 * los movimientos), así lo que se ve aquí es exactamente lo que se registrará.
 * El destino solo ofrece unidades de la misma familia que el origen.
 */
export function UnitConverter({ units }) {
  const active = useMemo(() => units.filter((u) => u.isActive), [units])
  const ids = { quantity: useId(), from: useId(), to: useId() }
  const [quantity, setQuantity] = useState('1')
  const [from, setFrom] = useState('TAMB')
  const [to, setTo] = useState('L')

  const familyOf = (code) => {
    const unit = active.find((u) => u.code === code)
    return unit ? (unit.baseUnit?.id ?? unit.id) : null
  }
  const targets = active.filter((u) => familyOf(u.code) === familyOf(from) && u.code !== from)

  // Si el origen cambia de familia, el destino pasa a la base de la nueva familia.
  useEffect(() => {
    if (!active.length) return
    if (!active.some((u) => u.code === from)) setFrom(active[0].code)
    else if (!targets.some((u) => u.code === to)) setTo(targets[0]?.code ?? '')
  }, [active, from, to, targets])

  const params = { from, to, quantity: useDebounced(quantity.trim().replace(',', '.')) }
  const { data, isFetching, isError, error } = useConversion(params)

  const swap = () => {
    setFrom(to)
    setTo(from)
  }

  return (
    <section className='rounded-xl border border-line/80 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]'>
      <h2 className='text-sm font-semibold'>Convertir cantidades</h2>
      <p className='mt-0.5 text-xs text-ink-500'>Solo entre unidades de la misma familia (litros con litros, kilos con kilos).</p>

      <div className='mt-4 flex flex-wrap items-end gap-2'>
        <div className='flex flex-col'>
          <label htmlFor={ids.quantity} className='mb-1 text-xs text-ink-500'>
            Cantidad
          </label>
          <input
            id={ids.quantity}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            inputMode='decimal'
            className={`${fieldClass} w-28 tabular-nums`}
          />
        </div>
        <div className='flex flex-col'>
          <label htmlFor={ids.from} className='mb-1 text-xs text-ink-500'>
            De
          </label>
          <select id={ids.from} value={from} onChange={(e) => setFrom(e.target.value)} className={`${fieldClass} w-32 cursor-pointer`}>
            {active.map((u) => (
              <option key={u.id} value={u.code}>
                {u.code} · {u.name}
              </option>
            ))}
          </select>
        </div>
        <motion.button
          type='button'
          onClick={swap}
          whileTap={{ rotate: 180 }}
          disabled={!to}
          aria-label='Invertir conversión'
          className='grid size-10 place-items-center rounded-md border border-line bg-white text-ink-500 transition-colors hover:text-forest-700 disabled:opacity-40'
        >
          <ArrowLeftRight className='size-4' />
        </motion.button>
        <div className='flex flex-col'>
          <label htmlFor={ids.to} className='mb-1 text-xs text-ink-500'>
            A
          </label>
          <select id={ids.to} value={to} onChange={(e) => setTo(e.target.value)} className={`${fieldClass} w-32 cursor-pointer`}>
            {targets.map((u) => (
              <option key={u.id} value={u.code}>
                {u.code} · {u.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className='mt-4 flex min-h-[44px] items-center rounded-md bg-sand-50 px-4 py-2.5' aria-live='polite'>
        {isFetching && !data ? (
          <Loader2 className='size-4 animate-spin text-forest-700' aria-label='Calculando' />
        ) : isError ? (
          <span className='text-sm text-red-600'>{error?.message}</span>
        ) : !to ? (
          <span className='text-sm text-ink-500'>{from} no tiene otras unidades en su familia.</span>
        ) : (
          <AnimatePresence mode='wait'>
            {data && (
              <motion.span
                key={data.text}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className='font-mono text-base text-ink-900'
              >
                {data.text}
              </motion.span>
            )}
          </AnimatePresence>
        )}
      </div>
    </section>
  )
}
