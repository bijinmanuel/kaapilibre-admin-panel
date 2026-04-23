'use client'
import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Send, User, Shield } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { useComplaint, useAdminReply, useUpdateComplaintStatus } from '@/hooks/useComplaints'
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
  product_quality: 'Product quality', wrong_item: 'Wrong item',
  delivery: 'Delivery', payment: 'Payment', packaging: 'Packaging', other: 'Other',
}

export default function ComplaintDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { data: complaint, isLoading } = useComplaint(id)
  const reply        = useAdminReply()
  const updateStatus = useUpdateComplaintStatus()

  const [replyText,     setReplyText]     = useState('')
  const [replyStatus,   setReplyStatus]   = useState('')
  const [newPriority,   setNewPriority]   = useState('')

  const handleReply = async () => {
    if (!replyText.trim()) return
    await reply.mutateAsync({ id, message: replyText, updateStatus: replyStatus || undefined })
    setReplyText(''); setReplyStatus('')
  }

  const handleStatusUpdate = async () => {
    if (!newPriority) return
    await updateStatus.mutateAsync({ id, priority: newPriority })
    setNewPriority('')
  }

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
  if (!complaint) return <div className="text-muted-foreground">Complaint not found</div>

  return (
    <div>
      <PageHeader
        title={complaint.ticketNumber}
        action={
          <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left: thread ─────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Subject */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-foreground">{complaint.subject}</p>
                <p className="text-xs text-muted-foreground mt-1">{CATEGORY_LABELS[complaint.category as ComplaintCategory]}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${PRIORITY_COLORS[complaint.priority as ComplaintPriority]}`}>
                  {complaint.priority}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${STATUS_COLORS[complaint.status as ComplaintStatus]}`}>
                  {complaint.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>

          {/* Message thread */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <p className="text-sm font-medium text-foreground">Thread ({complaint.messages.length} messages)</p>
            </div>
            <div className="p-5 space-y-4 max-h-[500px] overflow-y-auto">
              {complaint.messages.map((msg, i) => {
                const isAdmin = msg.sender === 'admin'
                return (
                  <div key={msg._id ?? i} className={cn('flex gap-3', isAdmin && 'flex-row-reverse')}>
                    {/* Avatar */}
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                      isAdmin
                        ? 'bg-primary/10'
                        : 'bg-muted'
                    )}>
                      {isAdmin
                        ? <Shield className="w-4 h-4" style={{ color: '#d4a853' }} />
                        : <User className="w-4 h-4 text-muted-foreground" />}
                    </div>
                    {/* Bubble */}
                    <div className={cn('max-w-[75%] space-y-1', isAdmin && 'items-end flex flex-col')}>
                      <div className={cn(
                        'rounded-xl px-4 py-3 text-sm leading-relaxed',
                        isAdmin
                          ? 'rounded-tr-sm'
                          : 'rounded-tl-sm bg-muted text-foreground',
                      )}
                        style={isAdmin ? { background: 'rgba(212,168,83,0.1)', border: '1px solid rgba(212,168,83,0.2)' } : {}}>
                        <p>{msg.message}</p>
                      </div>
                      <p className="text-[10px] text-muted-foreground px-1">
                        {msg.senderName} · {formatDateTime(msg.sentAt)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Reply box */}
          {!['resolved', 'closed'].includes(complaint.status) && (
            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Reply</p>
              <textarea
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                rows={4}
                placeholder="Type your reply here..."
                style={{ resize: 'vertical' }}
              />
              <div className="flex items-center gap-3">
                <select value={replyStatus} onChange={e => setReplyStatus(e.target.value)} style={{ width: 'auto', flex: 1 }}>
                  <option value="">Keep current status</option>
                  <option value="in_progress">Mark as in progress</option>
                  <option value="resolved">Mark as resolved</option>
                  <option value="closed">Close ticket</option>
                </select>
                <button
                  onClick={handleReply}
                  disabled={!replyText.trim() || reply.isPending}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 flex-shrink-0"
                  style={{ background: '#d4a853', color: '#1a1713' }}>
                  {reply.isPending
                    ? <><Loader2 className="w-4 h-4 animate-spin" />Sending...</>
                    : <><Send className="w-4 h-4" />Send reply</>}
                </button>
              </div>
            </div>
          )}

          {['resolved', 'closed'].includes(complaint.status) && (
            <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4 text-sm text-green-600 dark:text-green-400">
              This complaint was {complaint.status} on {formatDateTime(complaint.resolvedAt ?? complaint.updatedAt)}
              {complaint.resolvedBy && ` by ${complaint.resolvedBy}`}.
            </div>
          )}
        </div>

        {/* ── Right: details panel ──────────────────────────────────────── */}
        <div className="space-y-5">

          {/* Complaint info */}
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Details</p>
            <div className="space-y-3 text-sm">
              {[
                ['Ticket',   complaint.ticketNumber],
                ['Customer', complaint.customer.name],
                ['Email',    complaint.customer.email],
                ['Order',    complaint.orderNumber ?? '—'],
                ['Opened',   formatDateTime(complaint.createdAt)],
                ['Updated',  formatDateTime(complaint.updatedAt)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-2">
                  <span className="text-muted-foreground flex-shrink-0">{k}</span>
                  <span className="text-foreground text-right break-all text-xs font-medium">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Change priority */}
          {!['resolved', 'closed'].includes(complaint.status) && (
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Change priority</p>
              <div className="flex gap-2">
                <select value={newPriority} onChange={e => setNewPriority(e.target.value)} style={{ flex: 1 }}>
                  <option value="">Select priority</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
                <button
                  onClick={handleStatusUpdate}
                  disabled={!newPriority || updateStatus.isPending}
                  className="px-3 py-2 rounded-lg text-xs font-medium border border-border hover:bg-accent transition-colors disabled:opacity-50">
                  Set
                </button>
              </div>
            </div>
          )}

          {/* Quick status buttons */}
          {!['resolved', 'closed'].includes(complaint.status) && (
            <div className="rounded-xl border border-border bg-card p-5 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Quick actions</p>
              <button
                onClick={() => updateStatus.mutateAsync({ id, status: 'in_progress' })}
                disabled={complaint.status === 'in_progress' || updateStatus.isPending}
                className="w-full h-9 rounded-lg text-xs font-medium border border-blue-500/30 text-blue-500 hover:bg-blue-500/10 transition-colors disabled:opacity-40">
                Mark in progress
              </button>
              <button
                onClick={() => updateStatus.mutateAsync({ id, status: 'resolved' })}
                disabled={updateStatus.isPending}
                className="w-full h-9 rounded-lg text-xs font-medium border border-green-500/30 text-green-500 hover:bg-green-500/10 transition-colors">
                Mark resolved
              </button>
              <button
                onClick={() => updateStatus.mutateAsync({ id, status: 'closed' })}
                disabled={updateStatus.isPending}
                className="w-full h-9 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:bg-accent transition-colors">
                Close ticket
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
