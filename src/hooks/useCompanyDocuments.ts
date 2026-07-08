import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { toast } from 'sonner'

export interface CompanyDocument {
  _id: string
  title: string
  description?: string
  fileUrl: string
  fileName: string
  fileType: 'pdf' | 'image' | 'doc'
  fileSize: number
  uploadedBy: {
    _id: string
    name: string
    email: string
  }
  createdAt: string
}

export function useCompanyDocuments(search?: string) {
  return useQuery<CompanyDocument[]>({
    queryKey: ['company-documents', search],
    queryFn: async () => {
      const res: any = await api.get('/company-documents', { params: { search } })
      return res.data
    },
  })
}

export function useUploadCompanyDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ title, description, file }: { title: string; description?: string; file: File }) => {
      const fd = new FormData()
      fd.append('title', title)
      if (description) fd.append('description', description)
      fd.append('file', file)
      return api.post('/company-documents', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['company-documents'] })
      toast.success('Document uploaded successfully')
    },
    onError: (e: Error) => {
      toast.error(e.message || 'Failed to upload document')
    },
  })
}

export function useDeleteCompanyDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/company-documents/${id}`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['company-documents'] })
      toast.success('Document deleted successfully')
    },
    onError: (e: Error) => {
      toast.error(e.message || 'Failed to delete document')
    },
  })
}
