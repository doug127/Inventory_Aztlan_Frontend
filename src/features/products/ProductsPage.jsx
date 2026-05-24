import { useState } from 'react'
import { PageHeader } from '@/components/common/PageHeader'
import { UnitForm } from '@/features/products/features/units/components/UnitForm'
import { CategoryForm } from '@/features/products/features/categories/components/CategoryForm'
import { GridCategoryUnit } from '@/features/products/components/GridCategoryUnit'
import {
  useBaseUnits,
  useCreateUnit,
} from './features/units/hooks/useUnits'
import {
  useCategories,
  useParentCategories,
  useCreateCategory,
} from '@/features/products/features/categories/hooks/useCategories'

export const ProductsPage = () => {

  const [unitOpen, setUnitOpen] = useState(false)

  const [categoryOpen, setCategoryOpen] = useState(false)

  // UNITS
  const { data: units = [] } = useBaseUnits()

  // CATEGORY TREE
  const { data: categoriesTree = [] } = useParentCategories()

  // FLAT CATEGORIES
  const { data: categories = [] } = useCategories()

  // MUTATIONS
  const createUnit = useCreateUnit()
  const createCategory = useCreateCategory()

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

      <GridCategoryUnit
        setUnitOpen={setUnitOpen}
        setCategoryOpen={setCategoryOpen}
        categoriesTree={categoriesTree}
        units={units}
      />

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