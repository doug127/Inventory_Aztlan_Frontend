import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { unitSchema } from '../schemas/unitSchema'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'
import { MessageError } from '@/components/common/MessageError'
import { ButtonCloseModal } from '@/components/common/ButtonCloseModal'
import { Select } from '@/components/common/Select'

export const UnitForm = ({
  open,
  onOpenChange,
  unit = null,
  onSubmit,
  loading,
  units = [],
  serverError,
}) => {

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(unitSchema),

    defaultValues: {
      name: '',
      code: '',
      is_active: true,
      base_unit_id: null,
      conversion_factor: 1,
    },
  })

  const [exampleValue, setExampleValue] = useState("")
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

  const unitOptions = [
    {
      value: "",
      label: "Unidad base",
    },
    ...baseUnits.map((u) => ({
      value: u.id,
      label: `${u.name} (${u.code})`,
    })),
  ];
  
  useEffect(() => {
    if (!open) return
    
    if (unit){
      reset({
        name: unit.name, 
        code: unit.code,
        is_active: unit.is_active,
        base_unit_id: unit.base_unit?.id,
        conversion_factor: unit.conversion_factor,
      })
    } else {
      reset({
        name: "",
        code: "",
        is_active: false,
        base_unit_id: null,
        conversion_factor: null,
      })
    }
    
  }, [unit, open])

  // Si no tiene unidad base entonces factor = 1
  useEffect(() => {
    if (watch('base_unit_id') === null) {
      setValue('conversion_factor', 1)
    }
  }, [watch('base_unit_id'), setValue])

  const submitForm = handleSubmit( async (data) => {
    if (data.base_unit_id === null) {
      data.conversion_factor = 1
    }

    data.is_active = true;

    await onSubmit(data)

    closeModal();
  })

  if (!open) return null;

  const closeModal = () => {
    reset()
    onOpenChange(false);
  }

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
                  Nueva Unidad
                </h3>
                <p className='mt-1 text-sm text-gray-500'>
                  Completa los datos principales de la Unidad.
                </p>
              </div>

              <ButtonCloseModal
                onClick={closeModal}
              />
            </div>

              <form
                onSubmit={submitForm}
                className='space-y-5 py-6 px-6'
              >
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                  <div>
                    {/* NAME */}

                    <Input
                      label='Nombre'
                      maxLength='50'
                      {...register('name')}
                    />
                    {errors.name && (
                      <MessageError message={errors.name.message}/>
                    )}
                  </div>

                  {/* CODE */}

                  <div>
                    <Input
                      label='Código'
                      maxLength='4'
                      {...register('code')}
                    />

                    {errors.code && (
                      <MessageError message={errors.code.message}/>
                    )}

                </div>

                </div>

                  
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                  {/* BASE UNIT */}
                  <div className=''>
                    <Select
                      {...register("base_unit_id", {
                        setValueAs: (value) => 
                          value === "" ? null : Number(value),
                      })}
                      error={errors.base_unit_id?.message}
                      options={unitOptions}
                    />

                    {errors.base_unit_id && (
                      <MessageError message={errors.base_unit_id.message} />
                    )}
                  </div>

                  {/* CONVERSION */}

                  <div>
                    <Input
                      label='Factor de conversión'
                      type='number'
                      step='0.01'
                      min='0'
                      disabled={watch('base_unit_id') === null}
                      {...register('conversion_factor', {
                        valueAsNumber: true,
                      })}
                    />

                    {errors.conversion_factor && (
                      <MessageError message={errors.conversion_factor.message} />
                    )}
                  </div>
                </div>

                

                <div className='space-y-1.5'>
                </div>

                <div className='mt-2 rounded-lg border p-3 bg-muted/30 space-y-2'>
                  <div className='flex items-center gap-3'>

                    {/* INPUT */}
                    <div className='flex items-center gap-2'>
                      <span className='text-xs text-muted-foreground'>Ejemplo de Conversión:</span>

                      <Input
                        type='text'
                        value={exampleValue}
                        min='0'
                        maxLength='3'
                        inputMode="numeric"
                        pattern="[0-9]*"
                        onChange={(e) => {
                          const value = e.target.value;

                          if(/^\d*$/.test(value)){
                            setExampleValue(value);
                          }
                        }}
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
                    variant='primary'
                    disabled={loading}
                  >
                    {loading
                      ? 'Guardando...' : 'Crear unidad'}
                  </Button>
                </div>
              </form>
          </div>
        </div>
      </div>
      
  )
}