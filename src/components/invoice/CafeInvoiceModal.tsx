'use client'
import { useState, useEffect, useRef } from 'react'
import { X, Printer, Send, Loader2, Mail, Check, ExternalLink } from 'lucide-react'
import { api } from '@/lib/api'
import { generateCafeInvoiceHTML, getInvoiceNumber } from '@/lib/invoiceGenerator'
import { toast } from 'sonner'
import type { CafeOrder, Cafe } from '@/types'

interface CafeInvoiceModalProps {
  order: CafeOrder
  onClose: () => void
}

export function CafeInvoiceModal({ order, onClose }: CafeInvoiceModalProps) {
  const iframeRef    = useRef<HTMLIFrameElement>(null)
  const [sending,    setSending]    = useState(false)
  const [sent,       setSent]       = useState(false)
  const [showEmail,  setShowEmail]  = useState(false)
  const [loaded,     setLoaded]     = useState(false)

  const cafe = order.cafeId as Cafe
  const [emailTo,    setEmailTo]    = useState(cafe?.email || '')

  const invoiceNumber = getInvoiceNumber(order.orderNumber)
  const invoiceHTML = generateCafeInvoiceHTML(order)

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 400)
    return () => clearTimeout(t)
  }, [])

  const handlePrint = () => {
    const win = window.open('', '_blank')
    if (!win) { toast.error('Pop-up blocked'); return }
    win.document.write(invoiceHTML)
    win.document.close()
    win.focus()
    setTimeout(() => win.print(), 500)
  }

  const handleOpenNew = () => {
    const win = window.open('', '_blank')
    if (!win) { toast.error('Pop-up blocked'); return }
    win.document.write(invoiceHTML)
    win.document.close()
  }

  const handleSend = async () => {
    if (!emailTo.trim()) return
    setSending(true)
    try {
      await api.post(`/cafe/orders/${order._id}/send-invoice`, { email: emailTo.trim() })
      setSent(true)
      toast.success(`Invoice sent to ${emailTo}`)
      setTimeout(() => { setSent(false); setShowEmail(false) }, 3000)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-card border border-border rounded-2xl shadow-2xl flex flex-col w-[900px] max-w-[95vw] h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div>
            <p className="font-bold text-foreground">{invoiceNumber}</p>
            <p className="text-xs text-muted-foreground">{cafe?.name || 'Cafe Order'}</p>
          </div>

          <div className="flex items-center gap-2">
            {showEmail ? (
              <div className="flex items-center gap-2 animate-in slide-in-from-right-2">
                <input
                  value={emailTo}
                  onChange={e => setEmailTo(e.target.value)}
                  placeholder="email@example.com"
                  className="w-[200px] h-9 px-3 text-sm bg-card border border-border rounded-lg"
                  autoFocus
                />
                <button onClick={handleSend} disabled={sending || !emailTo.trim()}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-primary text-primary-foreground disabled:opacity-50"
                >
                  {sending ? <Loader2 className="w-3 h-3 animate-spin" /> : sent ? <Check className="w-3 h-3" /> : <Send className="w-3 h-3" />}
                  {sent ? 'Sent' : 'Send'}
                </button>
                <button onClick={() => setShowEmail(false)} className="p-2 hover:bg-accent rounded-lg">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button onClick={() => setShowEmail(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm border border-border hover:bg-accent transition-colors">
                <Mail className="w-4 h-4" /> Email
              </button>
            )}

            <button onClick={handleOpenNew} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm border border-border hover:bg-accent transition-colors">
              <ExternalLink className="w-4 h-4" /> Open
            </button>

            <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-primary text-primary-foreground hover:scale-[1.02] transition-all">
              <Printer className="w-4 h-4" /> Print / PDF
            </button>

            <button onClick={onClose} className="p-2 hover:bg-accent rounded-lg ml-2">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 relative bg-muted/20">
          {!loaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-card z-10">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}
          <iframe ref={iframeRef} srcDoc={invoiceHTML} className="w-full h-full border-0" title="Cafe Invoice" />
        </div>
      </div>
    </div>
  )
}
