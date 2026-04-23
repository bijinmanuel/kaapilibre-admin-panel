'use client'
import { useState } from 'react'
import {
  X, Plus, Trash2, ShoppingBag, User, CreditCard,
  MapPin, Loader2, ChevronDown, Package,
} from 'lucide-react'
import { useCreateOrder } from '@/hooks/useOrders'
import { useProducts } from '@/hooks/useProducts'
import type { WeightVariant, GrindType, PaymentMethod } from '@/types'

interface CreateOrderModalProps {
  onClose: () => void
}

const WEIGHTS: WeightVariant[] = ['100g', '250g', '500g']
const GRINDS: GrindType[] = ['Whole Bean', 'Coarse', 'Medium', 'Fine']
const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'cash',     label: 'Cash on Delivery' },
  { value: 'upi',      label: 'UPI' },
  { value: 'card',     label: 'Card' },
  { value: 'netbanking', label: 'Net Banking' },
  { value: 'website',  label: 'Website' },
  { value: 'email',    label: 'Email' },
]

interface LineItem {
  id: string
  product: string
  weight: WeightVariant
  grind: GrindType
  qty: number
}

const uid = () => Math.random().toString(36).slice(2, 9)

const emptyItem = (): LineItem => ({
  id: uid(), product: '', weight: '250g', grind: 'Whole Bean', qty: 1,
})

