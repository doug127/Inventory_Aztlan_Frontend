import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// Colores por valor — centralizado aquí para toda la app
const VARIANTS = {
  // Tipos de movimiento
  IN: 'bg-green-100 text-green-800 border-green-200',
  OUT: 'bg-red-100 text-red-800 border-red-200',
  TRANSFER: 'bg-blue-100 text-blue-800 border-blue-200',
  ADJUST: 'bg-yellow-100 text-yellow-800 border-yellow-200',

  // Estados activo/inactivo
  true: 'bg-green-100 text-green-800 border-green-200',
  false: 'bg-gray-100 text-gray-600 border-gray-200',
  active: 'bg-green-100 text-green-800 border-green-200',
  inactive: 'bg-gray-100 text-gray-600 border-gray-200',

  // Razones de movimiento
  CONSUMO: 'bg-orange-100 text-orange-800 border-orange-200',
  PRESTAMO: 'bg-purple-100 text-purple-800 border-purple-200',
  DESECHO: 'bg-red-100 text-red-800 border-red-200',
  COMPRA: 'bg-green-100 text-green-800 border-green-200',
  VENTA: 'bg-blue-100 text-blue-800 border-blue-200',
  TRASLADO: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  AJUSTE: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  OTRO: 'bg-gray-100 text-gray-600 border-gray-200',

  // Asset types
  VEHICULO: 'bg-blue-100 text-blue-800 border-blue-200',
  PERSONAL: 'bg-purple-100 text-purple-800 border-purple-200',
  CAMPO: 'bg-green-100 text-green-800 border-green-200',
  COSECHA: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  TALLER: 'bg-orange-100 text-orange-800 border-orange-200',
  EXTERNO: 'bg-gray-100 text-gray-600 border-gray-200',
}

const LABELS = {
  IN: 'Entrada',
  OUT: 'Salida',
  TRANSFER: 'Transferencia',
  ADJUST: 'Ajuste',
  true: 'Activo',
  false: 'Inactivo',
  active: 'Activo',
  inactive: 'Inactivo',
  CONSUMO: 'Consumo',
  PRESTAMO: 'Préstamo',
  DESECHO: 'Desecho',
  COMPRA: 'Compra',
  VENTA: 'Venta',
  TRASLADO: 'Traslado',
  AJUSTE: 'Ajuste',
  OTRO: 'Otro',
  VEHICULO: 'Vehículo',
  PERSONAL: 'Personal',
  CAMPO: 'Campo',
  COSECHA: 'Cosecha',
  TALLER: 'Taller',
  EXTERNO: 'Externo',
}

export function StatusBadge({ value, label, className }) {
  const key = String(value)
  const colorClass = VARIANTS[key] ?? 'bg-gray-100 text-gray-600 border-gray-200'
  const displayLabel = label ?? LABELS[key] ?? value

  return (
    <Badge
      variant='outline'
      className={cn('font-medium border text-xs px-2 py-0.5', colorClass, className)}
    >
      {displayLabel}
    </Badge>
  )
}
