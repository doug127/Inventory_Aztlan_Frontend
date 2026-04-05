import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layouts/AppLayout'
import { AuthLayout } from '@/components/layouts/AuthLayout'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'

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
          {
            path: '/users',
            element: (
              <Page>
                <UsersPage />
              </Page>
            ),
          },
        ],
      },
    ],
  },

  // ─── Fallback ─────────────────────────────────────────────────────────────
  { path: '*', element: <Navigate to='/' /> },
])
