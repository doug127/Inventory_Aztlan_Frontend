import axios from 'axios'
import { useAuthStore } from '@/stores/authStore'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

// RESPONSE → manejo global de errores
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status
    const message = error.response?.data?.error ?? 'Error inesperado'

    if (status === 401 && window.location.pathname !== '/login') {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }

    if (status === 403) window.location.href = '/403'

    if (status === 500) console.error('[Server Error]', error.response?.data)

    return Promise.reject({ status, message, raw: error.response?.data })
  }
)
