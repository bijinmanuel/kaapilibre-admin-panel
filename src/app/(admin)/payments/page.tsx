'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Clock, RefreshCw } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { usePayments, type PaymentStatus, type PaymentMethod } from '@/hooks/usePayments'
import { formatCurrency, formatDateTime } from '@/lib/utils'

const STATUS_CONFIG: Record<PaymentStatus, { label: string; cls: string }> = {
  pending: { label: 'Pending', cls: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-500' },
  success: { label: 'Success', cls: 'border-green-500/30 bg-green-500/10 text-green-500' },
  failed: { label: 'Failed', cls: 'border-red-500/30 bg-red-500/10 text-red-500' },
  refunded: { label: 'Refunded', cls: 'border-purple-500/30 bg-purple-500/10 text-purple-500' },
  partially_refunded: { label: 'Partial refund', cls: 'border-orange-500/30 bg-orange-500/10 text-orange-500' },
}

const METHOD_LABELS: Record<PaymentMethod, string> = {
  upi: 'UPI', card: 'Card', netbanking: 'Net banking',
  cash: 'Cash', whatsapp: 'WhatsApp', website: 'Website', email: 'Email',
}

export default function PaymentsPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [method, setMethod] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = usePayments({
    search: search || undefined,
    status: status || undefined,
    method: method || undefined,
    from: from || undefined,
    to: to || undefined,
    page, limit: 20,
  })

  const payments = data?.data ?? []
  const meta = data?.meta
  const stats = data?.stats

  const resetFilters = () => { setSearch(''); setStatus(''); setMethod(''); setFrom(''); setTo(''); setPage(1) }

  return (
    <div>
      <PageHeader title="Payments" description={meta ? `${meta.total} records` : ''} />

      {/* Summary stat cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            {
              label: 'Collected',
              value: formatCurrency(stats.totalAmount ?? 0),
              sub: `${stats.successCount} successful`,
              icon: TrendingUp,
              color: '#22c55e',
            },
            {
              label: 'Failed',
              value: `${stats.failedCount}`,
              sub: 'transactions',
              icon: TrendingDown,
              color: '#ef4444',
            },
            {
              label: 'Pending',
              value: `${stats.pendingCount}`,
              sub: 'awaiting payment',
              icon: Clock,
              color: '#f59e0b',
            },
            {
              label: 'Refunded',
              value: formatCurrency(stats.refundAmount ?? 0),
              sub: 'total refunds',
              icon: RefreshCw,
              color: '#a78bfa',
            },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{s.label}</p>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: `${s.color}15` }}>
                  <s.icon className="w-4 h-4" style={{ color: s.color }} />
                </div>
              </div>
              <p className="text-xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Order no, email, name, transaction ID..." style={{ paddingLeft: '2.25rem' }} />
        </div>

        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1) }} style={{ width: 'auto' }}>
          <option value="">All statuses</option>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>

        <select value={method} onChange={e => { setMethod(e.target.value); setPage(1) }} style={{ width: 'auto' }}>
          <option value="">All methods</option>
          {Object.entries(METHOD_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>

        <input type="date" value={from} onChange={e => setFrom(e.target.value)} style={{ width: 'auto' }} />
        <input type="date" value={to} onChange={e => setTo(e.target.value)} style={{ width: 'auto' }} />

        {(search || status || method || from || to) && (
          <button onClick={resetFilters} className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg">
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
                {['Order', 'Customer', 'Method', 'Amount', 'Status', 'Transaction ID', 'Date', ''].map(h => (
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
              ) : payments.length > 0 ? payments.map(p => {
                const sc = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.pending
                return (
                  <tr key={p._id}
                    onClick={() => router.push(`/payments/${p._id}`)}
                    className="border-b border-border last:border-0 hover:bg-accent/40 cursor-pointer transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-medium" style={{ color: '#d4a853' }}>{p.orderNumber}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{p.customerName}</p>
                      <p className="text-xs text-muted-foreground">{p.customerEmail}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-muted-foreground">{METHOD_LABELS[p.method] ?? p.method}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-foreground">{formatCurrency(p.amount)}</p>
                      {p.refundAmount && p.refundAmount > 0 && (
                        <p className="text-xs text-purple-500">−{formatCurrency(p.refundAmount)} refunded</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${sc.cls}`}>{sc.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-muted-foreground truncate max-w-32 block">
                        {p.transactionId ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {formatDateTime(p.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      {p.status === 'failed' && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded border border-red-500/30 bg-red-500/10 text-red-400">
                          {p.failureReason ? p.failureReason.slice(0, 20) : 'Failed'}
                        </span>
                      )}
                    </td>
                  </tr>
                )
              }) : (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                    No payments found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">Page {meta.page} of {meta.totalPages} ({meta.total} payments)</p>
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
