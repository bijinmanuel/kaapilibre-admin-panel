import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import type { CafeProduct, ApiResponse } from '@/types'

export function useCafeProducts() {
  return useQuery<CafeProduct[]>({
    queryKey: ['cafe-products'],
    queryFn: async () => {
      const res = await api.get('/cafe/products') as ApiResponse<CafeProduct[]>
      return res.data
    },
  })
}

export function useCreateCafeProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<CafeProduct>) => api.post('/cafe/products', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cafe-products'] })
      toast.success('Product added successfully')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useUpdateCafeProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CafeProduct> }) => 
      api.patch(`/cafe/products/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cafe-products'] })
      toast.success('Product updated')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useDeleteCafeProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/cafe/products/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cafe-products'] })
      toast.success('Product deleted')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}
