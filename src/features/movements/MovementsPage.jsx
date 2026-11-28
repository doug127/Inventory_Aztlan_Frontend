import { Link } from 'react-router-dom'
import { ArrowDownToLine, ArrowLeftRight, ArrowUpFromLine, ClipboardCheck, Undo2 } from 'lucide-react'
import { PendingLoans } from './PendingLoans'
import { MovementHistory } from './MovementHistory'
import { useAuthStore } from '@/stores/authStore'
import { HIERARCHY } from '@/lib/constants'

// Movimientos. HU-401 habilita la orden de retiro, HU-402 la entrada, HU-403 el traslado y HU-404 el
// ajuste (solo ADMIN). HU-405 agrega la devolución y la lista de préstamos pendientes; el historial con
// filtros, HU-408.

const ACTIONS = [
  {
    to: '/movements/new/withdrawal',
    label: 'Orden de retiro',
    hint: 'Salida hacia un tractor, un tablón o el personal',
    icon: ArrowUpFromLine,
    ready: true,
  },
  { to: '/movements/new/entry', label: 'Entrada', hint: 'Compras a proveedores y otros ingresos', icon: ArrowDownToLine, ready: true },
  { to: '/movements/new/return', label: 'Devolución', hint: 'Lo que regresa de un préstamo', icon: Undo2, ready: true },
  { to: '/movements/new/transfer', label: 'Traslado', hint: 'De un almacén a otro', icon: ArrowLeftRight, ready: true },
  { to: '/movements/new/adjustment', label: 'Ajuste', hint: 'Diferencias del conteo físico', icon: ClipboardCheck, minHierarchy: HIERARCHY.ADMIN, ready: true },
]

export function MovementsPage() {
  const hasHierarchy = useAuthStore((s) => s.hasHierarchy)
  const canRegister = hasHierarchy(HIERARCHY.ALMACENISTA)
  return (
    <div className='mx-auto max-w-6xl font-plex text-ink-900'>
      <h1 className='text-[1.75rem] font-semibold tracking-tight'>Movimientos</h1>
      <p className='mt-0.5 text-sm text-ink-500'>Cada salida, entrada o traslado queda registrado con su documento y no se modifica.</p>

      {canRegister && (
        <section className='mt-6' aria-label='Registrar un movimiento'>
          <h2 className='text-sm font-semibold'>Registrar</h2>
          <div className='mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5'>
            {ACTIONS.filter((a) => !a.minHierarchy || hasHierarchy(a.minHierarchy)).map(({ to, label, hint, icon: Icon, ready }) =>
              ready ? (
                <Link
                  key={label}
                  to={to}
                  className='group rounded-xl border border-line/80 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-colors hover:border-forest-700'
                >
                  <span className='grid size-10 place-items-center rounded-lg bg-forest-50 text-forest-800 ring-1 ring-forest-700/10'>
                    <Icon className='size-5' aria-hidden />
                  </span>
                  <p className='mt-3 font-medium group-hover:text-forest-800'>{label}</p>
                  <p className='mt-0.5 text-sm text-ink-500'>{hint}</p>
                </Link>
              ) : (
                <div key={label} className='rounded-xl border border-dashed border-line bg-white/60 p-4 text-ink-500' aria-disabled='true'>
                  <span className='grid size-10 place-items-center rounded-lg bg-sand-50'>
                    <Icon className='size-5' aria-hidden />
                  </span>
                  <p className='mt-3 font-medium'>{label}</p>
                  <p className='mt-0.5 text-sm'>{hint} · Próximamente</p>
                </div>
              )
            )}
          </div>
        </section>
      )}

      <div className='mt-8'>
        <MovementHistory />
      </div>

      <PendingLoans className='mt-6' />
    </div>
  )
}
