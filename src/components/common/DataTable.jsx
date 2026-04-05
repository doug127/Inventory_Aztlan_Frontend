import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from './LoadingSpinner'
import { EmptyState } from './EmptyState'

export function DataTable({
  columns,
  data = [],
  loading = false,
  // paginación server-side
  pageIndex = 0,
  pageCount = 1,
  onPageChange,
  // estado vacío
  emptyTitle = 'Sin resultados',
  emptyDescription,
}) {
  const table = useReactTable({
    data,
    columns,
    pageCount,
    state: { pagination: { pageIndex, pageSize: 20 } },
    onPaginationChange: (updater) => {
      const next = typeof updater === 'function' ? updater({ pageIndex, pageSize: 20 }) : updater
      onPageChange?.(next.pageIndex)
    },
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
  })

  if (loading) return <LoadingSpinner />

  return (
    <div className='space-y-3'>
      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id}>
                {group.headers.map((header) => (
                  <TableHead key={header.id} className='text-xs font-medium'>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <EmptyState title={emptyTitle} description={emptyDescription} />
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className='hover:bg-muted/50'>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className='text-sm'>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginación */}
      {pageCount > 1 && (
        <div className='flex items-center justify-between px-1'>
          <p className='text-sm text-muted-foreground'>
            Página {pageIndex + 1} de {pageCount}
          </p>
          <div className='flex gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => onPageChange?.(pageIndex - 1)}
              disabled={pageIndex === 0}
            >
              Anterior
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={() => onPageChange?.(pageIndex + 1)}
              disabled={pageIndex >= pageCount - 1}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
