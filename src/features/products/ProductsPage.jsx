import { useState } from 'react'
import { motion } from 'framer-motion'
import { PageHeader } from '@/components/common/PageHeader'
import { UnitForm } from '@/features/products/features/units/components/UnitForm'
import { CategoryForm } from '@/features/products/features/categories/components/CategoryForm'
import { GridCategoryUnit } from '@/features/products/components/GridCategoryUnit'
import { ProductsTable } from '@/features/products/components/ProductsTable'
import {
  useBaseUnits,
  useCreateUnit,
} from '@/features/products/features/units/hooks/useUnits'
import {
  useCategories,
  useParentCategories,
  useCreateCategory,
} from '@/features/products/features/categories/hooks/useCategories'
import {
  useProducts,
} from './hooks/useProducts'

export const ProductsPage = () => {
  const [unitOpen, setUnitOpen] = useState(false)
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [page, setPage] = useState(1)

  const limit = 5

  const { data: units = [] } = useBaseUnits()
  const { data: categoriesTree = [] } = useParentCategories()
  const { data: categories = [] } = useCategories()

  const {
    data: products = [],
    isLoading: productsLoading,
  } = useProducts({ page, limit })

  const createUnit = useCreateUnit()
  const createCategory = useCreateCategory()

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
        description='Gestion de productos, categorias y unidades'
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className='w-full'
      >
        <ProductsTable
          products={products}
          loading={productsLoading}
          page={page}
          setPage={setPage}
          limit={limit}
        />
      </motion.div>

      <GridCategoryUnit
        setUnitOpen={setUnitOpen}
        setCategoryOpen={setCategoryOpen}
        categoriesTree={categoriesTree}
        units={units}
      />

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
