import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { PageHeader } from '@/components/common/PageHeader'
import { ProductForm } from './components/ProductForm'
import { UnitForm } from '@/features/products/features/units/components/UnitForm'
import { CategoryForm } from '@/features/products/features/categories/components/CategoryForm'
import { GridUnit } from '@/features/products/features/units/layouts/GridUnit'
import { GridCategory } from '@/features/products/features/categories/layouts/GridCategory'
import { ProductsTable } from '@/features/products/components/ProductsTable'
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
  const [unitOpen, setUnitOpen] = useState(false)
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [productOpen, setProductOpen] = useState(false)

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
  const updateProduct = useUpdateProduct()
  const updateUnit = useUpdateUnit()

  // const handleCreateProduct = async (data) => {
  //   await createProduct.mutateAsync(data)
  //   setProductOpen(false)
  // }

  const handleCreateUnit = async (data) => {
    await createUnit.mutateAsync(data)
    setUnitOpen(false)
  }

  const handleCreateCategory = async (data) => {
    await createCategory.mutateAsync(data)
    setCategoryOpen(false)
  }

  const openCreateProduct = () => {
    setSelectedProduct(null);
    setProductOpen(true);
  };
  
  const openEditProduct = (product) => {
    setSelectedProduct(product);
    setProductOpen(true);
  };

  const handleEditProduct = async (id, data) => {
    await updateProduct.mutateAsync({
      id: selectedProduct.id,
      ...data
    });

    setSelectedProduct(null);
    setProductOpen(false);
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
        <ProductsTable
          products={products}
          loading={productsLoading}
          page={page}
          setPage={setPage}
          limit={limit}
          onEdit={openEditProduct}
        />
      </motion.div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>

        {/* CATEGORIES */}
        <GridCategory
          setCategoryOpen={setCategoryOpen}
          categoriesTree={categoriesTree}
        />

        {/* UNITS */}
        <GridUnit
          setUnitOpen={setUnitOpen}
          units={units}
        />
      </div>

      <ProductForm
        open={productOpen}
        onOpenChange={setProductOpen}
        product={selectedProduct}
        units={allUnits}
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
        units={units}
        onSubmit={handleCreateUnit}
        loading={createUnit.isPending}
      />

    </div>
  )
}



