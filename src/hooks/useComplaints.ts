import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { toast } from 'sonner'

export interface ComplaintMessage {
  _id: string
  sender: 'customer' | 'admin'
  senderName: string
  message: string
  sentAt: string
}

export interface Complaint {
  _id: string
  ticketNumber: string
  customer: { userId: string; name: string; email: string }
  orderId?: string
  orderNumber?: string
  category: string
  subject: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high'
  messages: ComplaintMessage[]
  resolvedAt?: string
  resolvedBy?: string
  createdAt: string
  updatedAt: string
}

interface ComplaintFilters {
  status?: string; category?: string; priority?: string;
  search?: string; page?: number; limit?: number
}

export function useComplaints(filters: ComplaintFilters = {}) {
  return useQuery<{ data: Complaint[]; meta: any }>({
    queryKey: ['complaints', filters],
    queryFn: async () => {
      const res = await api.get('/complaints', { params: { ...filters, limit: filters.limit || 20 } }) as any
      return { data: res.data, meta: res.meta }
    },
  })
}

export function useComplaint(id: string) {
  return useQuery<Complaint>({
    queryKey: ['complaint', id],
    queryFn: async () => { const res = await api.get(`/complaints/${id}`) as any; return res.data },
    enabled: !!id,
  })
}

export function useAdminReply() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, message, updateStatus }: { id: string; message: string; updateStatus?: string }) =>
      api.post(`/complaints/${id}/reply`, { message, updateStatus }),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['complaints'] })
      qc.invalidateQueries({ queryKey: ['complaint', vars.id] })
      toast.success('Reply sent')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useUpdateComplaintStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status, priority }: { id: string; status?: string; priority?: string }) =>
      api.patch(`/complaints/${id}/status`, { status, priority }),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['complaints'] })
      qc.invalidateQueries({ queryKey: ['complaint', vars.id] })
      toast.success('Complaint updated')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}
