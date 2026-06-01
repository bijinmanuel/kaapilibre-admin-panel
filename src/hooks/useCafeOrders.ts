import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import type { CafeOrder, ApiResponse, PaginationMeta, PerformanceInsightsData, CafeAcquisitionData, SalesIntelligenceData } from '@/types'

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
export function useUpdateCafeOrderPaymentStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, paymentStatus }: { id: string; paymentStatus: 'pending' | 'paid' }) =>
      api.patch(`/cafe/orders/${id}/payment-status`, { paymentStatus }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cafe/orders'] })
      qc.invalidateQueries({ queryKey: ['cafe/orders/analytics'] })
      toast.success('Payment status updated')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useUpdateCafeOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<CafeOrder> & { id: string }) => 
      api.patch(`/cafe/orders/${data.id}`, data),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ['cafe/orders'] })
      qc.invalidateQueries({ queryKey: ['cafe/orders', res.data._id] })
      toast.success('Order updated successfully')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function usePerformanceInsights(region?: string) {
  return useQuery<PerformanceInsightsData>({
    queryKey: ['cafe/orders/analytics/performance', region],
    queryFn: async () => {
      const res = await api.get('/cafe/orders/analytics/performance', { params: { region } }) as ApiResponse<PerformanceInsightsData>
      return res.data
    },
    staleTime: 1000 * 60 * 5,
  })
}

export function useCafeAcquisition(region?: string) {
  return useQuery<CafeAcquisitionData>({
    queryKey: ['cafe/orders/analytics/acquisition', region],
    queryFn: async () => {
      const res = await api.get('/cafe/orders/analytics/acquisition', { params: { region } }) as ApiResponse<CafeAcquisitionData>
      return res.data
    },
    staleTime: 1000 * 60 * 5,
  })
}

export function useSalesIntelligence(region?: string) {
  return useQuery<SalesIntelligenceData>({
    queryKey: ['cafe/orders/analytics/sales-intelligence', region],
    queryFn: async () => {
      const res = await api.get('/cafe/orders/analytics/sales-intelligence', { params: { region } }) as ApiResponse<SalesIntelligenceData>
      return res.data
    },
    staleTime: 1000 * 60 * 5,
  })
}
