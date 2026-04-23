'use client'
import { useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, CreditCard, FileText, Calendar, Store, MapPin, Phone, Mail } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useCafeOrder, useUpdateCafeOrderStatus } from '@/hooks/useCafeOrders'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import type { Cafe, CafeOrder, CafeOrderStatus } from '@/types'
import { CafeInvoiceModal } from '@/components/invoice/CafeInvoiceModal'

export default function CafeOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { data: order, isLoading } = useCafeOrder(id)
  const { mutate: updateStatus } = useUpdateCafeOrderStatus()
  const [showInvoice, setShowInvoice] = useState(false)

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
    </div>
  )

  if (!order) return <div className="text-muted-foreground p-8 text-center">Order not found</div>

  // Cafe might be populated or just an ID
  const cafe = order.cafeId as Cafe

  return (
    <>
      <PageHeader
        title={`Order ${order.orderNumber}`}
        description={`Created on ${formatDateTime(order.createdAt)}`}
        action={
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowInvoice(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
            >
              <FileText className="w-4 h-4" /> Invoice
            </button>
            <button 
              onClick={() => router.back()} 
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Cafe Info */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4 text-primary">
              <Store className="w-5 h-5" />
              <h3 className="font-bold">Cafe Details</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Name</p>
                <p className="font-medium text-foreground">{cafe?.name || 'Unknown Cafe'}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Location</p>
                <div className="flex items-center gap-2 text-foreground">
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-sm">{cafe?.location || 'N/A'}</span>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Contact</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                    {cafe?.contactNumber || 'N/A'}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                    {cafe?.email || 'N/A'}
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Status</p>
                <StatusBadge status={order.status as any} />
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-muted/30">
              <h3 className="font-bold text-sm">Order Items</h3>
            </div>
            <table className="w-full">
              <thead>
                <tr className="text-left text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border">
                  <th className="px-6 py-4">Item Name</th>
                  <th className="px-6 py-4 text-center">Qty</th>
                  <th className="px-6 py-4 text-right">Price</th>
                  <th className="px-6 py-4 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {order.items.map((item, i) => (
                  <tr key={i} className="text-sm">
                    <td className="px-6 py-4 font-medium text-foreground">{item.name}</td>
                    <td className="px-6 py-4 text-center text-muted-foreground">{item.qty}</td>
                    <td className="px-6 py-4 text-right text-muted-foreground">{formatCurrency(item.price)}</td>
                    <td className="px-6 py-4 text-right font-bold text-foreground">{formatCurrency(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-muted/30 font-bold text-lg">
                  <td colSpan={3} className="px-6 py-4 text-right">Total Amount</td>
                  <td className="px-6 py-4 text-right text-primary">{formatCurrency(order.totalAmount)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          {/* Summary Card */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="font-bold mb-4">Summary</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Order ID</span>
                <span className="font-mono text-xs font-bold">{order._id}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Payment Method</span>
                <div className="flex items-center gap-2 capitalize">
                  <CreditCard className="w-4 h-4 text-muted-foreground" />
                  {order.paymentMethod}
                </div>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Created At</span>
                <div className="flex items-center gap-2 text-xs">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  {formatDateTime(order.createdAt)}
                </div>
              </div>
            </div>
            
            {order.status === 'pending' && (
              <div className="mt-8 space-y-2">
                <button 
                  onClick={() => updateStatus({ id: order._id, status: 'completed' })}
                  className="w-full py-3 rounded-xl bg-green-500 text-white font-bold text-sm transition-all hover:bg-green-600 active:scale-[0.98]"
                >
                  Mark Completed
                </button>
                <button 
                  onClick={() => updateStatus({ id: order._id, status: 'cancelled' })}
                  className="w-full py-3 rounded-xl bg-red-500/10 text-red-500 font-bold text-sm transition-all hover:bg-red-500/20 active:scale-[0.98]"
                >
                  Cancel Order
                </button>
              </div>
            )}
          </div>

          {order.notes && (
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="font-bold mb-2">Internal Notes</h3>
              <p className="text-sm text-muted-foreground italic">{order.notes}</p>
            </div>
          )}
        </div>
      </div>

      {showInvoice && (
        <CafeInvoiceModal
          order={order}
          onClose={() => setShowInvoice(false)}
        />
      )}
    </>
  )
}
