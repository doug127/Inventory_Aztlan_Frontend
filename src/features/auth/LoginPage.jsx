import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useAuthStore } from '@/stores/authStore'
import { authService } from './authService'
import { loginSchema } from './authSchemas'
import { toast } from 'sonner'

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState(null)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  const {
    register,       // conecta inputs al formulario
    handleSubmit,   // envuelve el submit con validación
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema), // Zod valida antes de onSubmit
  })

  const onSubmit = async (data) => {
    try {
      setServerError(null)

      // 1. Login → el backend setea la cookie y retorna { message, user }
      const loginRes = await authService.login(data)
      console.log('1. Login response:', loginRes)

      // 2. /auth/me → retorna { id, username, role, privilege }
      const me = await authService.me()
      console.log('2. /auth/me response:', me)

      // 3. Guardamos user y permisos en el store
      //    privilege viene como array del backend
      const userData = { id: me.id, username: me.username, role: me.role }
      const permissions = me.privilege ?? []
      console.log('3. Guardando user:', userData)
      console.log('4. Guardando permissions:', permissions)
      setAuth({ user: userData, permissions })

      // 4. Redirigir al dashboard
      console.log('5. Store después de setAuth:', useAuthStore.getState())
      toast.success(`Bienvenido, ${me.username}`)
      navigate('/', { replace: true })

    } catch (error) {
      const msg = error?.message ?? error?.raw?.error ?? 'Credenciales incorrectas'
      toast.error(msg)
    }
  }

  return (
    <Card className='shadow-sm'>
      <CardHeader className='space-y-1 pb-4'>
        <CardTitle className='text-xl'>Iniciar sesión</CardTitle>
        <CardDescription>Ingresa tus credenciales para continuar</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className='space-y-4' noValidate>

          {/* Username */}
          <div className='space-y-1.5'>
            <Label htmlFor='username'>Usuario</Label>
            <Input
              id='username'
              placeholder='Tu nombre de usuario'
              autoComplete='username'
              autoFocus
              {...register('username')}
              className={errors.username ? 'border-destructive' : ''}
            />
            {errors.username && (
              <p className='text-xs text-destructive'>{errors.username.message}</p>
            )}
          </div>

          <Button
            type='button'
            variant='outline'
            onClick={() => toast.success('Sonner funciona')}
          >
            Test toast
          </Button>

          {/* Password */}
          <div className='space-y-1.5'>
            <Label htmlFor='password'>Contraseña</Label>
            <div className='relative'>
              <Input
                id='password'
                type={showPassword ? 'text' : 'password'}
                placeholder='Tu contraseña'
                autoComplete='current-password'
                {...register('password')}
                className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
              />
              <button
                type='button'
                onClick={() => setShowPassword((v) => !v)}
                className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground'
              >
                {showPassword
                  ? <EyeOff className='h-4 w-4' />
                  : <Eye className='h-4 w-4' />
                }
              </button>
            </div>
            {errors.password && (
              <p className='text-xs text-destructive'>{errors.password.message}</p>
            )}
          </div>

          {/* Submit */}
          <Button type='submit' className='w-full' disabled={isSubmitting}>
            {isSubmitting
              ? <span className='flex items-center gap-2'>
                  <span className='h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent' />
                  Ingresando...
                </span>
              : <span className='flex items-center gap-2'>
                  <LogIn className='h-4 w-4' />
                  Ingresar
                </span>
            }
          </Button>

        </form>
      </CardContent>
    </Card>
  )
}
