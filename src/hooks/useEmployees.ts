import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import type { Employee, EmployeeAnalytics, ApiResponse } from '@/types'

export function useEmployees(filters: { status?: string; search?: string; department?: string } = {}) {
  return useQuery<Employee[]>({
    queryKey: ['employees', filters],
    queryFn: async () => {
      const res = await api.get('/employees', { params: filters }) as ApiResponse<Employee[]>
      return res.data
    },
  })
}

export function useEmployee(id: string) {
  return useQuery<Employee>({
    queryKey: ['employee', id],
    queryFn: async () => {
      const res = await api.get(`/employees/${id}`) as ApiResponse<Employee>
      return res.data
    },
    enabled: !!id,
  })
}

export function useEmployeeAnalytics() {
  return useQuery<EmployeeAnalytics>({
    queryKey: ['employee-analytics'],
    queryFn: async () => {
      const res = await api.get('/employees/analytics') as ApiResponse<EmployeeAnalytics>
      return res.data
    },
  })
}

export function useAddEmployee() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Employee>) => api.post('/employees', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employees'] })
      qc.invalidateQueries({ queryKey: ['employee-analytics'] })
      toast.success('Employee added successfully')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useUpdateEmployee() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Employee> & { id: string }) =>
      api.patch(`/employees/${id}`, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['employees'] })
      qc.invalidateQueries({ queryKey: ['employee', vars.id] })
      qc.invalidateQueries({ queryKey: ['employee-analytics'] })
      toast.success('Employee updated successfully')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useDeleteEmployee() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/employees/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employees'] })
      qc.invalidateQueries({ queryKey: ['employee-analytics'] })
      toast.success('Employee removed')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useUploadEmployeeImage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => {
      const formData = new FormData()
      formData.append('image', file)
      return api.post(`/employees/${id}/image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['employees'] })
      qc.invalidateQueries({ queryKey: ['employee', vars.id] })
      toast.success('Employee image uploaded')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useEmployeeAttendance(id: string, month?: string) {
  return useQuery({
    queryKey: ['employee-attendance', id, month],
    queryFn: async () => {
      const res = await api.get(`/employees/${id}/attendance`, { params: { month } }) as ApiResponse<any>
      return res.data
    },
    enabled: !!id,
  })
}

export function useMarkAttendance() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, date, status }: { id: string; date: string; status: string }) =>
      api.post(`/employees/${id}/attendance`, { date, status }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['employee-attendance', vars.id] })
      toast.success('Attendance marked')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useUploadDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, file, documentName }: { id: string; file: File; documentName: string }) => {
      const formData = new FormData()
      formData.append('image', file)
      formData.append('documentName', documentName)
      return api.post(`/employees/${id}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['employee', vars.id] })
      toast.success('Document uploaded')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}
