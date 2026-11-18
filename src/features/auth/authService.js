import { api, refreshSession } from '@/lib/api'

// Endpoints de /api/auth. Cada función devuelve el `data` del sobre estándar del backend.
const unwrap = (envelope) => envelope?.data

export const authService = {
  /** Acepta el correo o el username. remember=false → la sesión termina al cerrar el navegador. */
  login: ({ identifier, password, remember }) =>
    api.post('/auth/login', { username: identifier, password, remember }).then(unwrap),

  /** Recupera la sesión con la cookie del refresh token (al cargar la app o al vencer el access token). */
  refresh: refreshSession,

  me: () => api.get('/auth/me').then(unwrap),

  logout: () => api.post('/auth/logout'),

  /** Devuelve una sesión nueva { accessToken, user }: las demás sesiones quedan cerradas. */
  changePassword: ({ currentPassword, newPassword }) =>
    api.post('/auth/change-password', { currentPassword, newPassword }).then(unwrap),

  // --- Recuperación de contraseña (sin sesión) ---
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }).then(unwrap),

  validateResetToken: (token) => api.get('/auth/reset-password/validate', { params: { token } }).then(unwrap),

  resetPassword: ({ token, newPassword }) => api.post('/auth/reset-password', { token, newPassword }),

  // --- Sesiones activas (HU-109) ---
  listSessions: () => api.get('/auth/sessions').then(unwrap),

  revokeSession: (id) => api.delete(`/auth/sessions/${id}`),

  revokeOtherSessions: () => api.delete('/auth/sessions').then(unwrap),
}
