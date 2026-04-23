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

      {/* Stat cards */}
      <div className={`grid gap-4 ${isAdmin ? 'grid-cols-2 lg:grid-cols-5' : 'grid-cols-1 sm:grid-cols-3'}`}>
        <StatCard title="Total Orders" value={overview?.totalOrders ?? 0} icon={ShoppingCart} isLoading={overviewLoading} />
        {isAdmin && <StatCard title="Revenue" value={formatCurrency(overview?.revenue ?? 0)} icon={DollarSign} iconColor="#22c55e" isLoading={overviewLoading} />}
        {isAdmin && <StatCard title="Customers" value={overview?.customers ?? 0} icon={Users} iconColor="#60a5fa" isLoading={overviewLoading} />}
        <StatCard title="Pending" value={overview?.pendingOrders ?? 0} icon={Clock} iconColor="#f59e0b" isLoading={overviewLoading} />
        <StatCard title="Low Stock" value={overview?.lowStockCount ?? 0} icon={AlertTriangle} iconColor="#ef4444" isLoading={overviewLoading} />
      </div>

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
