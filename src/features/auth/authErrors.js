// Mensajes para el usuario a partir de los códigos de error del backend (naming_conventions.md §11).

const minutesUntil = (details) => {
  const seconds = details?.retryAfterSeconds
  return seconds ? Math.max(1, Math.ceil(seconds / 60)) : null
}

export const loginErrorMessage = (error) => {
  switch (error?.code) {
    case 'AUTH_INVALID_CREDENTIALS':
      return 'Correo o contraseña incorrectos.'
    case 'AUTH_ACCOUNT_LOCKED': {
      const minutes = minutesUntil(error.details)
      return `Tu cuenta está bloqueada temporalmente por varios intentos fallidos. ${
        minutes ? `Intenta de nuevo en ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}` : 'Intenta más tarde'
      } o contacta al administrador.`
    }
    case 'AUTH_ACCOUNT_INACTIVE':
      return 'Tu cuenta está desactivada. Contacta al administrador.'
    case 'AUTH_RATE_LIMITED':
      return 'Demasiados intentos desde este equipo. Espera un minuto e inténtalo de nuevo.'
    default:
      return genericErrorMessage(error)
  }
}

export const genericErrorMessage = (error) => {
  if (error?.code === 'NETWORK_ERROR') return error.message
  if (error?.code === 'AUTH_RATE_LIMITED') return error.message
  if (error?.status >= 500) return 'Ocurrió un error en el servidor. Inténtalo de nuevo en unos minutos.'
  return error?.message ?? 'Ocurrió un error inesperado.'
}

/** Errores por campo que devuelve el backend en details: [{ path, message }]. */
export const fieldErrorsFrom = (error) =>
  Array.isArray(error?.details)
    ? error.details.reduce((acc, issue) => {
        if (issue.path && !acc[issue.path]) acc[issue.path] = issue.message
        return acc
      }, {})
    : {}

/** m•••@aztlan.mx: confirma a dónde se envió sin mostrar el correo completo. */
export const maskEmail = (email) => {
  const [name, domain] = String(email).split('@')
  return domain ? `${name.charAt(0)}•••@${domain}` : email
}
