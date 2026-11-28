import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AlertTriangle, ArrowRight, Boxes, Fuel, Handshake, Network } from 'lucide-react'
import { EASE_OUT } from '@/features/auth/components/AuthUI'

// Pantalla /reports (user_flow.md §14): un acceso por reporte. Los de consumo son de HU-501; las
// existencias, las alertas y los préstamos pendientes ya tienen su pantalla (con impresión) y se
// enlazan desde aquí. Movimientos por período llega con HU-502.

const REPORTS = [
  {
    to: '/reports/consumption',
    icon: Fuel,
    title: 'Consumo por activo',
    text: 'Consumo neto de cada activo y producto en un período: diésel por tractor, herbicida por lote.',
  },
  {
    to: '/reports/consumption?groupBy=assetCategory',
    icon: Network,
    title: 'Consumo por categoría de activo',
    text: 'Compara ramas del árbol de activos: línea amarilla contra maquinaria agrícola.',
  },
  { to: '/stock', icon: Boxes, title: 'Existencias por almacén', text: 'Inventario a la fecha por almacén y categoría, con su estado.' },
  { to: '/stock?alert=CON_ALERTA', icon: AlertTriangle, title: 'Alertas de stock', text: 'Productos bajo el mínimo o sobre el máximo, para planificar compras.' },
  { to: '/movements', icon: Handshake, title: 'Préstamos pendientes', text: 'Lo prestado que aún no se devuelve, al final de Movimientos.' },
]

export function ReportsPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: EASE_OUT }} className='mx-auto max-w-6xl font-plex text-ink-900'>
      <h1 className='text-[1.75rem] font-semibold tracking-tight'>Reportes</h1>
      <p className='mt-0.5 text-sm text-ink-500'>Elige un reporte, ajusta sus filtros e imprímelo o guárdalo como PDF.</p>
      <ul className='mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
        {REPORTS.map(({ to, icon: Icon, title, text }) => (
          <li key={to}>
            <Link
              to={to}
              className='group flex h-full flex-col rounded-xl border border-line/80 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-colors hover:border-forest-700/40'
            >
              <span className='grid size-10 place-items-center rounded-lg bg-forest-50 text-forest-800'>
                <Icon className='size-5' aria-hidden />
              </span>
              <span className='mt-3 font-semibold'>{title}</span>
              <span className='mt-1 flex-1 text-sm text-ink-500'>{text}</span>
              <span className='mt-3 inline-flex items-center gap-1 text-sm font-medium text-forest-800'>
                Abrir
                <ArrowRight className='size-4 transition-transform group-hover:translate-x-0.5' aria-hidden />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </motion.div>
  )
}
