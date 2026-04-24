'use client'
import { useState } from 'react'
import { Plus, Coffee, Tag, DollarSign, Edit2, Trash2, Search, Filter } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { useCafeProducts, useDeleteCafeProduct } from '@/hooks/useCafeProducts'
import { formatCurrency } from '@/lib/utils'
import { AddCafeProductModal } from '@/components/cafes/AddCafeProductModal'
import { ConfirmModal } from '@/components/common/ConfirmModal'
import type { CafeProduct } from '@/types'
import { toast } from 'sonner'

export default function CafeMenuPage() {
  const [showAdd, setShowAdd] = useState(false)
  const [editingProduct, setEditingProduct] = useState<CafeProduct | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const { data: products, isLoading } = useCafeProducts()
  const { mutate: deleteProduct } = useDeleteCafeProduct()

  const filtered = products?.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = category ? p.category === category : true
    return matchesSearch && matchesCategory
  })

  const handleDelete = (id: string) => {
    deleteProduct(id)
    setConfirmDelete(null)
  }

  return (
    <>
      <PageHeader
        title="Cafe Menu"
        description="Manage coffee beans, drinks and food items"
        action={
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-[1.02]"
            style={{ background: '#d4a853', color: '#1a1713' }}
          >
            <Plus className="w-4 h-4" /> Add Menu Item
          </button>
        }
      />

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          {/* <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /> */}
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="flex gap-4">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-4 py-2.5 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">All Categories</option>
            <option value="Coffee Beans">Coffee Beans</option>
            <option value="Equipment">Equipment</option>
            <option value="Other">Other</option>
            {/* <option value="Dessert">Dessert</option>
            <option value="Other">Other</option> */}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isLoading ? (
          [...Array(8)].map((_, i) => (
            <div key={i} className="h-40 rounded-2xl bg-card border border-border animate-pulse" />
          ))
        ) : filtered && filtered.length > 0 ? (
          filtered.map((product) => (
            <div key={product._id} className="group bg-card border border-border rounded-2xl p-5 hover:border-primary/50 transition-all relative overflow-hidden">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                  <Coffee className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingProduct(product)}
                    className="p-1.5 hover:bg-accent rounded-md transition-colors text-muted-foreground"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setConfirmDelete(product._id)}
                    className="p-1.5 hover:bg-red-500/10 rounded-md transition-colors text-muted-foreground hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <h4 className="font-bold text-foreground mb-1">{product.name}</h4>
              <div className="flex items-center gap-2 mb-4">
                <span className="px-2 py-0.5 rounded-full bg-accent text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  {product.category}
                </span>
              </div>

              <div className="flex items-center justify-between mt-auto">
                <span className="text-lg font-black text-primary">{formatCurrency(product.price)}</span>
                <span className={`text-[10px] font-bold uppercase tracking-widest ${product.isActive ? 'text-green-500' : 'text-red-500'}`}>
                  {product.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center">
            <p className="text-muted-foreground italic">No menu items found</p>
          </div>
        )}
      </div>

      {(showAdd || editingProduct) && (
        <AddCafeProductModal
          onClose={() => {
            setShowAdd(false)
            setEditingProduct(null)
          }}
          initialData={editingProduct || undefined}
        />
      )}

      {confirmDelete && (
        <ConfirmModal
          title="Delete Menu Item?"
          message="This action cannot be undone. This item will be removed from the cafe menu suggestions."
          onConfirm={() => handleDelete(confirmDelete)}
          onClose={() => setConfirmDelete(null)}
          confirmText="Delete Item"
        />
      )}
    </>
  )
}
