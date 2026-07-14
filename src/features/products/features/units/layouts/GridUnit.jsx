import { PermissionGate } from '@/features/auth/PermissionGate'
import { HIERARCHY } from '@/lib/constants'
import { Plus, Ruler } from 'lucide-react'
import { Button } from '@/components/common/Button'

export const GridUnit = ({
    setUnitOpen,
    units,
}) => {
    return (
        <div className='rounded-2xl border bg-card'>

          {/* HEADER */}

          <div className='flex items-center justify-between border-b p-4'>
            <div className='flex items-center gap-2'>
              <Ruler className='h-5 w-5 text-primary' />
              <div>
                <h2 className='font-semibold'>
                  Unidades
                </h2>

                <p className='text-sm text-muted-foreground'>
                  Unidades base para productos
                </p>
              </div>
            </div>

            <PermissionGate minHierarchy={HIERARCHY.ADMIN}>
              <Button
                onClick={() => setUnitOpen(true)}
                variant='primary'
              >
                <Plus className='h-4 w-4 mr-2' />
                Nueva unidad
              </Button>
            </PermissionGate>

          </div>

          {/* UNITS LIST */}

          <div className='p-4 space-y-2 max-h-[650px] overflow-auto'>
            {units.length === 0 && (
              <div className='text-sm text-muted-foreground'>
                No hay unidades registradas
              </div>
            )}
            {units.map((unit) => (
              <div
                key={unit.id}
                className='flex items-center justify-between rounded-xl border px-4 py-3'
              >
                <div>
                  <p className='font-medium'>
                    {unit.name}
                  </p>

                  <p className='text-sm text-muted-foreground'>
                    {unit.code}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
    )
}