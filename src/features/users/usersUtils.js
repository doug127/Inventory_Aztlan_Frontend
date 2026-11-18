import { z } from 'zod'

// --- Formulario de alta y edición -------------------------------------------

// Igual que el backend (chk_users_username): empieza con letra, 3 a 50 caracteres.
const USERNAME_RE = /^[a-z][a-z0-9._]{2,49}$/

export const userFormSchema = z.object({
  fullName: z.string().trim().min(3, 'Escribe el nombre completo (mínimo 3 caracteres)').max(150, 'Máximo 150 caracteres'),
  email: z.string().trim().min(1, 'Escribe el correo').email('El correo no tiene un formato válido').max(150, 'Máximo 150 caracteres'),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(USERNAME_RE, 'Empieza con una letra; 3 a 50 caracteres: letras, números, punto o guion bajo'),
  roleCode: z.string().min(1, 'Elige un rol'),
})

/** "Raúl Méndez Pérez" → "raul.mendez" (user_flow.md §2.1: se sugiere nombre.apellido). */
export const suggestUsername = (fullName) => {
  const parts = fullName
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
  if (!parts.length) return ''
  return [parts[0], parts[1]].filter(Boolean).join('.').slice(0, 50)
}

// --- Permisos sobre un usuario (business_rules.md §8.3) ----------------------

/** El actor puede gestionar al usuario: rango inferior (o SUPERADMIN) y no es él mismo. */
export const canManage = (actor, user) =>
  Boolean(actor && user) && actor.id !== user.id && (actor.role?.code === 'SUPERADMIN' || user.role.hierarchy > actor.role?.hierarchy)

// --- Presentación -------------------------------------------------------------

export const initials = (fullName = '') =>
  fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('')

export { timeAgo, formatDateTime, describeDevice } from '@/lib/format'
