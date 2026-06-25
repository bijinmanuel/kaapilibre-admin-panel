'use client'
import { useState } from 'react'
import { X, Package as PackageIcon } from 'lucide-react'
import { useCreatePackage, useUpdatePackage } from '@/hooks/useData'

export function AddPackageModal({
  onClose,
  initialData
}: {
  onClose: () => void,
  initialData?: any
}) {
  const isEdit = !!initialData

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    weightValue: isEdit
      ? initialData.weightInGrams >= 1000
        ? (initialData.weightInGrams / 1000).toString()
        : initialData.weightInGrams.toString()
      : '',
    weightUnit: isEdit
      ? initialData.weightInGrams >= 1000 ? 'kg' : 'g'
      : 'kg',
    qty: initialData?.qty?.toString() || '0',
    reorderAt: initialData?.reorderAt?.toString() || '10',
    isExportOnly: initialData?.isExportOnly || false
  })

  const { mutate: createPackage, isPending: isCreating } = useCreatePackage()
  const { mutate: updatePackage, isPending: isUpdating } = useUpdatePackage()

  const isPending = isCreating || isUpdating

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const weightVal = parseFloat(formData.weightValue)
    if (isNaN(weightVal) || weightVal <= 0) return

    const weightInGrams = formData.weightUnit === 'kg' ? weightVal * 1000 : weightVal
    const qty = parseInt(formData.qty)
    const reorderAt = parseInt(formData.reorderAt)

    const payload = {
      name: formData.name || `${formData.weightValue}${formData.weightUnit}`,
      weightInGrams,
      qty: isNaN(qty) ? 0 : qty,
      reorderAt: isNaN(reorderAt) ? 10 : reorderAt,
      isExportOnly: formData.isExportOnly
    }

    if (isEdit) {
      updatePackage({ id: initialData._id, ...payload }, { onSuccess: onClose })
    } else {
      createPackage(payload, { onSuccess: onClose })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card border border-border w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 className="text-xl font-bold text-foreground">{isEdit ? 'Edit Package' : 'Add Package'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-accent rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Package Name / Label</label>
            <input
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. 10kg Bag, 250g Pouch"
              className="w-full px-4 py-2.5 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Weight Value</label>
              <input
                required
                type="number"
                step="any"
                value={formData.weightValue}
                onChange={(e) => setFormData({ ...formData, weightValue: e.target.value })}
                placeholder="e.g. 10 or 250"
                className="w-full px-4 py-2.5 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Weight Unit</label>
              <select
                value={formData.weightUnit}
                onChange={(e) => setFormData({ ...formData, weightUnit: e.target.value })}
                className="w-full px-4 py-2.5 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="g">Grams (g)</option>
                <option value="kg">Kilograms (kg)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Initial Stock</label>
              <input
                required
                type="number"
                value={formData.qty}
                onChange={(e) => setFormData({ ...formData, qty: e.target.value })}
                placeholder="0"
                min="0"
                className="w-full px-4 py-2.5 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Reorder Alert Level</label>
              <input
                required
                type="number"
                value={formData.reorderAt}
                onChange={(e) => setFormData({ ...formData, reorderAt: e.target.value })}
                placeholder="10"
                min="0"
                className="w-full px-4 py-2.5 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="isExportOnly"
              checked={formData.isExportOnly}
              onChange={(e) => setFormData({ ...formData, isExportOnly: e.target.checked })}
              className="w-4 h-4 rounded text-primary focus:ring-primary/20 border-border bg-card"
            />
            <label htmlFor="isExportOnly" className="text-sm font-medium text-foreground select-none cursor-pointer">
              Export Only (e.g. 5kg package)
            </label>
          </div>

          <p className="text-xs text-muted-foreground mt-1">
            * Cafe orders will use fallback algorithms that exclude Export Only packages. Online orders will match weight variants directly.
          </p>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isPending}
              className="w-full py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
              style={{ background: '#d4a853', color: '#1a1713' }}
            >
              <PackageIcon className="w-4 h-4" />
              {isPending ? 'Processing...' : isEdit ? 'Update Package' : 'Add Package'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
