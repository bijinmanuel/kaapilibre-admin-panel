'use client'
import { useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle, Loader2, Trash2, CreditCard, Edit2, Check, X, FileText } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useOrder, useUpdateOrderStatus, useDeleteOrder, useUpdatePayment } from '@/hooks/useOrders'
import { useIsAdmin } from '@/store/authStore'
import { formatCurrency, formatDateTime, getNextStatuses } from '@/lib/utils'
import { STATUS_HEX } from '@/lib/utils'
import type { OrderStatus, PaymentStatus } from '@/types'
import { InvoiceModal } from '@/components/invoice/InvoiceModal'

const STATUS_ORDER: OrderStatus[] = ['pending', 'confirmed', 'roasting', 'dispatched', 'delivered']

const PAYMENT_STATUS_COLORS: Record<PaymentStatus, { bg: string; text: string; border: string }> = {
  pending:  { bg: 'bg-yellow-500/10', text: 'text-yellow-600 dark:text-yellow-400', border: 'border-yellow-500/30' },
  paid:     { bg: 'bg-green-500/10',  text: 'text-green-600 dark:text-green-400',   border: 'border-green-500/30' },
  failed:   { bg: 'bg-red-500/10',    text: 'text-red-600 dark:text-red-400',       border: 'border-red-500/30' },
  refunded: { bg: 'bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-500/30' },
}

