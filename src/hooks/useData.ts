import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import type { Customer, ContactMessage, ApiResponse, PaginationMeta } from '@/types'

// ── Customers ───────────────────────────────────────────────────────────────
interface CustomerFilters { search?: string; sort?: string; order?: string; page?: number; limit?: number }

export function useCustomers(filters: CustomerFilters = {}) {
  return useQuery<{ data: Customer[]; meta: PaginationMeta }>({
    queryKey: ['customers', filters],
    queryFn: async () => {
      const res = await api.get('/customers', { params: { ...filters, limit: filters.limit || 20 } }) as ApiResponse<Customer[]>
      return { data: res.data, meta: res.meta! }
    },
  })
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: ['customer', id],
    queryFn: async () => { const res = await api.get(`/customers/${id}`) as any; return res.data },
    enabled: !!id,
  })
}

export function useCustomerOrders(id: string, page = 1) {
  return useQuery({
    queryKey: ['customer-orders', id, page],
    queryFn: async () => {
      const res = await api.get(`/customers/${id}/orders`, { params: { page } }) as any
      return { data: res.data, meta: res.meta }
    },
    enabled: !!id,
  })
}

export function useDeactivateCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/customers/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['customers'] }); toast.success('Customer deactivated') },
    onError: (e: Error) => toast.error(e.message),
  })
}

// ── Inventory ────────────────────────────────────────────────────────────────
export function useInventory() {
  return useQuery({
    queryKey: ['inventory'],
    queryFn: async () => { const res = await api.get('/inventory') as any; return res.data },
  })
}

export function useStockAlerts() {
  return useQuery({
    queryKey: ['inventory', 'alerts'],
    queryFn: async () => { const res = await api.get('/inventory/alerts') as any; return res.data },
  })
}

export function useUpdateStock() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ productId, weight, quantity, operation }: { productId: string; weight: string; quantity: number; operation: string }) =>
      api.patch(`/inventory/${productId}`, { weight, quantity, operation }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['inventory'] }); toast.success('Stock updated') },
    onError: (e: Error) => toast.error(e.message),
  })
}

// ── Contact ──────────────────────────────────────────────────────────────────
interface MessageFilters { isRead?: boolean; page?: number; limit?: number }

export function useMessages(filters: MessageFilters = {}) {
  return useQuery<{ data: ContactMessage[]; meta: PaginationMeta }>({
    queryKey: ['messages', filters],
    queryFn: async () => {
      const params: Record<string, unknown> = { limit: filters.limit || 20, page: filters.page || 1 }
      if (filters.isRead !== undefined) params.isRead = filters.isRead
      const res = await api.get('/contact', { params }) as ApiResponse<ContactMessage[]>
      return { data: res.data, meta: res.meta! }
    },
  })
}

export function useMarkAsRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.patch(`/contact/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['messages'] }),
  })
}

export function useDeleteMessage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/contact/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['messages'] }); toast.success('Message deleted') },
    onError: (e: Error) => toast.error(e.message),
  })
}
