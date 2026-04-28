import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import type { Cafe, ApiResponse, CafeAnalytics } from '@/types'

export function useCafes() {
  return useQuery<Cafe[]>({
    queryKey: ['cafes'],
    queryFn: async () => {
      const res = await api.get('/cafe') as ApiResponse<Cafe[]>
      return res.data
    },
  })
}

export function useCafe(id: string) {
  return useQuery<Cafe>({
    queryKey: ['cafe', id],
    queryFn: async () => {
      const res = await api.get(`/cafe/${id}`) as ApiResponse<Cafe>
      return res.data
    },
    enabled: !!id,
  })
}

export function useCafeAnalytics(id: string) {
  return useQuery<CafeAnalytics>({
    queryKey: ['cafe-analytics', id],
    queryFn: async () => {
      const res = await api.get(`/cafe/${id}/analytics`) as ApiResponse<CafeAnalytics>
      return res.data
    },
    enabled: !!id,
  })
}

export function useCreateCafe() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Cafe>) => api.post('/cafe', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cafes'] })
      toast.success('Cafe created successfully')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useUpdateCafe() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Cafe> }) =>
      api.patch(`/cafe/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cafes'] })
      toast.success('Cafe updated successfully')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}
