// Formatos de fecha y de dispositivo compartidos por las pantallas de administración.

const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' })

/** "hace 5 minutos", "ayer", "hace 3 días" */
export const timeAgo = (value) => {
  if (!value) return null
  const seconds = Math.round((new Date(value).getTime() - Date.now()) / 1000)
  const units = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ]
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit)
  }
  return 'hace un momento'
}

export const formatDateTime = (value) =>
  value ? new Intl.DateTimeFormat('es', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—'

/** Navegador y sistema a partir del User-Agent, para la lista de dispositivos. */
export const describeDevice = (userAgent) => {
  if (!userAgent) return { name: 'Dispositivo desconocido', mobile: false }
  const ua = userAgent
  const browser = /Edg\//.test(ua)
    ? 'Edge'
    : /OPR\//.test(ua)
      ? 'Opera'
      : /Chrome\//.test(ua)
        ? 'Chrome'
        : /Firefox\//.test(ua)
          ? 'Firefox'
          : /Safari\//.test(ua)
            ? 'Safari'
            : /PostmanRuntime/.test(ua)
              ? 'Postman'
              : null
  const os = /Android/.test(ua)
    ? 'Android'
    : /iPhone|iPad/.test(ua)
      ? 'iOS'
      : /Windows/.test(ua)
        ? 'Windows'
        : /Mac OS X/.test(ua)
          ? 'macOS'
          : /Linux/.test(ua)
            ? 'Linux'
            : null
  return {
    name: [browser, os].filter(Boolean).join(' en ') || ua.slice(0, 40),
    mobile: /Android|iPhone|iPad|Mobile/.test(ua),
  }
}
