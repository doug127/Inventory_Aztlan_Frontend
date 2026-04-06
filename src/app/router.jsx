import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layouts/AppLayout'
import { AuthLayout } from '@/components/layouts/AuthLayout'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { HIERARCHY } from '@/lib/constants'
import { ForbiddenPage } from '@/components/common/ForbiddenPage'
import { PermissionRoute } from '@/features/auth/PermissionRoute'

// Lazy imports — cada módulo se carga solo cuando se navega a él
const LoginPage = lazy(() =>
  import('@/features/auth/LoginPage').then((m) => ({ default: m.LoginPage }))
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
const UsersPage = lazy(() =>
  import('@/features/users/UsersPage').then((m) => ({ default: m.UsersPage }))
)

// Wrapper para suspense en lazy loading
const Page = ({ children }) => <Suspense fallback={<LoadingSpinner />}>{children}</Suspense>

export const router = createBrowserRouter([
  // ─── Rutas públicas ───────────────────────────────────────────────────────
  {
    element: <AuthLayout />,
    children: [
      {
        path: '/login',
        element: (
          <Page>
            <LoginPage />
          </Page>
        ),
      },
    ],
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
        ],
      },
    ],
  },

  // ─── Fallback ─────────────────────────────────────────────────────────────
  { path: '*', element: <Navigate to='/' /> },
])
