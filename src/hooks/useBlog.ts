import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { toast } from 'sonner'

export interface BlogBlock {
  _id?: string
  type: 'paragraph' | 'image' | 'heading' | 'quote'
  content?: string
  url?: string
  publicId?: string
  caption?: string
  order: number
}

export interface Blog {
  _id: string
  title: string
  slug: string
  excerpt: string
  coverImage?: { url: string; publicId: string }
  blocks: BlogBlock[]
  tags: string[]
  status: 'draft' | 'published'
  author: { id: string; name: string }
  publishedAt?: string
  readTimeMinutes: number
  createdAt: string
  updatedAt: string
}

interface BlogFilters {
  status?: 'draft' | 'published' | 'all'
  tag?: string
  search?: string
  page?: number
  limit?: number
}

export function useBlogs(filters: BlogFilters = {}) {
  return useQuery<{ data: Blog[]; meta: any }>({
    queryKey: ['blogs', filters],
    queryFn: async () => {
      const res = await api.get('/blog', { params: { ...filters, limit: filters.limit || 20 } }) as any
      return { data: res.data, meta: res.meta }
    },
  })
}

export function useBlog(id: string) {
  return useQuery<Blog>({
    queryKey: ['blog', id],
    queryFn: async () => {
      const res = await api.get(`/blog/id/${id}`) as any
      return res.data
    },
    enabled: !!id,
  })
}

export function useCreateBlog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Blog>) => api.post('/blog', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['blogs'] }); toast.success('Blog post created') },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useUpdateBlog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Blog> }) =>
      api.put(`/blog/${id}`, data),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['blogs'] })
      qc.invalidateQueries({ queryKey: ['blog', vars.id] })
      toast.success('Blog post saved')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useDeleteBlog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/blog/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['blogs'] }); toast.success('Blog post deleted') },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useTogglePublish() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.patch(`/blog/${id}/publish`),
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: ['blogs'] })
      qc.invalidateQueries({ queryKey: ['blog', id] })
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useUploadCoverImage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => {
      const fd = new FormData()
      fd.append('image', file)
      return api.post(`/blog/${id}/cover`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['blog', vars.id] })
      toast.success('Cover image uploaded')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useUploadBlockImage() {
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => {
      const fd = new FormData()
      fd.append('image', file)
      return api.post(`/blog/${id}/blocks/image`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }) as Promise<any>
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useDeleteBlockImage() {
  return useMutation({
    mutationFn: ({ id, publicId }: { id: string; publicId: string }) =>
      api.delete(`/blog/${id}/blocks/image/${btoa(publicId)}`),
    onError: (e: Error) => toast.error(e.message),
  })
}