export function CreateOrderModal({ onClose }: CreateOrderModalProps) {
  const { data: productsData } = useProducts({ limit: 100 })
  const products = productsData?.data?.filter(p => p.isActive) ?? []

  const createOrder = useCreateOrder()

  // ── Form state ──────────────────────────────────────────────────────────────
  const [name,            setName]            = useState('')
  const [email,           setEmail]           = useState('')
  const [phone,           setPhone]           = useState('')
  const [shippingAddress, setShippingAddress] = useState('')
  const [notes,           setNotes]           = useState('')
  const [paymentMethod,   setPaymentMethod]   = useState<PaymentMethod>('whatsapp')
  const [transactionId,   setTransactionId]   = useState('')
  const [paymentNotes,    setPaymentNotes]    = useState('')
  const [items,           setItems]           = useState<LineItem[]>([emptyItem()])
  const [activeSection,   setActiveSection]   = useState<string>('customer')

  // ── Item helpers ─────────────────────────────────────────────────────────────
  const updateItem = (id: string, patch: Partial<LineItem>) =>
    setItems(prev => prev.map(it => it.id === id ? { ...it, ...patch } : it))

  const removeItem = (id: string) =>
    setItems(prev => prev.length > 1 ? prev.filter(it => it.id !== id) : prev)

  const addItem = () => setItems(prev => [...prev, emptyItem()])

  // ── Derived total ─────────────────────────────────────────────────────────
  const calcTotal = () => {
    return items.reduce((sum, it) => {
      const p = products.find(pr => pr._id === it.product)
      if (!p) return sum
      return sum + (p.prices[it.weight] ?? 0) * it.qty
    }, 0)
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (items.some(it => !it.product)) {
      return
    }
    await createOrder.mutateAsync({
      customer: { name: name.trim(), email: email.trim(), phone: phone.trim() },
      items: items.map(it => ({
        product: it.product,
        weight:  it.weight,
        grind:   it.grind,
        qty:     it.qty,
      })),
      payment: {
        method:        paymentMethod,
        transactionId: transactionId.trim() || undefined,
        notes:         paymentNotes.trim()  || undefined,
      },
      shippingAddress: shippingAddress.trim(),
      notes:           notes.trim() || undefined,
    })
    onClose()
  }

  const sections = [
    { id: 'customer', icon: User,        label: 'Customer'  },
    { id: 'items',    icon: ShoppingBag, label: 'Items'     },
    { id: 'payment',  icon: CreditCard,  label: 'Payment'   },
    { id: 'shipping', icon: MapPin,      label: 'Shipping'  },
  ]

  const total = calcTotal()

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.78)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>

      <div
        className="bg-card border border-border rounded-2xl shadow-2xl flex flex-col"
        style={{ width: '720px', maxWidth: '95vw', maxHeight: '92vh' }}>

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(212,168,83,0.15)' }}>
              <Package className="w-4 h-4" style={{ color: '#d4a853' }} />
            </div>
            <div>
              <h2 className="font-semibold text-foreground text-sm">Create Manual Order</h2>
              <p className="text-xs text-muted-foreground">Customer contacted directly — create order on their behalf</p>
            </div>
          </div>
          <button onClick={onClose}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Section tabs ─────────────────────────────────────────────────── */}
        <div className="flex border-b border-border px-5 gap-1 flex-shrink-0">
          {sections.map(s => {
            const Icon = s.icon
            const active = activeSection === s.id
            return (
              <button key={s.id} onClick={() => setActiveSection(s.id)}
                className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors relative"
                style={{ color: active ? '#d4a853' : '' }}>
                <Icon className="w-3.5 h-3.5" />
                {s.label}
                {active && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t"
                    style={{ background: '#d4a853' }} />
                )}
              </button>
            )
          })}
        </div>

        {/* ── Form body ────────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-5 py-5">

            {/* ── Customer Section ─────────────────────────────────────────── */}
            {activeSection === 'customer' && (
              <div className="space-y-4">
                <SectionTitle>Customer Details</SectionTitle>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 sm:col-span-1">
                    <Label>Full Name *</Label>
                    <input value={name} onChange={e => setName(e.target.value)}
                      placeholder="e.g. Priya Menon" required />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <Label>Phone *</Label>
                    <input value={phone} onChange={e => setPhone(e.target.value)}
                      placeholder="+91 98765 43210" required />
                  </div>
                  <div className="col-span-2">
                    <Label>Email *</Label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="customer@example.com" required />
                  </div>
                </div>
                <NavButtons next="items" setSection={setActiveSection} />
              </div>
            )}

            {/* ── Items Section ─────────────────────────────────────────────── */}
            {activeSection === 'items' && (
              <div className="space-y-4">
                <SectionTitle>Order Items</SectionTitle>
                <div className="space-y-3">
                  {items.map((item, idx) => {
                    const selectedProduct = products.find(p => p._id === item.product)
                    return (
                      <div key={item.id}
                        className="rounded-xl border border-border p-4 space-y-3"
                        style={{ background: 'rgba(255,255,255,0.02)' }}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-muted-foreground">Item {idx + 1}</span>
                          {items.length > 1 && (
                            <button type="button" onClick={() => removeItem(item.id)}
                              className="p-1 rounded text-muted-foreground hover:text-red-400 transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Product select */}
                        <div>
                          <Label>Product *</Label>
                          <div className="relative">
                            <select
                              value={item.product}
                              onChange={e => updateItem(item.id, { product: e.target.value })}
                              required
                              style={{ paddingRight: '2rem' }}>
                              <option value="">— Select product —</option>
                              {products.map(p => (
                                <option key={p._id} value={p._id}>{p.name}</option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          {/* Weight */}
                          <div>
                            <Label>Weight</Label>
                            <select value={item.weight}
                              onChange={e => updateItem(item.id, { weight: e.target.value as WeightVariant })}>
                              {WEIGHTS.map(w => (
                                <option key={w} value={w}>
                                  {w}{selectedProduct ? ` — ₹${selectedProduct.prices[w] ?? '—'}` : ''}
                                </option>
                              ))}
                            </select>
                          </div>
                          {/* Grind */}
                          <div>
                            <Label>Grind</Label>
                            <select value={item.grind}
                              onChange={e => updateItem(item.id, { grind: e.target.value as GrindType })}>
                              {GRINDS.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                          </div>
                          {/* Qty */}
                          <div>
                            <Label>Qty</Label>
                            <input type="number" min={1} max={99}
                              value={item.qty}
                              onChange={e => updateItem(item.id, { qty: Math.max(1, Number(e.target.value)) })}
                              style={{ textAlign: 'center' }} />
                          </div>
                        </div>

                        {/* Subtotal */}
                        {selectedProduct && (
                          <p className="text-xs text-right" style={{ color: '#d4a853' }}>
                            Subtotal: ₹{((selectedProduct.prices[item.weight] ?? 0) * item.qty).toLocaleString('en-IN')}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>

                <button type="button" onClick={addItem}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-border text-xs text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Add another item
                </button>

                {total > 0 && (
                  <div className="flex justify-end">
                    <div className="rounded-lg px-4 py-2.5 border border-border text-sm">
                      <span className="text-muted-foreground">Order Total: </span>
                      <span className="font-semibold" style={{ color: '#d4a853' }}>
                        ₹{total.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                )}

                <NavButtons prev="customer" next="payment" setSection={setActiveSection} />
              </div>
            )}

            {/* ── Payment Section ───────────────────────────────────────────── */}
            {activeSection === 'payment' && (
              <div className="space-y-4">
                <SectionTitle>Payment Details</SectionTitle>
                <div>
                  <Label>Payment Method *</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
                    {PAYMENT_METHODS.map(m => (
                      <button key={m.value} type="button"
                        onClick={() => setPaymentMethod(m.value)}
                        className="px-3 py-2.5 rounded-lg border text-xs font-medium transition-all"
                        style={{
                          borderColor:      paymentMethod === m.value ? '#d4a853' : '',
                          background:       paymentMethod === m.value ? 'rgba(212,168,83,0.12)' : '',
                          color:            paymentMethod === m.value ? '#d4a853' : '',
                        }}>
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Transaction ID <span className="text-muted-foreground">(optional)</span></Label>
                  <input value={transactionId} onChange={e => setTransactionId(e.target.value)}
                    placeholder="UPI Ref / Transaction ID" />
                </div>
                <div>
                  <Label>Payment Notes <span className="text-muted-foreground">(optional)</span></Label>
                  <textarea value={paymentNotes} onChange={e => setPaymentNotes(e.target.value)}
                    placeholder="e.g. Paid via GPay, screenshot received"
                    rows={2}
                    style={{ resize: 'vertical', width: '100%', padding: '0.5rem 0.75rem',
                      background: 'transparent', border: '1px solid var(--border)', borderRadius: '0.5rem',
                      fontSize: '0.875rem', color: 'var(--foreground)', outline: 'none' }} />
                </div>
                <NavButtons prev="items" next="shipping" setSection={setActiveSection} />
              </div>
            )}

            {/* ── Shipping Section ──────────────────────────────────────────── */}
            {activeSection === 'shipping' && (
              <div className="space-y-4">
                <SectionTitle>Shipping & Notes</SectionTitle>
                <div>
                  <Label>Shipping Address *</Label>
                  <textarea value={shippingAddress} onChange={e => setShippingAddress(e.target.value)}
                    placeholder="Full delivery address including city, state, PIN"
                    rows={4} required
                    style={{ resize: 'vertical', width: '100%', padding: '0.5rem 0.75rem',
                      background: 'transparent', border: '1px solid var(--border)', borderRadius: '0.5rem',
                      fontSize: '0.875rem', color: 'var(--foreground)', outline: 'none' }} />
                </div>
                <div>
                  <Label>Order Notes <span className="text-muted-foreground">(optional)</span></Label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)}
                    placeholder="e.g. Customer prefers morning delivery, fragile packaging needed"
                    rows={3}
                    style={{ resize: 'vertical', width: '100%', padding: '0.5rem 0.75rem',
                      background: 'transparent', border: '1px solid var(--border)', borderRadius: '0.5rem',
                      fontSize: '0.875rem', color: 'var(--foreground)', outline: 'none' }} />
                </div>

                {/* Order Summary */}
                {total > 0 && (
                  <div className="rounded-xl border border-border p-4 space-y-2"
                    style={{ background: 'rgba(212,168,83,0.04)' }}>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Order Summary</p>
                    {items.filter(it => it.product).map(it => {
                      const p = products.find(pr => pr._id === it.product)
                      if (!p) return null
                      return (
                        <div key={it.id} className="flex justify-between text-xs">
                          <span className="text-muted-foreground">{p.name} · {it.weight} · {it.grind} × {it.qty}</span>
                          <span>₹{((p.prices[it.weight] ?? 0) * it.qty).toLocaleString('en-IN')}</span>
                        </div>
                      )
                    })}
                    <div className="border-t border-border pt-2 flex justify-between text-sm font-semibold">
                      <span>Total</span>
                      <span style={{ color: '#d4a853' }}>₹{total.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                )}

                <div className="flex justify-between gap-3 pt-1">
                  <button type="button" onClick={() => setActiveSection('payment')}
                    className="px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                    ← Back
                  </button>
                  <button type="submit"
                    disabled={createOrder.isPending || !name || !email || !phone || !shippingAddress || items.some(it => !it.product)}
                    className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 transition-opacity"
                    style={{ background: '#d4a853', color: '#1a1713' }}>
                    {createOrder.isPending
                      ? <><Loader2 className="w-4 h-4 animate-spin" />Creating…</>
                      : <><Package className="w-4 h-4" />Create Order</>}
                  </button>
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Small helpers ─────────────────────────────────────────────────────────────
function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-medium text-muted-foreground mb-1">{children}</label>
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-1">
      <h3 className="text-sm font-semibold text-foreground">{children}</h3>
      <div className="flex-1 h-px bg-border" />
    </div>
  )
}

function NavButtons({
  prev, next, setSection,
}: {
  prev?: string; next?: string; setSection: (s: string) => void
}) {
  return (
    <div className="flex justify-between gap-3 pt-2">
      {prev ? (
        <button type="button" onClick={() => setSection(prev)}
          className="px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
          ← Back
        </button>
      ) : <span />}
      {next && (
        <button type="button" onClick={() => setSection(next)}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{ background: '#d4a853', color: '#1a1713' }}>
          Next →
        </button>
      )}
    </div>
  )
}
