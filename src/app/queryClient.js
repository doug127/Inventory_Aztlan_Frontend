import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 min — maestros no cambian seguido
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})
