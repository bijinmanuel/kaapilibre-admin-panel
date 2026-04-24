'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingCart, DollarSign, Store, TrendingUp } from 'lucide-react'
import { StatCard } from '@/components/dashboard/StatCard'
import { PageHeader } from '@/components/layout/PageHeader'
import { useGlobalCafeAnalytics, useCafeOrders } from '@/hooks/useCafeOrders'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line 
} from 'recharts'

export default function CafeDashboardPage() {
  const router = useRouter()
  const { data: analytics, isLoading: analyticsLoading } = useGlobalCafeAnalytics()
  const { data: ordersData, isLoading: ordersLoading } = useCafeOrders({ limit: 10 })

  const revenueData = analytics?.monthlyStats?.map((s: any) => ({
    label: s.month,
    revenue: s.amount,
    orders: s.count
  })) || []

  return (
    <div className="space-y-6">
      <PageHeader title="Cafe Analytics" description="Aggregated business intelligence for all cafe locations" />

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Cafe Revenue" 
          value={formatCurrency(analytics?.totalRevenue ?? 0)} 
          icon={DollarSign} 
          iconColor="#22c55e" 
          isLoading={analyticsLoading} 
        />
        <StatCard 
          title="Total Cafe Orders" 
          value={analytics?.totalOrders ?? 0} 
          icon={ShoppingCart} 
          iconColor="#d4a853"
          isLoading={analyticsLoading} 
        />
        <StatCard 
          title="Active Cafes" 
          value={analytics?.cafeBreakdown?.length ?? 0} 
          icon={Store} 
          iconColor="#60a5fa"
          isLoading={analyticsLoading} 
        />
        <StatCard 
          title="Avg. Order Value" 
          value={formatCurrency(analytics?.totalOrders > 0 ? analytics.totalRevenue / analytics.totalOrders : 0)} 
          icon={TrendingUp} 
          iconColor="#8b5cf6"
          isLoading={analyticsLoading} 
        />
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
                <th className="text-right px-6 py-3 font-medium text-[10px] uppercase">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {analytics?.monthlyStats?.map((s: any) => (
                <tr key={s.month}>
                  <td className="px-6 py-3 font-medium">{s.month}</td>
                  <td className="px-6 py-3">{s.count}</td>
                  <td className="px-6 py-3 text-right font-bold" style={{ color: '#d4a853' }}>{formatCurrency(s.amount)}</td>
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
              <BarChart data={analytics?.cafeBreakdown || []} layout="vertical">
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
                <th className="text-left px-6 py-4 font-medium uppercase tracking-wider text-[10px]">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {ordersData?.data?.map((order) => (
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
                  <td className="px-6 py-4 text-xs text-muted-foreground">{formatDateTime(order.createdAt)}</td>
                </tr>
              ))}
              {!ordersData?.data?.length && !ordersLoading && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">No recent cafe orders found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
