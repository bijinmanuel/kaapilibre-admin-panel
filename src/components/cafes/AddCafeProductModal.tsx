'use client'
import { useState } from 'react'
import { X, Coffee, Sparkles } from 'lucide-react'
import { useCreateCafeProduct, useUpdateCafeProduct } from '@/hooks/useCafeProducts'
import { useCafes, useUpdateCafe } from '@/hooks/useCafes'
import type { CafeCategory, CafeProduct } from '@/types'

export function AddCafeProductModal({
  onClose,
  initialData
}: {
  onClose: () => void,
  initialData?: CafeProduct
}) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    category: (initialData?.category || 'Coffee Beans') as CafeCategory,
    price: initialData?.price?.toString() || '',
    roast: initialData?.roast || 'Medium-Dark Roast',
    variety: initialData?.variety || '',
    origin: initialData?.origin || '',
    description: initialData?.description || '',
  })
  const [assignCafeId, setAssignCafeId] = useState<string>('')

  const { data: cafes } = useCafes()
  const { mutate: updateCafe } = useUpdateCafe()
  const { mutateAsync: createProduct, isPending: isCreating } = useCreateCafeProduct()
  const { mutateAsync: updateProduct, isPending: isUpdating } = useUpdateCafeProduct()

  const isEdit = !!initialData
  const isPending = isCreating || isUpdating

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const payload: any = {
      ...formData,
      price: parseFloat(formData.price),
      ...(assignCafeId ? { cafeId: assignCafeId } : {})
    }

    try {
      if (isEdit) {
        await updateProduct({ id: initialData._id, data: payload })
      } else {
        await createProduct(payload)
      }

      // If user selected a cafe to assign this blend to:
      if (assignCafeId && cafes) {
        const targetCafe = cafes.find(c => c._id === assignCafeId)
        if (targetCafe) {
          const currentBeans = targetCafe.targetBeans || []
          const trimmedName = formData.name.trim()
          if (!currentBeans.some(b => b.toLowerCase() === trimmedName.toLowerCase())) {
            updateCafe({
              id: targetCafe._id,
              data: { targetBeans: [...currentBeans, trimmedName] }
            })
          }
        }
      }

      onClose()
    } catch (err) {
      // handled in hooks
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card border border-border w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 className="text-xl font-bold text-foreground">{isEdit ? 'Edit Menu Item' : 'Add Menu Item'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-accent rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Item Name</label>
            <div className="relative">
              {/* <Coffee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /> */}
              <input
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Arabica Beans"
                className="w-full pl-12 pr-4 py-2.5 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Price</label>
              <div className="relative">
                {/* <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /> */}
                <input
                  required
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                  className="w-full pl-12 pr-4 py-2.5 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Category</label>
              <div className="relative">
                {/* <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /> */}
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                  className="w-full pl-12 pr-4 py-2.5 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none"
                >
                  <option value="Coffee Beans">Coffee Beans</option>
                  <option value="Equipment">Equipment</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {formData.category === 'Coffee Beans' && (
            <div className="space-y-4 pt-1 border-t border-border/50">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Roast Profile</label>
                  <select
                    value={formData.roast}
                    onChange={(e) => setFormData({ ...formData, roast: e.target.value })}
                    className="w-full px-3 py-2.5 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                  >
                    <option value="Medium Roast">Medium Roast</option>
                    <option value="Medium-Dark Roast">Medium-Dark Roast</option>
                    <option value="Dark Roast">Dark Roast</option>
                    <option value="Light Roast">Light Roast</option>
                    <option value="Omni Roast">Omni Roast</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Variety</label>
                  <input
                    value={formData.variety}
                    onChange={(e) => setFormData({ ...formData, variety: e.target.value })}
                    placeholder="e.g. 100% Arabica"
                    className="w-full px-3 py-2.5 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Origin / Estate</label>
                <input
                  value={formData.origin}
                  onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                  placeholder="e.g. Chikmagalur & Wayanad"
                  className="w-full px-3 py-2.5 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Description</label>
            <div className="relative">
              <input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional tasting notes or details..."
                className="w-full px-4 py-2.5 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
              />
            </div>
          </div>

          {!isEdit && (
            <div className="space-y-1 pt-2 border-t border-border/50">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                <span>Assign to Partner Cafe (Optional)</span>
                <span className="text-[10px] text-muted-foreground lowercase">tags for cafe wholesale</span>
              </label>
              <select
                value={assignCafeId}
                onChange={(e) => setAssignCafeId(e.target.value)}
                className="w-full px-3 py-2.5 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm text-foreground"
              >
                <option value="">-- None (General wholesale roast) --</option>
                {cafes?.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} {c.location ? `(${c.location})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="pt-4">
            <button
              type="submit"
              disabled={isPending}
              className="w-full py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99]"
              style={{ background: '#d4a853', color: '#1a1713' }}
            >
              {isPending ? 'Processing...' : isEdit ? 'Update Item' : 'Add Menu Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
