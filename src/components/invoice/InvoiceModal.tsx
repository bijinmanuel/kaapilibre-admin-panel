'use client'
import { useState, useEffect, useRef } from 'react'
import { X, Printer, Send, Loader2, Mail, Check, ExternalLink } from 'lucide-react'
import { api } from '@/lib/api'
import { generateInvoiceHTML, getInvoiceNumber } from '@/lib/invoiceGenerator'
import { toast } from 'sonner'
import type { Order } from '@/types'

interface InvoiceModalProps {
  order: Order
  onClose: () => void
}

export function InvoiceModal({ order, onClose }: InvoiceModalProps) {
  const iframeRef    = useRef<HTMLIFrameElement>(null)
  const [sending,    setSending]    = useState(false)
  const [sent,       setSent]       = useState(false)
  const [emailTo,    setEmailTo]    = useState(order.customer.email)
  const [showEmail,  setShowEmail]  = useState(false)
  const [loaded,     setLoaded]     = useState(false)

  const invoiceNumber = getInvoiceNumber(order.orderNumber)

  // Inject the invoice HTML directly into the iframe srcdoc — no backend call needed
  const invoiceHTML = generateInvoiceHTML(order)

  useEffect(() => {
    // Pre-mark as loaded after a short delay since srcdoc loads synchronously
    const t = setTimeout(() => setLoaded(true), 400)
    return () => clearTimeout(t)
  }, [])

  const handlePrint = () => {
    // Open in new window for reliable print dialog
    const win = window.open('', '_blank')
    if (!win) { toast.error('Pop-up blocked — please allow pop-ups for this site'); return }
    win.document.write(invoiceHTML)
    win.document.close()
    win.focus()
    setTimeout(() => win.print(), 500)
  }

  const handleOpenNew = () => {
    const win = window.open('', '_blank')
    if (!win) { toast.error('Pop-up blocked — please allow pop-ups'); return }
    win.document.write(invoiceHTML)
    win.document.close()
  }

  const handleSend = async () => {
    if (!emailTo.trim()) return
    setSending(true)
    try {
      await api.post(`/invoices/${order._id}/send`, { email: emailTo.trim() })
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.78)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>

      <div
        className="bg-card border border-border rounded-2xl shadow-2xl flex flex-col"
        style={{ width: '900px', maxWidth: '95vw', height: '90vh' }}>

        {/* ── Toolbar ─────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border flex-shrink-0 gap-3 flex-wrap">
          <div className="flex-shrink-0">
            <p className="font-semibold text-foreground text-sm">{invoiceNumber}</p>
            <p className="text-xs text-muted-foreground">{order.orderNumber} · {order.customer.name}</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* Email area */}
            {showEmail ? (
              <div className="flex items-center gap-2">
                <input
                  value={emailTo}
                  onChange={e => setEmailTo(e.target.value)}
                  placeholder="email@example.com"
                  style={{ width: '210px', margin: 0 }}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  autoFocus
                />
                <button onClick={handleSend} disabled={sending || !emailTo.trim()}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium disabled:opacity-50 flex-shrink-0"
                  style={{ background: '#d4a853', color: '#1a1713' }}>
                  {sending ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Sending</>
                   : sent   ? <><Check className="w-3.5 h-3.5" />Sent!</>
                   :          <><Send className="w-3.5 h-3.5" />Send</>}
                </button>
                <button onClick={() => setShowEmail(false)}
                  className="p-2 rounded-lg text-muted-foreground hover:bg-accent transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button onClick={() => setShowEmail(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                <Mail className="w-4 h-4" /> Email
              </button>
            )}

            {/* Open in new tab */}
            <button onClick={handleOpenNew}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
              <ExternalLink className="w-4 h-4" /> Open
            </button>

            {/* Print */}
            <button onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium"
              style={{ background: '#d4a853', color: '#1a1713' }}>
              <Printer className="w-4 h-4" /> Print / PDF
            </button>

            <button onClick={onClose}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Preview iframe using srcdoc ─────────────────── */}
        <div className="flex-1 relative overflow-hidden bg-muted/20">
          {!loaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-card z-10">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-7 h-7 animate-spin" style={{ color: '#d4a853' }} />
                <p className="text-xs text-muted-foreground">Generating invoice...</p>
              </div>
            </div>
          )}
          <iframe
            ref={iframeRef}
            srcDoc={invoiceHTML}
            className="w-full h-full border-0"
            title={`Invoice ${invoiceNumber}`}
            sandbox="allow-same-origin allow-scripts allow-popups"
          />
        </div>
      </div>
    </div>
  )
}
