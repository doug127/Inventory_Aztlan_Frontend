import { axios } from 'axios'
import { useAuthStore } from '@/stores/authStore'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: { 'Content-Type': 'application/json' },
  // withCredentials: true,
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// RESPONSE → manejo global de errores
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status

    if (status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }

    if (status === 403) {
      window.location.href = '/403'
    }

    if (status === 500) {
      console.error('[Server Error]', error.response?.data)
      // toast.error('Error interno del servidor') ← lo activamos cuando instalemos sonner en Fase 2
    }

    return Promise.reject(error.response?.data ?? error)
  }
)
