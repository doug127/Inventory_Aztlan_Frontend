import { ROLES } from '../constants/roles'

export const getAssignableRoles = (currentUser) => {
  if (!currentUser) return []

  switch (currentUser.role) {
    case 'superadmin':
      return [ROLES.ADMIN, ROLES.USER]

    case 'admin':
      return [ROLES.USER]

    default:
      return []
  }
}