import { useState } from 'react'
import { motion } from 'framer-motion'
import { PageHeader } from '@/components/common/PageHeader'
import { ProductForm } from './components/ProductForm'
import { DataTable } from '@/components/layouts/DataTable'
import { productColumns } from './utils/productColumns.jsx'
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from './hooks/useProducts'
// Las unidades se gestionan en /units (HU-202); aquí solo se necesitan para el selector del producto.
import { useUnitOptions } from '@/features/units/unitsApi'
// Las categorías se gestionan en /product-categories (HU-203); aquí solo se necesita el árbol activo.
import { useCategoryOptions } from '@/features/product-categories/productCategoriesApi'
import { Button } from '@/components/common/Button'
import { Plus } from 'lucide-react'


export const ProductsPage = () => {
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
  const { data: categoriesTree = [] } = useCategoryOptions()
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

  
  // const openCreateProduct = () => {
  //   setSelectedProduct(null);
  //   setProductOpen(true);
  // };
  
  
  const openEditProduct = (product) => {
    setSelectedProduct(product);
    setProductOpen(true);
  };

  
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
        description='Gestión de productos'
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


    </div>
  )
}



