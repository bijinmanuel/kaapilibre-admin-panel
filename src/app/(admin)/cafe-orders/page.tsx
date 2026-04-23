'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Plus, Coffee, Calendar, CreditCard, MoreVertical } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { useCafeOrders, useUpdateCafeOrderStatus } from '@/hooks/useCafeOrders'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { CafeOrderStatus } from '@/types'
import { CreateCafeOrderModal } from '@/components/orders/CreateCafeOrderModal'

const useDebounce = (val: string, ms = 350) => {
  const [deb, setDeb] = useState(val)
  useEffect(() => { const t = setTimeout(() => setDeb(val), ms); return () => clearTimeout(t) }, [val, ms])
  return deb
}

export default function CafeOrdersPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebounce(search)

  const { data, isLoading } = useCafeOrders({
    search: debouncedSearch || undefined,
    status: status || undefined,
    page,
    limit: 20,
  })

  const { mutate: updateStatus } = useUpdateCafeOrderStatus()

  const orders = data?.data || []
  const meta = data?.meta

  return (
    <>
      <PageHeader
        title="Cafe Orders"
        description="Manage physical store orders and walk-ins"
        action={
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: '#d4a853', color: '#1a1713' }}
          >
            <Plus className="w-4 h-4" /> New Cafe Order
          </button>
        }
      />

      <div className="flex flex-wrap gap-4 mb-6">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search orders by number or items..."
            className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-4 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {isLoading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="h-48 rounded-xl bg-card border border-border animate-pulse" />
          ))
        ) : orders.length > 0 ? (
          orders.map((order) => (
            <div key={order._id} className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Link href={`/cafe-orders/${order._id}`} className="font-mono text-sm font-bold text-primary hover:underline underline-offset-4">
                      {order.orderNumber}
                    </Link>
                    <StatusBadge status={order.status as any} />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    {formatDateTime(order.createdAt)}
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-lg font-bold text-foreground">{formatCurrency(order.totalAmount)}</span>
                  <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                    <CreditCard className="w-3 h-3" />
                    {order.paymentMethod}
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      <span className="font-medium text-foreground">{item.qty}x</span> {item.name}
                    </span>
                    <span className="text-foreground/80">{formatCurrency(item.subtotal)}</span>
                  </div>
                ))}
              </div>

              {order.status === 'pending' && (
                <div className="flex gap-2 pt-4 border-t border-border">
                  <button
                    onClick={() => updateStatus({ id: order._id, status: 'completed' })}
                    className="flex-1 py-2 rounded-lg bg-green-500/10 text-green-500 text-xs font-semibold hover:bg-green-500 hover:text-white transition-all"
                  >
                    Mark Completed
                  </button>
                  <button
                    onClick={() => updateStatus({ id: order._id, status: 'cancelled' })}
                    className="px-3 py-2 rounded-lg bg-red-500/10 text-red-500 text-xs font-semibold hover:bg-red-500 hover:text-white transition-all"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center">
            <Coffee className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-muted-foreground">No cafe orders found</p>
          </div>
        )}
      </div>

      {showCreate && <CreateCafeOrderModal onClose={() => setShowCreate(false)} />}
    </>
  )
}
