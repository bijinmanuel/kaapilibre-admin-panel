'use client'
import { useState } from 'react'
import { AlertTriangle, Check, X, Loader2, Plus, Trash2, Edit2, Package as PackageIcon } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  useInventory,
  useStockAlerts,
  useUpdateStock,
  usePackages,
  useUpdatePackage,
  useDeletePackage
} from '@/hooks/useData'
import { cn } from '@/lib/utils'
import { AddPackageModal } from '@/components/inventory/AddPackageModal'
import { ConfirmModal } from '@/components/common/ConfirmModal'

type Weight = '250g' | '500g' | '1kg'

interface EditCell {
  productId: string
  weight: Weight
  value: string
  operation: 'set' | 'add' | 'subtract'
}

interface EditPackageCell {
  packageId: string
  field: 'qty' | 'reorderAt'
  value: string
  operation?: 'set' | 'add' | 'subtract'
}

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<'products' | 'packages'>('products')
  const [showAddPackage, setShowAddPackage] = useState(false)
  const [editingPackage, setEditingPackage] = useState<any>(null)
  const [confirmDeletePackage, setConfirmDeletePackage] = useState<string | null>(null)

  // Products hooks
  const { data: products, isLoading: isProductsLoading } = useInventory()
  const { data: alerts } = useStockAlerts()
  const updateStock = useUpdateStock()
  const [editing, setEditing] = useState<EditCell | null>(null)

  // Packages hooks
  const { data: packages, isLoading: isPackagesLoading } = usePackages()
  const updatePackage = useUpdatePackage()
  const deletePackage = useDeletePackage()
  const [editingPkgCell, setEditingPkgCell] = useState<EditPackageCell | null>(null)

  // Product Inline Edit functions
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
    (['250g', '500g', '1kg'] as Weight[]).some(w => isLowStock(stock, w))

  // Package Inline Edit functions
  const startEditPkgCell = (packageId: string, field: 'qty' | 'reorderAt', currentVal: number) => {
    setEditingPkgCell({
      packageId,
      field,
      value: String(currentVal),
      operation: field === 'qty' ? 'set' : undefined
    })
  }

  const saveEditPkgCell = async () => {
    if (!editingPkgCell) return
    const val = parseInt(editingPkgCell.value)
    if (isNaN(val) || val < 0) return

    const payload: any = { id: editingPkgCell.packageId }
    if (editingPkgCell.field === 'qty') {
      payload.quantity = val
      payload.operation = editingPkgCell.operation || 'set'
    } else {
      payload.reorderAt = val
    }

    await updatePackage.mutateAsync(payload)
    setEditingPkgCell(null)
  }

  const handlePkgKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') saveEditPkgCell()
    if (e.key === 'Escape') setEditingPkgCell(null)
  }

  const handleDeletePackage = (id: string) => {
    deletePackage.mutate(id)
    setConfirmDeletePackage(null)
  }

  return (
    <div>
      <PageHeader
        title="Inventory"
        description={activeTab === 'products' ? "Click any quantity to edit inline" : "Manage packaging materials, stock levels, and alert thresholds"}
        action={activeTab === 'packages' && (
          <button
            onClick={() => setShowAddPackage(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-[1.02]"
            style={{ background: '#d4a853', color: '#1a1713' }}
          >
            <Plus className="w-4 h-4" /> Add Package
          </button>
        )}
      />

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

      {/* Tabs */}
      <div className="flex border-b border-border mb-6">
        <button
          onClick={() => setActiveTab('products')}
          className={cn(
            'px-5 py-2.5 text-sm font-semibold border-b-2 -mb-[2px] transition-colors',
            activeTab === 'products' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          Coffee Products
        </button>
        <button
          onClick={() => setActiveTab('packages')}
          className={cn(
            'px-5 py-2.5 text-sm font-semibold border-b-2 -mb-[2px] transition-colors',
            activeTab === 'packages' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          Packaging Materials
        </button>
      </div>

      {activeTab === 'products' ? (
        /* Products Table */
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Product</th>
                  {(['250g', '500g', '1kg'] as Weight[]).map(w => (
                    <th key={w} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">{w}</th>
                  ))}
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {isProductsLoading ? (
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
                        {(['250g', '500g', '1kg'] as Weight[]).map(weight => {
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
                {!isProductsLoading && !products?.length && (
                  <tr><td colSpan={5} className="px-5 py-12 text-center text-muted-foreground">No products found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Packaging Materials Table */
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Package</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Weight Value</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Stock Qty</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Alert level</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Usage</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isPackagesLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="border-b border-border">
                      {[...Array(7)].map((_, j) => (
                        <td key={j} className="px-4 py-4">
                          <div className="h-4 rounded bg-muted animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  packages?.map((pkg: any) => {
                    const isLow = pkg.qty <= pkg.reorderAt
                    const isEditingQty = editingPkgCell?.packageId === pkg._id && editingPkgCell?.field === 'qty'
                    const isEditingReorder = editingPkgCell?.packageId === pkg._id && editingPkgCell?.field === 'reorderAt'

                    return (
                      <tr key={pkg._id}
                        className={cn(
                          'border-b border-border last:border-0 transition-colors',
                          isLow ? 'border-l-2 border-l-red-500/60 bg-red-500/3' : 'hover:bg-accent/30'
                        )}>
                        {/* Package Name */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-accent rounded-lg text-muted-foreground">
                              <PackageIcon className="w-4 h-4" />
                            </div>
                            <span className="font-medium text-foreground">{pkg.name}</span>
                          </div>
                        </td>

                        {/* Weight in Grams / Kilograms */}
                        <td className="px-4 py-4">
                          <span className="text-muted-foreground font-medium">
                            {pkg.weightInGrams >= 1000
                              ? `${pkg.weightInGrams / 1000} kg`
                              : `${pkg.weightInGrams} g`}
                          </span>
                        </td>

                        {/* Quantity Inline edit */}
                        <td className="px-4 py-4">
                          {isEditingQty ? (
                            <div className="flex items-center gap-1.5">
                              <select
                                value={editingPkgCell.operation}
                                onChange={e => setEditingPkgCell(prev => prev ? { ...prev, operation: e.target.value as any } : null)}
                                style={{ width: 'auto', minWidth: '80px', fontSize: '11px', padding: '3px 6px' }}>
                                <option value="set">Set to</option>
                                <option value="add">Add</option>
                                <option value="subtract">Subtract</option>
                              </select>
                              <input
                                type="number"
                                value={editingPkgCell.value}
                                onChange={e => setEditingPkgCell(prev => prev ? { ...prev, value: e.target.value } : null)}
                                onKeyDown={handlePkgKeyDown}
                                autoFocus
                                min={0}
                                style={{ width: '60px', fontSize: '12px', padding: '3px 6px' }}
                              />
                              <button onClick={saveEditPkgCell} disabled={updatePackage.isPending}
                                className="p-1 rounded text-green-500 hover:bg-green-500/10 transition-colors">
                                {updatePackage.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                              </button>
                              <button onClick={() => setEditingPkgCell(null)}
                                className="p-1 rounded text-muted-foreground hover:bg-accent transition-colors">
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => startEditPkgCell(pkg._id, 'qty', pkg.qty)}
                              className={cn(
                                'text-left rounded-lg px-2.5 py-1.5 transition-colors hover:bg-accent/60 group',
                                isLow ? 'text-red-400' : 'text-foreground'
                              )}>
                              <span className="font-semibold text-sm">{pkg.qty}</span>
                              {isLow && <AlertTriangle className="w-3 h-3 text-red-400 inline ml-1" />}
                              <span className="text-[10px] text-muted-foreground ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity">edit qty</span>
                            </button>
                          )}
                        </td>

                        {/* Reorder Level Inline edit */}
                        <td className="px-4 py-4">
                          {isEditingReorder ? (
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                value={editingPkgCell.value}
                                onChange={e => setEditingPkgCell(prev => prev ? { ...prev, value: e.target.value } : null)}
                                onKeyDown={handlePkgKeyDown}
                                autoFocus
                                min={0}
                                style={{ width: '60px', fontSize: '12px', padding: '3px 6px' }}
                              />
                              <button onClick={saveEditPkgCell} disabled={updatePackage.isPending}
                                className="p-1 rounded text-green-500 hover:bg-green-500/10 transition-colors">
                                {updatePackage.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                              </button>
                              <button onClick={() => setEditingPkgCell(null)}
                                className="p-1 rounded text-muted-foreground hover:bg-accent transition-colors">
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => startEditPkgCell(pkg._id, 'reorderAt', pkg.reorderAt)}
                              className="text-left rounded-lg px-2.5 py-1.5 transition-colors hover:bg-accent/60 group text-muted-foreground">
                              <span className="text-sm font-semibold">{pkg.reorderAt}</span>
                              <span className="text-[10px] text-muted-foreground ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity">edit limit</span>
                            </button>
                          )}
                        </td>

                        {/* Usage */}
                        <td className="px-4 py-4">
                          {pkg.isExportOnly ? (
                            <span className="text-[11px] px-2 py-0.5 rounded border border-orange-500/30 bg-orange-500/10 text-orange-400 font-bold uppercase tracking-wider">
                              Export Only
                            </span>
                          ) : (
                            <span className="text-[11px] px-2 py-0.5 rounded border border-green-500/30 bg-green-500/10 text-green-500 font-bold uppercase tracking-wider">
                              Cafe & Online
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-4">
                          {isLow ? (
                            <span className="text-xs px-2 py-0.5 rounded-full border border-red-500/30 bg-red-500/10 text-red-400">
                              Low stock
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 rounded-full border border-green-500/30 bg-green-500/10 text-green-500">
                              OK
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setEditingPackage(pkg)}
                              className="p-1.5 hover:bg-accent rounded-md transition-colors text-muted-foreground hover:text-foreground"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setConfirmDeletePackage(pkg._id)}
                              className="p-1.5 hover:bg-red-500/10 rounded-md transition-colors text-muted-foreground hover:text-red-500"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
                {!isPackagesLoading && !packages?.length && (
                  <tr><td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">No packaging materials configured</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground mt-3">
        Click any quantity number to edit inline. Press <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border font-mono text-[10px]">Enter</kbd> to save or <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border font-mono text-[10px]">Esc</kbd> to cancel.
      </p>

      {/* Add / Edit Package Modal */}
      {(showAddPackage || editingPackage) && (
        <AddPackageModal
          onClose={() => {
            setShowAddPackage(false)
            setEditingPackage(null)
          }}
          initialData={editingPackage || undefined}
        />
      )}

      {/* Delete Package Confirmation Modal */}
      {confirmDeletePackage && (
        <ConfirmModal
          title="Delete Packaging Material?"
          message="Are you sure you want to remove this packaging material configuration? Orders requiring this weight will no longer be tracked correctly."
          onConfirm={() => handleDeletePackage(confirmDeletePackage)}
          onClose={() => setConfirmDeletePackage(null)}
          confirmText="Delete Package"
        />
      )}
    </div>
  )
}
