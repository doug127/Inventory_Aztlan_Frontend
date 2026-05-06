import { z } from 'zod'

export const createUserSchema = z.object({
  username: z.string()
    .min(3, 'Mínimo 3 caracteres')
    .max(20, 'Máximo 20 caracteres')
    .regex(/^[a-zA-Z0-9_]+$/, 'Solo letras, números y guión bajo'),
  fullname: z.string()
    .min(3, 'Mínimo 3 caracteres')
    .max(50, 'Máximo 50 caracteres'),
  password: z.string()
    .min(6, 'Mínimo 6 caracteres'),
  role_id: z.number().optional(),
})

export const updateUserSchema = z.object({
  username: z.string()
    .min(3, 'Mínimo 3 caracteres')
    .max(20, 'Máximo 20 caracteres')
    .regex(/^[a-zA-Z0-9_]+$/, 'Solo letras, números y guión bajo')
    .optional(),
  fullname: z.string()
    .min(3, 'Mínimo 3 caracteres')
    .max(50, 'Máximo 50 caracteres')
    .optional(),
  password: z.string()
    .min(6, 'Mínimo 6 caracteres')
    .optional()
    .or(z.literal('')),
  is_active: z.boolean().optional(),
  role_id: z.number().optional(),
})