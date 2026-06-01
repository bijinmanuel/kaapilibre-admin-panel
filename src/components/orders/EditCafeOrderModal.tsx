'use client'
import { useState, useEffect } from 'react'
import { X, Plus, Trash2, CreditCard, Wallet, Banknote } from 'lucide-react'
import { useUpdateCafeOrder } from '@/hooks/useCafeOrders'
import { useCafes } from '@/hooks/useCafes'
import { useCafeProducts } from '@/hooks/useCafeProducts'
import { formatCurrency } from '@/lib/utils'
import type { CafeOrder } from '@/types'

export function EditCafeOrderModal({ order, onClose }: { order: CafeOrder; onClose: () => void }) {
  const [items, setItems] = useState<{ name: string; qty: number; price: number }[]>(
    order.items.map(i => ({ name: i.name, qty: i.qty, price: i.price || (i.subtotal / i.qty) }))
  )
  const [paymentMethod, setPaymentMethod] = useState<any>(order.paymentMethod)
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid'>(order.paymentStatus)
  const [notes, setNotes] = useState(order.notes || '')
  const [cafeId, setCafeId] = useState(order._id || (typeof order.cafeId === 'string' ? order.cafeId : ''))
  const [status, setStatus] = useState(order.status)

  const { data: cafes } = useCafes()
  const { data: menuItems } = useCafeProducts()
  const { mutate: updateOrder, isPending } = useUpdateCafeOrder()

  const addItem = () => setItems([...items, { name: '', qty: 1, price: 0 }])
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx))

  const updateItem = (idx: number, field: string, val: any) => {
    const newItems = [...items]
    if (field === 'name') {
      const product = menuItems?.find(p => p.name === val)
      if (product) {
        newItems[idx] = { ...newItems[idx], name: val, price: product.price }
        setItems(newItems)
        return
      }
    }
    newItems[idx] = { ...newItems[idx], [field]: val }
    setItems(newItems)
  }

  const total = items.reduce((sum, item) => sum + (item.qty * item.price), 0)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const validItems = items.filter(i => i.name && i.price > 0)
    if (validItems.length === 0 || !cafeId) return

    updateOrder({
      id: order._id,
      cafeId,
      items: validItems.map(i => ({ ...i, subtotal: i.qty * i.price })),
      totalAmount: total,
      paymentMethod,
      paymentStatus,
      notes,
      status
    }, {
      onSuccess: onClose
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card border border-border w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h3 className="text-xl font-bold text-foreground">Edit Order</h3>
            <p className="text-xs text-muted-foreground font-mono mt-1">{order.orderNumber}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-accent rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Cafe</label>
              <select
                required
                value={cafeId}
                onChange={(e) => setCafeId(e.target.value)}
                className="w-full px-4 py-2.5 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Select Cafe...</option>
                {cafes?.map(cafe => (
                  <option key={cafe._id} value={cafe._id}>{cafe.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Order Status</label>
              <select
                required
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-4 py-2.5 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-muted-foreground">Items</label>
              <button type="button" onClick={addItem} className="text-xs font-bold text-primary flex items-center gap-1 hover:underline">
                <Plus className="w-3 h-3" /> Add Item
              </button>
            </div>

            <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2">
              {items.map((item, idx) => (
                <div key={idx} className="flex gap-3 items-end">
                  <div className="flex-1">
                    <input
                      placeholder="Item name"
                      list="edit-menu-options"
                      value={item.name}
                      onChange={(e) => updateItem(idx, 'name', e.target.value)}
                      required
                      className="text-sm w-full bg-card border border-border rounded-lg px-3 py-2"
                    />
                    <datalist id="edit-menu-options">
                      {menuItems?.map(p => (
                        <option key={p._id} value={p.name}>{p.category}</option>
                      ))}
                    </datalist>
                  </div>
                  <div className="w-16">
                    <input
                      type="number"
                      placeholder="Qty"
                      value={item.qty || ''}
                      onChange={(e) => updateItem(idx, 'qty', e.target.value === '' ? 0 : parseInt(e.target.value))}
                      required
                      min="1"
                      className="text-sm w-full bg-card border border-border rounded-lg px-2 py-2 text-center"
                    />
                  </div>
                  <div className="w-24">
                    <input
                      type="number"
                      placeholder="Price"
                      value={item.price || ''}
                      onChange={(e) => updateItem(idx, 'price', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                      required
                      min="0"
                      className="text-sm w-full bg-card border border-border rounded-lg px-2 py-2"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    disabled={items.length === 1}
                    className="p-2 text-muted-foreground hover:text-red-500 disabled:opacity-30"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Payment Method</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'cash', icon: Banknote, label: 'Cash' },
                  { id: 'upi', icon: Wallet, label: 'UPI' },
                  { id: 'card', icon: CreditCard, label: 'Card' },
                ].map((method) => (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setPaymentMethod(method.id)}
                    className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all ${paymentMethod === method.id
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/50'
                      }`}
                  >
                    <method.icon className="w-4 h-4" />
                    <span className="text-[9px] font-bold uppercase tracking-wider">{method.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Payment Status</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'pending', label: 'Pending' },
                  { id: 'paid', label: 'Paid' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setPaymentStatus(s.id as any)}
                    className={`flex items-center justify-center p-2 rounded-xl border text-[9px] font-bold uppercase tracking-wider transition-all h-[52px] ${paymentStatus === s.id
                      ? s.id === 'paid' ? 'border-green-500 bg-green-500/10 text-green-500' : 'border-orange-500 bg-orange-500/10 text-orange-500'
                      : 'border-border hover:border-primary/50'
                      }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special instructions..."
              className="w-full bg-card border border-border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 h-20 resize-none"
            />
          </div>

          <div className="pt-4 border-t border-border flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Total Amount</span>
              <span className="text-xl font-bold text-foreground">{formatCurrency(total)}</span>
            </div>
            <button
              type="submit"
              disabled={isPending || total === 0}
              className="px-8 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
              style={{ background: '#d4a853', color: '#1a1713' }}
            >
              {isPending ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
