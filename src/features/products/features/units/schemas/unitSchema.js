import { z } from 'zod'

export const unitSchema = z.object({
  name: z.string()
    .min(3, 'El nombre de la unidad debe tener al menos 3 caracteres')
    .max(50, 'El nombre de la unidad no debe exceder los 50 caracteres')
    .refine(val => !val.includes('  '), {
      message: 'El nombre de la unidad no debe contener espacios dobles',
    })
    .refine(val => /^[A-Za-z0-9\s]+$/.test(val), {
      message: 'El nombre de la unidad solo debe contener letras, números y espacios',
    }),

  code: z.string()
    .min(1, 'El código de la unidad debe tener al menos 1 carácter')
    .max(4, 'El código de la unidad no debe exceder los 4 caracteres')
    .refine(val => !val.includes(' '), {
      message: 'El código de la unidad no debe contener espacios',
    }),

  is_active: z.boolean(),

  base_unit_id: z.number().positive().nullable().optional(),

  conversion_factor: z.number({
    invalid_type_error: 'El factor de conversión debe ser numérico',
  }).positive('El factor de conversión debe ser mayor a 0'),
})