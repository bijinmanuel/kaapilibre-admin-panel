'use client'
import { useState } from 'react'
import { X } from 'lucide-react'
import { useCreateCafeProduct, useUpdateCafeProduct } from '@/hooks/useCafeProducts'
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
    description: initialData?.description || '',
  })

  const { mutate: createProduct, isPending: isCreating } = useCreateCafeProduct()
  const { mutate: updateProduct, isPending: isUpdating } = useUpdateCafeProduct()

  const isEdit = !!initialData
  const isPending = isCreating || isUpdating

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const payload = {
      ...formData,
      price: parseFloat(formData.price)
    }

    if (isEdit) {
      updateProduct({ id: initialData._id, data: payload }, { onSuccess: onClose })
    } else {
      createProduct(payload, { onSuccess: onClose })
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
                  {/* <option value="Tea">Tea</option> */}
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Description</label>
            <div className="relative">
              {/* <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /> */}
              <input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional details..."
                className="w-full pl-12 pr-4 py-2.5 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

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
