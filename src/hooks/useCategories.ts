import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import type { Category, ApiResponse } from '@/types'

interface CategoryFilters {
  search?: string
  includeInactive?: boolean
}

export function useCategories(filters: CategoryFilters = {}) {
  return useQuery<Category[]>({
    queryKey: ['categories', filters],
    queryFn: async () => {
      const res = await api.get('/categories', { params: filters }) as ApiResponse<Category[]>
      return res.data || []
    },
  })
}

export function useCategory(idOrSlug: string) {
  return useQuery<Category>({
    queryKey: ['category', idOrSlug],
    queryFn: async () => {
      const res = await api.get(`/categories/${idOrSlug}`) as ApiResponse<Category>
      return res.data
    },
    enabled: !!idOrSlug,
  })
}

export function useCreateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Category>) => api.post('/categories', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] })
      qc.invalidateQueries({ queryKey: ['products'] })
      toast.success('Category created successfully')
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to create category'),
  })
}

export function useUpdateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Category> }) =>
      api.put(`/categories/${id}`, data),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['categories'] })
      qc.invalidateQueries({ queryKey: ['category', vars.id] })
      qc.invalidateQueries({ queryKey: ['products'] })
      toast.success('Category updated successfully')
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to update category'),
  })
}

export function useDeleteCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/categories/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] })
      qc.invalidateQueries({ queryKey: ['products'] })
      toast.success('Category deleted')
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to delete category'),
  })
}

export function useToggleCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.patch(`/categories/${id}/toggle`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] })
      qc.invalidateQueries({ queryKey: ['products'] })
      toast.success('Category status updated')
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to toggle category status'),
  })
}
