import { useState } from 'react'
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
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export const ProductsPage = () => {

  const [unitOpen, setUnitOpen] = useState(false)

  const [categoryOpen, setCategoryOpen] = useState(false)

  const [productOpen, setProductOpen] = useState(false)

  const [page, setPage] = useState(1)

  const [filters, setFilters] = useState({
    search: '',
    unit: '',
    category: '',
  })

  const limit = 5

  // UNITS
  const { data: units = [] } =
    useBaseUnits()

  // const { data: allUnits = [] } =
  //   useAllUnits()

  // CATEGORY TREE
  const { data: categoriesTree = [] } =
    useParentCategories()

  // FLAT CATEGORIES
  const { data: categories = [] } =
    useCategories()

  // PRODUCTS
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

    // MUTATIONS
  const createUnit = useCreateUnit()

  const createCategory = useCreateCategory()

  const createProduct = useCreateProduct()

  const handleCreateProduct = async (data) => {
    console.log(data)
    await createProduct.mutateAsync(data)
    setProductOpen(false)
  }

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
      <Button
        onClick={() => setProductOpen(true)}
      >
        <Plus className='h-4 w-4 mr-2' />
        Nuevo producto
      </Button>
      <ProductForm
        open={productOpen}
        onOpenChange={setProductOpen}

        units={units}

        categories={categories}

        onSubmit={handleCreateProduct}

        loading={createProduct.isPending}
      />

      {/* PRODUCTS TABLE */}
      <ProductsTable
        products={products}
        loading={productsLoading}

        page={page}
        setPage={setPage}
        
        limit={limit}
        filters={filters}
        setFilters={setFilters}

        units={units}
        categories={categories}
      />

      {/* GRID SUPERIOR */}
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