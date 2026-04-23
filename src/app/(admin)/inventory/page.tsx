'use client'
import { useState } from 'react'
import { AlertTriangle, Check, X, Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { useInventory, useStockAlerts, useUpdateStock } from '@/hooks/useData'
import { cn } from '@/lib/utils'

type Weight = '100g' | '250g' | '500g'

interface EditCell {
  productId: string
  weight: Weight
  value: string
  operation: 'set' | 'add' | 'subtract'
}

export default function InventoryPage() {
  const { data: products, isLoading } = useInventory()
  const { data: alerts } = useStockAlerts()
  const updateStock = useUpdateStock()
  const [editing, setEditing] = useState<EditCell | null>(null)

  const startEdit = (productId: string, weight: Weight, currentQty: number) => {
    setEditing({ productId, weight, value: String(currentQty), operation: 'set' })
  }

  const saveEdit = async () => {
    if (!editing) return
    const qty = parseInt(editing.value)
    if (isNaN(qty) || qty < 0) return
    await updateStock.mutateAsync({
      productId: editing.productId,
      weight: editing.weight,
      quantity: qty,
      operation: editing.operation,
    })
    setEditing(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') saveEdit()
    if (e.key === 'Escape') setEditing(null)
  }

  const isLowStock = (stock: any, weight: Weight) => {
    const v = stock?.[weight]
    return v && v.qty <= v.reorderAt
  }

  const isProductLowStock = (stock: any) =>
    (['100g', '250g', '500g'] as Weight[]).some(w => isLowStock(stock, w))

  return (
    <div>
      <PageHeader title="Inventory" description="Click any quantity to edit inline" />

      {/* Alerts banner */}
      {alerts && alerts.length > 0 && (
        <div className="mb-5 rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                {alerts.length} low stock {alerts.length === 1 ? 'alert' : 'alerts'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {alerts.slice(0, 5).map((a: any) => `${a.product} (${a.weight}): ${a.qty} left`).join(' · ')}
                {alerts.length > 5 && ` · +${alerts.length - 5} more`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Product</th>
                {(['100g', '250g', '500g'] as Weight[]).map(w => (
                  <th key={w} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">{w}</th>
                ))}
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(7)].map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    {[...Array(5)].map((_, j) => (
                      <td key={j} className="px-4 py-4">
                        <div className="h-4 rounded bg-muted animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                products?.map((product: any) => {
                  const lowStock = isProductLowStock(product.stock)
                  return (
                    <tr key={product._id}
                      className={cn(
                        'border-b border-border last:border-0 transition-colors',
                        lowStock ? 'border-l-2 border-l-red-500/60 bg-red-500/3' : 'hover:bg-accent/30'
                      )}>
                      {/* Product name */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-medium text-foreground">{product.name}</p>
                            {product.badge && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded font-medium mt-0.5 inline-block"
                                style={{ background: 'rgba(212,168,83,0.15)', color: '#d4a853' }}>
                                {product.badge}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Stock cells */}
                      {(['100g', '250g', '500g'] as Weight[]).map(weight => {
                        const variant = product.stock?.[weight]
                        const qty = variant?.qty ?? 0
                        const reorderAt = variant?.reorderAt ?? 10
                        const low = qty <= reorderAt
                        const isEditingThis = editing?.productId === product._id && editing?.weight === weight

                        return (
                          <td key={weight} className="px-4 py-4">
                            {isEditingThis ? (
                              <div className="flex items-center gap-1.5">
                                <select
                                  value={editing.operation}
                                  onChange={e => setEditing(prev => prev ? { ...prev, operation: e.target.value as any } : null)}
                                  style={{ width: 'auto', minWidth: '80px', fontSize: '11px', padding: '3px 6px' }}>
                                  <option value="set">Set to</option>
                                  <option value="add">Add</option>
                                  <option value="subtract">Subtract</option>
                                </select>
                                <input
                                  type="number"
                                  value={editing.value}
                                  onChange={e => setEditing(prev => prev ? { ...prev, value: e.target.value } : null)}
                                  onKeyDown={handleKeyDown}
                                  autoFocus
                                  min={0}
                                  style={{ width: '60px', fontSize: '12px', padding: '3px 6px' }}
                                />
                                <button onClick={saveEdit} disabled={updateStock.isPending}
                                  className="p-1 rounded text-green-500 hover:bg-green-500/10 transition-colors">
                                  {updateStock.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                </button>
                                <button onClick={() => setEditing(null)}
                                  className="p-1 rounded text-muted-foreground hover:bg-accent transition-colors">
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => startEdit(product._id, weight, qty)}
                                className={cn(
                                  'text-left rounded-lg px-2.5 py-1.5 transition-colors hover:bg-accent/60 group',
                                  low ? 'text-red-400' : 'text-foreground'
                                )}>
                                <span className="font-medium text-sm">{qty}</span>
                                <span className="text-xs text-muted-foreground ml-1">/ {reorderAt}</span>
                                {low && <AlertTriangle className="w-3 h-3 text-red-400 inline ml-1" />}
                                <span className="text-[10px] text-muted-foreground ml-1 opacity-0 group-hover:opacity-100 transition-opacity">click to edit</span>
                              </button>
                            )}
                          </td>
                        )
                      })}

                      {/* Status */}
                      <td className="px-4 py-4">
                        {lowStock ? (
                          <span className="text-xs px-2 py-0.5 rounded-full border border-red-500/30 bg-red-500/10 text-red-400">
                            Low stock
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full border border-green-500/30 bg-green-500/10 text-green-500">
                            OK
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
              {!isLoading && !products?.length && (
                <tr><td colSpan={5} className="px-5 py-12 text-center text-muted-foreground">No products found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-3">
        Click any quantity number to edit. Press <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border font-mono text-[10px]">Enter</kbd> to save or <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border font-mono text-[10px]">Esc</kbd> to cancel.
      </p>
    </div>
  )
}
