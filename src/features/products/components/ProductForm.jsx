import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/common/Button'
import { productSchema } from '../schemas/productSchema'


const ErrorMessage = ({ message }) => {
  if (!message) return null

  return (
    <p className='mt-1 text-xs text-red-600'>
      {message}
    </p>
  )
}

export const ProductForm = ({
  open,
  onOpenChange,
  onSubmit,
  loading,
  units = [],
  categories = [],
}) => {
  const {
    register,
    handleSubmit,
    reset,
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
    },
  })

  const fieldClass =
  `w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 
  shadow-sm transition-all duration-200 placeholder:text-gray-400 
  focus:border-black focus:ring-2 focus:ring-gray-200 focus:outline-none`

  const labelClass = 'block mb-2 text-sm font-medium text-gray-700'


  useEffect(() => {
    if (!open) return

    reset({
      name: '',
      code: '',
      product_category_id: null,
      unit_id: null,
      content_quantity: undefined,
      min_stock: undefined,
      max_stock: undefined,
    })
  }, [open, reset])

  if (!open) return null

  const closeModal = () => onOpenChange(false)

  const submitForm = handleSubmit(async (data) => {
    await onSubmit(data)
  })

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
            <button
              type='button'
              onClick={closeModal}
              className='cursor-pointer w-10 h-10 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors'
              aria-label='Cerrar modal'
            >
              <svg
                className='w-5 h-5'
                aria-hidden='true'
                xmlns='http://www.w3.org/2000/svg'
                width='24'
                height='24'
                fill='none'
                viewBox='0 0 24 24'
              >
                <path
                  stroke='currentColor'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M6 18 17.94 6M18 18 6.06 6'
                />
              </svg>
            </button>
          </div>

          <form onSubmit={submitForm} className='space-y-5 p-6'>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              {/* Nombre */}
              <div>
                <label className={labelClass} htmlFor='product-name'>
                  Nombre
                </label>
                <input
                  id='product-name'
                  type='text'
                  placeholder='Nombre del producto'
                  className={fieldClass}
                  {...register('name')}
                />
                <ErrorMessage message={errors.name?.message} />
              </div>

              {/* Codigo */} 
              <div>
                <label className={labelClass} htmlFor='product-code'>
                  Codigo
                </label>
                <input
                  id='product-code'
                  type='text'
                  placeholder='Codigo interno'
                  className={fieldClass}
                  {...register('code')}
                />
                <ErrorMessage message={errors.code?.message} />
              </div>
            </div>

            {/* Categoria y Unidad */}
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <div>
                <label className={labelClass} htmlFor='product-category'>
                  Categoria
                </label>
                <select
                  id='product-category'
                  className={fieldClass}
                  {...register('product_category_id', { valueAsNumber: true })}
                >
                  <option value=''>Seleccionar categoria</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <ErrorMessage message={errors.product_category_id?.message} />
              </div>

              <div>
                <label className={labelClass} htmlFor='product-unit'>
                  Unidad
                </label>
                <select
                  id='product-unit'
                  className={fieldClass}
                  {...register('unit_id', { valueAsNumber: true })}
                >
                  <option value=''>Seleccionar unidad</option>
                  {units.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name} ({unit.code})
                    </option>
                  ))}
                </select>
                <ErrorMessage message={errors.unit_id?.message} />
              </div>
            </div>

            {/* Contenido, Stock Minimo y Stock Maximo */}
            <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
              <div>
                <label className={labelClass} htmlFor='product-content'>
                  Contenido
                </label>
                <input
                  id='product-content'
                  type='number'
                  placeholder='1'
                  step='1'
                  className={fieldClass}
                  {...register('content_quantity', { valueAsNumber: true })}
                />
                <ErrorMessage message={errors.content_quantity?.message} />
              </div>

              <div>
                <label className={labelClass} htmlFor='product-min-stock'>
                  Stock minimo
                </label>
                <input
                  id='product-min-stock'
                  type='number'
                  placeholder='0'
                  step='1'
                  className={fieldClass}
                  {...register('min_stock', { valueAsNumber: true })}
                />
                <ErrorMessage message={errors.min_stock?.message} />
              </div>

              <div>
                <label className={labelClass} htmlFor='product-max-stock'>
                  Stock maximo
                </label>
                <input
                  id='product-max-stock'
                  type='number'
                  placeholder='100'
                  step='1'
                  className={fieldClass}
                  {...register('max_stock', { valueAsNumber: true })}
                />
                <ErrorMessage message={errors.max_stock?.message} />
              </div>
            </div>

            <div className='flex flex-col-reverse gap-3 border-t border-gray-100 px-6 py-4 sm:flex-row sm:justify-end'>
              <Button
                type='button'
                variant='neutral'
                onClick={closeModal}
                className='w-full sm:w-auto'
              >
                Cancelar
              </Button>

              <Button
                type='submit'
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
