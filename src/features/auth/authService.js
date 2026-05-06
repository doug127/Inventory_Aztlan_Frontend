import { api } from '@/lib/api'

export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  me: async () => {
    const res = await api.get('/auth/me')
    return res.user // 🔥 aquí limpias
  },
  logout: () => api.post('/auth/logout'),
}