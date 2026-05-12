import { useState } from 'react'
import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'

import { PageHeader } from '@/components/common/PageHeader'
import { PermissionGate } from '@/features/auth/PermissionGate'

import { HIERARCHY } from '@/lib/constants'

import { UnitForm } from '@/features/products/units/components/UnitForm'

export const ProductsPage = () => {
  const [unitOpen, setUnitOpen] = useState(false)

  // luego esto vendrá de react-query
  const units = []

  const handleCreateUnit = async (data) => {
    console.log(data)

    /*
      await createUnit.mutateAsync(data)
      setUnitOpen(false)
    */
  }

  return (
    <div className='space-y-6'>

      <PageHeader
        title='Productos'
        description='Gestión de productos y unidades'
        actions={
          <PermissionGate minHierarchy={HIERARCHY.ADMIN}>
            <Button
              size='sm'
              onClick={() => setUnitOpen(true)}
            >
              <Plus className='h-4 w-4 mr-2' />
              Nueva unidad
            </Button>
          </PermissionGate>
        }
      />

      <div className='rounded-xl border p-6 text-sm text-muted-foreground'>
        Aquí irá el CRUD de productos
      </div>

      <UnitForm
        open={unitOpen}
        onOpenChange={setUnitOpen}
        units={units}
        onSubmit={handleCreateUnit}
        loading={false}
      />

    </div>
  )
}