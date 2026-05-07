import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { HIERARCHY } from '@/lib/constants'
import { userSchema } from './usersSchemas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'

// Roles disponibles según jerarquía del usuario actual
const ROLES_BY_HIERARCHY = {
  [HIERARCHY.ADMIN]:      [{ id: 3, label: 'Usuario' }],
  [HIERARCHY.SUPERADMIN]: [{ id: 2, label: 'Admin' }, { id: 3, label: 'Usuario' }],
}

export const UserForm = ({ open, onOpenChange, user = null, onSubmit, loading }) => {
  const isEditing = !!user
  const hierarchyLevel = useAuthStore((s) => s.user?.hierarchy_level ?? 0)
  const isSuperAdmin = hierarchyLevel >= HIERARCHY.SUPERADMIN

  const availableRoles = ROLES_BY_HIERARCHY[hierarchyLevel] ?? []

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(isEditing ? userSchema : userSchema),
    defaultValues: isEditing ? {
      username:  user.username,
      fullname:  user.fullname,
      password:  '',
      is_active: user.is_active,
      role_id:   user.role_id ?? 3,
    } : {
      username: '',
      fullname: '',
      password: '',
      role_id: isSuperAdmin ? undefined : HIERARCHY.USER,
    },
  })

  // Resetear form cuando cambia el usuario o se abre/cierra
  useEffect(() => {
    if (open) {
      const values = isEditing
        ? {
            username: user.username,
            fullname: user.fullname,
            password: '',
            is_active: user.is_active,
            role_id: user.role_id,
          }
        : {
            username: '',
            fullname: '',
            password: '',
            role_id: 3,
          }

      reset(values, {
        keepErrors: true,
        keepDirty: false,
        keepTouched: false,
      })
    }
  }, [open, user, reset, isEditing])

  const handleFormSubmit = (data) => {
    if (isEditing && !data.password) delete data.password

    const payload = {
      ...data,
      role_id: isSuperAdmin ? data.role_id : ROLE_USER_ID,
    }

    console.log('FINAL PAYLOAD:', payload)
    onSubmit(payload)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='sm:max-w-md'>
        <SheetHeader>
          <SheetTitle>{isEditing ? 'Editar usuario' : 'Nuevo usuario'}</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className='space-y-4 py-4'>

          {/* Fullname */}
          <div className='space-y-1.5'>
            <Label>Nombre completo</Label>
            <Input
              placeholder='Juan Pérez'
              {...register('fullname')}
              className={errors.fullname ? 'border-destructive' : ''}
              aria-invalid={!!errors.fullname}
            />
            {errors.fullname && (
              <p className='text-xs text-destructive'>{errors.fullname.message}</p>
            )}
          </div>

          {/* Username */}
          <div className='space-y-1.5'>
            <Label>Usuario</Label>
            <Input
              placeholder='juan_perez'
              {...register('username')}
              className={errors.username ? 'border-destructive' : ''}
              aria-invalid={!!errors.username}
            />
            {errors.username && (
              <p className='text-xs text-destructive'>{errors.username.message}</p>
            )}
          </div>

          {/* Password */}
          <div className='space-y-1.5'>
            <Label>{isEditing ? 'Nueva contraseña (opcional)' : 'Contraseña'}</Label>
            <Input
              type='password'
              placeholder={isEditing ? 'Dejar vacío para no cambiar' : 'Mínimo 6 caracteres'}
              {...register('password')}
              className={errors.password ? 'border-destructive' : ''}
              aria-invalid={!!errors.password}
            />
            {errors.password && (
              <p className='text-xs text-destructive'>{errors.password.message}</p>
            )}
          </div>

          {/* Role — solo visible si es superadmin o si está editando */}
          {isSuperAdmin && (
            <div className='space-y-1.5'>
              <Label>Rol</Label>
              <Select
                value={watch('role_id')?.toString()}
                onValueChange={(val) =>
                  setValue('role_id', Number(val), {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }
              >
                <SelectTrigger className={errors.role_id ? 'border-destructive' : ''}>
                  <SelectValue>
                    {availableRoles.find(r => r.id === watch('role_id'))?.label || 'Seleccionar rol'}
                  </SelectValue>
                </SelectTrigger>

                <SelectContent>
                  {availableRoles.map((r) => (
                    <SelectItem key={r.id} value={r.id.toString()}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.role_id && (
                <p className='text-xs text-destructive'>{errors.role_id.message}</p>
              )}
            </div>
          )}

          {/* is_active — solo en edición */}
          {/* {isEditing && (
            <div className='flex items-center gap-3'>
              <input
                type='checkbox'
                id='is_active'
                {...register('is_active')}
                className='h-4 w-4 rounded border'
              />
              <Label htmlFor='is_active'>Usuario activo</Label>
            </div>
          )} */}

          <SheetFooter className='pt-4'>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type='submit' disabled={loading}>
              {loading ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear usuario'}
            </Button>
          </SheetFooter>

        </form>
      </SheetContent>
    </Sheet>
  )
}