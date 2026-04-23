'use client'
import { useState } from 'react'
import { subDays, format } from 'date-fns'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { PageHeader } from '@/components/layout/PageHeader'
import { RevenueChart } from '@/components/dashboard/RevenueChart'
import { OrdersDonutChart } from '@/components/dashboard/OrdersDonutChart'
import { useRevenue, useOrdersByStatus, useTopProducts, useCustomersGrowth } from '@/hooks/useAnalytics'
import { formatCurrency } from '@/lib/utils'

const fmt = (d: Date) => format(d, 'yyyy-MM-dd')

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg px-3 py-2 text-xs border border-border bg-popover shadow-lg">
      <p className="text-muted-foreground mb-1">{label}</p>
      <p className="font-semibold" style={{ color: '#d4a853' }}>{payload[0].value}</p>
    </div>
  )
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const [from, setFrom] = useState(fmt(subDays(new Date(), 30)))
  const [to, setTo] = useState(fmt(new Date()))

  const { data: revenue, isLoading: revLoading } = useRevenue(period, from, to)
  const { data: statusData, isLoading: statusLoading } = useOrdersByStatus()
  const { data: topProducts, isLoading: topLoading } = useTopProducts()
  const { data: growth, isLoading: growthLoading } = useCustomersGrowth(from, to)

  const totalRevenue = revenue?.reduce((s, p) => s + p.revenue, 0) || 0
  const totalOrders = revenue?.reduce((s, p) => s + p.orders, 0) || 0

  const growthChartData = growth?.map((g: any) => ({
    label: `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][(g._id.month||1)-1]}`,
    customers: g.newCustomers,
  })) || []

  const topChartData = topProducts?.map(p => ({ name: p.name.split(' ').slice(0, 2).join(' '), revenue: p.revenue, units: p.unitsSold })) || []

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" description="Revenue, orders and growth data" />

      {/* Date controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">From</label>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} style={{ width: 'auto' }} />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">To</label>
          <input type="date" value={to} onChange={e => setTo(e.target.value)} style={{ width: 'auto' }} />
        </div>
        <button onClick={() => { setFrom(fmt(subDays(new Date(), 30))); setTo(fmt(new Date())) }}
          className="px-3 py-2 text-xs border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
          Last 30 days
        </button>
        <button onClick={() => { setFrom(fmt(subDays(new Date(), 90))); setTo(fmt(new Date())) }}
          className="px-3 py-2 text-xs border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
          Last 90 days
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Total revenue</p>
          <p className="text-2xl font-bold" style={{ color: '#d4a853' }}>{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Total orders</p>
          <p className="text-2xl font-bold text-foreground">{totalOrders}</p>
        </div>
      </div>

      {/* Revenue chart */}
      <RevenueChart data={revenue} period={period} onPeriodChange={setPeriod} isLoading={revLoading} />

      {/* 3 charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Orders by status */}
        <OrdersDonutChart data={statusData} isLoading={statusLoading} />

        {/* Top products bar chart */}
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm font-medium text-foreground mb-1">Top products by revenue</p>
          <p className="text-xs text-muted-foreground mb-4">Top 5 all time</p>
          {topLoading ? (
            <div className="h-48 rounded bg-muted animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={topChartData} layout="vertical" margin={{ left: 0, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false}
                  tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} width={80} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="revenue" fill="#d4a853" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Customer growth */}
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm font-medium text-foreground mb-1">Customer growth</p>
          <p className="text-xs text-muted-foreground mb-4">New customers per month</p>
          {growthLoading ? (
            <div className="h-48 rounded bg-muted animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={growthChartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="customers" stroke="#1D9E75" strokeWidth={2} dot={false} activeDot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top products table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <p className="text-sm font-medium text-foreground">Top products detail</p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              {['Rank', 'Product', 'Units sold', 'Revenue'].map(h =>
                <th key={h} className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {topProducts?.map((p, i) => (
              <tr key={p._id} className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
                <td className="px-5 py-3">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold"
                    style={i === 0 ? { background: 'rgba(212,168,83,0.2)', color: '#d4a853' } : { background: 'var(--muted)', color: 'var(--muted-foreground)' }}>
                    {i + 1}
                  </span>
                </td>
                <td className="px-5 py-3 font-medium text-foreground">{p.name}</td>
                <td className="px-5 py-3 text-muted-foreground">{p.unitsSold}</td>
                <td className="px-5 py-3 font-semibold" style={{ color: '#d4a853' }}>{formatCurrency(p.revenue)}</td>
              </tr>
            ))}
            {!topProducts?.length && <tr><td colSpan={4} className="px-5 py-8 text-center text-muted-foreground">No data yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
