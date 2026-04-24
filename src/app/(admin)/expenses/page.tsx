'use client'
import { useState, useEffect } from 'react'
import { Plus, Wallet, TrendingDown, ArrowUpRight, ArrowDownRight, Calendar, Filter, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { useExpenses, useExpenseStats, useDeleteExpense } from '@/hooks/useExpenses'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { AddExpenseModal } from '@/components/expenses/AddExpenseModal'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie, Legend 
} from 'recharts'

const COLORS = ['#d4a853', '#eab308', '#f59e0b', '#d97706', '#b45309', '#78350f']

export default function ExpensesPage() {
  const [showAdd, setShowAdd] = useState(false)
  const [category, setCategory] = useState('')
  const { data: expensesData, isLoading: loadingExpenses } = useExpenses({ category })
  const { data: stats, isLoading: loadingStats } = useExpenseStats()
  const { mutate: deleteExpense } = useDeleteExpense()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const expenses = expensesData?.data || []

  const pieData = stats?.stats.map((s: any) => ({ name: s._id, value: s.total })) || []

  return (
    <>
      <PageHeader
        title="Expense Analysing"
        description="Track and analyze your business spending"
        action={
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: '#d4a853', color: '#1a1713' }}
          >
            <Plus className="w-4 h-4" /> Record Expense
          </button>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-card border border-border rounded-xl p-6 relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-1">Total Expenses</p>
          <h3 className="text-2xl font-bold text-foreground">{formatCurrency(stats?.totalAmount || 0)}</h3>
          <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
            <Wallet className="w-32 h-32" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Active Categories</p>
            <h3 className="text-2xl font-bold text-foreground">{pieData.length}</h3>
          </div>
          <div className="p-3 rounded-full bg-primary/10 text-primary">
            <Filter className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Expense List */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-bold text-foreground">Recent Expenses</h4>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <select 
                value={category} 
                onChange={(e) => setCategory(e.target.value)}
                className="text-xs bg-transparent border-none focus:ring-0 text-muted-foreground cursor-pointer"
              >
                <option value="">All Categories</option>
                <option value="Rent">Rent</option>
                <option value="Salary">Salary</option>
                <option value="Inventory">Inventory</option>
                <option value="Utility">Utility</option>
                <option value="Marketing">Marketing</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Title</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Category</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Date</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Amount</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loadingExpenses ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={5} className="px-4 py-4"><div className="h-4 bg-muted rounded w-full" /></td>
                    </tr>
                  ))
                ) : expenses.length > 0 ? (
                  expenses.map((expense) => (
                    <tr key={expense._id} className="hover:bg-accent/30 transition-colors group">
                      <td className="px-4 py-4">
                        <p className="font-medium text-foreground">{expense.title}</p>
                        {expense.notes && <p className="text-xs text-muted-foreground truncate max-w-[200px]">{expense.notes}</p>}
                      </td>
                      <td className="px-4 py-4">
                        <span className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-muted text-muted-foreground">
                          {expense.category}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-xs text-muted-foreground">
                        {new Date(expense.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4 text-right font-bold text-foreground">
                        {formatCurrency(expense.amount)}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button 
                          onClick={() => deleteExpense(expense._id)}
                          className="p-1.5 rounded-md hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">No expenses recorded yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Breakdown Chart */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h4 className="text-lg font-bold text-foreground mb-6">Category Breakdown</h4>
          <div className="h-[250px] w-full min-h-[250px]">
            {mounted && (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={100}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ background: '#1a1713', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ fontSize: '12px' }}
                />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
          
          <div className="mt-6 space-y-4">
            {pieData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: COLORS[idx % COLORS.length] }} />
                  <span className="text-xs text-muted-foreground capitalize">{item.name}</span>
                </div>
                <span className="text-xs font-bold text-foreground">{formatCurrency(item.value as number)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showAdd && <AddExpenseModal onClose={() => setShowAdd(false)} />}
    </>
  )
}
