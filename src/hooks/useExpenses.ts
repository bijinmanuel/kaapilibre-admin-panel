import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import type { Expense, ApiResponse, PaginationMeta, ExpenseStats } from '@/types'

interface ExpenseFilters {
  category?: string
  search?: string
  from?: string
  to?: string
  page?: number
  limit?: number
}

export function useExpenses(filters: ExpenseFilters = {}) {
  return useQuery<{ data: Expense[]; meta: PaginationMeta }>({
    queryKey: ['expenses', filters],
    queryFn: async () => {
      const res = await api.get('/expenses', { params: { ...filters, limit: filters.limit || 20 } }) as ApiResponse<Expense[]>
      return { data: res.data, meta: res.meta! }
    },
  })
}

export function useExpenseStats(month?: string) {
  return useQuery<{ stats: any[]; totalAmount: number }>({
    queryKey: ['expense-analytics', month],
    queryFn: async () => {
      const res = await api.get('/expenses/analytics', { params: { month } }) as ApiResponse<{ stats: any[]; totalAmount: number }>
      return res.data
    },
  })
}

export function useAddExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Expense>) => api.post('/expenses', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] })
      qc.invalidateQueries({ queryKey: ['expense-stats'] })
      toast.success('Expense recorded successfully')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useDeleteExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/expenses/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] })
      qc.invalidateQueries({ queryKey: ['expense-stats'] })
      toast.success('Expense deleted')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}
