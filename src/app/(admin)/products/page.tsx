'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Plus, ToggleLeft, ToggleRight, Eye, Coffee } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { useProducts, useToggleProduct } from '@/hooks/useProducts'
import { formatCurrency } from '@/lib/utils'

type StatusFilter = 'all' | 'active' | 'inactive'

export default function ProductsPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [variety, setVariety] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const { data, isLoading } = useProducts({
    search: search || undefined,
    variety: variety || undefined,
    limit: 100,
  })
  const toggle = useToggleProduct()

  // Filter by active/inactive client-side (backend returns all for admin)
  const allProducts = data?.data || []
  const products = allProducts.filter(p => {
    if (statusFilter === 'active') return p.isActive
    if (statusFilter === 'inactive') return !p.isActive
    return true
  })

  const activeCount = allProducts.filter(p => p.isActive).length
  const inactiveCount = allProducts.filter(p => !p.isActive).length

  return (
    <div>
      <PageHeader
        title="Products"
        description={`${allProducts.length} total · ${activeCount} active · ${inactiveCount} inactive`}
        action={
          <button onClick={() => router.push('/products/new')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: '#d4a853', color: '#1a1713' }}>
            <Plus className="w-4 h-4" /> Add product
          </button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search products..." style={{ paddingLeft: '2.25rem' }} />
        </div>

        {/* Variety */}
        <select value={variety} onChange={e => setVariety(e.target.value)} style={{ width: 'auto' }}>
          <option value="">All varieties</option>
          <option value="Arabica">Arabica</option>
          <option value="Robusta">Robusta</option>
        </select>

        {/* Status filter pills */}
        <div className="flex gap-1 p-1 rounded-lg bg-muted">
          {(['all', 'active', 'inactive'] as StatusFilter[]).map(f => (
            <button key={f} onClick={() => setStatusFilter(f)}
              className="px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-all"
              style={statusFilter === f ? { background: '#d4a853', color: '#1a1713' } : { color: 'var(--muted-foreground)' }}>
              {f}
              {f === 'inactive' && inactiveCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px]"
                  style={statusFilter === 'inactive' ? { background: 'rgba(0,0,0,0.2)' } : { background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>
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
          {[...Array(8)].map((_, i) => <div key={i} className="h-52 rounded-xl bg-card border border-border animate-pulse" />)}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map(product => (
            <div key={product._id}
              className={`rounded-xl border bg-card overflow-hidden transition-colors group ${product.isActive ? 'border-border hover:border-primary/30' : 'border-red-500/30 opacity-75 hover:opacity-100'
                }`}>
              {/* Image */}
              <div className="h-40 bg-muted flex items-center justify-center relative">
                {product.images?.[0] ? (
                  <img
                    src={product.images.find(i => i.isPrimary)?.url || product.images[0].url}
                    alt={product.name}
                    className={`w-full h-full object-cover ${!product.isActive ? 'grayscale' : ''}`}
                  />
                ) : (
                  <Coffee className="w-10 h-10 text-muted-foreground/30" />
                )}

                {/* Badge */}
                {product.badge && (
                  <span className="absolute top-2 left-2 text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: '#d4a853', color: '#1a1713' }}>
                    {product.badge}
                  </span>
                )}

                {/* Inactive overlay */}
                {!product.isActive && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-red-500/90 text-white">
                      Inactive
                    </span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-4">
                <p className="font-medium text-foreground text-sm truncate">{product.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{product.origin} · {product.variety}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-sm font-semibold" style={{ color: product.isActive ? '#d4a853' : 'var(--muted-foreground)' }}>
                    from {formatCurrency(product.prices['100g'])}
                  </span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => router.push(`/products/${product.slug}`)}
                      title="Edit product"
                      className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => toggle.mutate(product._id)}
                      title={product.isActive ? 'Deactivate' : 'Activate'}
                      className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                      {product.isActive
                        ? <ToggleRight className="w-3.5 h-3.5 text-green-500" />
                        : <ToggleLeft className="w-3.5 h-3.5 text-red-400" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center text-muted-foreground">
          <Coffee className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">
            {statusFilter === 'inactive' ? 'No inactive products' :
              statusFilter === 'active' ? 'No active products' :
                'No products found'}
          </p>
        </div>
      )}
    </div>
  )
}
