import { useState } from 'react'
import { motion } from 'framer-motion'
import { PageHeader } from '@/components/common/PageHeader'
import { ProductForm } from './components/ProductForm'
import { UnitForm } from '@/features/products/features/units/components/UnitForm'
import { CategoryForm } from '@/features/products/features/categories/components/CategoryForm'
import { GridCategoryUnit } from '@/features/products/components/GridCategoryUnit'
import { ProductsTable } from '@/features/products/components/ProductsTable'
import { useCreateProduct } from './hooks/useProducts'
import {
  useBaseUnits,
  useAllUnits,
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
import { Button } from '@/components/common/Button'
import { Plus } from 'lucide-react'

export const ProductsPage = () => {
  const [productOpen, setProductOpen] = useState(false)
  const [unitOpen, setUnitOpen] = useState(false)
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [page, setPage] = useState(1)

  const [filters, setFilters] = useState({
    search: '',
    unit: '',
    category: '',
  })

  const limit = 5

  const { data: units = [] } = useBaseUnits()
  const { data: allUnits = [] } = useAllUnits()
  const { data: categoriesTree = [] } = useParentCategories()
  const { data: categories = [] } = useCategories()

  const {
    data: products = [],
    isLoading: productsLoading,
  } = useProducts({ 
    page, 
    limit,
    name: filters.search,
    unit: filters.unit,
    category_product: filters.category, 
  })

  const createUnit = useCreateUnit()
  const createCategory = useCreateCategory()
  const createProduct = useCreateProduct()

  const handleCreateProduct = async (data) => {
    await createProduct.mutateAsync(data)
    setProductOpen(false)
  }

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
        actions={
          <div className='flex items-bottom gap-2'>
            <Button
              onClick={() => setProductOpen(true)}
              className='text-sm'
            >
              <Plus className='mr-2 h-4 w-4' /> Nuevo Producto
            </Button>
          </div>
        }
        actionsPosition='center'
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

      <ProductForm
        open={productOpen}
        onOpenChange={setProductOpen}
        units={allUnits}
        categoriesTree={categoriesTree}
        onSubmit={handleCreateProduct}
        loading={createProduct.isPending}
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
