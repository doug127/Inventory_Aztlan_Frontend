import { useState } from 'react'
import { motion } from 'framer-motion'
import { PageHeader } from '@/components/common/PageHeader'
import { ProductForm } from './components/ProductForm'
import { UnitForm } from '@/features/products/features/units/components/UnitForm'
import { CategoryForm } from '@/features/products/features/categories/components/CategoryForm'
import { GridUnit } from '@/features/products/features/units/layouts/GridUnit'
import { GridCategory } from '@/features/products/features/categories/layouts/GridCategory'
import { DataTable } from '@/components/layouts/DataTable'
import { productColumns } from './utils/productColumns.jsx'
import { useProducts, useCreateProduct, useUpdateProduct } from './hooks/useProducts'
import {
  useBaseUnits,
  useAllUnits,
  useCreateUnit,
  useUpdateUnit
} from '@/features/products/features/units/hooks/useUnits'
import {
  useCategories,
  useParentCategories,
  useCreateCategory,
} from '@/features/products/features/categories/hooks/useCategories'
import { Button } from '@/components/common/Button'
import { Plus } from 'lucide-react'


export const ProductsPage = () => {
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [productsPage, setProductsPage] = useState(1)
  const [unitsPage, setUnitsPage] = useState(1)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [productOpen, setProductOpen] = useState(false)
  const [selectedUnit, setSelectedUnit] = useState(null)
  const [unitOpen, setUnitOpen] = useState(false)
  
  const [filters, setFilters] = useState({
    search: '',
    unit: '',
    category: '',
  })

  const limit = 5

  const { data: units = [] } = useBaseUnits()
  const { 
    data: unitsResponse = {},
    isLoading: unitsLoading
  } = useAllUnits({
    page: unitsPage, 
    limit
  })
  const { data: categoriesTree = [] } = useParentCategories()
  const { data: categories = [] } = useCategories()
  const {
    data: products = [],
    isLoading: productsLoading,
  } = useProducts({ 
    page: productsPage, 
    limit,
    name: filters.search,
    unit: filters.unit,
    category_product: filters.category, 
  })
  
  const unitsAll = unitsResponse.data;
  
  const createUnit = useCreateUnit()
  const createCategory = useCreateCategory()
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()
  const updateUnit = useUpdateUnit()

  const handleCreateCategory = async (data) => {
    await createCategory.mutateAsync(data)
    setCategoryOpen(false)
  }

  // const openCreateProduct = () => {
  //   setSelectedProduct(null);
  //   setProductOpen(true);
  // };
  
  const openEditProduct = (product) => {
    setSelectedProduct(product);
    setProductOpen(true);
  };

  const openCreateUnit = () => {
    setSelectedUnit(null);
    setUnitOpen(true)
  }

  const openEditUnit = (unit) => {
    setSelectedUnit(unit);
    setUnitOpen(true)
  }

  const handleSubmitProduct = async (data) => {
    if (selectedProduct) {
      await updateProduct.mutateAsync({
        id: selectedProduct.id,
        data,
      });
    } else {
      await createProduct.mutateAsync(data);
    }

    setProductOpen(false);
    setSelectedProduct(null);
  };

  const handleSubmitUnit = async (data) => {
    if (selectedUnit) {
      await updateUnit.mutateAsync({
        id: selectedUnit.id,
        data
      });
    } else {
      await createUnit.mutateAsync(data);
    }
  }
  
  return (
    <div className='space-y-6'>
      <PageHeader
        title='Productos'
        description='Gestion de productos, categorias y unidades'
        actions={
          <div className='flex items-bottom gap-2'>
            <Button
              onClick={() =>{ 
                setSelectedProduct(null)
                setProductOpen(true)
              }}
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
        <DataTable
          title='Productos'
          data={products}
          loading={productsLoading}
          page={productsPage}
          onPageChange={setProductsPage}
          limit={limit}
          columns={productColumns}
          searchFields={["name"]}
          onEdit={openEditProduct}
        />
      </motion.div>

      <div className='grid grid-cols-1 lg:grid-cols-[0.8fr_1.5fr] gap-6'>

        {/* CATEGORIES */}
        <GridCategory
          setCategoryOpen={setCategoryOpen}
          categoriesTree={categoriesTree}
        />

        {/* UNITS */}
        <GridUnit
          onCreate={openCreateUnit}
          page={unitsPage}
          onPageChange={setUnitsPage}
          limit={limit}
          units={unitsResponse}
          loading={unitsLoading}
          onEdit={openEditUnit}
        />
      </div>

      <ProductForm
        open={productOpen}
        onOpenChange={setProductOpen}
        product={selectedProduct}
        units={unitsAll}
        categoriesTree={categoriesTree}
        onSubmit={handleSubmitProduct}
        loading={
          selectedProduct
            ? updateProduct.isPending
            : createProduct.isPending
        }
      />

      <CategoryForm
        open={categoryOpen}
        onOpenChange={setCategoryOpen}
        category={categories}
        categoriesTree={categoriesTree}
        onSubmit={handleCreateCategory}
        loading={createCategory.isPending}
      />
      <UnitForm
        open={unitOpen}
        onOpenChange={setUnitOpen}
        unit={selectedUnit}
        units={units}
        onSubmit={handleSubmitUnit}
        loading={
          selectedUnit
            ? updateUnit.isPending
            : createUnit.isPending
        }
      />

    </div>
  )
}



