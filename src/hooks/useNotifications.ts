import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface Notification {
  _id: string
  type: string
  title: string
  message: string
  link?: string
  isRead: boolean
  metadata?: Record<string, unknown>
  createdAt: string
}

export function useNotifications() {
  return useQuery<{ notifications: Notification[]; unreadCount: number }>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await api.get('/notifications') as any
      return res.data
    },
    refetchInterval: 20_000, // poll every 20s for real-time push alerts
    staleTime: 10_000,
  })
}

export function useMarkOneRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })
}

export function useMarkAllRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })
}

export function useClearAll() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.delete('/notifications/clear-all'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })
}

export function useOpenComplaintsSummary() {
  return useQuery<{
    openCafeComplaints: any[]
    openCustomerComplaints: any[]
    unreadContacts: any[]
    recentCafeOrders: any[]
    openCafeCount: number
    openCustomerCount: number
    unreadContactCount: number
  }>({
    queryKey: ['open-complaints-summary'],
    queryFn: async () => {
      const [cafeRes, custRes, contactRes, cafeOrdersRes] = await Promise.allSettled([
        api.get('/cafe-portal/admin/complaints?status=open'),
        api.get('/complaints', { params: { status: 'open', limit: 20 } }),
        api.get('/contact', { params: { isRead: false, limit: 20 } }),
        api.get('/cafe/orders', { params: { limit: 10 } }),
      ])

      let openCafeComplaints: any[] = []
      if (cafeRes.status === 'fulfilled') {
        const val = cafeRes.value as any
        openCafeComplaints = Array.isArray(val)
          ? val
          : Array.isArray(val?.data)
          ? val.data
          : Array.isArray(val?.data?.data)
          ? val.data.data
          : []
      }

      let openCustomerComplaints: any[] = []
      let openCustomerTotal = 0
      if (custRes.status === 'fulfilled') {
        const val = custRes.value as any
        openCustomerComplaints = Array.isArray(val?.data)
          ? val.data
          : Array.isArray(val)
          ? val
          : []
        openCustomerTotal = val?.meta?.total ?? openCustomerComplaints.length
      }

      let unreadContacts: any[] = []
      let unreadContactTotal = 0
      if (contactRes.status === 'fulfilled') {
        const val = contactRes.value as any
        const list = Array.isArray(val?.data) ? val.data : Array.isArray(val) ? val : []
        unreadContacts = list.filter((c: any) => !c.isRead)
        unreadContactTotal = val?.meta?.total ?? unreadContacts.length
      }

      let recentCafeOrders: any[] = []
      if (cafeOrdersRes.status === 'fulfilled') {
        const val = cafeOrdersRes.value as any
        recentCafeOrders = Array.isArray(val?.data)
          ? val.data
          : Array.isArray(val)
          ? val
          : []
      }

      return {
        openCafeComplaints,
        openCustomerComplaints,
        unreadContacts,
        recentCafeOrders,
        openCafeCount: openCafeComplaints.length,
        openCustomerCount: openCustomerTotal,
        unreadContactCount: unreadContactTotal,
      }
    },
    refetchInterval: 20_000, // poll every 20s for live push notifications
    staleTime: 10_000,
  })
}
