import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { DataTable } from '@/components/common/DataTable'
import { StatusBadge } from '@/components/common/StatusBadge'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { PermissionGate } from '@/features/auth/PermissionGate'
import { Button } from '@/components/ui/button'
import { HIERARCHY } from '@/lib/constants'
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from './usersQueries'
import { UserForm } from './UserForm'
import { useAuthStore } from '@/stores/authStore'

export const UsersPage = () => {
  const [formOpen, setFormOpen]       = useState(false)
  const [deleteOpen, setDeleteOpen]   = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [serverError, setServerError] = useState(null)

  const currentUser = useAuthStore((s) => s.user)

  const { data: users = [], isLoading } = useUsers()

  const createUser  = useCreateUser()
  const updateUser  = useUpdateUser()
  const deleteUser  = useDeleteUser()
  
  const handleCreate = () => {
    setSelectedUser(null)
    setServerError(null)
    setFormOpen(true)
  }

  const handleEdit = (user) => {
    setSelectedUser(user)
    setServerError(null)
    setFormOpen(true)
  }

  const canDeleteUser = (targetUser) => {
    if(!currentUser || !targetUser) return false
    
     if (targetUser.role === 'superadmin') {
        return false
      }
    // No puede eliminarse a sí mismo
    if(targetUser.id === currentUser.id) return false 

    // Solo puede eliminarse a usuarios de menor jerarquía
    return targetUser.hierarchy_level < currentUser.hierarchy_level
  }
  
  const handleDeleteClick = (user) => {
    if(!canDeleteUser(user)) return

    setSelectedUser(user)
    setDeleteOpen(true)
  }

  const handleFormSubmit = async (data) => {
    try {
      setServerError(null)

      if (selectedUser) {
        await updateUser.mutateAsync({ id: selectedUser.id, data })
      } else {
        await createUser.mutateAsync(data)
      }

      setFormOpen(false)
    } catch (error) {
      console.log('SERVER ERROR:', error)

      setServerError(
        error?.response?.data?.message ||
        error?.message ||
        'Error inesperado'
      )
    }
  }

  const handleDeleteConfirm = async () => {
    try {
      await deleteUser.mutateAsync(selectedUser.id)
      setDeleteOpen(false)
      setSelectedUser(null)
    } catch (error) {
      console.error('Delete user error:', error)
    }
  }

  const columns = [
    {
      accessorKey: 'fullname',
      header: 'Nombre',
      cell: ({ row }) => (
        <span className='font-medium'>{row.original.fullname}</span>
      ),
    },
    {
      accessorKey: 'username',
      header: 'Usuario',
      cell: ({ row }) => (
        <span className='text-muted-foreground'>@{row.original.username}</span>
      ),
    },
    {
      accessorKey: 'role',
      header: 'Rol',
      cell: ({ row }) => (
        <StatusBadge value={row.original.role} label={row.original.role} />
      ),
    },
    {
      accessorKey: 'is_active',
      header: 'Estado',
      cell: ({ row }) => (
        <StatusBadge value={row.original.is_active ? 'active' : 'inactive'} />
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className='flex items-center justify-end gap-2'>
          <PermissionGate minHierarchy={HIERARCHY.ADMIN}>
            <Button
              variant='ghost'
              size='icon'
              className='h-8 w-8'
              onClick={() => handleEdit(row.original)}
            >
              <Pencil className='h-3.5 w-3.5' />
            </Button>
          </PermissionGate>
          <PermissionGate minHierarchy={HIERARCHY.SUPERADMIN}>
            {canDeleteUser(row.original) && (
              <Button
                variant='ghost'
                size='icon'
                className='h-8 w-8 text-destructive hover:text-destructive'
                onClick={() => handleDeleteClick(row.original)}
              >
                <Trash2 className='h-3.5 w-3.5' />
              </Button>
            )}
          </PermissionGate>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title='Usuarios'
        description='Gestión de usuarios del sistema'
        actions={
          <PermissionGate minHierarchy={HIERARCHY.ADMIN}>
            <Button size='sm' onClick={handleCreate}>
              <Plus className='h-4 w-4 mr-2' />
              Nuevo usuario
            </Button>
          </PermissionGate>
        }
      />

      <DataTable
        columns={columns}
        data={users}
        loading={isLoading}
        emptyTitle='Sin usuarios'
        emptyDescription='No hay usuarios registrados aún'
      />

      <UserForm
        open={formOpen}
        onOpenChange={setFormOpen}
        user={selectedUser}
        onSubmit={handleFormSubmit}
        loading={createUser.isPending || updateUser.isPending}
        serverError={serverError}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title='¿Eliminar usuario?'
        description={`Esta acción eliminará permanentemente a "${selectedUser?.fullname}".`}
        confirmLabel='Eliminar'
        variant='destructive'
        onConfirm={handleDeleteConfirm}
        loading={deleteUser.isPending}
      />
    </div>
  )
}