import { KeyRound, Lock, LogIn, LogOut, MailQuestion, RefreshCw, ShieldAlert, ShieldCheck, Unlock } from 'lucide-react'

// Cómo se muestra cada tipo de evento de auth_events.
// tone: success (verde) | danger (rojo) | warning (ámbar) | neutral (gris)
export const EVENT_TYPES = {
  LOGIN_SUCCESS: { label: 'Inicio de sesión', icon: LogIn, tone: 'success' },
  LOGIN_FAILED: { label: 'Intento fallido', icon: ShieldAlert, tone: 'danger' },
  LOGOUT: { label: 'Cierre de sesión', icon: LogOut, tone: 'neutral' },
  TOKEN_REFRESHED: { label: 'Sesión renovada', icon: RefreshCw, tone: 'neutral' },
  ACCOUNT_LOCKED: { label: 'Cuenta bloqueada', icon: Lock, tone: 'danger' },
  ACCOUNT_UNLOCKED: { label: 'Cuenta desbloqueada', icon: Unlock, tone: 'warning' },
  PASSWORD_RESET_REQUESTED: { label: 'Recuperación solicitada', icon: MailQuestion, tone: 'warning' },
  PASSWORD_RESET_COMPLETED: { label: 'Contraseña restablecida', icon: ShieldCheck, tone: 'success' },
  PASSWORD_CHANGED: { label: 'Contraseña cambiada', icon: KeyRound, tone: 'success' },
}

export const TONES = {
  success: 'bg-forest-50 text-forest-700',
  danger: 'bg-red-50 text-red-600',
  warning: 'bg-amber-50 text-amber-700',
  neutral: 'bg-sand-50 text-ink-500',
}

const ALL = Object.keys(EVENT_TYPES)

// Atajos de filtro. "Accesos" (por defecto) quita las renovaciones de sesión, que se registran
// cada ~15 min por usuario activo y taparían todo lo demás.
export const PRESETS = [
  { id: 'access', label: 'Accesos', types: ALL.filter((t) => t !== 'TOKEN_REFRESHED') },
  { id: 'failed', label: 'Intentos fallidos', types: ['LOGIN_FAILED'] },
  { id: 'locks', label: 'Bloqueos', types: ['ACCOUNT_LOCKED', 'ACCOUNT_UNLOCKED'] },
  { id: 'sessions', label: 'Inicios y cierres', types: ['LOGIN_SUCCESS', 'LOGOUT'] },
  { id: 'passwords', label: 'Contraseñas', types: ['PASSWORD_RESET_REQUESTED', 'PASSWORD_RESET_COMPLETED', 'PASSWORD_CHANGED'] },
  { id: 'all', label: 'Todo', types: [] },
]
