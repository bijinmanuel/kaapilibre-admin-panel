'use client'

import React, { useState } from 'react'
import {
  X,
  Coffee,
  Sparkles,
  Plus,
  Check,
  Search,
  Flame,
  Tag,
  MapPin,
  Loader2,
  Layers,
} from 'lucide-react'
import { useCafeProducts, useCreateCafeProduct } from '@/hooks/useCafeProducts'
import { useUpdateCafe } from '@/hooks/useCafes'
import type { Cafe, CafeProduct } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'

interface AssignBlendModalProps {
  cafe: Cafe
  onClose: () => void
}

export function AssignBlendModal({ cafe, onClose }: AssignBlendModalProps) {
  const [activeTab, setActiveTab] = useState<'catalog' | 'custom'>('catalog')
  const [search, setSearch] = useState('')
  const [customNameInput, setCustomNameInput] = useState('')

  // State for creating a new bespoke blend
  const [newBlend, setNewBlend] = useState({
    name: `${cafe.name} Signature Blend`,
    category: 'Coffee Beans' as const,
    price: '850',
    roast: 'Medium-Dark Roast',
    variety: '100% Arabica',
    origin: 'Chikmagalur & Wayanad Estates',
    description: `Custom roasted signature blend exclusively curated for ${cafe.name}.`,
  })

  const { data: products, isLoading: isLoadingProducts } = useCafeProducts()
  const { mutateAsync: createProduct, isPending: isCreatingProduct } = useCreateCafeProduct()
  const { mutateAsync: updateCafe, isPending: isUpdatingCafe } = useUpdateCafe()

  const currentAssigned = cafe.targetBeans || []

  // Filter existing cafe products (preferring Coffee Beans)
  const filteredProducts = (products || []).filter((p) => {
    const q = search.toLowerCase().trim()
    if (!q) return true
    return (
      p.name.toLowerCase().includes(q) ||
      (p.roast && p.roast.toLowerCase().includes(q)) ||
      (p.origin && p.origin.toLowerCase().includes(q)) ||
      (p.variety && p.variety.toLowerCase().includes(q))
    )
  })

  // Assign existing blend name to cafe
  const handleAssignBlend = async (blendName: string) => {
    const trimmed = blendName.trim()
    if (!trimmed) return

    // Check if already assigned (case-insensitive)
    if (currentAssigned.some((b) => b.toLowerCase() === trimmed.toLowerCase())) {
      toast.info(`"${trimmed}" is already assigned to ${cafe.name}`)
      return
    }

    const updatedBeans = [...currentAssigned, trimmed]
    try {
      await updateCafe({
        id: cafe._id,
        data: { targetBeans: updatedBeans },
      })
      toast.success(`Assigned "${trimmed}" to ${cafe.name}`)
      onClose()
    } catch (err) {
      // error toast handled in hook
    }
  }

  // Create a brand new blend product and assign it
  const handleCreateAndAssign = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedName = newBlend.name.trim()
    if (!trimmedName) {
      toast.error('Blend name is required')
      return
    }

    const priceNum = parseFloat(newBlend.price)
    if (isNaN(priceNum) || priceNum <= 0) {
      toast.error('Please enter a valid price per kg')
      return
    }

    try {
      // 1. Create the wholesale CafeProduct
      await createProduct({
        name: trimmedName,
        category: newBlend.category,
        price: priceNum,
        roast: newBlend.roast,
        variety: newBlend.variety,
        origin: newBlend.origin,
        description: newBlend.description,
        isActive: true,
        cafeId: cafe._id,
      } as any)

      // 2. Append to cafe's targetBeans
      const isAlreadyTagged = currentAssigned.some(
        (b) => b.toLowerCase() === trimmedName.toLowerCase()
      )
      const updatedBeans = isAlreadyTagged
        ? currentAssigned
        : [...currentAssigned, trimmedName]

      await updateCafe({
        id: cafe._id,
        data: { targetBeans: updatedBeans },
      })

      toast.success(`Created "${trimmedName}" & assigned to ${cafe.name}`)
      onClose()
    } catch (err) {
      // handled in hooks
    }
  }

  const isPending = isCreatingProduct || isUpdatingCafe

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card border border-border w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">
                Assign Dedicated Blend
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Configure specific roast blends for <span className="text-primary font-medium">{cafe.name}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-full transition-colors text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-border bg-muted/30 px-6 pt-3 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('catalog')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'catalog'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Coffee className="w-4 h-4" /> Choose from Menu ({products?.length || 0})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('custom')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'custom'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Plus className="w-4 h-4" /> Create Bespoke Blend
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'catalog' ? (
            <div className="space-y-4">
              {/* Search & Fast add */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search wholesale roasts & blends..."
                  className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                />
              </div>

              {/* Product List */}
              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {isLoadingProducts ? (
                  <div className="py-12 flex flex-col items-center justify-center text-muted-foreground text-sm gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <span>Loading roasts...</span>
                  </div>
                ) : filteredProducts.length > 0 ? (
                  filteredProducts.map((p) => {
                    const isAssigned = currentAssigned.some(
                      (b) => b.toLowerCase() === p.name.toLowerCase()
                    )

                    return (
                      <div
                        key={p._id}
                        className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-4 ${
                          isAssigned
                            ? 'bg-primary/5 border-primary/30'
                            : 'bg-muted/20 border-border hover:border-primary/40'
                        }`}
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-foreground truncate">
                              {p.name}
                            </span>
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-accent text-muted-foreground">
                              {p.category}
                            </span>
                            {isAssigned && (
                              <span className="text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Check className="w-3 h-3" /> Assigned
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            {p.roast && (
                              <span className="flex items-center gap-1">
                                <Flame className="w-3 h-3 text-primary" /> {p.roast}
                              </span>
                            )}
                            {p.origin && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-muted-foreground/60" /> {p.origin}
                              </span>
                            )}
                            <span className="font-semibold text-primary">
                              {formatCurrency(p.price)} / kg
                            </span>
                          </div>

                          {p.description && (
                            <p className="text-xs text-muted-foreground/80 line-clamp-1">
                              {p.description}
                            </p>
                          )}
                        </div>

                        <div>
                          {isAssigned ? (
                            <button
                              disabled
                              className="px-3 py-1.5 rounded-lg bg-primary/20 text-primary text-xs font-semibold cursor-default"
                            >
                              Active Blend
                            </button>
                          ) : (
                            <button
                              onClick={() => handleAssignBlend(p.name)}
                              disabled={isPending}
                              className="px-3.5 py-1.5 rounded-lg bg-card border border-border hover:border-primary/50 text-xs font-semibold text-foreground hover:text-primary transition-all flex items-center gap-1.5 shadow-sm hover:scale-[1.02]"
                            >
                              <Plus className="w-3.5 h-3.5" /> Assign
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="py-8 text-center border border-dashed border-border rounded-xl">
                    <p className="text-xs text-muted-foreground">
                      No matching menu products found.
                    </p>
                  </div>
                )}
              </div>

              {/* Direct Name Input Shortcut */}
              <div className="pt-3 border-t border-border">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Or tag a custom blend name directly:
                </label>
                <div className="flex gap-2">
                  <input
                    value={customNameInput}
                    onChange={(e) => setCustomNameInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAssignBlend(customNameInput)
                        setCustomNameInput('')
                      }
                    }}
                    placeholder="e.g. Kaapi Dark Roast Blend"
                    className="flex-1 px-4 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      handleAssignBlend(customNameInput)
                      setCustomNameInput('')
                    }}
                    disabled={isPending || !customNameInput.trim()}
                    className="px-4 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                    style={{ background: '#d4a853', color: '#1a1713' }}
                  >
                    Add Tag
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Tab 2: Create Brand New Bespoke Blend Form */
            <form onSubmit={handleCreateAndAssign} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 text-xs text-muted-foreground flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-primary shrink-0" />
                <span>
                  This will register a new wholesale roast in your menu and tag it exclusively for{' '}
                  <strong className="text-foreground">{cafe.name}</strong>.
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Blend / Product Name *
                </label>
                <input
                  required
                  value={newBlend.name}
                  onChange={(e) => setNewBlend({ ...newBlend, name: e.target.value })}
                  placeholder="e.g. Royal Espresso Blend"
                  className="w-full px-4 py-2.5 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Price per Kg (₹) *
                  </label>
                  <input
                    required
                    type="number"
                    step="1"
                    min="1"
                    value={newBlend.price}
                    onChange={(e) => setNewBlend({ ...newBlend, price: e.target.value })}
                    placeholder="850"
                    className="w-full px-4 py-2.5 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Roast Profile
                  </label>
                  <select
                    value={newBlend.roast}
                    onChange={(e) => setNewBlend({ ...newBlend, roast: e.target.value })}
                    className="w-full px-3 py-2.5 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm text-foreground"
                  >
                    <option value="Medium Roast">Medium Roast</option>
                    <option value="Medium-Dark Roast">Medium-Dark Roast</option>
                    <option value="Dark Roast">Dark Roast</option>
                    <option value="Light Roast">Light Roast</option>
                    <option value="Omni Roast">Omni Roast</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Bean Variety
                  </label>
                  <input
                    value={newBlend.variety}
                    onChange={(e) => setNewBlend({ ...newBlend, variety: e.target.value })}
                    placeholder="e.g. 100% Arabica or 80:20 Blend"
                    className="w-full px-4 py-2.5 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Origin / Estate
                  </label>
                  <input
                    value={newBlend.origin}
                    onChange={(e) => setNewBlend({ ...newBlend, origin: e.target.value })}
                    placeholder="e.g. Chikmagalur & Wayanad"
                    className="w-full px-4 py-2.5 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Flavor Profile & Description
                </label>
                <textarea
                  rows={2}
                  value={newBlend.description}
                  onChange={(e) => setNewBlend({ ...newBlend, description: e.target.value })}
                  placeholder="Notes of dark chocolate, hazelnut, and caramel..."
                  className="w-full px-4 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm resize-none"
                />
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 shadow-lg"
                  style={{ background: '#d4a853', color: '#1a1713' }}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Saving & Assigning...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" /> Create & Assign to {cafe.name}
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
