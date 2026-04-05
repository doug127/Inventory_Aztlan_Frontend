import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './features/auth/authProvider'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { queryClient } from './app/queryClient.js'
import { App } from '@/app/App.jsx'
import { Toaster } from 'sonner'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
        <Toaster richColors position='top-right' />
      </AuthProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </StrictMode>
)
