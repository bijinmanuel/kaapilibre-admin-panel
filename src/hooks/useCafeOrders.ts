import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import type { CafeOrder, ApiResponse, PaginationMeta } from '@/types'

interface CafeOrderFilters {
  status?: string
  search?: string
  from?: string
  to?: string
  page?: number
  limit?: number
}

export function useCafeOrders(filters: CafeOrderFilters = {}) {
  return useQuery<{ data: CafeOrder[]; meta: PaginationMeta }>({
    queryKey: ['cafe/orders', filters],
    queryFn: async () => {
      const res = await api.get('/cafe/orders', { params: { ...filters, limit: filters.limit || 20 } }) as ApiResponse<CafeOrder[]>
      return { data: res.data, meta: res.meta! }
    },
  })
}

export function useCafeOrder(id: string) {
  return useQuery<CafeOrder>({
    queryKey: ['cafe/orders', id],
    queryFn: async () => {
      const res = await api.get(`/cafe/orders/${id}`) as ApiResponse<CafeOrder>
      return res.data
    },
    enabled: !!id,
  })
}

export function useCreateCafeOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<CafeOrder>) => api.post('/cafe/orders', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cafe/orders'] })
      toast.success('Cafe order created successfully')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useUpdateCafeOrderStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/cafe/orders/${id}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cafe/orders'] })
      toast.success('Order status updated')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useGlobalCafeAnalytics() {
  return useQuery({
    queryKey: ['cafe/orders/analytics'],
    queryFn: async () => {
      const res = await api.get('/cafe/orders/analytics') as ApiResponse<any>
      return res.data
    },
    staleTime: 1000 * 60 * 5,
  })
}
