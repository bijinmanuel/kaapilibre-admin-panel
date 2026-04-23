'use client'
import { useState } from 'react'
import { Mail, MailOpen, X, Trash2, Package } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { useMessages, useMarkAsRead, useDeleteMessage } from '@/hooks/useData'
import { useIsAdmin } from '@/store/authStore'
import { formatDateTime, truncate, cn } from '@/lib/utils'
import type { ContactMessage } from '@/types'

type Filter = 'all' | 'unread' | 'read'

export default function ContactPage() {
  const isAdmin = useIsAdmin()
  const [filter, setFilter] = useState<Filter>('all')
  const [selected, setSelected] = useState<ContactMessage | null>(null)
  const [page, setPage] = useState(1)

  const filters = filter === 'all' ? {} : { isRead: filter === 'read' }
  const { data, isLoading } = useMessages({ ...filters, page, limit: 25 })
  const markRead = useMarkAsRead()
  const deleteMsg = useDeleteMessage()

  const messages = data?.data || []
  const unreadCount = messages.filter(m => !m.isRead).length

  const openMessage = (msg: ContactMessage) => {
    setSelected(msg)
    if (!msg.isRead) markRead.mutate(msg._id)
  }

  const handleDelete = async (id: string) => {
    await deleteMsg.mutateAsync(id)
    setSelected(null)
  }

  return (
    <div>
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            Contact
            {unreadCount > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: 'rgba(212,168,83,0.2)', color: '#d4a853' }}>
                {unreadCount} unread
              </span>
            )}
          </span> as unknown as string
        }
      />

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 rounded-lg bg-muted w-fit mb-5">
        {(['all', 'unread', 'read'] as Filter[]).map(f => (
          <button key={f} onClick={() => { setFilter(f); setPage(1) }}
            className="px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-all"
            style={filter === f ? { background: '#d4a853', color: '#1a1713' } : { color: 'var(--muted-foreground)' }}>
            {f}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              {['', 'Sender', 'Product', 'Message', 'Date'].map(h =>
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              [...Array(8)].map((_, i) => (
                <tr key={i} className="border-b border-border">
                  {[...Array(5)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 rounded bg-muted animate-pulse" /></td>)}
                </tr>
              ))
            ) : messages.map(msg => (
              <tr key={msg._id}
                onClick={() => openMessage(msg)}
                className={cn(
                  'border-b border-border last:border-0 cursor-pointer transition-colors',
                  msg.isRead ? 'hover:bg-accent/40' : 'bg-primary/3 hover:bg-primary/5',
                )}>
                <td className="px-4 py-3 w-8">
                  {msg.isRead
                    ? <MailOpen className="w-3.5 h-3.5 text-muted-foreground" />
                    : <Mail className="w-3.5 h-3.5" style={{ color: '#d4a853' }} />}
                </td>
                <td className="px-4 py-3">
                  <p className={cn('text-foreground', !msg.isRead && 'font-semibold')}>{msg.name}</p>
                  <p className="text-xs text-muted-foreground">{msg.email}</p>
                </td>
                <td className="px-4 py-3">
                  {msg.selectedProduct
                    ? <span className="text-xs px-2 py-0.5 rounded-full border border-border bg-secondary text-secondary-foreground flex items-center gap-1 w-fit">
                        <Package className="w-2.5 h-2.5" />{msg.selectedProduct}
                      </span>
                    : <span className="text-muted-foreground text-xs">—</span>}
                </td>
                <td className="px-4 py-3 text-muted-foreground max-w-xs">
                  <span className={cn(!msg.isRead && 'text-foreground')}>{truncate(msg.message, 80)}</span>
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                  {formatDateTime(msg.createdAt)}
                </td>
              </tr>
            ))}
            {!isLoading && !messages.length && (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">No messages found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Slide-over detail */}
      {selected && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setSelected(null)} />

          {/* Panel */}
          <div className="fixed right-0 top-0 h-full w-full max-w-md bg-card border-l border-border z-50 flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <div className="flex items-center gap-2">
                {selected.isRead
                  ? <MailOpen className="w-4 h-4 text-muted-foreground" />
                  : <Mail className="w-4 h-4" style={{ color: '#d4a853' }} />}
                <span className="font-medium text-foreground">{selected.name}</span>
              </div>
              <button onClick={() => setSelected(null)}
                className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Sender info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                {[
                  ['Name', selected.name],
                  ['Email', selected.email],
                  ['Phone', selected.phone],
                  ['Date', formatDateTime(selected.createdAt)],
                ].map(([k, v]) => (
                  <div key={k}>
                    <p className="text-xs text-muted-foreground mb-1">{k}</p>
                    <p className="text-foreground font-medium break-all">{v}</p>
                  </div>
                ))}
              </div>

              {selected.selectedProduct && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Interested in</p>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-secondary text-sm">
                    <Package className="w-3.5 h-3.5 text-muted-foreground" />
                    {selected.selectedProduct}
                  </span>
                </div>
              )}

              <div>
                <p className="text-xs text-muted-foreground mb-2">Message</p>
                <div className="rounded-xl border border-border bg-background p-4">
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{selected.message}</p>
                </div>
              </div>
            </div>

            {/* Footer actions */}
            {isAdmin && (
              <div className="p-6 border-t border-border">
                <button
                  onClick={() => handleDelete(selected._id)}
                  disabled={deleteMsg.isPending}
                  className="w-full h-10 rounded-lg text-sm font-medium border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                  <Trash2 className="w-4 h-4" />
                  {deleteMsg.isPending ? 'Deleting...' : 'Delete message'}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
