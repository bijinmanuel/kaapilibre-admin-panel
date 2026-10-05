'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Search, Plus, Coffee, Calendar, CreditCard, Edit2, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, FileText, Download, LayoutGrid, List,
  X, Eye, Store, CheckCircle, Clock, RefreshCw
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import {
  useCafeOrders,
  useUpdateCafeOrderStatus,
  useUpdateCafeOrderPaymentStatus,
  useGlobalCafeAnalytics
} from '@/hooks/useCafeOrders'
import { useCafes } from '@/hooks/useCafes'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import type { CafeOrder, Cafe } from '@/types'
import { CreateCafeOrderModal } from '@/components/orders/CreateCafeOrderModal'
import { EditCafeOrderModal } from '@/components/orders/EditCafeOrderModal'
import { CafeInvoiceModal } from '@/components/invoice/CafeInvoiceModal'
import { toast } from 'sonner'

const useDebounce = (val: string, ms = 350) => {
  const [deb, setDeb] = useState(val)
  useEffect(() => {
    const t = setTimeout(() => setDeb(val), ms)
    return () => clearTimeout(t)
  }, [val, ms])
  return deb
}

export default function CafeOrdersPage() {
  const router = useRouter()

  // View mode: 'table' (full list) or 'grid' (cards)
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')

  // Filters & Pagination state
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<string>('')
  const [paymentStatus, setPaymentStatus] = useState<string>('')
  const [cafeId, setCafeId] = useState<string>('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState<number>(20) // 0 means all orders

  // Modals state
  const [showCreate, setShowCreate] = useState(false)
  const [editingOrder, setEditingOrder] = useState<CafeOrder | null>(null)
  const [invoiceOrder, setInvoiceOrder] = useState<CafeOrder | null>(null)

  const debouncedSearch = useDebounce(search)

  // Fetch Cafes for filter dropdown
  const { data: cafes } = useCafes()

  // Fetch Cafe Orders
  const { data, isLoading, isFetching, refetch } = useCafeOrders({
    search: debouncedSearch || undefined,
    status: status || undefined,
    paymentStatus: paymentStatus || undefined,
    cafeId: cafeId || undefined,
    from: fromDate || undefined,
    to: toDate || undefined,
    page,
    limit,
  })

  // Global Analytics for KPI summary cards
  const { data: globalAnalytics } = useGlobalCafeAnalytics()

  const { mutate: updateStatus } = useUpdateCafeOrderStatus()
  const { mutate: updatePaymentStatus } = useUpdateCafeOrderPaymentStatus()

  const orders = data?.data || []
  const meta = data?.meta

  // Restore view mode preference from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('cafe_orders_view_mode')
      if (saved === 'grid' || saved === 'table') {
        setViewMode(saved)
      }
    } catch {
      // fallback
    }
  }, [])

  const handleViewModeChange = (mode: 'table' | 'grid') => {
    setViewMode(mode)
    try {
      localStorage.setItem('cafe_orders_view_mode', mode)
    } catch {
      // fallback
    }
  }

  // Reset filters
  const resetFilters = () => {
    setSearch('')
    setStatus('')
    setPaymentStatus('')
    setCafeId('')
    setFromDate('')
    setToDate('')
    setPage(1)
  }

  const isFiltered = Boolean(search || status || paymentStatus || cafeId || fromDate || toDate)

  // Quick stats calculation
  const totalOrdersCount = meta?.total ?? orders.length
  const totalRevenue = useMemo(() => {
    if (globalAnalytics?.stats && Array.isArray(globalAnalytics.stats)) {
      return globalAnalytics.stats.reduce((acc: number, s: any) => acc + (s.totalSales || 0), 0)
    }
    return orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0)
  }, [globalAnalytics, orders])

  const paidRevenue = useMemo(() => {
    if (globalAnalytics?.stats && Array.isArray(globalAnalytics.stats)) {
      return globalAnalytics.stats.reduce((acc: number, s: any) => acc + (s.paidSales || 0), 0)
    }
    return orders.filter(o => o.paymentStatus === 'paid').reduce((sum, o) => sum + (o.totalAmount || 0), 0)
  }, [globalAnalytics, orders])

  const pendingRevenue = useMemo(() => {
    if (globalAnalytics?.stats && Array.isArray(globalAnalytics.stats)) {
      return globalAnalytics.stats.reduce((acc: number, s: any) => acc + (s.pendingSales || 0), 0)
    }
    return orders.filter(o => o.paymentStatus === 'pending').reduce((sum, o) => sum + (o.totalAmount || 0), 0)
  }, [globalAnalytics, orders])

  // Pagination helpers
  const totalPages = meta?.totalPages || (meta?.total ? Math.ceil(meta.total / (limit || 1)) : 1)
  const isNoLimit = limit === 0 || limit >= 10000

  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }
    const pages: (number | string)[] = [1]
    if (page > 3) pages.push('...')
    const start = Math.max(2, page - 1)
    const end = Math.min(totalPages - 1, page + 1)
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
    if (page < totalPages - 2) pages.push('...')
    pages.push(totalPages)
    return pages
  }

  // Export current list to CSV
  const handleExportCsv = () => {
    if (!orders || orders.length === 0) {
      toast.error('No orders to export')
      return
    }

    const headers = [
      'Order Number',
      'Cafe Name',
      'Location',
      'Items Count',
      'Items Summary',
      'Total Amount (INR)',
      'Status',
      'Payment Method',
      'Payment Status',
      'Created Date'
    ]

    const rows = orders.map((o) => {
      const cafeObj = typeof o.cafeId === 'object' && o.cafeId ? (o.cafeId as Cafe) : null
      const cafeName = cafeObj ? cafeObj.name : (typeof o.cafeId === 'string' ? o.cafeId : 'Walk-in')
      const location = cafeObj?.location || ''
      const itemsCount = o.items?.reduce((acc, it) => acc + it.qty, 0) || 0
      const itemsSummary = o.items?.map((it) => `${it.qty}x ${it.name}`).join('; ') || ''

      return [
        `"${o.orderNumber}"`,
        `"${cafeName.replace(/"/g, '""')}"`,
        `"${location.replace(/"/g, '""')}"`,
        itemsCount,
        `"${itemsSummary.replace(/"/g, '""')}"`,
        o.totalAmount,
        o.status,
        o.paymentMethod,
        o.paymentStatus,
        `"${formatDateTime(o.createdAt)}"`
      ]
    })

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `cafe_orders_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success(`Exported ${orders.length} cafe orders`)
  }

  return (
    <>
      <PageHeader
        title="Cafe Orders"
        description={
          meta
            ? `${meta.total} cafe orders total${isFiltered ? ' (filtered)' : ''}`
            : 'Manage partner cafe orders, invoices, and walk-ins'
        }
        action={
          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-card border border-border rounded-lg p-0.5 shadow-sm">
              <button
                onClick={() => handleViewModeChange('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  viewMode === 'table'
                    ? 'font-bold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                style={
                  viewMode === 'table'
                    ? { background: 'rgba(212, 168, 83, 0.2)', color: '#d4a853', border: '1px solid rgba(212, 168, 83, 0.4)' }
                    : { border: '1px solid transparent' }
                }
                title="Full Table List View"
              >
                <List className="w-3.5 h-3.5" />
                <span>Full List</span>
              </button>
              <button
                onClick={() => handleViewModeChange('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  viewMode === 'grid'
                    ? 'font-bold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                style={
                  viewMode === 'grid'
                    ? { background: 'rgba(212, 168, 83, 0.2)', color: '#d4a853', border: '1px solid rgba(212, 168, 83, 0.4)' }
                    : { border: '1px solid transparent' }
                }
                title="Cards Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Cards</span>
              </button>
            </div>

            {/* Export CSV Button */}
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              title="Export visible orders to CSV"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>

            {/* Refresh */}
            <button
              onClick={() => refetch()}
              className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              title="Refresh orders"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-primary' : ''}`} />
            </button>

            {/* Create Order Button */}
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm"
              style={{ background: '#d4a853', color: '#161410' }}
            >
              <Plus className="w-4 h-4" />
              <span>New Cafe Order</span>
            </button>
          </div>
        }
      />

      {/* Priority-Based KPI Stats Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6 items-stretch">
        {/* Priority 1: Hero / Big Card (Recorded Revenue) */}
        <div
          onClick={() => resetFilters()}
          className="lg:col-span-5 rounded-2xl border border-primary/30 bg-gradient-to-br from-card via-card to-primary/[0.08] p-5 sm:p-6 shadow-sm flex flex-col justify-between cursor-pointer hover:border-primary/60 transition-all group relative overflow-hidden"
          title="Click to reset filters and view all revenue"
        >
          {/* Subtle background ambient glow */}
          <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-primary/10 blur-2xl pointer-events-none group-hover:bg-primary/20 transition-all" />

          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shadow-xs shrink-0"
                  style={{ background: 'rgba(212, 168, 83, 0.18)', color: '#d4a853' }}
                >
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Recorded Revenue
                  </span>
                  <p className="text-[11px] text-muted-foreground">Primary Sales Volume</p>
                </div>
              </div>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border shrink-0"
                style={{
                  background: 'rgba(212, 168, 83, 0.15)',
                  color: '#d4a853',
                  borderColor: 'rgba(212, 168, 83, 0.3)'
                }}
              >
                Top Metric
              </span>
            </div>

            {/* Giant Hero Number */}
            <div className="my-3">
              <h2 className="text-3xl sm:text-4xl xl:text-[40px] font-extrabold tracking-tight text-foreground leading-none">
                {formatCurrency(totalRevenue)}
              </h2>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Total sales revenue across all partner cafe orders and walk-ins
            </p>
          </div>

          {/* Sub-breakdown: Paid vs Pending Revenue pills */}
          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border/70 mt-2">
            <div className="bg-background/60 border border-border/60 rounded-lg p-2.5">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-500 uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Paid</span>
              </div>
              <p className="text-sm font-bold text-foreground mt-0.5">
                {formatCurrency(paidRevenue)}
              </p>
            </div>
            <div className="bg-background/60 border border-border/60 rounded-lg p-2.5">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-amber-500 uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span>Pending</span>
              </div>
              <p className="text-sm font-bold text-foreground mt-0.5">
                {formatCurrency(pendingRevenue)}
              </p>
            </div>
          </div>
        </div>

        {/* Priority 2, 3, 4: Remaining 3 Secondary Cards */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3.5 items-stretch">
          {/* Card 2: Total Orders */}
          <div
            onClick={() => {
              setStatus('')
              setPaymentStatus('')
              setPage(1)
            }}
            className={`rounded-2xl border p-4 shadow-sm flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.01] ${
              status === '' && paymentStatus === ''
                ? 'border-primary/50 bg-card ring-1 ring-primary/20'
                : 'border-border bg-card hover:border-primary/30'
            }`}
            title="Click to view all orders"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Total Orders</span>
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(212, 168, 83, 0.15)', color: '#d4a853' }}
                >
                  <Coffee className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-foreground mt-3">
                {totalOrdersCount}
              </p>
            </div>
            <div className="pt-3 border-t border-border/60 mt-3">
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <span>Partner cafe orders</span>
              </span>
            </div>
          </div>

          {/* Card 3: Pending Action */}
          <div
            onClick={() => {
              setStatus('pending')
              setPage(1)
            }}
            className={`rounded-2xl border p-4 shadow-sm flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.01] ${
              status === 'pending'
                ? 'border-amber-500/60 bg-amber-500/5 ring-1 ring-amber-500/20'
                : 'border-border bg-card hover:border-amber-500/40'
            }`}
            title="Click to filter pending orders"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-500">Pending Action</span>
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-amber-500 mt-3">
                {orders.filter(o => o.status === 'pending' || o.paymentStatus === 'pending').length}
              </p>
            </div>
            <div className="pt-3 border-t border-border/60 mt-3">
              <span className="text-[11px] text-muted-foreground">
                Needs status / payment
              </span>
            </div>
          </div>

          {/* Card 4: Completed Orders */}
          <div
            onClick={() => {
              setStatus('completed')
              setPage(1)
            }}
            className={`rounded-2xl border p-4 shadow-sm flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.01] ${
              status === 'completed'
                ? 'border-green-500/60 bg-green-500/5 ring-1 ring-green-500/20'
                : 'border-border bg-card hover:border-green-500/40'
            }`}
            title="Click to filter completed orders"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-green-500">Completed</span>
                <div className="w-8 h-8 rounded-lg bg-green-500/10 text-green-500 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-green-500 mt-3">
                {orders.filter(o => o.status === 'completed').length}
              </p>
            </div>
            <div className="pt-3 border-t border-border/60 mt-3">
              <span className="text-[11px] text-muted-foreground">
                Fulfilled cafe orders
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-card border border-border rounded-xl p-4 mb-6 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              placeholder="Search by order #, cafe name, or item..."
              className="w-full pl-9 pr-8 py-2 bg-card text-foreground border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Cafe Dropdown Filter */}
          <div className="min-w-[170px]">
            <select
              value={cafeId}
              onChange={(e) => {
                setCafeId(e.target.value)
                setPage(1)
              }}
              className="w-full px-3 py-2 bg-card text-foreground border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">All Cafes</option>
              {cafes?.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Order Status Filter */}
          <div className="min-w-[140px]">
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value)
                setPage(1)
              }}
              className="w-full px-3 py-2 bg-card text-foreground border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">All Order Statuses</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Payment Status Filter */}
          <div className="min-w-[140px]">
            <select
              value={paymentStatus}
              onChange={(e) => {
                setPaymentStatus(e.target.value)
                setPage(1)
              }}
              className="w-full px-3 py-2 bg-card text-foreground border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">All Payment Statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Payment Pending</option>
            </select>
          </div>

          {/* Date Range */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground whitespace-nowrap">From:</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value)
                  setPage(1)
                }}
                className="px-2.5 py-1.5 bg-card text-foreground border border-border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground whitespace-nowrap">To:</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value)
                  setPage(1)
                }}
                className="px-2.5 py-1.5 bg-card text-foreground border border-border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Clear Filters Button */}
          {isFiltered && (
            <button
              onClick={resetFilters}
              className="px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-accent transition-colors flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
        </div>

        {/* Quick Filter Presets & List Options */}
        <div className="flex items-center justify-between border-t border-border pt-3 text-xs flex-wrap gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-muted-foreground mr-1 text-xs">Quick:</span>
            <button
              onClick={() => {
                setStatus('')
                setPaymentStatus('')
                setPage(1)
              }}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                status === '' && paymentStatus === ''
                  ? 'font-bold shadow-xs'
                  : 'bg-muted hover:bg-accent text-muted-foreground hover:text-foreground'
              }`}
              style={
                status === '' && paymentStatus === ''
                  ? { background: 'rgba(212, 168, 83, 0.22)', color: '#d4a853', border: '1px solid rgba(212, 168, 83, 0.5)' }
                  : { border: '1px solid transparent' }
              }
            >
              All
            </button>
            <button
              onClick={() => {
                setStatus('pending')
                setPage(1)
              }}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                status === 'pending'
                  ? 'font-bold shadow-xs'
                  : 'bg-muted hover:bg-accent text-muted-foreground hover:text-foreground'
              }`}
              style={
                status === 'pending'
                  ? { background: 'rgba(245, 158, 11, 0.22)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.5)' }
                  : { border: '1px solid transparent' }
              }
            >
              Pending Orders
            </button>
            <button
              onClick={() => {
                setStatus('completed')
                setPage(1)
              }}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                status === 'completed'
                  ? 'font-bold shadow-xs'
                  : 'bg-muted hover:bg-accent text-muted-foreground hover:text-foreground'
              }`}
              style={
                status === 'completed'
                  ? { background: 'rgba(34, 197, 94, 0.22)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.5)' }
                  : { border: '1px solid transparent' }
              }
            >
              Completed
            </button>
            <button
              onClick={() => {
                setPaymentStatus('pending')
                setPage(1)
              }}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                paymentStatus === 'pending'
                  ? 'font-bold shadow-xs'
                  : 'bg-muted hover:bg-accent text-muted-foreground hover:text-foreground'
              }`}
              style={
                paymentStatus === 'pending'
                  ? { background: 'rgba(249, 115, 22, 0.22)', color: '#f97316', border: '1px solid rgba(249, 115, 22, 0.5)' }
                  : { border: '1px solid transparent' }
              }
            >
              Unpaid
            </button>
          </div>

          {/* Rows Per Page Selector (Options for Full List) */}
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-xs">Orders per page:</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value))
                setPage(1)
              }}
              className="px-2.5 py-1 bg-card text-foreground border border-border rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-primary font-medium"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={0}>All Orders (Full List)</option>
            </select>
          </div>
        </div>
      </div>

      {/* CONTENT: Table View (Full Order List) or Cards Grid View */}
      {viewMode === 'table' ? (
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground whitespace-nowrap">Order #</th>
                  <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground whitespace-nowrap">Cafe</th>
                  <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground whitespace-nowrap">Date & Time</th>
                  <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground">Items</th>
                  <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground text-right whitespace-nowrap">Total Amount</th>
                  <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground whitespace-nowrap">Payment</th>
                  <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground whitespace-nowrap">Status</th>
                  <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  [...Array(limit || 8)].slice(0, 10).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {[...Array(8)].map((_, j) => (
                        <td key={j} className="px-4 py-4">
                          <div className="h-4 rounded bg-muted/70" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : orders.length > 0 ? (
                  orders.map((order) => {
                    const cafeObj = typeof order.cafeId === 'object' && order.cafeId ? (order.cafeId as Cafe) : null
                    const cafeName = cafeObj ? cafeObj.name : (typeof order.cafeId === 'string' && order.cafeId ? order.cafeId : 'Walk-in')
                    const totalItemsQty = order.items.reduce((acc, item) => acc + item.qty, 0)

                    return (
                      <tr
                        key={order._id}
                        onClick={() => router.push(`/cafe-orders/${order._id}`)}
                        className="hover:bg-accent/40 cursor-pointer transition-colors group"
                      >
                        {/* Order Number */}
                        <td className="px-4 py-3.5 font-mono text-xs font-bold whitespace-nowrap">
                          <Link
                            href={`/cafe-orders/${order._id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="hover:underline underline-offset-4"
                            style={{ color: '#d4a853' }}
                          >
                            {order.orderNumber}
                          </Link>
                        </td>

                        {/* Cafe */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <Store className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <div>
                              <p className="font-medium text-foreground text-sm leading-tight">{cafeName}</p>
                              {cafeObj?.location && (
                                <p className="text-[11px] text-muted-foreground truncate max-w-[180px]">{cafeObj.location}</p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Date */}
                        <td className="px-4 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3 h-3 text-muted-foreground/70" />
                            <span>{formatDateTime(order.createdAt)}</span>
                          </div>
                        </td>

                        {/* Items */}
                        <td className="px-4 py-3.5 max-w-[280px]">
                          <div className="text-xs">
                            <span className="font-semibold text-foreground mr-1.5">
                              {totalItemsQty} {totalItemsQty === 1 ? 'item' : 'items'}:
                            </span>
                            <span className="text-muted-foreground line-clamp-1" title={order.items.map(i => `${i.qty}x ${i.name}`).join(', ')}>
                              {order.items.map((i) => `${i.qty}x ${i.name}`).join(', ')}
                            </span>
                          </div>
                        </td>

                        {/* Total Amount */}
                        <td className="px-4 py-3.5 text-right font-bold text-foreground text-sm whitespace-nowrap">
                          {formatCurrency(order.totalAmount)}
                        </td>

                        {/* Payment */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="flex flex-col gap-1 items-start">
                            <div className="flex items-center gap-1 text-[11px] text-muted-foreground capitalize">
                              <CreditCard className="w-3 h-3" />
                              <span>{order.paymentMethod || '—'}</span>
                            </div>
                            <span
                              className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                order.paymentStatus === 'paid'
                                  ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                  : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                              }`}
                            >
                              {order.paymentStatus}
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <StatusBadge status={order.status as any} />
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <div
                            className="flex items-center justify-end gap-1.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {/* Invoice Button */}
                            <button
                              onClick={() => setInvoiceOrder(order)}
                              className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                              title="View & Print Invoice"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>

                            {/* Edit Button */}
                            <button
                              onClick={() => setEditingOrder(order)}
                              className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                              title="Edit Order"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Quick Status buttons */}
                            {order.status === 'pending' && (
                              <button
                                onClick={() => updateStatus({ id: order._id, status: 'completed' })}
                                className="px-2 py-1 rounded bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white text-[11px] font-semibold transition-all"
                                title="Mark Completed"
                              >
                                Complete
                              </button>
                            )}

                            {order.status === 'completed' && order.paymentStatus === 'pending' && (
                              <button
                                onClick={() => updatePaymentStatus({ id: order._id, paymentStatus: 'paid' })}
                                className="px-2 py-1 rounded bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white text-[11px] font-semibold transition-all"
                                title="Mark Paid"
                              >
                                Mark Paid
                              </button>
                            )}

                            {/* View Detail Link */}
                            <Link
                              href={`/cafe-orders/${order._id}`}
                              className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                              title="View Order Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-muted-foreground">
                      <Coffee className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
                      <p className="font-medium text-foreground">No cafe orders found</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {isFiltered ? 'Try clearing or adjusting your search filters' : 'Create a new cafe order to get started'}
                      </p>
                      {isFiltered && (
                        <button
                          onClick={resetFilters}
                          className="mt-3 px-3 py-1.5 text-xs text-primary font-medium hover:underline"
                        >
                          Clear all filters
                        </button>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls in Table View */}
          <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-border gap-3 bg-muted/20">
            <div className="text-xs text-muted-foreground">
              {meta ? (
                isNoLimit ? (
                  <span>
                    Showing all <strong className="text-foreground">{meta.total}</strong> orders (Full list)
                  </span>
                ) : (
                  <span>
                    Showing{' '}
                    <strong className="text-foreground">
                      {meta.total === 0 ? 0 : (page - 1) * limit + 1}
                    </strong>{' '}
                    to{' '}
                    <strong className="text-foreground">
                      {Math.min(page * limit, meta.total)}
                    </strong>{' '}
                    of <strong className="text-foreground">{meta.total}</strong> orders
                  </span>
                )
              ) : (
                <span>{orders.length} orders</span>
              )}
            </div>

            {!isNoLimit && totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                {/* First Page */}
                <button
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                  className="p-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  title="First Page"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>

                {/* Prev Page */}
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Numbered Page Buttons */}
                <div className="flex items-center gap-1">
                  {getPageNumbers().map((p, idx) =>
                    p === '...' ? (
                      <span key={`dots-${idx}`} className="px-2 text-xs text-muted-foreground">
                        ...
                      </span>
                    ) : (
                      <button
                        key={`page-${p}`}
                        onClick={() => setPage(Number(p))}
                        className={`min-w-[28px] h-7 px-2 rounded-md text-xs font-medium transition-all ${
                          page === p
                            ? 'font-bold shadow-xs'
                            : 'border border-border text-muted-foreground hover:text-foreground hover:bg-accent'
                        }`}
                        style={
                          page === p
                            ? { background: 'rgba(212, 168, 83, 0.25)', color: '#d4a853', border: '1px solid rgba(212, 168, 83, 0.6)' }
                            : {}
                        }
                      >
                        {p}
                      </button>
                    )
                  )}
                </div>

                {/* Next Page */}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  title="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* Last Page */}
                <button
                  onClick={() => setPage(totalPages)}
                  disabled={page >= totalPages}
                  className="p-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  title="Last Page"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Grid / Cards View */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {isLoading ? (
              [...Array(6)].map((_, i) => (
                <div key={i} className="h-56 rounded-xl bg-card border border-border animate-pulse" />
              ))
            ) : orders.length > 0 ? (
              orders.map((order) => {
                const cafeObj = typeof order.cafeId === 'object' && order.cafeId ? (order.cafeId as Cafe) : null
                const cafeName = cafeObj ? cafeObj.name : (typeof order.cafeId === 'string' && order.cafeId ? order.cafeId : 'Walk-in')

                return (
                  <div
                    key={order._id}
                    className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-all group flex flex-col justify-between shadow-sm"
                  >
                    <div>
                      {/* Top Header: Cafe Name & Status Badge */}
                      <div className="flex justify-between items-start gap-2 mb-2 pb-2 border-b border-border/60">
                        <div className="flex items-center gap-1.5 truncate">
                          <Store className="w-3.5 h-3.5 shrink-0" style={{ color: '#d4a853' }} />
                          <span className="font-semibold text-foreground text-sm truncate" title={cafeName}>
                            {cafeName}
                          </span>
                        </div>
                        <StatusBadge status={order.status as any} />
                      </div>

                      {/* Order Number & Amount */}
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <Link
                            href={`/cafe-orders/${order._id}`}
                            className="font-mono text-sm font-bold hover:underline underline-offset-4 block mb-1"
                            style={{ color: '#d4a853' }}
                          >
                            {order.orderNumber}
                          </Link>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3 text-muted-foreground/70" />
                            <span>{formatDateTime(order.createdAt)}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-lg font-bold text-foreground">
                            {formatCurrency(order.totalAmount)}
                          </span>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                              <CreditCard className="w-3 h-3" />
                              {order.paymentMethod}
                            </span>
                            <span
                              className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                order.paymentStatus === 'paid'
                                  ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                  : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                              }`}
                            >
                              {order.paymentStatus}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Items List */}
                      <div className="space-y-1.5 mb-4 max-h-[120px] overflow-y-auto pr-1">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-xs py-0.5">
                            <span className="text-muted-foreground truncate mr-2">
                              <span className="font-semibold text-foreground">{item.qty}x</span> {item.name}
                            </span>
                            <span className="text-foreground/80 font-medium shrink-0">
                              {formatCurrency(item.subtotal)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div>
                      <div className="flex items-center gap-2 pt-3 border-t border-border">
                        {order.status === 'pending' && (
                          <>
                            <button
                              onClick={() => updateStatus({ id: order._id, status: 'completed' })}
                              className="flex-1 py-1.5 rounded-lg bg-green-500/10 text-green-500 text-xs font-semibold hover:bg-green-500 hover:text-white transition-all text-center"
                            >
                              Complete
                            </button>
                            <button
                              onClick={() => updateStatus({ id: order._id, status: 'cancelled' })}
                              className="px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-500 text-xs font-semibold hover:bg-red-500 hover:text-white transition-all"
                            >
                              Cancel
                            </button>
                          </>
                        )}

                        {order.status === 'completed' && order.paymentStatus === 'pending' && (
                          <button
                            onClick={() => updatePaymentStatus({ id: order._id, paymentStatus: 'paid' })}
                            className="flex-1 py-1.5 rounded-lg bg-amber-500/10 text-amber-500 text-xs font-semibold hover:bg-amber-500 hover:text-white transition-all text-center"
                          >
                            Mark as Paid
                          </button>
                        )}

                        {order.status === 'completed' && order.paymentStatus === 'paid' && (
                          <div className="flex-1 py-1.5 rounded-lg bg-emerald-500/5 text-emerald-500/80 text-[10px] font-bold uppercase tracking-widest text-center border border-emerald-500/20">
                            Paid & Completed
                          </div>
                        )}

                        {/* Invoice Modal Trigger */}
                        <button
                          onClick={() => setInvoiceOrder(order)}
                          className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                          title="Invoice"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit Button */}
                        <button
                          onClick={() => setEditingOrder(order)}
                          className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                          title="Edit Order"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* View Details */}
                        <Link
                          href={`/cafe-orders/${order._id}`}
                          className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                          title="Order Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="col-span-full py-16 text-center bg-card border border-border rounded-xl">
                <Coffee className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
                <p className="font-medium text-foreground">No cafe orders found</p>
                <p className="text-xs text-muted-foreground mt-1">Try clearing filters or creating an order</p>
              </div>
            )}
          </div>

          {/* Pagination Controls in Grid View */}
          <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 bg-card border border-border rounded-xl gap-3 shadow-sm">
            <div className="text-xs text-muted-foreground">
              {meta ? (
                isNoLimit ? (
                  <span>
                    Showing all <strong className="text-foreground">{meta.total}</strong> orders (Full list)
                  </span>
                ) : (
                  <span>
                    Showing{' '}
                    <strong className="text-foreground">
                      {meta.total === 0 ? 0 : (page - 1) * limit + 1}
                    </strong>{' '}
                    to{' '}
                    <strong className="text-foreground">
                      {Math.min(page * limit, meta.total)}
                    </strong>{' '}
                    of <strong className="text-foreground">{meta.total}</strong> orders
                  </span>
                )
              ) : (
                <span>{orders.length} orders</span>
              )}
            </div>

            {!isNoLimit && totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                  className="p-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  title="First Page"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1">
                  {getPageNumbers().map((p, idx) =>
                    p === '...' ? (
                      <span key={`dots-grid-${idx}`} className="px-2 text-xs text-muted-foreground">
                        ...
                      </span>
                    ) : (
                      <button
                        key={`page-grid-${p}`}
                        onClick={() => setPage(Number(p))}
                        className={`min-w-[28px] h-7 px-2 rounded-md text-xs font-medium transition-all ${
                          page === p
                            ? 'font-bold shadow-xs'
                            : 'border border-border text-muted-foreground hover:text-foreground hover:bg-accent'
                        }`}
                        style={
                          page === p
                            ? { background: 'rgba(212, 168, 83, 0.25)', color: '#d4a853', border: '1px solid rgba(212, 168, 83, 0.6)' }
                            : {}
                        }
                      >
                        {p}
                      </button>
                    )
                  )}
                </div>

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  title="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage(totalPages)}
                  disabled={page >= totalPages}
                  className="p-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  title="Last Page"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      {showCreate && <CreateCafeOrderModal onClose={() => setShowCreate(false)} />}
      {editingOrder && <EditCafeOrderModal order={editingOrder} onClose={() => setEditingOrder(null)} />}
      {invoiceOrder && <CafeInvoiceModal order={invoiceOrder} onClose={() => setInvoiceOrder(null)} />}
    </>
  )
}
