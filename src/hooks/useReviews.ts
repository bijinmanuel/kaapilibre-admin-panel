import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import type { Review, ReviewStats, ReviewStatus } from '@/types'

interface ReviewFilters {
  status?: string
  productId?: string
  search?: string
  rating?: number
  page?: number
  limit?: number
}

interface ReviewsResponse {
  reviews: Review[]
  pagination: {
    page: number
    limit: number
    totalPages: number
    totalItems: number
  }
}

export function useReviews(filters: ReviewFilters = {}) {
  return useQuery<ReviewsResponse>({
    queryKey: ['reviews', filters],
    queryFn: async () => {
      const res = (await api.get('/reviews/admin', {
        params: {
          ...filters,
          limit: filters.limit || 20,
        },
      })) as any
      return res.data
    },
  })
}

export function useReviewStats() {
  return useQuery<ReviewStats>({
    queryKey: ['review-stats'],
    queryFn: async () => {
      const res = (await api.get('/reviews/admin/stats')) as any
      return res.data
    },
    refetchInterval: 30000, // refresh stats every 30s
  })
}

export function useUpdateReviewStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ReviewStatus }) =>
      api.patch(`/reviews/admin/${id}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reviews'] })
      qc.invalidateQueries({ queryKey: ['review-stats'] })
      toast.success('Review status updated')
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to update review status'),
  })
}

export function useReplyReview() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, comment }: { id: string; comment: string }) =>
      api.patch(`/reviews/admin/${id}/reply`, { comment }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reviews'] })
      toast.success('Official reply saved')
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to save reply'),
  })
}

export function useDeleteReview() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/reviews/admin/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reviews'] })
      qc.invalidateQueries({ queryKey: ['review-stats'] })
      toast.success('Review deleted')
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to delete review'),
  })
}
