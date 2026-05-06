import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { DataTable } from '@/components/common/DataTable'
import { StatusBadge } from '@/components/common/StatusBadge'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { PermissionGate } from '@/features/auth/PermissionGate'
import { Button } from '@/components/ui/button'
import { HIERARCHY } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from './usersQueries'
import { UserForm } from './UserForm'

export function UsersPage() {
  const [formOpen, setFormOpen]       = useState(false)
  const [deleteOpen, setDeleteOpen]   = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)

  const { data: users = [], isLoading } = useUsers()
  const createUser  = useCreateUser()
  const updateUser  = useUpdateUser()
  const deleteUser  = useDeleteUser()

  const handleCreate = () => {
    setSelectedUser(null)
    setFormOpen(true)
  }

  const handleEdit = (user) => {
    setSelectedUser(user)
    setFormOpen(true)
  }

  const handleDeleteClick = (user) => {
    setSelectedUser(user)
    setDeleteOpen(true)
  }

  const handleFormSubmit = async (data) => {
    if (selectedUser) {
      await updateUser.mutateAsync({ id: selectedUser.id, data })
    } else {
      await createUser.mutateAsync(data)
    }
    setFormOpen(false)
  }

  const handleDeleteConfirm = async () => {
    await deleteUser.mutateAsync(selectedUser.id)
    setDeleteOpen(false)
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
        <StatusBadge value={row.original.role.name} label={row.original.role.name} />
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
      accessorKey: 'createdAt',
      header: 'Creado',
      cell: ({ row }) => (
        <span className='text-sm text-muted-foreground'>
          {formatDate(row.original.createdAt)}
        </span>
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
            <Button
              variant='ghost'
              size='icon'
              className='h-8 w-8 text-destructive hover:text-destructive'
              onClick={() => handleDeleteClick(row.original)}
            >
              <Trash2 className='h-3.5 w-3.5' />
            </Button>
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