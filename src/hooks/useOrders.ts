import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, API_URL_BASE } from '@/lib/api'
import { toast } from 'sonner'
import type { Order, ApiResponse, PaginationMeta } from '@/types'

interface OrderFilters {
  status?: string
  search?: string
  from?: string
  to?: string
  page?: number
  limit?: number
}

export function useOrders(filters: OrderFilters = {}) {
  return useQuery<{ data: Order[]; meta: PaginationMeta }>({
    queryKey: ['orders', filters],
    queryFn: async () => {
      const res = await api.get('/orders', { params: { ...filters, limit: filters.limit || 20 } }) as ApiResponse<Order[]>
      return { data: res.data, meta: res.meta! }
    },
  })
}

export function useOrder(id: string) {
  return useQuery<Order>({
    queryKey: ['order', id],
    queryFn: async () => {
      const res = await api.get(`/orders/${id}`) as ApiResponse<Order>
      return res.data
    },
    enabled: !!id,
  })
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: string; note?: string }) =>
      api.patch(`/orders/${id}/status`, { status, note }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['orders'] })
      qc.invalidateQueries({ queryKey: ['order', vars.id] })
      toast.success('Order status updated')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useDeleteOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/orders/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] })
      toast.success('Order deleted')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}


export function useUpdatePayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: {
      status: string; transactionId?: string; gatewayOrderId?: string;
      paidAt?: string; notes?: string;
    }}) => api.patch(`/orders/${id}/payment`, data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['orders'] })
      qc.invalidateQueries({ queryKey: ['order', vars.id] })
      toast.success('Payment details updated')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useCreateOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      customer: { name: string; email: string; phone: string }
      items: { product: string; weight: string; grind: string; qty: number }[]
      payment: { method: string; transactionId?: string; notes?: string }
      shippingAddress: string
      notes?: string
    }) => api.post('/orders', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] })
      toast.success('Order created successfully')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function downloadOrdersCsv() {
  window.open(`${API_URL_BASE}/orders/export/csv`, '_blank')
}
