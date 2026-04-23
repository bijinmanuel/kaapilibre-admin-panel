'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Download, Eye, FileText, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useOrders, downloadOrdersCsv } from '@/hooks/useOrders'
import { useIsAdmin } from '@/store/authStore'
import { formatCurrency, formatDateTime, ORDER_STATUSES } from '@/lib/utils'
import type { OrderStatus } from '@/types'
import { InvoiceModal } from '@/components/invoice/InvoiceModal'
import { CreateOrderModal } from '@/components/orders/CreateOrderModal'

const useDebounce = (val: string, ms = 350) => {
  const [deb, setDeb] = useState(val)
  useEffect(() => { const t = setTimeout(() => setDeb(val), ms); return () => clearTimeout(t) }, [val, ms])
  return deb
}

export default function OrdersPage() {
  const router = useRouter()
  const isAdmin = useIsAdmin()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)
  const [invoiceOrder, setInvoiceOrder] = useState<any>(null)
  const [showCreate,   setShowCreate]   = useState(false)
  const debouncedSearch = useDebounce(search)

  const { data, isLoading } = useOrders({
    search: debouncedSearch || undefined,
    status: status || undefined,
    from: from || undefined,
    to: to || undefined,
    page,
    limit: 20,
  })

  const orders = data?.data || []
  const meta = data?.meta

  const resetFilters = () => { setSearch(''); setStatus(''); setFrom(''); setTo(''); setPage(1) }

  return (
    <>
      <PageHeader
        title="Orders"
        description={meta ? `${meta.total} orders total` : ''}
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ background: '#d4a853', color: '#1a1713' }}>
              <Plus className="w-4 h-4" /> Create Order
            </button>
            {isAdmin && (
              <button onClick={downloadOrdersCsv}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                <Download className="w-4 h-4" /> Export CSV
              </button>
            )}
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search orders, customers..." style={{ paddingLeft: '2.25rem' }} />
        </div>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1) }} style={{ width: 'auto', minWidth: '140px' }}>
          <option value="">All statuses</option>
          {ORDER_STATUSES.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
        </select>
        <input type="date" value={from} onChange={e => setFrom(e.target.value)} style={{ width: 'auto' }} />
        <input type="date" value={to} onChange={e => setTo(e.target.value)} style={{ width: 'auto' }} />
        {(search || status || from || to) && (
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
                {['Order #', 'Customer', 'Status', 'Items', 'Total', 'Payment', 'Date', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    {[...Array(8)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 rounded bg-muted animate-pulse" /></td>)}
                  </tr>
                ))
              ) : orders.length > 0 ? orders.map(order => (
                <tr key={order._id}
                  onClick={() => router.push(`/orders/${order._id}`)}
                  className="border-b border-border last:border-0 hover:bg-accent/40 cursor-pointer transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-medium" style={{ color: '#d4a853' }}>{order.orderNumber}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{order.customer.name}</p>
                    <p className="text-xs text-muted-foreground">{order.customer.email}</p>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={order.status as OrderStatus} /></td>
                  <td className="px-4 py-3 text-muted-foreground">{order.items?.length || 0}</td>
                  <td className="px-4 py-3 font-semibold text-foreground">{formatCurrency(order.totalAmount)}</td>
                  <td className="px-4 py-3 capitalize text-muted-foreground text-xs">{order.payment?.method ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">{formatDateTime(order.createdAt)}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={e => { e.stopPropagation(); setInvoiceOrder(order) }}
                      className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                      title="View invoice">
                      <FileText className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">No orders found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">Page {meta.page} of {meta.totalPages} ({meta.total} orders)</p>
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
      {invoiceOrder && (
        <InvoiceModal
          order={invoiceOrder}
          onClose={() => setInvoiceOrder(null)}
        />
      )}
      {showCreate && (
        <CreateOrderModal onClose={() => setShowCreate(false)} />
      )}
    </>
  )
}
