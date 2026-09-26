import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import type { Faq, CreateFaqData, UpdateFaqData } from '@/types'

export interface FaqListResponse {
  faqs: Faq[]
  totalCount: number
  selectedForWebsiteCount: number
}

// ─── Query: Fetch all FAQs ───────────────────────────────────────────────────
export function useFaqs() {
  return useQuery<FaqListResponse>({
    queryKey: ['admin-faqs'],
    queryFn: async () => {
      const res = (await api.get('/faq/all')) as any
      return res.data
    },
  })
}

// ─── Mutation: Create FAQ ────────────────────────────────────────────────────
export function useCreateFaq() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateFaqData) => api.post('/faq', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-faqs'] })
      toast.success('FAQ created successfully')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || 'Failed to create FAQ')
    },
  })
}

// ─── Mutation: Update FAQ ────────────────────────────────────────────────────
export function useUpdateFaq() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateFaqData }) =>
      api.put(`/faq/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-faqs'] })
      toast.success('FAQ updated successfully')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || 'Failed to update FAQ')
    },
  })
}

// ─── Mutation: Delete FAQ ────────────────────────────────────────────────────
export function useDeleteFaq() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/faq/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-faqs'] })
      toast.success('FAQ deleted successfully')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || 'Failed to delete FAQ')
    },
  })
}

// ─── Mutation: Toggle Website Selection ──────────────────────────────────────
export function useToggleWebsiteFaq() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.patch(`/faq/${id}/toggle-website`),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ['admin-faqs'] })
      const isSelected = res?.data?.isSelectedForWebsite
      const count = res?.data?.totalSelected
      if (isSelected) {
        toast.success(`FAQ selected for website! (${count} active on website)`)
      } else {
        toast.info(`FAQ removed from website (${count} active on website)`)
      }
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || 'Failed to toggle website selection')
    },
  })
}

// ─── Mutation: Toggle Visibility ─────────────────────────────────────────────
export function useToggleVisibilityFaq() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.patch(`/faq/${id}/toggle-visibility`),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ['admin-faqs'] })
      const isVisible = res?.data?.isVisible
      toast.success(`FAQ is now ${isVisible ? 'published' : 'hidden'}`)
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || 'Failed to toggle visibility')
    },
  })
}

// ─── Mutation: Reorder FAQs ──────────────────────────────────────────────────
export function useReorderFaqs() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (orderedIds: string[]) => api.patch('/faq/reorder', { orderedIds }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-faqs'] })
      toast.success('FAQ order updated')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || 'Failed to reorder FAQs')
    },
  })
}
