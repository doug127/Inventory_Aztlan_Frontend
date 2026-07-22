import { useEffect, useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/common/Button'
import { ButtonCloseModal } from '@/components/common/ButtonCloseModal'
import { Input } from '@/components/common/Input'
import { Select } from '@/components/common/Select'
import { productSchema } from '../schemas/productSchema'
import { CategoryTreeSelect } from '../features/categories/components/CategoryTreeSelect'
import { MessageError } from '@/components/common/MessageError'

export const ProductForm = ({
  open,
  onOpenChange,
  onSubmit,
  loading,
  product,
  units = [],
  categoriesTree = [],
}) => {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      code: '',
      product_category_id: null,
      unit_id: null,
      content_quantity: undefined,
      min_stock: undefined,
      max_stock: undefined,
    }
  })

  const categoryId = watch("product_category_id");

  useEffect(() => {
    if (!open) return

    if (product){
      reset({
        name: product.name,
        code: product.code,
        product_category_id: product.category_product?.id ?? null,
        unit_id: product.unit?.id ?? null,
        content_quantity: product.content_quantity,
        min_stock: product.min_stock,
        max_stock: product.max_stock,
      });
    } else {
      reset({
        name: '',
        code: '',
        product_category_id: null,
        unit_id: null,
        content_quantity: '',
        min_stock: '',
        max_stock: '',
      });
    }
  }, [product, open]);
  
  // const submitForm = handleSubmit(async (data) => {
  //   console.log(data)
  //   await onSubmit(data)
  // })
  
  const submitForm = handleSubmit(
    async (data) => {
      console.log("SUBMIT", data);
      await onSubmit(data);
    },
    (errors) => {
      console.log("ERRORES", errors);
    }
  );

  const findCategoryById = (tree, id) => {
    for (const node of tree) {

      if (node.id === id) return node;

      if (node.children?.length) {

        const result = findCategoryById(
          node.children,
          id
        );

        if (result) return result;
      }
    }
    return null;
  };

  const selectedCategory = useMemo(() => {
    return findCategoryById(categoriesTree, categoryId);
  }, [categoriesTree, categoryId]);
  
  if (!open) return null

  const closeModal = () => {
    reset();
    onOpenChange(false)
  };

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6 backdrop-blur-[2px]'
      role='dialog'
      aria-modal='true'
      aria-labelledby='product-modal-title'
    >
      <div className='relative w-full max-w-2xl max-h-full'>
        <div className='relative w-full rounded-2xl bg-white border border-gray-200 shadow-2xl overflor-hidden'>
          <div className='flex rounded-2xl items-center justify-between border-b border-gray-100 bg-gray-50 px-6 py-5'>
            <div>
              <h3 id='product-modal-title' className='text-xl font-semiblod text-gray-900'>
                Nuevo producto
              </h3>
              <p className='mt-1 text-sm text-gray-500'>
                Completa los datos principales del producto.
              </p>
            </div>

            {/* Botón de cerrar modal */}
            <ButtonCloseModal
              onClick={closeModal}
            />
          </div>

          <form onSubmit={submitForm} className='space-y-5 p-6'>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              {/* Nombre */}
              <div>
                <Input
                  label='Nombre'
                  {...register('name')}
                />
                {errors.name && (
                  <MessageError
                    message={errors.name.message}
                  />
                )}
              </div>

              {/* Codigo */} 
              <div>
                <Input
                  label='Codigo'
                  {...register('code')}
                />
                {errors.code && (
                  <MessageError
                    message={errors.code.message}
                  />
                )}
              </div>
            </div>

            {/* Categoria y Unidad */}
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <div>
                  <input
                    type="hidden"
                    {...register("product_category_id", {
                      valueAsNumber: true,
                    })}
                  />
                  
                  <CategoryTreeSelect
                    tree={categoriesTree}
                    value={
                      selectedCategory
                      // categoryId != null ? findCategoryById(categoriesTree, categoryId) : initialCategory
                    }
                    onChange={(category)=>{
                      setValue(
                        "product_category_id",
                        category.id,
                        {
                          shouldValidate:true,
                          shouldDirty:true
                        }
                      );

                    }}
                  />
                <MessageError message={errors.product_category_id?.message} />
              </div>

              <div>
                <Select
                  options={units.map((unit) => ({
                    value: unit.id,
                    label: unit.name,
                  }))}
                  {...register('unit_id', { valueAsNumber: true })}
                  placeholder='Selecciona una unidad'
                />
                <MessageError message={errors.unit_id?.message} />
              </div>
            </div>

            {/* Contenido, Stock Minimo y Stock Maximo */}
            <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
              <div>
                <Input
                  label='Contenido'
                  type='number'
                  min='0'
                  step='1'
                  {...register('content_quantity', { valueAsNumber: true })}
                />
                {errors.content_quantity && (
                  <MessageError
                    message={errors.content_quantity.message}
                  />
                )}
              </div>

              <div>
                <Input
                  label='Stock minimo'
                  type='number'
                  min='0'
                  step='1'
                  {...register('min_stock', { valueAsNumber: true })}
                />
                {errors.min_stock && (
                  <MessageError
                    message={errors.min_stock.message}
                  />
                )}
              </div>

              <div>
                <Input
                  label='Stock maximo'
                  type='number'
                  min='0'
                  step='1'
                  {...register('max_stock', { valueAsNumber: true })}
                />
                {errors.max_stock && (
                  <MessageError
                    message={errors.max_stock.message}
                  />
                )}
              </div>
            </div>

            <div className='flex flex-col-reverse gap-3 border-t border-gray-100 px-6 py-4 sm:flex-row sm:justify-end'>
              <Button
                onClick={closeModal}
                variant='neutral'
              >
                Cancelar
              </Button>

              <Button
                type='submit'
                variant='primary'
                disabled={loading}
                className='w-full sm:w-auto bg-brand hover:bg-brand-strong focus:ring-4 focus:ring-brand-medium'
              >
                {loading ? 'Creando...' : 'Crear producto'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
