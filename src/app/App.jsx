// import { MainLayout } from '@/components/layouts/MainLayout.jsx'

// export const App = () => {
//   return (
//     <>
//       <MainLayout
//         sidebar={<div className='h-full bg-[var(--color-primary)] text-white p-4'>Sidebar</div>}
//         navbar={<div>Navbar</div>}
//       >
//         <h1 className='text-2xl font-bold'>Dashboard</h1>
//       </MainLayout>
//     </>
//   )
// }

import { PageHeader } from '@/components/common/PageHeader'
import { StatusBadge } from '@/components/common/StatusBadge'
import { EmptyState } from '@/components/common/EmptyState'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { DataTable } from '@/components/common/DataTable'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

const columns = [
  { accessorKey: 'reference', header: 'Referencia' },
  { accessorKey: 'type', header: 'Tipo', cell: ({ row }) => <StatusBadge value={row.original.type} /> },
  { accessorKey: 'reason', header: 'Razón', cell: ({ row }) => <StatusBadge value={row.original.reason} /> },
  { accessorKey: 'warehouse', header: 'Almacén' },
  { accessorKey: 'status', header: 'Estado', cell: ({ row }) => <StatusBadge value={row.original.status} /> },
]

const data = [
  { reference: 'MOV-0001', type: 'IN',       reason: 'COMPRA',   warehouse: 'Almacén Central', status: 'active' },
  { reference: 'MOV-0002', type: 'OUT',      reason: 'CONSUMO',  warehouse: 'Almacén Norte',   status: 'active' },
  { reference: 'MOV-0003', type: 'TRANSFER', reason: 'TRASLADO', warehouse: 'Almacén Sur',     status: 'inactive' },
  { reference: 'MOV-0004', type: 'ADJUST',   reason: 'AJUSTE',   warehouse: 'Almacén Central', status: 'active' },
  { reference: 'MOV-0005', type: 'OUT',      reason: 'PRESTAMO', warehouse: 'Almacén Norte',   status: 'active' },
]

export const App = () => {
  return (
    <div className='min-h-screen bg-background'>
      <div className='max-w-5xl mx-auto p-8 space-y-12'>

        {/* PageHeader */}
        <PageHeader
          title='Movimientos'
          description='Gestión de entradas, salidas, transferencias y ajustes'
          actions={
            <Button size='sm'>
              <Plus className='h-4 w-4 mr-2' />
              Nuevo movimiento
            </Button>
          }
        />

        {/* StatusBadge — todos los valores */}
        <div className='space-y-3'>
          <p className='text-sm font-medium text-muted-foreground'>Tipos de movimiento</p>
          <div className='flex flex-wrap gap-2'>
            {['IN', 'OUT', 'TRANSFER', 'ADJUST'].map((v) => (
              <StatusBadge key={v} value={v} />
            ))}
          </div>
          <p className='text-sm font-medium text-muted-foreground'>Razones</p>
          <div className='flex flex-wrap gap-2'>
            {['CONSUMO', 'PRESTAMO', 'DESECHO', 'COMPRA', 'VENTA', 'TRASLADO', 'AJUSTE', 'OTRO'].map((v) => (
              <StatusBadge key={v} value={v} />
            ))}
          </div>
          <p className='text-sm font-medium text-muted-foreground'>Estados</p>
          <div className='flex flex-wrap gap-2'>
            <StatusBadge value='active' />
            <StatusBadge value='inactive' />
          </div>
        </div>

        {/* DataTable con datos */}
        <div className='space-y-2'>
          <p className='text-sm font-medium text-muted-foreground'>DataTable con datos</p>
          <DataTable columns={columns} data={data} pageCount={1} />
        </div>

        {/* DataTable vacía */}
        <div className='space-y-2'>
          <p className='text-sm font-medium text-muted-foreground'>DataTable vacía</p>
          <DataTable
            columns={columns}
            data={[]}
            emptyTitle='Sin movimientos'
            emptyDescription='Crea tu primer movimiento usando el botón de arriba'
          />
        </div>

        {/* Loading */}
        <div className='space-y-2'>
          <p className='text-sm font-medium text-muted-foreground'>LoadingSpinner</p>
          <LoadingSpinner />
        </div>

      </div>
    </div>
  )
}