import { PermissionGate } from '@/features/auth/PermissionGate'

import { HIERARCHY } from '@/lib/constants'

import {
  Plus,
  FolderTree,
  Ruler,
} from 'lucide-react'

import { Button } from '@/components/ui/button'

import { CategoryTree } from '@/features/products/features/categories/components/CategoryTree'

export const GridCategoryUnit = ({
    setUnitOpen,
    setCategoryOpen,
    categoriesTree,
    units
}) => {

    return (
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>

        {/* CATEGORIES */}

        <div className='rounded-2xl border bg-card'>

          {/* HEADER */}

          <div className='flex items-center justify-between border-b p-4'>

            <div className='flex items-center gap-2'>

              <FolderTree className='h-5 w-5 text-primary' />

              <div>

                <h2 className='font-semibold'>
                  Categorías
                </h2>

                <p className='text-sm text-muted-foreground'>
                  Jerarquía de categorías
                </p>

              </div>

            </div>

            <PermissionGate
              minHierarchy={HIERARCHY.ADMIN}
            >

              <Button
                size='sm'
                onClick={() => setCategoryOpen(true)}
              >
                <Plus className='h-4 w-4 mr-2' />
                Nueva categoría
              </Button>

            </PermissionGate>

          </div>

          {/* TREE */}

          <div className='p-4 max-h-[650px] overflow-auto'>

            <CategoryTree
              categories={categoriesTree}
            />

          </div>

        </div>

        {/* UNITS */}

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

            <PermissionGate
              minHierarchy={HIERARCHY.ADMIN}
            >

              <Button
                size='sm'
                onClick={() => setUnitOpen(true)}
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

      </div>
    )
  }