import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { toast } from 'sonner'

export type PaymentStatus = 'pending' | 'success' | 'failed' | 'refunded' | 'partially_refunded'
export type PaymentMethod = 'upi' | 'card' | 'netbanking' | 'cash' | 'whatsapp' | 'website' | 'email'

export interface Payment {
  _id: string
  orderId: string
  orderNumber: string
  customerId?: string
  customerEmail: string
  customerPhone: string
  customerName: string
  method: PaymentMethod
  status: PaymentStatus
  amount: number
  currency: string
  transactionId?: string
  gatewayOrderId?: string
  gatewayPaymentId?: string
  refundId?: string
  refundAmount?: number
  refundedAt?: string
  refundReason?: string
  initiatedAt: string
  paidAt?: string
  failedAt?: string
  failureReason?: string
  notes?: string
  createdAt: string
}

export interface PaymentStats {
  totalAmount: number
  successCount: number
  failedCount: number
  pendingCount: number
  refundAmount: number
}

interface PaymentFilters {
  status?: string; method?: string; email?: string;
  search?: string; from?: string; to?: string;
  page?: number; limit?: number;
}

export function usePayments(filters: PaymentFilters = {}) {
  return useQuery<{ data: Payment[]; meta: any; stats: PaymentStats }>({
    queryKey: ['payments', filters],
    queryFn: async () => {
      const res = await api.get('/payments', { params: { ...filters, limit: filters.limit || 20 } }) as any
      return { data: res.data, meta: res.meta, stats: res.stats }
    },
  })
}

export function usePayment(id: string) {
  return useQuery<Payment>({
    queryKey: ['payment', id],
    queryFn: async () => { const res = await api.get(`/payments/${id}`) as any; return res.data },
    enabled: !!id,
  })
}

export function usePaymentsByOrder(orderId: string) {
  return useQuery<Payment[]>({
    queryKey: ['payments-order', orderId],
    queryFn: async () => { const res = await api.get(`/payments/order/${orderId}`) as any; return res.data },
    enabled: !!orderId,
  })
}

export function useUpdatePaymentStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: {
      status: string; transactionId?: string; gatewayPaymentId?: string;
      failureReason?: string; notes?: string;
    }}) => api.patch(`/payments/${id}`, data),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['payments'] })
      qc.invalidateQueries({ queryKey: ['payment', vars.id] })
      toast.success('Payment updated')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useRefundPayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, refundAmount, refundId, refundReason }: {
      id: string; refundAmount: number; refundId?: string; refundReason: string;
    }) => api.patch(`/payments/${id}/refund`, { refundAmount, refundId, refundReason }),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['payments'] })
      qc.invalidateQueries({ queryKey: ['payment', vars.id] })
      toast.success('Refund processed')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}
