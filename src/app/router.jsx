import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layouts/AppLayout'
import { ProtectedRoute, SessionRoute } from '@/features/auth/ProtectedRoute'
import { PublicRoute } from '@/features/auth/PublicRoute'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { HIERARCHY } from '@/lib/constants'
import { ForbiddenPage } from '@/components/common/ForbiddenPage'
import { PermissionRoute } from '@/features/auth/PermissionRoute'

// Lazy imports — cada módulo se carga solo cuando se navega a él
const LoginPage = lazy(() =>
  import('@/features/auth/pages/LoginPage').then((m) => ({ default: m.LoginPage }))
)
const ForgotPasswordPage = lazy(() =>
  import('@/features/auth/pages/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage }))
)
const ResetPasswordPage = lazy(() =>
  import('@/features/auth/pages/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage }))
)
const ChangePasswordPage = lazy(() =>
  import('@/features/auth/pages/ChangePasswordPage').then((m) => ({ default: m.ChangePasswordPage }))
)
const DashboardPage = lazy(() =>
  import('@/features/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage }))
)
const MovementsPage = lazy(() =>
  import('@/features/movements/MovementsPage').then((m) => ({ default: m.MovementsPage }))
)
const StockPage = lazy(() =>
  import('@/features/stock/StockPage').then((m) => ({ default: m.StockPage }))
)
const ProductsPage = lazy(() =>
  import('@/features/products/ProductsPage').then((m) => ({ default: m.ProductsPage }))
)
const WarehousesPage = lazy(() =>
  import('@/features/warehouses/WarehousesPage').then((m) => ({ default: m.WarehousesPage }))
)
const AssetsPage = lazy(() =>
  import('@/features/assets/AssetsPage').then((m) => ({ default: m.AssetsPage }))
)
const SecurityLogPage = lazy(() =>
  import('@/features/security-log/SecurityLogPage').then((m) => ({ default: m.SecurityLogPage }))
)
const UsersPage = lazy(() =>
  import('@/features/users/UsersPage').then((m) => ({ default: m.UsersPage }))
)

// Wrapper para suspense en lazy loading
const Page = ({ children }) => <Suspense fallback={<LoadingSpinner />}>{children}</Suspense>

export const router = createBrowserRouter([
  // ─── Acceso sin sesión ────────────────────────────────────────────────────
  {
    element: <PublicRoute />,
    children: [
      { path: '/login', element: <Page><LoginPage /></Page> },
      { path: '/forgot-password', element: <Page><ForgotPasswordPage /></Page> },
    ],
  },
  // Enlace del correo de recuperación: funciona con o sin sesión iniciada.
  { path: '/reset-password', element: <Page><ResetPasswordPage /></Page> },

  // ─── Con sesión, aunque falte cambiar la contraseña temporal ─────────────
  {
    element: <SessionRoute />,
    children: [{ path: '/change-password', element: <Page><ChangePasswordPage /></Page> }],
  },

  // ─── Ruta 403 Forbidden ───────────────────────────────────────────────────────

  { path: '/403', element: <Page><ForbiddenPage /></Page> },

  // ─── Rutas protegidas ─────────────────────────────────────────────────────
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            path: '/',
            element: (
              <Page>
                <DashboardPage />
              </Page>
            ),
          },
          {
            path: '/movements',
            element: (
              <Page>
                <MovementsPage />
              </Page>
            ),
          },
          {
            path: '/stock',
            element: (
              <Page>
                <StockPage />
              </Page>
            ),
          },
          {
            path: '/products',
            element: (
              <Page>
                <ProductsPage />
              </Page>
            ),
          },
          {
            path: '/warehouses',
            element: (
              <Page>
                <WarehousesPage />
              </Page>
            ),
          },
          {
            path: '/assets',
            element: (
              <Page>
                <AssetsPage />
              </Page>
            ),
          },
          // Solo admins pueden ver la lista de usuarios
          {
            element: <PermissionRoute minHierarchy={HIERARCHY.ADMIN} />,
            children: [
              { path: '/users', element: <Page><UsersPage /></Page> },
            ],
          },
          // Bitácora de seguridad: solo el SUPERADMIN (el backend también lo exige)
          {
            element: <PermissionRoute minHierarchy={HIERARCHY.SUPERADMIN} />,
            children: [{ path: '/admin/security-log', element: <Page><SecurityLogPage /></Page> }],
          },
        ],
      },
    ],
  },

  // ─── Fallback ─────────────────────────────────────────────────────────────
  { path: '*', element: <Navigate to='/' /> },
])