function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const c = PAYMENT_STATUS_COLORS[status]
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${c.bg} ${c.text} ${c.border}`}>
      {status}
    </span>
  )
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const isAdmin = useIsAdmin()
  const { data: order, isLoading } = useOrder(id)
  const updateStatus  = useUpdateOrderStatus()
  const deleteOrder   = useDeleteOrder()
  const updatePayment = useUpdatePayment()

  const [newStatus,   setNewStatus]   = useState('')
  const [note,        setNote]        = useState('')
  const [showDelete,  setShowDelete]  = useState(false)
  const [showInvoice, setShowInvoice] = useState(false)

  // Payment edit state
  const [editingPayment,   setEditingPayment]   = useState(false)
  const [payStatus,        setPayStatus]        = useState('')
  const [transactionId,    setTransactionId]    = useState('')
  const [gatewayOrderId,   setGatewayOrderId]   = useState('')
  const [payNotes,         setPayNotes]         = useState('')

  const openPaymentEdit = () => {
    if (!order) return
    setPayStatus(order.payment.status)
    setTransactionId(order.payment.transactionId ?? '')
    setGatewayOrderId(order.payment.gatewayOrderId ?? '')
    setPayNotes(order.payment.notes ?? '')
    setEditingPayment(true)
  }

  const savePayment = async () => {
    await updatePayment.mutateAsync({
      id,
      data: {
        status:        payStatus,
        transactionId: transactionId || undefined,
        gatewayOrderId: gatewayOrderId || undefined,
        notes:         payNotes || undefined,
      },
    })
    setEditingPayment(false)
  }

  const handleUpdateStatus = async () => {
    if (!newStatus) return
    await updateStatus.mutateAsync({ id, status: newStatus, note })
    setNewStatus(''); setNote('')
  }

  const handleDelete = async () => {
    await deleteOrder.mutateAsync(id)
    router.push('/orders')
  }

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
    </div>
  )
  if (!order) return <div className="text-muted-foreground">Order not found</div>

  const completedStatuses = order.statusHistory.map(h => h.status)
  const nextStatuses = getNextStatuses(order.status as OrderStatus)
  const payColor = PAYMENT_STATUS_COLORS[order.payment?.status as PaymentStatus] ?? PAYMENT_STATUS_COLORS.pending

  return (
    <>
      <PageHeader
        title={order.orderNumber}
        action={
          <div className="flex items-center gap-2">
            <button onClick={() => setShowInvoice(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
              <FileText className="w-4 h-4" /> Invoice
            </button>
            <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ── Left col ─────────────────────────────────────────────────── */}
        <div className="lg:col-span-3 space-y-5">

          {/* Customer info */}
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Customer</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                ['Name',    order.customer.name],
                ['Email',   order.customer.email],
                ['Phone',   order.customer.phone],
                ['Account', order.customer.userId ? 'Registered' : 'Guest'],
              ].map(([k, v]) => (
                <div key={k}>
                  <p className="text-muted-foreground text-xs">{k}</p>
                  <p className={`font-medium mt-0.5 ${k === 'Account' && !order.customer.userId ? 'text-yellow-500' : 'text-foreground'}`}>{v}</p>
                </div>
              ))}
              <div className="col-span-2">
                <p className="text-muted-foreground text-xs">Shipping address</p>
                <p className="font-medium text-foreground mt-0.5">{order.shippingAddress}</p>
              </div>
              {order.notes && (
                <div className="col-span-2">
                  <p className="text-muted-foreground text-xs">Notes</p>
                  <p className="text-foreground mt-0.5">{order.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Order items */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <p className="text-sm font-medium text-foreground">Order items</p>
            </div>
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-muted/30">
                {['Product', 'Weight', 'Grind', 'Qty', 'Unit price', 'Subtotal'].map(h =>
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">{h}</th>)}
              </tr></thead>
              <tbody>
                {order.items.map((item, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium text-foreground">{item.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{item.weight}</td>
                    <td className="px-4 py-3 text-muted-foreground">{item.grind}</td>
                    <td className="px-4 py-3 text-foreground">{item.qty}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatCurrency(item.unitPrice)}</td>
                    <td className="px-4 py-3 font-semibold text-foreground">{formatCurrency(item.subtotal)}</td>
                  </tr>
                ))}
                <tr className="bg-muted/20">
                  <td colSpan={5} className="px-4 py-3 text-right font-medium text-foreground">Total</td>
                  <td className="px-4 py-3 font-bold text-lg" style={{ color: '#d4a853' }}>{formatCurrency(order.totalAmount)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ── Payment details ─────────────────────────────────────── */}
          <div className={`rounded-xl border p-5 ${payColor.border} bg-card`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">Payment</p>
              </div>
              {isAdmin && !editingPayment && (
                <button onClick={openPaymentEdit}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border px-2.5 py-1 rounded-lg hover:bg-accent transition-colors">
                  <Edit2 className="w-3 h-3" /> Edit
                </button>
              )}
              {editingPayment && (
                <div className="flex gap-1">
                  <button onClick={savePayment} disabled={updatePayment.isPending}
                    className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/30 hover:bg-green-500/20 transition-colors">
                    <Check className="w-3 h-3" />{updatePayment.isPending ? 'Saving...' : 'Save'}
                  </button>
                  <button onClick={() => setEditingPayment(false)}
                    className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border border-border text-muted-foreground hover:bg-accent transition-colors">
                    <X className="w-3 h-3" /> Cancel
                  </button>
                </div>
              )}
            </div>

            {!editingPayment ? (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Method</p>
                  <p className="font-medium text-foreground mt-0.5 capitalize">{order.payment?.method ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <div className="mt-0.5">
                    <PaymentStatusBadge status={(order.payment?.status ?? 'pending') as PaymentStatus} />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Amount</p>
                  <p className="font-semibold text-foreground mt-0.5">{formatCurrency(order.payment?.amount ?? order.totalAmount)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Paid at</p>
                  <p className="font-medium text-foreground mt-0.5">
                    {order.payment?.paidAt ? formatDateTime(order.payment.paidAt) : '—'}
                  </p>
                </div>
                {order.payment?.transactionId && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Transaction ID</p>
                    <p className="font-mono text-xs text-foreground mt-0.5 break-all">{order.payment.transactionId}</p>
                  </div>
                )}
                {order.payment?.gatewayOrderId && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Gateway Order ID</p>
                    <p className="font-mono text-xs text-foreground mt-0.5 break-all">{order.payment.gatewayOrderId}</p>
                  </div>
                )}
                {order.payment?.notes && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Notes</p>
                    <p className="text-sm text-foreground mt-0.5">{order.payment.notes}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Payment status</label>
                    <select value={payStatus} onChange={e => setPayStatus(e.target.value)}>
                      {['pending', 'paid', 'failed', 'refunded'].map(s => (
                        <option key={s} value={s} className="capitalize">{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Transaction ID</label>
                    <input value={transactionId} onChange={e => setTransactionId(e.target.value)}
                      placeholder="UPI ref / auth code" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Gateway Order ID</label>
                  <input value={gatewayOrderId} onChange={e => setGatewayOrderId(e.target.value)}
                    placeholder="Razorpay / Stripe order ID (optional)" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Notes</label>
                  <input value={payNotes} onChange={e => setPayNotes(e.target.value)}
                    placeholder="e.g. Cash collected by delivery agent" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Right col ────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Summary */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-2xl font-bold font-mono" style={{ color: '#d4a853' }}>{order.orderNumber}</p>
              <StatusBadge status={order.status as OrderStatus} />
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total</span>
                <span className="font-semibold text-foreground">{formatCurrency(order.totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment</span>
                <PaymentStatusBadge status={(order.payment?.status ?? 'pending') as PaymentStatus} />
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Placed</span>
                <span className="text-foreground text-xs">{formatDateTime(order.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Status timeline */}
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-5">Status timeline</p>
            <div className="space-y-0">
              {STATUS_ORDER.map((s, i) => {
                const histEntry = order.statusHistory.find(h => h.status === s)
                const isDone    = completedStatuses.includes(s)
                const isCurrent = order.status === s
                const color     = isDone ? STATUS_HEX[s] : undefined
                return (
                  <div key={s} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${isCurrent ? 'ring-2 ring-offset-2 ring-offset-card' : ''}`}
                        style={isDone ? { background: color, outline: isCurrent ? `2px solid ${color}` : undefined } : { border: '2px solid var(--border)' }}>
                        {isDone && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                      </div>
                      {i < STATUS_ORDER.length - 1 && (
                        <div className="w-0.5 h-10 mt-0.5" style={{ background: isDone ? color : 'var(--border)' }} />
                      )}
                    </div>
                    <div className="pb-8">
                      <p className={`text-sm font-medium capitalize ${isDone ? 'text-foreground' : 'text-muted-foreground'}`}>{s}</p>
                      {histEntry && <p className="text-xs text-muted-foreground">{formatDateTime(histEntry.changedAt)}</p>}
                      {histEntry?.note && <p className="text-xs text-muted-foreground italic mt-0.5">{histEntry.note}</p>}
                    </div>
                  </div>
                )
              })}
              {order.status === 'cancelled' && (
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center bg-red-500/80 flex-shrink-0">
                    <span className="text-white text-xs">✕</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-red-400">Cancelled</p>
                    {(() => { const e = order.statusHistory.find(h => h.status === 'cancelled'); return e ? <p className="text-xs text-muted-foreground">{formatDateTime(e.changedAt)}</p> : null })()}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Update status */}
          {nextStatuses.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Update status</p>
              <div className="space-y-3">
                <select value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                  <option value="">Select next status</option>
                  {nextStatuses.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
                </select>
                <input value={note} onChange={e => setNote(e.target.value)} placeholder="Optional note..." />
                <button onClick={handleUpdateStatus} disabled={!newStatus || updateStatus.isPending}
                  className="w-full h-10 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition-opacity"
                  style={{ background: '#d4a853', color: '#1a1713' }}>
                  {updateStatus.isPending ? <><Loader2 className="w-4 h-4 animate-spin" />Updating...</> : 'Update Status'}
                </button>
              </div>
            </div>
          )}

          {/* Delete — admin only */}
          {isAdmin && (
            <div>
              {!showDelete ? (
                <button onClick={() => setShowDelete(true)}
                  className="w-full h-10 rounded-lg text-sm font-medium border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2">
                  <Trash2 className="w-4 h-4" /> Delete order
                </button>
              ) : (
                <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 space-y-3">
                  <p className="text-sm font-medium text-red-400">Delete this order permanently?</p>
                  <p className="text-xs text-muted-foreground">This cannot be undone.</p>
                  <div className="flex gap-2">
                    <button onClick={handleDelete} disabled={deleteOrder.isPending}
                      className="flex-1 h-9 rounded-lg text-sm font-medium bg-red-500 text-white disabled:opacity-50">
                      {deleteOrder.isPending ? 'Deleting...' : 'Yes, delete'}
                    </button>
                    <button onClick={() => setShowDelete(false)}
                      className="flex-1 h-9 rounded-lg text-sm border border-border text-muted-foreground hover:text-foreground">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Invoice Modal */}
      {showInvoice && (
        <InvoiceModal
          order={order}
          onClose={() => setShowInvoice(false)}
        />
      )}
    </>
  )
}