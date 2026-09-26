import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import type { Policy, PolicySlug, UpdatePolicyData } from '@/types'

// ─── Query: Fetch all policies (Admin list) ──────────────────────────────────
export function usePolicies() {
  return useQuery<Policy[]>({
    queryKey: ['admin-policies'],
    queryFn: async () => {
      const res = (await api.get('/policies')) as any
      return res.data || []
    },
  })
}

// ─── Query: Fetch single policy by slug (Admin detail) ────────────────────────
export function usePolicy(slug: PolicySlug | string) {
  return useQuery<Policy>({
    queryKey: ['admin-policy', slug],
    queryFn: async () => {
      const res = (await api.get(`/policies/admin/${slug}`)) as any
      return res.data
    },
    enabled: !!slug,
  })
}

// ─── Mutation: Update / Upsert Policy ─────────────────────────────────────────
export function useUpsertPolicy() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ slug, data }: { slug: string; data: UpdatePolicyData }) =>
      api.put(`/policies/${slug}`, data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['admin-policies'] })
      qc.invalidateQueries({ queryKey: ['admin-policy', variables.slug] })
      toast.success('Policy saved and updated successfully')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || 'Failed to update policy')
    },
  })
}

// ─── Mutation: Toggle Publish Status ──────────────────────────────────────────
export function useTogglePolicyPublish() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (slug: string) => api.patch(`/policies/${slug}/publish`),
    onSuccess: (res: any, slug) => {
      qc.invalidateQueries({ queryKey: ['admin-policies'] })
      qc.invalidateQueries({ queryKey: ['admin-policy', slug] })
      const isPublished = res?.data?.isPublished
      toast.success(`Policy is now ${isPublished ? 'Published' : 'Draft (hidden)'}`)
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || 'Failed to toggle policy publication status')
    },
  })
}
