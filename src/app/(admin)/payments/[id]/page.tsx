'use client'
import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Check, X, RefreshCw } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { usePayment, useUpdatePaymentStatus, useRefundPayment, type PaymentStatus, type PaymentMethod } from '@/hooks/usePayments'
import { formatCurrency, formatDateTime } from '@/lib/utils'

const STATUS_CONFIG: Record<PaymentStatus, { label: string; cls: string }> = {
  pending:           { label: 'Pending',        cls: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-500' },
  success:           { label: 'Success',        cls: 'border-green-500/30 bg-green-500/10 text-green-500' },
  failed:            { label: 'Failed',         cls: 'border-red-500/30 bg-red-500/10 text-red-500' },
  refunded:          { label: 'Refunded',       cls: 'border-purple-500/30 bg-purple-500/10 text-purple-500' },
  partially_refunded:{ label: 'Partial refund', cls: 'border-orange-500/30 bg-orange-500/10 text-orange-500' },
}

export default function PaymentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router  = useRouter()
  const { data: payment, isLoading } = usePayment(id)
  const updateStatus = useUpdatePaymentStatus()
  const refund       = useRefundPayment()

  // Update form state
  const [editingStatus,    setEditingStatus]    = useState(false)
  const [newStatus,        setNewStatus]        = useState('')
  const [transactionId,    setTransactionId]    = useState('')
  const [gatewayPaymentId, setGatewayPaymentId] = useState('')
  const [failureReason,    setFailureReason]    = useState('')
  const [statusNotes,      setStatusNotes]      = useState('')

  // Refund form state
  const [showRefund,    setShowRefund]    = useState(false)
  const [refundAmount,  setRefundAmount]  = useState('')
  const [refundId,      setRefundId]      = useState('')
  const [refundReason,  setRefundReason]  = useState('')

  const openStatusEdit = () => {
    if (!payment) return
    setNewStatus(payment.status)
    setTransactionId(payment.transactionId ?? '')
    setGatewayPaymentId(payment.gatewayPaymentId ?? '')
    setFailureReason(payment.failureReason ?? '')
    setStatusNotes(payment.notes ?? '')
    setEditingStatus(true)
  }

  const saveStatus = async () => {
    await updateStatus.mutateAsync({
      id,
      data: {
        status:          newStatus,
        transactionId:   transactionId   || undefined,
        gatewayPaymentId: gatewayPaymentId || undefined,
        failureReason:   failureReason   || undefined,
        notes:           statusNotes     || undefined,
      },
    })
    setEditingStatus(false)
  }

  const saveRefund = async () => {
    if (!refundAmount || !refundReason) return
    await refund.mutateAsync({
      id,
      refundAmount: parseFloat(refundAmount),
      refundId:     refundId || undefined,
      refundReason,
    })
    setShowRefund(false)
    setRefundAmount(''); setRefundId(''); setRefundReason('')
  }

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
  if (!payment)  return <div className="text-muted-foreground">Payment not found</div>

  const sc = STATUS_CONFIG[payment.status] ?? STATUS_CONFIG.pending

  return (
    <div>
      <PageHeader
        title={`Payment — ${payment.orderNumber}`}
        action={
          <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left: full details ───────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Status card */}
          <div className={`rounded-xl border p-5 ${sc.cls.split(' ')[0]}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Payment status</p>
                <span className={`text-base font-semibold ${sc.cls.split(' ')[2]}`}>{sc.label}</span>
                {payment.failureReason && (
                  <p className="text-xs text-red-400 mt-1">{payment.failureReason}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-foreground">{formatCurrency(payment.amount)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{payment.currency}</p>
              </div>
            </div>
          </div>

          {/* All details */}
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Payment details</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
              {[
                ['Order',          payment.orderNumber],
                ['Method',         payment.method.toUpperCase()],
                ['Amount',         formatCurrency(payment.amount)],
                ['Status',         sc.label],
                ['Initiated',      formatDateTime(payment.initiatedAt)],
                ['Paid at',        payment.paidAt ? formatDateTime(payment.paidAt) : '—'],
                ['Failed at',      payment.failedAt ? formatDateTime(payment.failedAt) : '—'],
                ['Transaction ID', payment.transactionId ?? '—'],
                ['Gateway Order',  payment.gatewayOrderId ?? '—'],
                ['Gateway Pymnt',  payment.gatewayPaymentId ?? '—'],
                ['Notes',          payment.notes ?? '—'],
              ].map(([k, v]) => (
                <div key={k}>
                  <p className="text-xs text-muted-foreground">{k}</p>
                  <p className={`font-medium mt-0.5 break-all ${k === 'Transaction ID' || k.startsWith('Gateway') ? 'font-mono text-xs' : 'text-foreground'}`}>
                    {v}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Customer info */}
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Customer</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                ['Name',  payment.customerName],
                ['Email', payment.customerEmail],
                ['Phone', payment.customerPhone],
                ['Type',  payment.customerId ? 'Registered' : 'Guest'],
              ].map(([k, v]) => (
                <div key={k}>
                  <p className="text-xs text-muted-foreground">{k}</p>
                  <p className={`font-medium mt-0.5 ${k === 'Type' && !payment.customerId ? 'text-yellow-500' : 'text-foreground'}`}>{v}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Refund info — shown if refunded */}
          {(payment.refundAmount ?? 0) > 0 && (
            <div className="rounded-xl border border-purple-500/30 bg-purple-500/5 p-5">
              <p className="text-xs font-medium text-purple-500 uppercase tracking-wider mb-4">Refund details</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {[
                  ['Refund amount', formatCurrency(payment.refundAmount!)],
                  ['Refund ID',     payment.refundId ?? '—'],
                  ['Refunded at',   payment.refundedAt ? formatDateTime(payment.refundedAt) : '—'],
                  ['Reason',        payment.refundReason ?? '—'],
                ].map(([k, v]) => (
                  <div key={k}>
                    <p className="text-xs text-muted-foreground">{k}</p>
                    <p className="font-medium text-foreground mt-0.5">{v}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Right: actions ───────────────────────────────────────────── */}
        <div className="space-y-5">

          {/* Update status */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Update status</p>
              {!editingStatus ? (
                <button onClick={openStatusEdit}
                  className="text-xs text-muted-foreground hover:text-foreground border border-border px-2.5 py-1 rounded-lg hover:bg-accent transition-colors">
                  Edit
                </button>
              ) : (
                <div className="flex gap-1">
                  <button onClick={saveStatus} disabled={updateStatus.isPending}
                    className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-green-500/10 text-green-500 border border-green-500/30">
                    <Check className="w-3 h-3" />{updateStatus.isPending ? '...' : 'Save'}
                  </button>
                  <button onClick={() => setEditingStatus(false)}
                    className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border border-border text-muted-foreground">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            {editingStatus ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Status</label>
                  <select value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Transaction ID</label>
                  <input value={transactionId} onChange={e => setTransactionId(e.target.value)} placeholder="UPI ref / auth code" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Gateway Payment ID</label>
                  <input value={gatewayPaymentId} onChange={e => setGatewayPaymentId(e.target.value)} placeholder="Razorpay / Stripe ID" />
                </div>
                {newStatus === 'failed' && (
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Failure reason</label>
                    <input value={failureReason} onChange={e => setFailureReason(e.target.value)} placeholder="e.g. Insufficient balance" />
                  </div>
                )}
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Notes</label>
                  <input value={statusNotes} onChange={e => setStatusNotes(e.target.value)} placeholder="Admin note" />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {(['pending', 'success', 'failed'] as PaymentStatus[]).map(s => (
                  <button key={s}
                    onClick={() => updateStatus.mutateAsync({ id, data: { status: s } })}
                    disabled={payment.status === s || updateStatus.isPending}
                    className={`w-full h-9 rounded-lg text-xs font-medium border transition-colors disabled:opacity-40 ${STATUS_CONFIG[s].cls}`}>
                    Mark as {STATUS_CONFIG[s].label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Refund */}
          {payment.status === 'success' && (
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Process refund</p>
              {!showRefund ? (
                <button onClick={() => setShowRefund(true)}
                  className="w-full h-10 rounded-lg text-sm font-medium border border-purple-500/30 text-purple-500 hover:bg-purple-500/10 flex items-center justify-center gap-2 transition-colors">
                  <RefreshCw className="w-4 h-4" /> Initiate refund
                </button>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">
                      Refund amount (max {formatCurrency(payment.amount)})
                    </label>
                    <input type="number" value={refundAmount} onChange={e => setRefundAmount(e.target.value)}
                      placeholder={String(payment.amount)} max={payment.amount} min={1} step={1} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Refund ID <span className="text-muted-foreground/60">(optional)</span></label>
                    <input value={refundId} onChange={e => setRefundId(e.target.value)} placeholder="Gateway refund reference" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Reason *</label>
                    <input value={refundReason} onChange={e => setRefundReason(e.target.value)} placeholder="e.g. Customer requested cancellation" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={saveRefund} disabled={!refundAmount || !refundReason || refund.isPending}
                      className="flex-1 h-9 rounded-lg text-sm bg-purple-500 text-white disabled:opacity-60 font-medium">
                      {refund.isPending ? 'Processing...' : 'Confirm refund'}
                    </button>
                    <button onClick={() => setShowRefund(false)}
                      className="flex-1 h-9 rounded-lg text-sm border border-border text-muted-foreground hover:text-foreground">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quick nav to order */}
          <button onClick={() => router.push(`/orders/${payment.orderId}`)}
            className="w-full h-10 rounded-xl text-sm font-medium border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            View order {payment.orderNumber} →
          </button>
        </div>
      </div>
    </div>
  )
}
