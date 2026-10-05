'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ShoppingCart, DollarSign, Store, TrendingUp } from 'lucide-react'
import { DashboardHeader } from '@/components/cafe-dashboard/DashboardHeader'
import { useGlobalCafeAnalytics, useCafeOrders } from '@/hooks/useCafeOrders'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line 
} from 'recharts'

export default function CafeDashboardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const region = searchParams.get('region') || ''

  const { data: analytics, isLoading: analyticsLoading } = useGlobalCafeAnalytics()
  const { data: ordersData, isLoading: ordersLoading } = useCafeOrders({ limit: 100 })

  // Calculate MoM Drop for Banner
  const monthlyStats = analytics?.monthlyStats || []
  let showBanner = false
  let bannerGap = 0
  
  if (monthlyStats.length >= 2) {
    const current = monthlyStats[monthlyStats.length - 1]
    const previous = monthlyStats[monthlyStats.length - 2]
    if (previous.amount > current.amount) {
      showBanner = true
      bannerGap = previous.amount - current.amount
    }
  }

  // Filter cafe breakdown by region
  const filteredBreakdown = analytics?.cafeBreakdown?.filter((c: any) => !region || c.region === region) || []

  // Filter orders by region
  const filteredOrders = ordersData?.data?.filter((order: any) => {
    if (!region) return true
    return (order.cafeId as any)?.region === region
  }).slice(0, 10) || []

  // Re-calculate Summary Cards based on Region Filter
  const totalPaid = region 
    ? filteredBreakdown.reduce((sum: number, c: any) => sum + c.paidRevenue, 0)
    : (analytics?.totalPaid ?? 0)

  const totalPending = region
    ? filteredBreakdown.reduce((sum: number, c: any) => sum + c.pendingRevenue, 0)
    : (analytics?.totalPending ?? 0)

  const totalOrders = region
    ? filteredBreakdown.reduce((sum: number, c: any) => sum + c.orders, 0)
    : (analytics?.totalOrders ?? 0)

  const activeCafes = region
    ? filteredBreakdown.length
    : (analytics?.cafeBreakdown?.length ?? 0)

  const totalRevenue = totalPaid + totalPending
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

  const revenueData = analytics?.monthlyStats?.map((s: any) => ({
    label: s.month,
    revenue: s.amount,
    orders: s.count
  })) || []

  return (
    <div className="space-y-6">
      <DashboardHeader 
        title="Cafe Analytics Overview" 
        description="Aggregated business intelligence for all cafe locations" 
        showBanner={showBanner}
        bannerGap={bannerGap}
      />

      {/* Priority-Based KPI Stats Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6 items-stretch">
        {/* Priority 1: Hero / Big Card (Total Cafe Revenue) */}
        <div
          onClick={() => router.push('/cafe-orders')}
          className="lg:col-span-5 rounded-2xl border border-primary/30 bg-gradient-to-br from-card via-card to-primary/[0.08] p-5 sm:p-6 shadow-sm flex flex-col justify-between cursor-pointer hover:border-primary/60 transition-all group relative overflow-hidden"
          title="Click to view cafe orders"
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
                    Total Cafe Revenue
                  </span>
                  <p className="text-[11px] text-muted-foreground">All Locations & Walk-ins</p>
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
              {analyticsLoading ? (
                <div className="h-10 w-44 rounded bg-muted animate-pulse my-2" />
              ) : (
                <h2 className="text-3xl sm:text-4xl xl:text-[40px] font-extrabold tracking-tight text-foreground leading-none">
                  {formatCurrency(totalRevenue)}
                </h2>
              )}
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Combined billed revenue from partner cafes and physical store sales
            </p>
          </div>

          {/* Sub-breakdown mini-cards: Paid vs Pending */}
          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border/70 mt-2">
            <div className="bg-background/60 border border-border/60 rounded-lg p-2.5">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-500 uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Paid</span>
              </div>
              <p className="text-sm font-bold text-foreground mt-0.5">
                {analyticsLoading ? '...' : formatCurrency(totalPaid)}
              </p>
            </div>
            <div className="bg-background/60 border border-border/60 rounded-lg p-2.5">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-amber-500 uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span>Pending</span>
              </div>
              <p className="text-sm font-bold text-foreground mt-0.5">
                {analyticsLoading ? '...' : formatCurrency(totalPending)}
              </p>
            </div>
          </div>
        </div>

        {/* Priority 2, 3, 4: Remaining 3 Secondary Cards */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3.5 items-stretch">
          {/* Card 2: Total Orders */}
          <div
            onClick={() => router.push('/cafe-orders')}
            className="rounded-2xl border border-border bg-card p-4 shadow-sm flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.01] hover:border-primary/40"
            title="Click to view cafe orders"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Total Orders</span>
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(212, 168, 83, 0.15)', color: '#d4a853' }}
                >
                  <ShoppingCart className="w-4 h-4" />
                </div>
              </div>
              {analyticsLoading ? (
                <div className="h-8 w-16 rounded bg-muted animate-pulse mt-3" />
              ) : (
                <p className="text-2xl sm:text-3xl font-bold text-foreground mt-3">
                  {totalOrders}
                </p>
              )}
            </div>
            <div className="pt-3 border-t border-border/60 mt-3">
              <span className="text-[11px] text-muted-foreground">Cafe order volume</span>
            </div>
          </div>

          {/* Card 3: Active Cafes */}
          <div
            onClick={() => router.push('/cafes')}
            className="rounded-2xl border border-border bg-card p-4 shadow-sm flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.01] hover:border-blue-500/40"
            title="Click to view cafes"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-blue-400">Active Cafes</span>
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                  <Store className="w-4 h-4" />
                </div>
              </div>
              {analyticsLoading ? (
                <div className="h-8 w-16 rounded bg-muted animate-pulse mt-3" />
              ) : (
                <p className="text-2xl sm:text-3xl font-bold text-foreground mt-3">
                  {activeCafes}
                </p>
              )}
            </div>
            <div className="pt-3 border-t border-border/60 mt-3">
              <span className="text-[11px] text-muted-foreground">Partner branches</span>
            </div>
          </div>

          {/* Card 4: Avg Order Value */}
          <div
            className="rounded-2xl border border-border bg-card p-4 shadow-sm flex flex-col justify-between transition-all hover:border-purple-500/40"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-purple-400">Avg. Order Value</span>
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              {analyticsLoading ? (
                <div className="h-8 w-20 rounded bg-muted animate-pulse mt-3" />
              ) : (
                <p className="text-2xl sm:text-3xl font-bold text-foreground mt-3">
                  {formatCurrency(avgOrderValue)}
                </p>
              )}
            </div>
            <div className="pt-3 border-t border-border/60 mt-3">
              <span className="text-[11px] text-muted-foreground">Per order basket</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Revenue Growth Chart */}
        <div className="lg:col-span-3 rounded-xl border border-border bg-card p-6">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-foreground">Revenue Growth</h3>
            <p className="text-xs text-muted-foreground">Monthly revenue across all cafes</p>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height={250} minWidth={0} debounce={100}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="label" 
                  tick={{ fontSize: 12, fill: '#888' }} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: '#888' }} 
                  axisLine={false} 
                  tickLine={false} 
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  contentStyle={{ background: '#1a1713', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                />
                <Line type="monotone" dataKey="revenue" stroke="#d4a853" strokeWidth={3} dot={{ r: 4, fill: '#d4a853' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-foreground">Top Products</h3>
            <p className="text-xs text-muted-foreground">Best selling items across all cafes</p>
          </div>
          <div className="space-y-4">
            {analytics?.topProducts?.map((p: any, i: number) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{p._id}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{p.totalQty} units sold</p>
                </div>
                <p className="text-sm font-bold" style={{ color: '#d4a853' }}>{formatCurrency(p.totalRevenue)}</p>
              </div>
            ))}
            {!analytics?.topProducts?.length && <p className="text-sm text-muted-foreground text-center py-8">No product data yet</p>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="text-lg font-bold text-foreground">Monthly Performance</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/30 text-muted-foreground">
                <th className="text-left px-6 py-3 font-medium text-[10px] uppercase">Month</th>
                <th className="text-left px-6 py-3 font-medium text-[10px] uppercase">Orders</th>
                <th className="text-right px-6 py-3 font-medium text-[10px] uppercase">Total Invoiced</th>
                <th className="text-right px-6 py-3 font-medium text-[10px] uppercase">Actually Paid</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {analytics?.monthlyStats?.map((s: any) => (
                <tr key={s.month}>
                  <td className="px-6 py-3 font-medium">{s.month}</td>
                  <td className="px-6 py-3">{s.count}</td>
                  <td className="px-6 py-3 text-right font-bold text-muted-foreground">{formatCurrency(s.amount)}</td>
                  <td className="px-6 py-3 text-right font-bold text-green-500">{formatCurrency(s.paidAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Cafe Breakdown Chart */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-foreground">Revenue by Location</h3>
            <p className="text-xs text-muted-foreground">Top performing cafe branches</p>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height={200} minWidth={0} debounce={100}>
              <BarChart data={filteredBreakdown} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis 
                  type="number"
                  tick={{ fontSize: 12, fill: '#888' }} 
                  axisLine={false} 
                  tickLine={false} 
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <YAxis 
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 12, fill: '#888' }} 
                  axisLine={false} 
                  tickLine={false} 
                  width={100}
                />
                <Tooltip 
                  contentStyle={{ background: '#1a1713', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                />
                <Bar dataKey="revenue" fill="#60a5fa" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground">Recent Cafe Orders</h3>
          <button 
            onClick={() => router.push('/cafe-orders')}
            className="text-xs font-medium text-primary hover:underline"
          >
            View All Orders
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/30 border-b border-border text-muted-foreground">
                <th className="text-left px-6 py-4 font-medium uppercase tracking-wider text-[10px]">Order #</th>
                <th className="text-left px-6 py-4 font-medium uppercase tracking-wider text-[10px]">Cafe</th>
                <th className="text-left px-6 py-4 font-medium uppercase tracking-wider text-[10px]">Total</th>
                <th className="text-left px-6 py-4 font-medium uppercase tracking-wider text-[10px]">Method</th>
                <th className="text-left px-6 py-4 font-medium uppercase tracking-wider text-[10px]">Payment</th>
                <th className="text-left px-6 py-4 font-medium uppercase tracking-wider text-[10px]">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredOrders.map((order) => (
                <tr 
                  key={order._id}
                  onClick={() => router.push(`/cafe-orders/${order._id}`)}
                  className="hover:bg-accent/30 transition-colors cursor-pointer"
                >
                  <td className="px-6 py-4 font-mono text-xs text-primary font-bold">{order.orderNumber}</td>
                  <td className="px-6 py-4 text-foreground font-medium">{(order.cafeId as any)?.name}</td>
                  <td className="px-6 py-4 font-bold" style={{ color: '#d4a853' }}>{formatCurrency(order.totalAmount)}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase bg-white/5 border border-white/10 text-muted-foreground">
                      {order.paymentMethod}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${
                      order.paymentStatus === 'paid' ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'
                    }`}>
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-muted-foreground">{formatDateTime(order.createdAt)}</td>
                </tr>
              ))}
              {!filteredOrders.length && !ordersLoading && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">No recent cafe orders found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
