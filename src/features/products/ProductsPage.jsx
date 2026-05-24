import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/common/PageHeader'
import { PermissionGate } from '@/features/auth/PermissionGate'
import { HIERARCHY } from '@/lib/constants'
import { UnitForm } from '@/features/products/units/components/UnitForm'
import { CategoryForm } from '@/features/products/categories/components/CategoryForm'
import {
  useBaseUnits,
  useCreateUnit,
} from './units/hooks/useUnits'
import {
  useCategories,
  useCreateCategory,
} from './categories/hooks/useCategories'

export const ProductsPage = () => {
  const [unitOpen, setUnitOpen] = useState(false)
  const [categoryOpen, setCategoryOpen] = useState(false)

  const { data: units = [] } = useBaseUnits()
  const { data: categories = [] } = useCategories()

  const createUnit = useCreateUnit()
  const createCategory = useCreateCategory()

  const handleCreateUnit = async (data) => {

    console.log('DATA ENVIADA:', data)

    await createUnit.mutateAsync(data)

    setUnitOpen(false)
  }

  const handleCreateCategory = async (data) => {
    console.log('DATA ENVIADA:', data)

    await createCategory.mutateAsync(data)

    setCategoryOpen(false)
  }

  return (
    <div className='space-y-6'>

      <PageHeader
        title='Productos'
        description='Gestión de productos y unidades'
        actions={
          <PermissionGate minHierarchy={HIERARCHY.ADMIN} className='flex items-center space-x-2 row'>
            <Button
              size='sm'
              onClick={() => setCategoryOpen(true)}
            >
              <Plus className='h-4 w-4 mr-2' />
              Nueva categoría
            </Button>
            
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

        loading={createUnit.isPending}
      />

      <CategoryForm
        open={categoryOpen}
        onOpenChange={setCategoryOpen}

        categories={categories}

        onSubmit={handleCreateCategory}

        loading={createCategory.isPending}
      />

    </div>
  )
}