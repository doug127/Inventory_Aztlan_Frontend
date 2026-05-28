import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { ChevronsUpDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { productSchema } from '../schemas/productSchema'

export const ProductForm = ({
  open,
  onOpenChange,
  onSubmit,
  loading,
  units = [],
  categories = [],
}) => {

  const [unitOpen, setUnitOpen] =
    useState(false)

  const [categoryOpen, setCategoryOpen] =
    useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(productSchema),

    defaultValues: {
      name: '',
      code: '',
      product_category_id: null,
      unit_id: null,
      content_quantity: 1,
      min_stock: 0,
      max_stock: 0,
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        name: '',
        code: '',
        product_category_id: null,
        unit_id: null,
        content_quantity: 1,
        min_stock: 0,
        max_stock: 0,
      })
    }

  }, [open, reset])

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className='sm:max-w-2xl'>

        <DialogHeader>
          <DialogTitle>
            Nuevo producto
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className='space-y-4'
        >
          {/* NAME */}

          <div className='space-y-1.5'>
            <Label>
              Nombre
            </Label>

            <Input
              {...register('name')}
            />

            {errors.name && (
              <p className='text-xs text-destructive'>
                {errors.name.message}
              </p>
            )}

          </div>
          {/* CODE */}

          <div className='space-y-1.5'>
            <Label>
              Código
            </Label>

            <Input {...register('code')}/>

            {errors.code && (
              <p className='text-xs text-destructive'>
                {errors.code.message}
              </p>
            )}

          </div>

          {/* CATEGORY */}

          <div className='space-y-1.5'>
            <Label>
              Categoría
            </Label>

            <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
              <PopoverTrigger className={cn(
                'flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-accent cursor-pointer',
                errors.product_category_id && 'border-destructive'
              )}>
    
                  {
                    watch('product_category_id')
                      ? categories.find(
                          (c) =>
                            c.id ===
                            watch('product_category_id')
                        )?.name
                      : 'Seleccionar categoría'
                  }
                  <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                </PopoverTrigger>

              <PopoverContent className='w-[400px] p-0'>
                <Command>
                  <CommandInput placeholder='Buscar categoría...' />
                  <CommandList>
                    <CommandEmpty>
                      No se encontraron categorías
                    </CommandEmpty>
                    <CommandGroup>
                      {categories.map((category) => (
                        <CommandItem
                          key={category.id}
                          value={category.name}
                          onSelect={() => {
                            setValue(
                              'product_category_id',
                              category.id,
                              {
                                shouldValidate: true,
                                shouldDirty: true,
                              }
                            )
                            setCategoryOpen(false)
                          }}
                        >

                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              watch('product_category_id') === category.id
                                ? 'opacity-100'
                                : 'opacity-0'
                            )}
                          />

                          {category.name}

                        </CommandItem>

                      ))}

                    </CommandGroup>

                  </CommandList>

                </Command>

              </PopoverContent>

            </Popover>

          </div>

          {/* UNIT */}

          <div className='space-y-1.5'>

            <Label>
              Unidad
            </Label>

            <Popover
              open={unitOpen}
              onOpenChange={setUnitOpen}
            >

              <PopoverTrigger className={cn(
                'flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-accent cursor-pointer',
                errors.unit_id && 'border-destructive'
              )}>

                
                  {
                    watch('unit_id')
                      ? units.find(
                          (u) =>
                            u.id ===
                            watch('unit_id')
                        )?.name
                      : 'Seleccionar unidad'
                  }

                  <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />

                </PopoverTrigger>

              <PopoverContent className='w-[400px] p-0'>

                <Command>

                  <CommandInput placeholder='Buscar unidad...' />

                  <CommandList>

                    <CommandEmpty>
                      No se encontraron unidades
                    </CommandEmpty>

                    <CommandGroup>

                      {units.map((unit) => (

                        <CommandItem
                          key={unit.id}
                          value={unit.name}
                          onSelect={() => {

                            setValue(
                              'unit_id',
                              unit.id,
                              {
                                shouldValidate: true,
                                shouldDirty: true,
                              }
                            )

                            setUnitOpen(false)
                          }}
                        >

                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              watch('unit_id') === unit.id
                                ? 'opacity-100'
                                : 'opacity-0'
                            )}
                          />

                          {unit.name}

                        </CommandItem>

                      ))}

                    </CommandGroup>

                  </CommandList>

                </Command>

              </PopoverContent>

            </Popover>

          </div>

          {/* NUMBERS */}

          <div className='grid grid-cols-3 gap-4'>

            <div className='space-y-1.5'>

              <Label>
                Contenido
              </Label>

              <Input
                type='number'
                {...register(
                  'content_quantity',
                  {
                    valueAsNumber: true,
                  }
                )}
              />

            </div>

            <div className='space-y-1.5'>

              <Label>
                Stock mínimo
              </Label>

              <Input
                type='number'
                {...register(
                  'min_stock',
                  {
                    valueAsNumber: true,
                  }
                )}
              />

            </div>

            <div className='space-y-1.5'>

              <Label>
                Stock máximo
              </Label>

              <Input
                type='number'
                {...register(
                  'max_stock',
                  {
                    valueAsNumber: true,
                  }
                )}
              />

            </div>

          </div>

          {/* ACTIONS */}

          <div className='flex justify-end pt-2'>

            <Button
              type='submit'
              disabled={loading}
            >
              Crear producto
            </Button>

          </div>

        </form>

      </DialogContent>

    </Dialog>
  )
}