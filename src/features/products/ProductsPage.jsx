import { useState } from 'react'

import {
  Plus,
  FolderTree,
  Ruler,
} from 'lucide-react'

import { Button } from '@/components/ui/button'

import { PageHeader } from '@/components/common/PageHeader'

import { PermissionGate } from '@/features/auth/PermissionGate'

import { HIERARCHY } from '@/lib/constants'

import { UnitForm } from '@/features/products/units/components/UnitForm'

import { CategoryForm } from '@/features/products/categories/components/CategoryForm'

import { CategoryTree } from '@/features/products/categories/components/CategoryTree'

import {
  useBaseUnits,
  useCreateUnit,
} from './units/hooks/useUnits'

import {
  useCategories,
  useParentCategories,
  useCreateCategory,
} from '@/features/products/categories/hooks/useCategories'

export const ProductsPage = () => {

  const [unitOpen, setUnitOpen] =
    useState(false)

  const [categoryOpen, setCategoryOpen] =
    useState(false)

  // UNITS

  const { data: units = [] } =
    useBaseUnits()

  // CATEGORY TREE

  const { data: categoriesTree = [] } =
    useParentCategories()

  // FLAT CATEGORIES

  const { data: categories = [] } =
    useCategories()

  // MUTATIONS

  const createUnit =
    useCreateUnit()

  const createCategory =
    useCreateCategory()

  // HANDLERS

  const handleCreateUnit = async (data) => {

    await createUnit.mutateAsync(data)

    setUnitOpen(false)
  }

  const handleCreateCategory = async (data) => {

    await createCategory.mutateAsync(data)

    setCategoryOpen(false)
  }

  return (
    <div className='space-y-6'>

      <PageHeader
        title='Productos'
        description='Gestión de productos, categorías y unidades'
      />

      {/* GRID */}

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

      {/* UNIT FORM */}

      <UnitForm
        open={unitOpen}
        onOpenChange={setUnitOpen}
        units={units}
        onSubmit={handleCreateUnit}
        loading={createUnit.isPending}
      />

      {/* CATEGORY FORM */}

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