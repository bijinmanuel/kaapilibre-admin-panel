'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingCart, DollarSign, Users, Clock, AlertTriangle } from 'lucide-react'
import { StatCard } from '@/components/dashboard/StatCard'
import { RevenueChart } from '@/components/dashboard/RevenueChart'
import { OrdersDonutChart } from '@/components/dashboard/OrdersDonutChart'
import { PageHeader } from '@/components/layout/PageHeader'
import { useOverview, useRevenue, useOrdersByStatus, useTopProducts, useRecentOrders } from '@/hooks/useAnalytics'
import { useIsAdmin } from '@/store/authStore'
import { formatCurrency, formatDateTime, STATUS_COLORS } from '@/lib/utils'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { OrderStatus } from '@/types'

export default function DashboardPage() {
  const isAdmin = useIsAdmin()
  const router = useRouter()
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily')

  const { data: overview, isLoading: overviewLoading } = useOverview()
  const { data: revenue, isLoading: revenueLoading } = useRevenue(period)
  const { data: statusData, isLoading: statusLoading } = useOrdersByStatus()
  const { data: topProducts, isLoading: topLoading } = useTopProducts()
  const { data: recentOrders, isLoading: recentLoading } = useRecentOrders()

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Welcome back to KaapiLibre Admin" />

      {/* Priority-Based KPI Stats Bar */}
      {isAdmin ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          {/* Priority 1: Hero / Big Card (Total Revenue) */}
          <div
            onClick={() => router.push('/orders')}
            className="lg:col-span-5 rounded-2xl border border-primary/30 bg-gradient-to-br from-card via-card to-primary/[0.08] p-5 sm:p-6 shadow-sm flex flex-col justify-between cursor-pointer hover:border-primary/60 transition-all group relative overflow-hidden"
            title="Click to view all orders"
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
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Total Revenue
                    </span>
                    <p className="text-[11px] text-muted-foreground">Store & Online Sales</p>
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
                {overviewLoading ? (
                  <div className="h-10 w-44 rounded bg-muted animate-pulse my-2" />
                ) : (
                  <h2 className="text-3xl sm:text-4xl xl:text-[40px] font-extrabold tracking-tight text-foreground leading-none">
                    {formatCurrency(overview?.revenue ?? 0)}
                  </h2>
                )}
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Aggregated sales volume across all products and retail channels
              </p>
            </div>

            {/* Sub-breakdown mini-cards */}
            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border/70 mt-2">
              <div className="bg-background/60 border border-border/60 rounded-lg p-2.5">
                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-500 uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Total Orders</span>
                </div>
                <p className="text-sm font-bold text-foreground mt-0.5">
                  {overviewLoading ? '...' : (overview?.totalOrders ?? 0)}
                </p>
              </div>
              <div className="bg-background/60 border border-border/60 rounded-lg p-2.5">
                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-blue-400 uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  <span>Customers</span>
                </div>
                <p className="text-sm font-bold text-foreground mt-0.5">
                  {overviewLoading ? '...' : (overview?.customers ?? 0)}
                </p>
              </div>
            </div>
          </div>

          {/* Priority 2, 3, 4, 5: Secondary Small Cards (2 on top, 2 below) */}
          <div className="lg:col-span-7 grid grid-cols-2 gap-3.5 items-stretch">
            {/* Orders Card */}
            <div
              onClick={() => router.push('/orders')}
              className="rounded-2xl border border-border bg-card p-4 shadow-sm flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.01] hover:border-primary/40"
              title="Click to view orders"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">Orders</span>
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(212, 168, 83, 0.15)', color: '#d4a853' }}
                  >
                    <ShoppingCart className="w-4 h-4" />
                  </div>
                </div>
                {overviewLoading ? (
                  <div className="h-8 w-16 rounded bg-muted animate-pulse mt-3" />
                ) : (
                  <p className="text-2xl sm:text-3xl font-bold text-foreground mt-3">
                    {overview?.totalOrders ?? 0}
                  </p>
                )}
              </div>
              <div className="pt-3 border-t border-border/60 mt-3">
                <span className="text-[11px] text-muted-foreground">Store & website</span>
              </div>
            </div>

            {/* Customers Card */}
            <div
              onClick={() => router.push('/customers')}
              className="rounded-2xl border border-border bg-card p-4 shadow-sm flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.01] hover:border-blue-500/40"
              title="Click to view customers"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-blue-400">Customers</span>
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                {overviewLoading ? (
                  <div className="h-8 w-16 rounded bg-muted animate-pulse mt-3" />
                ) : (
                  <p className="text-2xl sm:text-3xl font-bold text-foreground mt-3">
                    {overview?.customers ?? 0}
                  </p>
                )}
              </div>
              <div className="pt-3 border-t border-border/60 mt-3">
                <span className="text-[11px] text-muted-foreground">Active buyers</span>
              </div>
            </div>

            {/* Pending Orders Card */}
            <div
              onClick={() => router.push('/orders?status=pending')}
              className="rounded-2xl border border-border bg-card p-4 shadow-sm flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.01] hover:border-amber-500/40"
              title="Click to view pending orders"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-500">Pending</span>
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                {overviewLoading ? (
                  <div className="h-8 w-16 rounded bg-muted animate-pulse mt-3" />
                ) : (
                  <p className="text-2xl sm:text-3xl font-bold text-amber-500 mt-3">
                    {overview?.pendingOrders ?? 0}
                  </p>
                )}
              </div>
              <div className="pt-3 border-t border-border/60 mt-3">
                <span className="text-[11px] text-muted-foreground">To dispatch</span>
              </div>
            </div>

            {/* Low Stock Alert Card */}
            <div
              onClick={() => router.push('/inventory')}
              className="rounded-2xl border border-border bg-card p-4 shadow-sm flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.01] hover:border-red-500/40"
              title="Click to view inventory"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-red-500">Low Stock</span>
                  <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                </div>
                {overviewLoading ? (
                  <div className="h-8 w-16 rounded bg-muted animate-pulse mt-3" />
                ) : (
                  <p className="text-2xl sm:text-3xl font-bold text-red-500 mt-3">
                    {overview?.lowStockCount ?? 0}
                  </p>
                )}
              </div>
              <div className="pt-3 border-t border-border/60 mt-3">
                <span className="text-[11px] text-muted-foreground">Items to restock</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Non-Admin Layout */
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div
            onClick={() => router.push('/orders')}
            className="rounded-2xl border border-primary/30 bg-gradient-to-br from-card via-card to-primary/[0.08] p-5 shadow-sm flex flex-col justify-between cursor-pointer hover:border-primary/60 transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-muted-foreground uppercase">Total Orders</span>
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(212, 168, 83, 0.18)', color: '#d4a853' }}
              >
                <ShoppingCart className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground">{overview?.totalOrders ?? 0}</p>
          </div>
          <div
            onClick={() => router.push('/orders?status=pending')}
            className="rounded-2xl border border-border bg-card p-5 shadow-sm flex flex-col justify-between cursor-pointer hover:border-amber-500/40 transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-amber-500 uppercase">Pending</span>
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-bold text-amber-500">{overview?.pendingOrders ?? 0}</p>
          </div>
          <div
            onClick={() => router.push('/inventory')}
            className="rounded-2xl border border-border bg-card p-5 shadow-sm flex flex-col justify-between cursor-pointer hover:border-red-500/40 transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-red-500 uppercase">Low Stock</span>
              <div className="w-9 h-9 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-bold text-red-500">{overview?.lowStockCount ?? 0}</p>
          </div>
        </div>
      )}

      {/* Charts — admin only */}
      {isAdmin && (
        <>
          <RevenueChart data={revenue} period={period} onPeriodChange={setPeriod} isLoading={revenueLoading} />
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <OrdersDonutChart data={statusData} isLoading={statusLoading} />
            </div>
            <div className="lg:col-span-3 rounded-xl border border-border bg-card p-5">
              <p className="text-sm font-medium text-foreground mb-4">Top products</p>
              {topLoading ? (
                <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-8 rounded bg-muted animate-pulse" />)}</div>
              ) : (
                <div className="space-y-3">
                  {topProducts?.map((p, i) => (
                    <div key={p._id} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.unitsSold} units</p>
                      </div>
                      <span className="text-sm font-semibold" style={{ color: '#d4a853' }}>{formatCurrency(p.revenue)}</span>
                    </div>
                  ))}
                  {!topProducts?.length && <p className="text-sm text-muted-foreground">No data yet</p>}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Recent orders table */}
      <div className="rounded-xl border border-border bg-card">
        <div className="px-5 py-4 border-b border-border">
          <p className="text-sm font-medium text-foreground">Recent orders</p>
        </div>
        <div className="overflow-x-auto">
          {recentLoading ? (
            <div className="p-4 space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-10 rounded bg-muted animate-pulse" />)}</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {['Order #', 'Customer', 'Status', 'Total', 'Date'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentOrders?.map(order => (
                  <tr key={order._id}
                    onClick={() => router.push(`/orders/${order._id}`)}
                    className="border-b border-border last:border-0 hover:bg-accent/50 cursor-pointer transition-colors">
                    <td className="px-5 py-3 font-mono text-xs" style={{ color: '#d4a853' }}>{order.orderNumber}</td>
                    <td className="px-5 py-3 text-foreground">{order.customer?.name}</td>
                    <td className="px-5 py-3"><StatusBadge status={order.status as OrderStatus} /></td>
                    <td className="px-5 py-3 font-medium text-foreground">{formatCurrency(order.totalAmount)}</td>
                    <td className="px-5 py-3 text-muted-foreground text-xs">{formatDateTime(order.createdAt)}</td>
                  </tr>
                ))}
                {!recentOrders?.length && (
                  <tr><td colSpan={5} className="px-5 py-8 text-center text-muted-foreground text-sm">No orders yet</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
