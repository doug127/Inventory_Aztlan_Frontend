import { useState } from 'react'
import { motion } from 'framer-motion'
import { PageHeader } from '@/components/common/PageHeader'
import { ProductForm } from './components/ProductForm'
import { CategoryForm } from '@/features/products/features/categories/components/CategoryForm'
import { GridCategory } from '@/features/products/features/categories/layouts/GridCategory'
import { DataTable } from '@/components/layouts/DataTable'
import { productColumns } from './utils/productColumns.jsx'
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from './hooks/useProducts'
// Las unidades se gestionan en /units (HU-202); aquí solo se necesitan para el selector del producto.
import { useUnitOptions } from '@/features/units/unitsApi'
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
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [productOpen, setProductOpen] = useState(false)
  const [productsSearch, setProductsSearch] = useState('')

  
  const [filters, setFilters] = useState({
    search: '',
    unit: '',
    category: '',
  })

  const limit = 5

  const { data: unitOptions = [] } = useUnitOptions()
  const { data: categoriesTree = [] } = useParentCategories()
  const { data: categories = [] } = useCategories()
  const {
    data: products = [],
    isLoading: productsLoading,
  } = useProducts({ 
    page: productsPage, 
    limit,
    name: productsSearch,
    unit: filters.unit,
    category_product: filters.category, 
  })
  
  
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()
  const deleteProduct = useDeleteProduct()
  const createCategory = useCreateCategory()

  
  // const openCreateProduct = () => {
  //   setSelectedProduct(null);
  //   setProductOpen(true);
  // };
  
  
  const openEditProduct = (product) => {
    setSelectedProduct(product);
    setProductOpen(true);
  };

  const handleCreateCategory = async (data) => {
    await createCategory.mutateAsync(data)
    setCategoryOpen(false)
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

  const handleDeleteProduct = async (product) => {
    const confirmed = window.confirm(
      `¿Deseas eliminar el producto "${product.name}"?`
    )

    if (!confirmed) return

    deleteProduct.mutate(product.id)
  }

  
  return (
    <div className='space-y-6'>
      <PageHeader
        title='Productos'
        description='Gestion de productos y categorias'
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
          onDelete={handleDeleteProduct}
          searchValue={productsSearch}
          onSearchChange={(value) => {
            setProductsSearch(value)
            setProductsPage(1)
          }}
          searchPlaceholder='Buscar producto...'
        />
      </motion.div>

      <div className='grid grid-cols-1 gap-6 lg:max-w-xl'>

        {/* CATEGORIES */}
        <GridCategory
          setCategoryOpen={setCategoryOpen}
          categoriesTree={categoriesTree}
        />

      </div>

      <ProductForm
        open={productOpen}
        onOpenChange={setProductOpen}
        product={selectedProduct}
        units={unitOptions}
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

    </div>
  )
}



