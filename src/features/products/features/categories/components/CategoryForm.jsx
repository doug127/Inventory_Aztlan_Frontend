import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { categorySchema } from '../schemas/categorySchema'
import { ButtonCloseModal } from '@/components/common/ButtonCloseModal'
import { MessageError } from '@/components/common/MessageError'
import { Input } from '@/components/common/Input'
import { Button } from '@/components/common/button'
import { ErrorMessage } from '@/features/products/components/ProductForm'
import { CategoryTreeSelect } from './CategoryTreeSelect'


export const CategoryForm = ({
  open,
  onOpenChange,
  category = null,
  categoriesTree = [],
  onSubmit,
  loading,
  serverError,
}) => {

  const isEditing = !!category
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [isBaseCategory, setIsBaseCategory] = useState(true);
  
  console.log(category);
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    // control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(categorySchema),
    
    defaultValues: {
      name: '',
      description: '',
      parent_id: null,
    },
  })
  
  const selectedParentId = watch("parent_id");

  useEffect(() => {
    if (!open) return;
    
    reset({
      name: category?.name ?? "",
      description: category?.description ?? "",
      parent_id: category?.parent_id ?? null,
    });

    setIsBaseCategory(category?.parent_id == null);
  }, [open, category, reset])

  const findCategoryById = (tree, id) => {
    for (const node of tree) {

      if (node.id === id) return node;

      if (node.children?.length) {

        const result = findCategoryById(node.children, id);

        if (result) return result;
      }
    }

    return null;
  };


  const submitForm = handleSubmit(async (data) => {
    await onSubmit(data);

    closeModal();
  })

  const closeModal = () => {
    reset()
    onOpenChange(false)
  }

  if (!open) return null;

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6 backdrop-blur-[2px]'
      role='dialog'
      aria-modal='true'
      aria-labelledby='category-modal-title'
    >
      <div className='relative w-full max-w-lg max-h-full'>
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

            <form
              onSubmit={submitForm}
              className='space-y-5 p-6'
            >

              {/* NAME */}

              <div className='grid grid-cols-1 gap-4'>
                <div>
                  <Input
                    label='Nombre'
                    {...register('name')}
                  />
                  {errors.name && (
                    <MessageError message={errors.name.message} />
                  )}
                </div>
              </div>

              {/* DESCRIPTION */}

              <div className='grid grid-cols-1 gap-4'>
                
                <Input
                  label='Descripción'
                  type='textarea'
                  {...register('description')}
                />
                {errors.description && (
                  <MessageError message={errors.description.message} />
                )}
              </div>

              {/* PARENT CATEGORY */}

              <div className="space-y-2">
                  <div className="flex items-center gap-2">
                  <input
                    id="isBaseCategory"
                    type="checkbox"
                    checked={isBaseCategory}
                    onChange={(e) => {
                      const checked = e.target.checked;

                      setIsBaseCategory(checked);

                      if (checked) {
                        setValue("parent_id", null, {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                      }
                    }}
                    className="h-4 w-4 rounded border-gray-300"
                  />

                  <label
                    htmlFor="isBaseCategory"
                    className="text-sm text-gray-700"
                  >
                    Categoría base
                  </label>
                </div>
                  <input
                    type="hidden"
                    {...register("parent_id", {
                      setValueAs: (value) =>
                        value === "" || value == null
                          ? null
                          : Number(value),
                    })}
                  />

                  <CategoryTreeSelect
                    disabled={isBaseCategory}
                    tree={categoriesTree}
                    value={findCategoryById(
                      categoriesTree,
                      selectedParentId
                    )}
                    onChange={(categorySelected) => {
                      setValue(
                        "parent_id",
                        categorySelected?.id ?? null,
                        {
                          shouldValidate: true,
                          shouldDirty: true,
                        }
                      );
                    }}
                  />

                  {errors.parent_id && (
                    <MessageError
                      message={errors.parent_id.message}
                    />
                  )}
              </div>

              {/* SERVER ERROR */}

              {serverError && (
                <div className='rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive'>
                  {serverError}
                </div>
              )}

              <div className='flex flex-col-reverse gap-3 px-2 py-4 sm:flex-row sm:justify-end'>
                <Button
                  type='button'
                  variant='neutral'
                  onClick={() => onOpenChange(false)}
                >
                  Cancelar
                </Button>

                  <Button
                    type='submit'
                    disabled={loading}
                  >
                    {loading
                      ? 'Guardando...'
                      : isEditing
                        ? 'Guardar cambios'
                        : 'Crear categoría'}
                  </Button>
              </div>
            </form>

        </div>
      </div>
    </div>
  )
}