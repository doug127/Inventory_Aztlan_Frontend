import { z } from 'zod'

export const userSchema = z.object({
  username: z.string()
    .min(3, 'El nombre de usuario debe tener al menos 3 caracteres')
    .max(30, 'El nombre de usuario no debe exceder los 30 caracteres')
    .refine(val => !val.includes(' '), 'El nombre de usuario no debe contener espacios')
    .regex(/^[a-zA-Z0-9_]+$/, 'Solo letras, números y guión bajo'),
  fullname: z.string()
    .nonempty('El nombre completo es obligatorio')
    .min(3, 'El nombre completo debe tener al menos 3 caracteres')
    .max(100, 'El nombre completo no debe exceder los 100 caracteres')
    .refine(val => !val.includes('  '), 'El nombre completo no debe contener espacios dobles')
    .refine(val => /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]+$/.test(val), 'El nombre completo solo debe contener letras y espacios')
    .refine(val => val.trim().split(' ').length >= 2, 'El nombre completo debe contener al menos un nombre y un apellido'),
  password: z.string()
    .nonempty('La contraseña es obligatoria')
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(100, 'La contraseña no debe exceder los 100 caracteres')
    .refine(val => !val.includes(' '), 'La contraseña no debe contener espacios')
    .refine(val => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.,-_])[A-Za-z\d@$!%*?&.,-_]{8,}$/.test(val), 
    'La contraseña debe tener al menos 8 caracteres, una letra mayúscula, una letra minúscula, un número y un carácter especial'),    
  role_id: z.number()
    .positive('El rol es obligatorio'),
})