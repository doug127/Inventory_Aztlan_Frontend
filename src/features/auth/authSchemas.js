import { z } from 'zod'

// Política de contraseñas del backend (business_rules.md §9.2.1). La misma lista alimenta la
// validación del formulario y la lista de requisitos que se ve mientras se escribe.
export const PASSWORD_RULES = [
  { id: 'length', label: 'Al menos 8 caracteres', test: (v) => v.length >= 8 },
  { id: 'upper', label: 'Una letra mayúscula', test: (v) => /[A-Z]/.test(v) },
  { id: 'lower', label: 'Una letra minúscula', test: (v) => /[a-z]/.test(v) },
  { id: 'number', label: 'Un número', test: (v) => /[0-9]/.test(v) },
]

const newPasswordField = z
  .string()
  .max(128, 'La contraseña no debe superar los 128 caracteres')
  .refine((v) => PASSWORD_RULES.every((rule) => rule.test(v)), 'La contraseña no cumple los requisitos')

const withConfirmation = (shape) =>
  z.object({ ...shape, confirmPassword: z.string().min(1, 'Repite la contraseña') }).refine(
    (data) => data.newPassword === data.confirmPassword,
    { path: ['confirmPassword'], message: 'Las contraseñas no coinciden' }
  )

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, 'Escribe tu correo electrónico'),
  password: z.string().min(1, 'Escribe tu contraseña'),
  remember: z.boolean(),
})

export const forgotPasswordSchema = z.object({
  email: z.string().trim().min(1, 'Escribe tu correo electrónico').email('El correo no tiene un formato válido'),
})

export const resetPasswordSchema = withConfirmation({ newPassword: newPasswordField })

export const changePasswordSchema = withConfirmation({
  currentPassword: z.string().min(1, 'Escribe tu contraseña actual'),
  newPassword: newPasswordField,
})
