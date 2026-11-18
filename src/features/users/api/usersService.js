import { api } from '@/lib/api'

// Endpoints de /api/users (HU-107, HU-108, HU-109). El interceptor devuelve el sobre
// { success, data, meta }: las listas paginadas necesitan `meta`, el resto solo `data`.
const unwrap = (envelope) => envelope?.data

/** Quita los filtros vacíos para no mandar ?roleCode=&isActive= */
const cleanParams = (params) =>
  Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''))

export const usersService = {
  /** { data: UserDto[], meta: { pagination, filters, search, sort } } */
  list: (params) => api.get('/users', { params: cleanParams(params) }),

  get: (id) => api.get(`/users/${id}`).then(unwrap),

  assignableRoles: () => api.get('/users/assignable-roles').then(unwrap),

  /** { username, fullName, email, roleCode }: la contraseña temporal la envía el sistema por correo. */
  create: (body) => api.post('/users', body).then(unwrap),

  /** Cualquier subconjunto de { username, fullName, email, roleCode }. */
  update: (id, body) => api.patch(`/users/${id}`, body).then(unwrap),

  deactivate: (id) => api.post(`/users/${id}/deactivate`).then(unwrap),

  activate: (id) => api.post(`/users/${id}/activate`).then(unwrap),

  /** { user, wasLocked } */
  unlock: (id) => api.post(`/users/${id}/unlock`).then(unwrap),

  /** { message, user, revokedSessions } */
  forcePasswordReset: (id) => api.post(`/users/${id}/force-password-reset`).then(unwrap),

  sessions: (id) => api.get(`/users/${id}/sessions`).then(unwrap),

  /** { user, revokedSessions } */
  revokeSessions: (id) => api.post(`/users/${id}/revoke-sessions`).then(unwrap),
}
