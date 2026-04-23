'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, ChevronLeft, ChevronRight, Eye } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { useCustomers } from '@/hooks/useData'
import { formatCurrency, formatDate, getInitials } from '@/lib/utils'

export default function CustomersPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('createdAt')
  const [page, setPage] = useState(1)
  const { data, isLoading } = useCustomers({ search: search || undefined, sort, order: 'desc', page, limit: 20 })
  const customers = data?.data || []
  const meta = data?.meta

  return (
    <div>
      <PageHeader title="Customers" description={meta ? `${meta.total} customers` : ''} />
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="Search customers..." style={{ paddingLeft: '2.25rem' }} />
        </div>
        <select value={sort} onChange={e => setSort(e.target.value)} style={{ width: 'auto' }}>
          <option value="createdAt">Newest first</option>
          <option value="totalSpent">Most spent</option>
          <option value="totalOrders">Most orders</option>
        </select>
      </div>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-muted/30">
              {['Customer', 'Phone', 'Type', 'Orders', 'Total spent', 'Joined', ''].map(h =>
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">{h}</th>)}
            </tr></thead>
            <tbody>
              {isLoading ? [...Array(8)].map((_, i) => (
                <tr key={i} className="border-b border-border">{[...Array(7)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 rounded bg-muted animate-pulse" /></td>)}</tr>
              )) : customers.map(c => (
                <tr key={c._id} onClick={() => router.push(`/customers/${c._id}`)}
                  className="border-b border-border last:border-0 hover:bg-accent/40 cursor-pointer transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ background: 'rgba(212,168,83,0.15)', color: '#d4a853' }}>
                        {getInitials(c.name)}
                      </div>
                      <div><p className="font-medium text-foreground">{c.name}</p><p className="text-xs text-muted-foreground">{c.email}</p></div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{c.phone || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${c.isGuest ? 'border-yellow-500/30 bg-yellow-500/10 text-yellow-500' : 'border-green-500/30 bg-green-500/10 text-green-500'}`}>
                      {c.isGuest ? 'Guest' : 'Active'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-foreground">{c.totalOrders}</td>
                  <td className="px-4 py-3 font-medium text-foreground">{formatCurrency(c.totalSpent)}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{formatDate(c.createdAt)}</td>
                  <td className="px-4 py-3"><Eye className="w-3.5 h-3.5 text-muted-foreground" /></td>
                </tr>
              ))}
              {!isLoading && !customers.length && <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">No customers found</td></tr>}
            </tbody>
          </table>
        </div>
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">Page {meta.page} of {meta.totalPages}</p>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="p-1.5 rounded-md border border-border disabled:opacity-30 hover:bg-accent"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={() => setPage(p => p + 1)} disabled={page === meta.totalPages} className="p-1.5 rounded-md border border-border disabled:opacity-30 hover:bg-accent"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
