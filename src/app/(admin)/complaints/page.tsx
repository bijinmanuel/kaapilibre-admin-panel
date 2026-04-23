'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, AlertTriangle, ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { useComplaints } from '@/hooks/useComplaints'
import { formatDateTime, cn } from '@/lib/utils'
import type { ComplaintStatus, ComplaintPriority, ComplaintCategory } from '@/types'

const STATUS_COLORS: Record<ComplaintStatus, string> = {
  open:        'border-red-500/30 bg-red-500/10 text-red-500',
  in_progress: 'border-blue-500/30 bg-blue-500/10 text-blue-500',
  resolved:    'border-green-500/30 bg-green-500/10 text-green-500',
  closed:      'border-border bg-muted/30 text-muted-foreground',
}

const PRIORITY_COLORS: Record<ComplaintPriority, string> = {
  high:   'border-red-500/30 bg-red-500/10 text-red-500',
  medium: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-500',
  low:    'border-border bg-muted/30 text-muted-foreground',
}

const CATEGORY_LABELS: Record<ComplaintCategory, string> = {
  product_quality: 'Product quality',
  wrong_item:      'Wrong item',
  delivery:        'Delivery',
  payment:         'Payment',
  packaging:       'Packaging',
  other:           'Other',
}

export default function ComplaintsPage() {
  const router = useRouter()
  const [search,   setSearch]   = useState('')
  const [status,   setStatus]   = useState('')
  const [priority, setPriority] = useState('')
  const [category, setCategory] = useState('')
  const [page,     setPage]     = useState(1)

  const { data, isLoading } = useComplaints({
    search:   search || undefined,
    status:   status || undefined,
    priority: priority || undefined,
    category: category || undefined,
    page, limit: 20,
  })

  const complaints = data?.data ?? []
  const meta       = data?.meta

  return (
    <div>
      <PageHeader
        title="Complaints"
        description={meta ? `${meta.total} total` : ''}
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search ticket, subject, customer..." style={{ paddingLeft: '2.25rem' }} />
        </div>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1) }} style={{ width: 'auto' }}>
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <select value={priority} onChange={e => { setPriority(e.target.value); setPage(1) }} style={{ width: 'auto' }}>
          <option value="">All priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select value={category} onChange={e => { setCategory(e.target.value); setPage(1) }} style={{ width: 'auto' }}>
          <option value="">All categories</option>
          {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        {(search || status || priority || category) && (
          <button onClick={() => { setSearch(''); setStatus(''); setPriority(''); setCategory(''); setPage(1) }}
            className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg">
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {['Ticket', 'Customer', 'Category', 'Subject', 'Priority', 'Status', 'Date', 'Replies'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    {[...Array(8)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 rounded bg-muted animate-pulse" /></td>)}
                  </tr>
                ))
              ) : complaints.length > 0 ? complaints.map(c => (
                <tr key={c._id}
                  onClick={() => router.push(`/complaints/${c._id}`)}
                  className="border-b border-border last:border-0 hover:bg-accent/40 cursor-pointer transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs font-medium" style={{ color: '#d4a853' }}>{c.ticketNumber}</span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{c.customer.name}</p>
                    <p className="text-xs text-muted-foreground">{c.customer.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-muted-foreground">{CATEGORY_LABELS[c.category as ComplaintCategory]}</span>
                  </td>
                  <td className="px-4 py-3 max-w-48">
                    <p className="text-foreground truncate">{c.subject}</p>
                    {c.orderNumber && (
                      <p className="text-xs text-muted-foreground font-mono">{c.orderNumber}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${PRIORITY_COLORS[c.priority as ComplaintPriority]}`}>
                      {c.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${STATUS_COLORS[c.status as ComplaintStatus]}`}>
                      {c.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                    {formatDateTime(c.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-xs text-muted-foreground">{(c as any).messages?.length ?? 0}</span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                    <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No complaints found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">Page {meta.page} of {meta.totalPages}</p>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => p - 1)} disabled={page === 1}
                className="p-1.5 rounded-md border border-border disabled:opacity-30 hover:bg-accent transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setPage(p => p + 1)} disabled={page === meta.totalPages}
                className="p-1.5 rounded-md border border-border disabled:opacity-30 hover:bg-accent transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
