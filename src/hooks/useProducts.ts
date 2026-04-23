import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import type { Product, ApiResponse, PaginationMeta } from '@/types'

interface ProductFilters {
  search?: string
  variety?: string
  process?: string
  sort?: string
  page?: number
  limit?: number
}

export function useProducts(filters: ProductFilters = {}) {
  return useQuery<{ data: Product[]; meta: PaginationMeta }>({
    queryKey: ['products', filters],
    queryFn: async () => {
      const res = await api.get('/products', { params: { ...filters, limit: filters.limit || 20 } }) as ApiResponse<Product[]>
      return { data: res.data, meta: res.meta! }
    },
  })
}

// Fetches by slug — returns full product including _id for mutations
export function useProduct(slugOrId: string) {
  return useQuery<Product>({
    queryKey: ['product', slugOrId],
    queryFn: async () => {
      const res = await api.get(`/products/${slugOrId}`) as ApiResponse<Product>
      return res.data
    },
    enabled: !!slugOrId,
  })
}

export function useCreateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Product>) => api.post('/products', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); toast.success('Product created') },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useUpdateProduct() {
  const qc = useQueryClient()
  return useMutation({
    // Always uses _id (not slug) — slug may change if name changes
    mutationFn: ({ id, data }: { id: string; data: Partial<Product> }) =>
      api.put(`/products/${id}`, data),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['products'] })
      qc.invalidateQueries({ queryKey: ['product', vars.id] })
      toast.success('Product updated')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useDeleteProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/products/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); toast.success('Product deleted') },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useToggleProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.patch(`/products/${id}/toggle`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); toast.success('Product status toggled') },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useUploadProductImage() {
  const qc = useQueryClient()
  return useMutation({
    // id here is always the MongoDB _id, never the slug
    mutationFn: ({ id, file }: { id: string; file: File }) => {
      const fd = new FormData()
      fd.append('image', file)
      return api.post(`/products/${id}/images`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['product', vars.id] })
      qc.invalidateQueries({ queryKey: ['products'] })
      toast.success('Image uploaded')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useDeleteProductImage() {
  const qc = useQueryClient()
  return useMutation({
    // publicId from Cloudinary contains slashes — must be base64-encoded for the URL
    mutationFn: ({ productId, publicId }: { productId: string; publicId: string }) => {
      const encoded = btoa(publicId)  // base64 encode so slashes don't break the URL
      return api.delete(`/products/${productId}/images/${encoded}`)
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['product', vars.productId] })
      qc.invalidateQueries({ queryKey: ['products'] })
      toast.success('Image deleted')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useSetPrimaryImage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ productId, publicId }: { productId: string; publicId: string }) =>
      api.patch(`/products/${productId}/images/${btoa(publicId)}/primary`),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['product', vars.productId] })
      toast.success('Primary image updated')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}
