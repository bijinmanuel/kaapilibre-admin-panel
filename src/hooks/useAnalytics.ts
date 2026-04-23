import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { OverviewStats, RevenuePoint, StatusCount, TopProduct, Order, ApiResponse } from '@/types'

export function useOverview() {
  return useQuery<OverviewStats>({
    queryKey: ['analytics', 'overview'],
    queryFn: async () => {
      const res = await api.get('/analytics/overview') as ApiResponse<OverviewStats>
      return res.data
    },
    staleTime: 1000 * 60 * 5,
  })
}

export function useRevenue(period: 'daily' | 'weekly' | 'monthly' = 'daily', from?: string, to?: string) {
  return useQuery<RevenuePoint[]>({
    queryKey: ['analytics', 'revenue', period, from, to],
    queryFn: async () => {
      const res = await api.get('/analytics/revenue', { params: { period, from, to } }) as ApiResponse<RevenuePoint[]>
      return res.data
    },
    staleTime: 1000 * 60 * 5,
  })
}

export function useOrdersByStatus() {
  return useQuery<StatusCount[]>({
    queryKey: ['analytics', 'orders-by-status'],
    queryFn: async () => {
      const res = await api.get('/analytics/orders-by-status') as ApiResponse<StatusCount[]>
      return res.data
    },
    staleTime: 1000 * 60 * 5,
  })
}

export function useTopProducts() {
  return useQuery<TopProduct[]>({
    queryKey: ['analytics', 'top-products'],
    queryFn: async () => {
      const res = await api.get('/analytics/top-products') as ApiResponse<TopProduct[]>
      return res.data
    },
    staleTime: 1000 * 60 * 5,
  })
}

export function useRecentOrders() {
  return useQuery<Order[]>({
    queryKey: ['analytics', 'recent-orders'],
    queryFn: async () => {
      const res = await api.get('/analytics/recent-orders') as ApiResponse<Order[]>
      return res.data
    },
    staleTime: 1000 * 60 * 2,
  })
}

export function useCustomersGrowth(from?: string, to?: string) {
  return useQuery({
    queryKey: ['analytics', 'customers-growth', from, to],
    queryFn: async () => {
      const res = await api.get('/analytics/customers-growth', { params: { from, to } }) as any
      return res.data
    },
    staleTime: 1000 * 60 * 5,
  })
}
