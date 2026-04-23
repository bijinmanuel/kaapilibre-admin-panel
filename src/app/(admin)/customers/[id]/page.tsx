'use client'
import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useCustomer, useCustomerOrders, useDeactivateCustomer } from '@/hooks/useData'
import { formatCurrency, formatDate, formatDateTime, getInitials } from '@/lib/utils'
import type { OrderStatus } from '@/types'

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { data, isLoading } = useCustomer(id)
  const { data: ordersData } = useCustomerOrders(id)
  const deactivate = useDeactivateCustomer()
  const [showDeactivate, setShowDeactivate] = useState(false)
  const customer = data?.customer
  const orders = ordersData?.data || []

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
  if (!customer) return <div className="text-muted-foreground">Customer not found</div>

  return (
    <div>
      <PageHeader title={customer.name}
        action={<button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="w-4 h-4" /> Back</button>}
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-5">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold"
                style={{ background: 'rgba(212,168,83,0.15)', color: '#d4a853' }}>
                {getInitials(customer.name)}
              </div>
              <div>
                <p className="font-semibold text-foreground">{customer.name}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full border mt-1 inline-block ${customer.isGuest ? 'border-yellow-500/30 bg-yellow-500/10 text-yellow-500' : 'border-green-500/30 bg-green-500/10 text-green-500'}`}>
                  {customer.isGuest ? 'Guest' : 'Active'}
                </span>
              </div>
            </div>
            <div className="space-y-3 text-sm">
              {[['Email', customer.email], ['Phone', customer.phone || '—'], ['Joined', formatDate(customer.createdAt)], ['Address', customer.savedAddress || '—']].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3">
                  <span className="text-muted-foreground flex-shrink-0">{k}</span>
                  <span className="text-foreground text-right break-all">{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[{ label: 'Total orders', value: customer.totalOrders }, { label: 'Total spent', value: formatCurrency(customer.totalSpent) }].map(s => (
              <div key={s.label} className="rounded-xl border border-border bg-card p-4">
                <p className="text-xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>
          {!showDeactivate ? (
            <button onClick={() => setShowDeactivate(true)}
              className="w-full h-10 rounded-lg text-sm border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors">
              Deactivate account
            </button>
          ) : (
            <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 space-y-3">
              <p className="text-sm text-red-400 font-medium">Deactivate this customer?</p>
              <div className="flex gap-2">
                <button onClick={async () => { await deactivate.mutateAsync(id); router.push('/customers') }}
                  className="flex-1 h-9 rounded-lg text-sm bg-red-500 text-white">Deactivate</button>
                <button onClick={() => setShowDeactivate(false)} className="flex-1 h-9 rounded-lg text-sm border border-border text-muted-foreground">Cancel</button>
              </div>
            </div>
          )}
        </div>
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border"><p className="text-sm font-medium text-foreground">Order history</p></div>
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-muted/30">
                {['Order #', 'Status', 'Total', 'Date'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">{h}</th>)}
              </tr></thead>
              <tbody>
                {orders.map((o: any) => (
                  <tr key={o._id} onClick={() => router.push(`/orders/${o._id}`)}
                    className="border-b border-border last:border-0 hover:bg-accent/40 cursor-pointer transition-colors">
                    <td className="px-4 py-3 font-mono text-xs" style={{ color: '#d4a853' }}>{o.orderNumber}</td>
                    <td className="px-4 py-3"><StatusBadge status={o.status as OrderStatus} /></td>
                    <td className="px-4 py-3 font-medium text-foreground">{formatCurrency(o.totalAmount)}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{formatDateTime(o.createdAt)}</td>
                  </tr>
                ))}
                {!orders.length && <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No orders yet</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
