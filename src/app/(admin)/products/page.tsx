'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  Plus,
  ToggleLeft,
  ToggleRight,
  Eye,
  Coffee,
  Tag,
  Edit2,
  Trash2,
  Layers,
  ArrowRight
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { useProducts, useToggleProduct } from '@/hooks/useProducts'
import { useCategories, useToggleCategory, useDeleteCategory } from '@/hooks/useCategories'
import { CategoryModal } from '@/components/products/CategoryModal'
import { ConfirmModal } from '@/components/common/ConfirmModal'
import { formatCurrency } from '@/lib/utils'
import type { Category } from '@/types'

type StatusFilter = 'all' | 'active' | 'inactive'
type TabType = 'products' | 'categories'

export default function ProductsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('products')

  // Products state
  const [search, setSearch] = useState('')
  const [species, setSpecies] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  // Category state
  const [categorySearch, setCategorySearch] = useState('')
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null)

  // Data hooks
  const { data: categories = [], isLoading: isCategoriesLoading } = useCategories({
    includeInactive: true,
  })

  const { data, isLoading } = useProducts({
    search: search || undefined,
    species: species || undefined,
    category: categoryFilter === 'uncategorized' ? undefined : (categoryFilter || undefined),
    limit: 100,
  })

  const toggle = useToggleProduct()
  const toggleCategory = useToggleCategory()
  const deleteCategory = useDeleteCategory()

  // Filter products client-side for active/inactive and uncategorized
  const allProducts = data?.data || []
  const products = allProducts.filter((p) => {
    if (statusFilter === 'active' && !p.isActive) return false
    if (statusFilter === 'inactive' && p.isActive) return false
    if (categoryFilter === 'uncategorized') {
      return !p.category
    }
    return true
  })

  const activeCount = allProducts.filter((p) => p.isActive).length
  const inactiveCount = allProducts.filter((p) => !p.isActive).length

  // Filter categories by search
  const filteredCategories = categories.filter((c) =>
    categorySearch
      ? c.name.toLowerCase().includes(categorySearch.toLowerCase()) ||
        c.slug.toLowerCase().includes(categorySearch.toLowerCase()) ||
        c.description?.toLowerCase().includes(categorySearch.toLowerCase())
      : true
  )

  const activeCategoriesCount = categories.filter((c) => c.isActive).length

  const handleOpenAddCategory = () => {
    setEditingCategory(null)
    setShowCategoryModal(true)
  }

  const handleOpenEditCategory = (cat: Category) => {
    setEditingCategory(cat)
    setShowCategoryModal(true)
  }

  const handleConfirmDeleteCategory = async () => {
    if (!deletingCategory) return
    await deleteCategory.mutateAsync(deletingCategory._id)
    setDeletingCategory(null)
  }

  return (
    <div>
      {/* Header */}
      <PageHeader
        title="Product Catalog"
        description={
          activeTab === 'products'
            ? `${allProducts.length} products · ${activeCount} active · ${inactiveCount} inactive`
            : `${categories.length} categories · ${activeCategoriesCount} active`
        }
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenAddCategory}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium border border-border bg-card text-foreground hover:bg-accent transition-colors"
            >
              <Tag className="w-4 h-4 text-primary" style={{ color: '#d4a853' }} />
              Add category
            </button>
            <button
              onClick={() => router.push('/products/new')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
              style={{ background: '#d4a853', color: '#1a1713' }}
            >
              <Plus className="w-4 h-4" /> Add product
            </button>
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-3 mb-6">
        <button
          onClick={() => setActiveTab('products')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'products'
              ? 'bg-primary text-black font-semibold'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent'
          }`}
          style={activeTab === 'products' ? { background: '#d4a853', color: '#1a1713' } : {}}
        >
          <Coffee className="w-4 h-4" />
          <span>Products</span>
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={
              activeTab === 'products'
                ? { background: 'rgba(0,0,0,0.15)' }
                : { background: 'var(--muted)', color: 'var(--muted-foreground)' }
            }
          >
            {allProducts.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'categories'
              ? 'bg-primary text-black font-semibold'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent'
          }`}
          style={activeTab === 'categories' ? { background: '#d4a853', color: '#1a1713' } : {}}
        >
          <Tag className="w-4 h-4" />
          <span>Categories</span>
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={
              activeTab === 'categories'
                ? { background: 'rgba(0,0,0,0.15)' }
                : { background: 'var(--muted)', color: 'var(--muted-foreground)' }
            }
          >
            {categories.length}
          </span>
        </button>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* PRODUCTS TAB */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'products' && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            {/* Search */}
            <div className="relative flex-1 min-w-48 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                style={{ paddingLeft: '2.25rem' }}
              />
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{ width: 'auto' }}
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} {!c.isActive ? '(Inactive)' : ''}
                </option>
              ))}
              <option value="uncategorized">Uncategorized</option>
            </select>

            {/* Species */}
            <select
              value={species}
              onChange={(e) => setSpecies(e.target.value)}
              style={{ width: 'auto' }}
            >
              <option value="">All species</option>
              <option value="Arabica">Arabica</option>
              <option value="Robusta">Robusta</option>
            </select>

            {/* Status filter pills */}
            <div className="flex gap-1 p-1 rounded-lg bg-muted">
              {(['all', 'active', 'inactive'] as StatusFilter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className="px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-all"
                  style={
                    statusFilter === f
                      ? { background: '#d4a853', color: '#1a1713' }
                      : { color: 'var(--muted-foreground)' }
                  }
                >
                  {f}
                  {f === 'inactive' && inactiveCount > 0 && (
                    <span
                      className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px]"
                      style={
                        statusFilter === 'inactive'
                          ? { background: 'rgba(0,0,0,0.2)' }
                          : { background: 'rgba(239,68,68,0.15)', color: '#ef4444' }
                      }
                    >
                      {inactiveCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-52 rounded-xl bg-card border border-border animate-pulse" />
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.map((product) => {
                const categoryObj =
                  typeof product.category === 'object' && product.category !== null
                    ? (product.category as Category)
                    : categories.find((c) => c._id === product.category)

                return (
                  <div
                    key={product._id}
                    className={`rounded-xl border bg-card overflow-hidden transition-colors group ${
                      product.isActive
                        ? 'border-border hover:border-primary/30'
                        : 'border-red-500/30 opacity-75 hover:opacity-100'
                    }`}
                  >
                    {/* Image */}
                    <div className="h-40 bg-muted flex items-center justify-center relative">
                      {product.images?.[0] ? (
                        <img
                          src={product.images.find((i) => i.isPrimary)?.url || product.images[0].url}
                          alt={product.name}
                          className={`w-full h-full object-cover ${!product.isActive ? 'grayscale' : ''}`}
                        />
                      ) : (
                        <Coffee className="w-10 h-10 text-muted-foreground/30" />
                      )}

                      {/* Category Pill */}
                      {categoryObj && (
                        <span
                          className="absolute bottom-2 left-2 text-[10px] px-2 py-0.5 rounded-full font-medium backdrop-blur-md"
                          style={{
                            background: 'rgba(0,0,0,0.65)',
                            color: '#d4a853',
                            border: '1px solid rgba(212,168,83,0.3)',
                          }}
                        >
                          {categoryObj.name}
                        </span>
                      )}

                      {/* Badge */}
                      {product.badge && (
                        <span
                          className="absolute top-2 left-2 text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ background: '#d4a853', color: '#1a1713' }}
                        >
                          {product.badge}
                        </span>
                      )}

                      {/* Inactive overlay */}
                      {!product.isActive && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                          <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-red-500/90 text-white">
                            Inactive
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <p className="font-medium text-foreground text-sm truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {product.origin} · {product.variety}
                        {product.species ? ` · ${product.species}` : ''}
                      </p>
                      <div className="flex items-center justify-between mt-3">
                        <span
                          className="text-sm font-semibold"
                          style={{ color: product.isActive ? '#d4a853' : 'var(--muted-foreground)' }}
                        >
                          from {formatCurrency(product.prices['250g'])}
                        </span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => router.push(`/products/${product.slug}`)}
                            title="Edit product"
                            className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => toggle.mutate(product._id)}
                            title={product.isActive ? 'Deactivate' : 'Activate'}
                            className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {product.isActive ? (
                              <ToggleRight className="w-3.5 h-3.5 text-green-500" />
                            ) : (
                              <ToggleLeft className="w-3.5 h-3.5 text-red-400" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="py-20 text-center text-muted-foreground">
              <Coffee className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">
                {statusFilter === 'inactive'
                  ? 'No inactive products'
                  : statusFilter === 'active'
                  ? 'No active products'
                  : categoryFilter
                  ? 'No products in this category'
                  : 'No products found'}
              </p>
            </div>
          )}
        </>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* CATEGORIES TAB */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          {/* Category Top Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-48 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                placeholder="Search categories..."
                style={{ paddingLeft: '2.25rem' }}
              />
            </div>

            <button
              onClick={handleOpenAddCategory}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
              style={{ background: '#d4a853', color: '#1a1713' }}
            >
              <Plus className="w-4 h-4" /> Create Category
            </button>
          </div>

          {/* Categories Grid / Cards */}
          {isCategoriesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-40 rounded-xl bg-card border border-border animate-pulse" />
              ))}
            </div>
          ) : filteredCategories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCategories.map((cat) => (
                <div
                  key={cat._id}
                  className={`rounded-xl border p-5 bg-card flex flex-col justify-between transition-all group ${
                    cat.isActive
                      ? 'border-border hover:border-primary/40'
                      : 'border-red-500/20 bg-red-500/[0.02]'
                  }`}
                >
                  <div>
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: 'rgba(212,168,83,0.15)', color: '#d4a853' }}
                        >
                          <Tag className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground text-sm leading-snug">
                            {cat.name}
                          </h4>
                          <span className="text-[11px] text-muted-foreground">/{cat.slug}</span>
                        </div>
                      </div>

                      {/* Status toggle button */}
                      <button
                        type="button"
                        onClick={() => toggleCategory.mutate(cat._id)}
                        title={cat.isActive ? 'Deactivate category' : 'Activate category'}
                        className="text-muted-foreground hover:text-foreground transition-colors p-1"
                      >
                        {cat.isActive ? (
                          <ToggleRight className="w-6 h-6 text-green-500" />
                        ) : (
                          <ToggleLeft className="w-6 h-6 text-red-400" />
                        )}
                      </button>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-2 leading-relaxed min-h-[32px]">
                      {cat.description || <span className="italic opacity-60">No description provided</span>}
                    </p>
                  </div>

                  {/* Footer info & actions */}
                  <div className="pt-4 mt-3 border-t border-border flex items-center justify-between">
                    {/* Products link */}
                    <button
                      onClick={() => {
                        setCategoryFilter(cat._id)
                        setActiveTab('products')
                      }}
                      className="flex items-center gap-1.5 text-xs font-medium hover:underline transition-colors"
                      style={{ color: '#d4a853' }}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>{cat.productCount ?? 0} products</span>
                      <ArrowRight className="w-3 h-3 opacity-70 group-hover:translate-x-0.5 transition-transform" />
                    </button>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditCategory(cat)}
                        title="Edit category"
                        className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingCategory(cat)}
                        title="Delete category"
                        className="p-1.5 rounded-md hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center text-muted-foreground rounded-2xl border border-dashed border-border bg-card/50">
              <Tag className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium text-foreground">No categories found</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto mb-4">
                {categorySearch
                  ? `No categories matching "${categorySearch}"`
                  : 'Organize your specialty coffees into categories like Single Origin, Blend, Micro-lot, etc.'}
              </p>
              <button
                onClick={handleOpenAddCategory}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium"
                style={{ background: '#d4a853', color: '#1a1713' }}
              >
                <Plus className="w-3.5 h-3.5" /> Create first category
              </button>
            </div>
          )}
        </div>
      )}

      {/* Category Modal (Create / Edit) */}
      {showCategoryModal && (
        <CategoryModal
          onClose={() => {
            setShowCategoryModal(false)
            setEditingCategory(null)
          }}
          category={editingCategory}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingCategory && (
        <ConfirmModal
          title="Delete Category?"
          message={`Are you sure you want to delete "${deletingCategory.name}"? Products currently linked to this category will become uncategorized.`}
          confirmText="Yes, delete"
          onClose={() => setDeletingCategory(null)}
          onConfirm={handleConfirmDeleteCategory}
          variant="danger"
        />
      )}
    </div>
  )
}
