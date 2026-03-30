import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export const cn = (...inputs) => twMerge(clsx(inputs))

export const formatDate = (date) => {
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export const formatNumber = (n, decimals = 2) => {
  return new Intl.NumberFormat('es-MX', {
    maximumFractionDigits: decimals,
  }).format(n)
}
