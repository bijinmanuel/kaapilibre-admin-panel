'use client'
import { useState, useEffect, useRef } from 'react'
import { X, Printer, Send, Loader2, Mail, Check, ExternalLink } from 'lucide-react'
import { api } from '@/lib/api'
import { generateConsolidatedCafeInvoiceHTML } from '@/lib/invoiceGenerator'
import { toast } from 'sonner'
import type { Cafe, CafeOrder } from '@/types'
import { format } from 'date-fns'

interface ConsolidatedCafeInvoiceModalProps {
  cafe: Cafe
  orders: CafeOrder[]
  billingPeriod: string
  onClose: () => void
}

export function ConsolidatedCafeInvoiceModal({ cafe, orders, billingPeriod, onClose }: ConsolidatedCafeInvoiceModalProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [showEmail, setShowEmail] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [emailTo, setEmailTo] = useState(cafe?.email || '')
  
  const formattedPeriod = billingPeriod || 'Selected Orders'
  const defaultInvoiceNumber = `INV-CON-${cafe?.name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toUpperCase()}-${format(new Date(), 'yyMMdd')}`
  const [invoiceNumber, setInvoiceNumber] = useState(defaultInvoiceNumber)
  const [confirmedInvoiceNumber, setConfirmedInvoiceNumber] = useState(defaultInvoiceNumber)
  
  const invoiceHTML = generateConsolidatedCafeInvoiceHTML(cafe, orders, formattedPeriod, confirmedInvoiceNumber)

  useEffect(() => {
    const initInvoiceNumber = async () => {
      let finalNum = defaultInvoiceNumber
      try {
        const res = await api.get(`/cafe/${cafe._id}/next-consolidated-invoice-number`) as any
        if (res.data?.invoiceNumber) {
          finalNum = res.data.invoiceNumber
          setInvoiceNumber(finalNum)
          setConfirmedInvoiceNumber(finalNum)
        }
      } catch (err) {
        console.error('Failed to fetch next consolidated invoice number:', err)
      }

      try {
        await api.post('/cafe/orders/assign-invoice', {
          orderIds: orders.map(o => o._id),
          invoiceNumber: finalNum
        })
      } catch (err) {
        console.error('Failed to save invoice number to database:', err)
      }
      setLoaded(true)
    }

    initInvoiceNumber()
  }, [cafe._id, orders, defaultInvoiceNumber])

  const handleInvoiceNumberBlur = async () => {
    const trimmed = invoiceNumber.trim()
    if (!trimmed) {
      setInvoiceNumber(confirmedInvoiceNumber)
      return
    }
    if (trimmed === confirmedInvoiceNumber) return
    
    setConfirmedInvoiceNumber(trimmed)
    try {
      await api.post('/cafe/orders/assign-invoice', {
        orderIds: orders.map(o => o._id),
        invoiceNumber: trimmed
      })
      toast.success(`Invoice number updated to ${trimmed}`)
    } catch (err) {
      console.error('Failed to update invoice number in database:', err)
      toast.error('Failed to save updated invoice number')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur()
    }
  }

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
      await api.post(`/cafe/orders/send-consolidated-invoice`, {
        email: emailTo.trim(),
        subject: `Consolidated Invoice ${confirmedInvoiceNumber} for ${cafe.name} (${formattedPeriod}) - KaapiLibre`,
        html: invoiceHTML
      })
      setSent(true)
      toast.success(`Consolidated invoice sent to ${emailTo}`)
      setTimeout(() => { setSent(false); setShowEmail(false) }, 3000)
    } catch (e: any) {
      toast.error(e.message || 'Failed to send invoice email')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-card border border-border rounded-2xl shadow-2xl flex flex-col w-[900px] max-w-[95vw] h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Invoice No:</span>
              <input
                value={invoiceNumber}
                onChange={e => setInvoiceNumber(e.target.value)}
                onBlur={handleInvoiceNumberBlur}
                onKeyDown={handleKeyDown}
                className="font-mono font-bold text-foreground bg-transparent border-b border-border/30 focus:border-primary focus:outline-none py-0.5 w-[220px]"
                title="Click to edit invoice number"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">{cafe?.name || 'Consolidated Invoice'} ({orders.length} orders)</p>
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
                  {sent ? 'Sent' : 'Send Email'}
                </button>
                <button onClick={() => setShowEmail(false)} className="p-2 hover:bg-accent rounded-lg">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button onClick={() => setShowEmail(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm border border-border hover:bg-accent transition-colors">
                <Mail className="w-4 h-4" /> Email Invoice
              </button>
            )}

            <button onClick={handleOpenNew} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm border border-border hover:bg-accent transition-colors">
              <ExternalLink className="w-4 h-4" /> Open
            </button>

            <button onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium"
              style={{ background: '#d4a853', color: '#1a1713' }}>
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
          <iframe ref={iframeRef} srcDoc={invoiceHTML} className="w-full h-full border-0" title="Consolidated Cafe Invoice" />
        </div>
      </div>
    </div>
  )
}
