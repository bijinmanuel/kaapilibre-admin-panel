'use client'
import { useState, useEffect } from 'react'
import { X, Tag, Loader2 } from 'lucide-react'
import { useCreateCategory, useUpdateCategory } from '@/hooks/useCategories'
import type { Category } from '@/types'

interface CategoryModalProps {
  onClose: () => void
  category?: Category | null
  onSuccess?: (category: Category) => void
}

export function CategoryModal({ onClose, category, onSuccess }: CategoryModalProps) {
  const isEdit = !!category
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [order, setOrder] = useState<number>(0)
  const [isActive, setIsActive] = useState(true)
  const [error, setError] = useState('')

  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()

  useEffect(() => {
    if (category) {
      setName(category.name || '')
      setDescription(category.description || '')
      setOrder(category.order ?? 0)
      setIsActive(category.isActive ?? true)
    } else {
      setName('')
      setDescription('')
      setOrder(0)
      setIsActive(true)
    }
  }, [category])

  const isPending = createCategory.isPending || updateCategory.isPending

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) {
      setError('Category name is required')
      return
    }
    if (trimmedName.length < 2) {
      setError('Category name must be at least 2 characters')
      return
    }
    setError('')

    const payload = {
      name: trimmedName,
      description: description.trim() || undefined,
      order: Number(order) || 0,
      isActive,
    }

    try {
      if (isEdit && category) {
        const res = await updateCategory.mutateAsync({
          id: category._id,
          data: payload,
        })
        const updated = (res as any)?.data || { ...category, ...payload }
        onSuccess?.(updated)
        onClose()
      } else {
        const res = await createCategory.mutateAsync(payload)
        const created = (res as any)?.data
        onSuccess?.(created)
        onClose()
      }
    } catch {
      // Error toast is handled by hook
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card border border-border w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(212,168,83,0.15)', color: '#d4a853' }}>
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">
                {isEdit ? 'Edit Category' : 'Create Category'}
              </h3>
              <p className="text-xs text-muted-foreground">
                {isEdit ? 'Modify category details' : 'Add a new product category'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-full text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">
              Category Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (error) setError('')
              }}
              placeholder="e.g. Single Origin, Blend, Micro-lot"
              className="w-full"
              autoFocus
            />
            {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">
              Description <span className="text-muted-foreground/60">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Short description of this category for internal reference and store display..."
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                Display Order
              </label>
              <input
                type="number"
                min={0}
                step={1}
                value={order}
                onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
                placeholder="0"
                className="w-full"
              />
              <span className="text-[10px] text-muted-foreground mt-0.5 block">
                Lower numbers display first
              </span>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                Status
              </label>
              <label className="flex items-center gap-2.5 h-10 px-3 rounded-lg border border-border bg-input/20 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-border w-4 h-4 text-primary focus:ring-0"
                />
                <span className="text-xs font-medium text-foreground">
                  {isActive ? 'Active' : 'Inactive'}
                </span>
              </label>
              <span className="text-[10px] text-muted-foreground mt-0.5 block">
                {isActive ? 'Visible for products' : 'Hidden from selection'}
              </span>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-11 rounded-lg text-sm font-medium border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 h-11 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60 transition-opacity"
              style={{ background: '#d4a853', color: '#1a1713' }}
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isEdit ? 'Saving...' : 'Creating...'}
                </>
              ) : isEdit ? (
                'Save Changes'
              ) : (
                'Create Category'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
