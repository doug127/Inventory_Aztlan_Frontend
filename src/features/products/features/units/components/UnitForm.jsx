import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { unitSchema } from '../schemas/unitSchema'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
} from '@/components/ui/sheet'

export const UnitForm = ({
  open,
  onOpenChange,
  unit = null,
  onSubmit,
  loading,
  units = [],
  serverError,
}) => {

  const isEditing = !!unit

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(unitSchema),

    defaultValues: isEditing
      ? {
          name: unit.name,
          code: unit.code,
          is_active: unit.is_active,
          base_unit_id: unit.base_unit?.id ?? null,
          conversion_factor: unit.conversion_factor,
        }
      : {
          name: '',
          code: '',
          is_active: true,
          base_unit_id: null,
          conversion_factor: 1,
        },
  })

  const [exampleValue, setExampleValue] = useState(5)
  const conversionResult =
  exampleValue && watch('conversion_factor')
    ? exampleValue * watch('conversion_factor')
    : 0

  const getDecimals = (num) => {
    if (!num || !num.toString().includes('.')) return 0
    return num.toString().split('.')[1].length
  }

  const decimals = getDecimals(watch('conversion_factor')) + 1

  const formattedResult = conversionResult.toFixed(decimals)
  
  const baseUnits = units
  
  useEffect(() => {
    if (open) {
    
      const values = isEditing
        ? {
            name: unit.name,
            code: unit.code,
            is_active: unit.is_active,
            base_unit_id: unit.base_unit?.id ?? null,
            conversion_factor: unit.conversion_factor,
          }
        : {
            name: '',
            code: '',
            is_active: true,
            base_unit_id: null,
            conversion_factor: 1,
          }

      reset(values)
    }
  }, [open, unit, reset, isEditing])

  // Si NO tiene unidad base → factor = 1
  useEffect(() => {
    if (watch('base_unit_id') === null) {
      setValue('conversion_factor', 1)
    }
  }, [watch('base_unit_id'), setValue])

  const handleFormSubmit = (data) => {

    // 🔥 si es unidad base:
    // conversion_factor = 1 automáticamente
    if (data.base_unit_id === null) {
      data.conversion_factor = 1
    }

    onSubmit(data)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='sm:max-w-md'>

        <SheetHeader>
          <SheetTitle>
            {isEditing ? 'Editar unidad' : 'Nueva unidad'}
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
              placeholder='Kilogramo'
              {...register('name')}
              className={errors.name ? 'border-destructive' : ''}
            />

            {errors.name && (
              <p className='text-xs text-destructive'>
                {errors.name.message}
              </p>
            )}
          </div>

          {/* CODE */}

          <div className='space-y-1.5'>
            <Label>Código</Label>

            <Input
              placeholder='KG'
              {...register('code')}
              className={errors.code ? 'border-destructive' : ''}
            />

            {errors.code && (
              <p className='text-xs text-destructive'>
                {errors.code.message}
              </p>
            )}
          </div>

          {/* BASE UNIT */}
            
          <div className='space-y-1.5'>
            <Label>Unidad base</Label>

            <Select
              value={ watch('base_unit_id') === null
                ? 'Sin unidad base'
                : baseUnits.find(
                    (u) => u.id === watch('base_unit_id')
                  )?.name
              }
              onValueChange={(val) =>
                setValue(
                  'base_unit_id',
                  val === 'null'
                    ? null
                    : Number(val),
                  {
                    shouldValidate: true,
                    shouldDirty: true,
                  }
                )
              }
            >
              <SelectTrigger
                className={
                  errors.base_unit_id
                    ? 'border-destructive'
                    : ''
                }
              >
                <SelectValue placeholder='Sin unidad base' />
              </SelectTrigger>

              <SelectContent>

                <SelectItem value='null'>
                  Sin unidad base
                </SelectItem>

                {baseUnits.map((u) => (
                  <SelectItem
                    key={u.id}
                    value={u.id.toString()}
                  >
                    {u.name} ({u.code})
                  </SelectItem>
                ))}

              </SelectContent>
            </Select>

            {errors.base_unit_id && (
              <p className='text-xs text-destructive'>
                {errors.base_unit_id.message}
              </p>
            )}
          </div>

          {/* CONVERSION */}

          <div className='space-y-1.5'>
            <Label>Factor de conversión</Label>

            <Input
              type='number'
              step='0.01'
              disabled={watch('base_unit_id') === null}
              {...register('conversion_factor', {
                valueAsNumber: true,
              })}
              className={
                errors.conversion_factor
                  ? 'border-destructive'
                  : ''
              }
            />

            {errors.conversion_factor && (
              <p className='text-xs text-destructive'>
                {errors.conversion_factor.message}
              </p>
            )}
          </div>

          <div className='mt-2 rounded-lg border p-3 bg-muted/30 space-y-2'>

            <Label className='text-xs text-muted-foreground'>
              Ejemplo de conversión
            </Label>

            <div className='flex items-center gap-3'>

              {/* INPUT */}
              <div className='flex items-center gap-2'>
                <span className='text-xs text-muted-foreground'>Input:</span>

                <Input
                  type='number'
                  value={exampleValue}
                  onChange={(e) => setExampleValue(Number(e.target.value))}
                  className='h-8 w-24'
                />
              </div>

              {/* ICON / SEPARADOR */}
              <span className='text-muted-foreground text-sm'>
                →
              </span>

              {/* RESULTADO */}
              <div className='flex items-center gap-2'>
                <span className='text-xs text-muted-foreground'>Resultado:</span>

                <div className='h-8 min-w-[60px] flex items-center px-2 rounded-md bg-background border text-sm font-medium'>
                  {formattedResult}
                </div>
              </div>

            </div>
          </div>

          {/* STATUS */}

          {isEditing && (
            <div className='flex items-center gap-3'>

              <input
                type='checkbox'
                id='is_active'
                {...register('is_active')}
                className='h-4 w-4 rounded border'
              />

              <Label htmlFor='is_active'>
                Unidad activa
              </Label>

            </div>
          )}

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
                  : 'Crear unidad'}
            </Button>

          </SheetFooter>

        </form>

      </SheetContent>
    </Sheet>
  )
}