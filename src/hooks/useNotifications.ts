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

export interface LiveNotificationSummary {
  notifications: Notification[]
  unreadCount: number
  openCafeComplaints: any[]
  openCustomerComplaints: any[]
  unreadContacts: any[]
  recentCafeOrders: any[]
  openCafeCount: number
  openCustomerCount: number
  unreadContactCount: number
}

function useLiveNotificationFeed() {
  return useQuery<LiveNotificationSummary>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = (await api.get('/notifications/live-summary')) as any
      return res.data
    },
    refetchInterval: 60_000, // single lightweight poll every 60s
    refetchIntervalInBackground: false, // pause polling when tab is in background
    refetchOnWindowFocus: true, // refresh immediately when admin returns to tab
    staleTime: 30_000,
  })
}

export function useNotifications() {
  const query = useLiveNotificationFeed()
  return {
    ...query,
    data: query.data
      ? {
          notifications: query.data.notifications ?? [],
          unreadCount: query.data.unreadCount ?? 0,
        }
      : undefined,
  }
}

export function useOpenComplaintsSummary() {
  const query = useLiveNotificationFeed()
  return {
    ...query,
    data: query.data
      ? {
          openCafeComplaints: query.data.openCafeComplaints ?? [],
          openCustomerComplaints: query.data.openCustomerComplaints ?? [],
          unreadContacts: query.data.unreadContacts ?? [],
          recentCafeOrders: query.data.recentCafeOrders ?? [],
          openCafeCount: query.data.openCafeCount ?? 0,
          openCustomerCount: query.data.openCustomerCount ?? 0,
          unreadContactCount: query.data.unreadContactCount ?? 0,
        }
      : undefined,
  }
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
