// CategoryForm.jsx

import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { categorySchema } from '../schemas/categorySchema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'

export const CategoryForm = ({
  open,
  onOpenChange,
  category = null,
  categories = [],
  onSubmit,
  loading,
  serverError,
}) => {

  const isEditing = !!category
  const [categoryOpen, setCategoryOpen] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(categorySchema),

    defaultValues: isEditing
      ? {
          name: category.name,
          description: category.description || '',
          parent_id: category.parent_id ?? null,
        }
      : {
          name: '',
          description: '',
          parent_id: null,
        },
  })

  useEffect(() => {
    if (open) {

      const values = isEditing
        ? {
            name: category.name,
            description: category.description || '',
            parent_id: category.parent_id ?? null,
          }
        : {
            name: '',
            description: '',
            parent_id: null,
          }

      reset(values)
    }
  }, [open, category, reset, isEditing])

  const handleFormSubmit = (data) => {
    console.log('Form data raw:', data)
    const payload = {
      name: data.name.trim(),
      description: data.description?.trim() || undefined,
      parent_id: data.parent_id ?? null,
    }
    onSubmit(payload)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='sm:max-w-md'>

        <SheetHeader>
          <SheetTitle>
            {isEditing
              ? 'Editar categoría'
              : 'Nueva categoría'}
          </SheetTitle>
        </SheetHeader>

        <form
          onSubmit={handleSubmit(handleFormSubmit)}
          className='space-y-4 py-4'
        >

          {/* NAME */}

          <div className='space-y-1.5'>
            <Label>Nombre</Label>

            <Input
              placeholder='Herramientas'
              {...register('name')}
              className={
                errors.name
                  ? 'border-destructive'
                  : ''
              }
            />

            {errors.name && (
              <p className='text-xs text-destructive'>
                {errors.name.message}
              </p>
            )}
          </div>

          {/* DESCRIPTION */}

          <div className='space-y-1.5'>
            <Label>Descripción</Label>

            <Textarea
              placeholder='Descripción de la categoría'
              {...register('description')}
              className={
                errors.description
                  ? 'border-destructive'
                  : ''
              }
            />

            {errors.description && (
              <p className='text-xs text-destructive'>
                {errors.description.message}
              </p>
            )}
          </div>

          {/* PARENT CATEGORY */}

         <div className='space-y-1.5'>
            <Label>Categoría padre</Label>

            <Controller
              name='parent_id'
              control={control}
              render={({ field }) => (
                <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                  <PopoverTrigger>
                    <div
                      role='combobox'
                      className={cn(
                        'flex h-9 w-full items-center justify-between rounded-4xl border border-input bg-input/30 px-3 py-2 text-sm',
                        errors.parent_id && 'border-destructive'
                      )}
                    >
                      {field.value === null
                        ? 'Sin categoría padre'
                        : categories.find((cat) => cat.id === field.value)?.name ?? 'Sin categoría padre'
                      }
                      <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                    </div>
                  </PopoverTrigger>

                  <PopoverContent className='w-[var(--radix-popover-trigger-width)] p-0' align='start'>
                    <Command>
                      <CommandInput placeholder='Buscar categoría...' />
                      <CommandList>
                        <CommandEmpty>No se encontraron categorías</CommandEmpty>
                        <CommandGroup>

                          <CommandItem
                            value='Sin categoría padre'
                            onSelect={() => {
                              field.onChange(null)
                              setCategoryOpen(false)
                            }}
                          >
                            <Check className={cn('mr-2 h-4 w-4', field.value === null ? 'opacity-100' : 'opacity-0')} />
                            Sin categoría padre
                          </CommandItem>

                          {categories.map((cat) => {
                            if (category?.id === cat.id) return null
                            return (
                              <CommandItem
                                key={cat.id}
                                value={cat.name}
                                onSelect={() => {
                                  field.onChange(cat.id)
                                  setCategoryOpen(false)
                                }}
                              >
                                <Check className={cn('mr-2 h-4 w-4', field.value === cat.id ? 'opacity-100' : 'opacity-0')} />
                                {cat.name}
                              </CommandItem>
                            )
                          })}

                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              )}
            />

            {errors.parent_id && (
              <p className='text-xs text-destructive'>{errors.parent_id.message}</p>
            )}
          </div>

          {/* SERVER ERROR */}

          {serverError && (
            <div className='rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive'>
              {serverError}
            </div>
          )}

          <SheetFooter className='pt-4'>

            <Button
              type='button'
              variant='outline'
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

          </SheetFooter>

        </form>

      </SheetContent>
    </Sheet>
  )
}