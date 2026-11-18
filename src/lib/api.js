import axios from 'axios'
import { useAuthStore } from '@/stores/authStore'

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

// withCredentials: el navegador envía la cookie httpOnly del refresh token a /api/auth.
export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

// Cliente sin interceptores, solo para renovar la sesión (evita bucles de reintento).
const bare = axios.create({ baseURL, withCredentials: true })

const PUBLIC_PATHS = ['/login', '/forgot-password', '/reset-password']
const isOnPublicPage = () => PUBLIC_PATHS.some((p) => window.location.pathname.startsWith(p))

// Errores del access token que se resuelven renovando la sesión con el refresh token.
const RENEWABLE = new Set(['AUTH_TOKEN_EXPIRED', 'AUTH_TOKEN_INVALID'])

/**
 * Error normalizado del sobre estándar del backend:
 *   { success: false, error: { code, message, details?, requestId } }
 */
export const toApiError = (error) => {
  const body = error.response?.data
  return {
    status: error.response?.status ?? 0,
    code: body?.error?.code ?? (error.response ? 'UNKNOWN_ERROR' : 'NETWORK_ERROR'),
    message:
      body?.error?.message ??
      (error.response ? 'Error inesperado' : 'No se pudo conectar con el servidor. Revisa tu conexión.'),
    details: body?.error?.details,
    requestId: body?.error?.requestId,
  }
}

/**
 * Renueva la sesión con la cookie del refresh token. Las llamadas simultáneas comparten la misma
 * petición: el backend rota el token en cada uso y reusar uno ya rotado cierra TODAS las sesiones.
 * Devuelve { accessToken, user, ... } y actualiza el store.
 */
let refreshInFlight = null
export const refreshSession = () => {
  refreshInFlight ??= bare
    .post('/auth/refresh')
    .then((res) => {
      const session = res.data.data
      useAuthStore.getState().setSession(session)
      return session
    })
    .catch((error) => {
      throw toApiError(error)
    })
    .finally(() => {
      refreshInFlight = null
    })
  return refreshInFlight
}

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token && !config.headers.Authorization) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Éxito → devuelve el sobre { success, data, meta? }. Error → objeto normalizado (toApiError).
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const apiError = toApiError(error)
    const config = error.config ?? {}

    // Access token vencido: renueva una vez y repite la petición original.
    if (apiError.status === 401 && RENEWABLE.has(apiError.code) && config.headers?.Authorization && !config._retried) {
      try {
        const { accessToken } = await refreshSession()
        config._retried = true
        config.headers.Authorization = `Bearer ${accessToken}`
        return api(config)
      } catch {
        useAuthStore.getState().clearSession()
        if (!isOnPublicPage()) window.location.assign('/login')
        return Promise.reject(apiError)
      }
    }

    if (apiError.code === 'AUTH_ACCOUNT_INACTIVE' && config.headers?.Authorization) {
      useAuthStore.getState().clearSession()
      if (!isOnPublicPage()) window.location.assign('/login')
    }

    // Contraseña temporal pendiente: lo único permitido es cambiarla.
    if (apiError.code === 'AUTH_PASSWORD_CHANGE_REQUIRED' && window.location.pathname !== '/change-password') {
      window.location.assign('/change-password')
    }

    if (apiError.code === 'FORBIDDEN_ROLE') window.location.assign('/403')

    if (apiError.status >= 500) console.error('[Server Error]', apiError)

    return Promise.reject(apiError)
  }
)
