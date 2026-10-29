'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ShoppingCart, DollarSign, Store, TrendingUp, TrendingDown, Award, CheckCircle2, Clock } from 'lucide-react'
import { DashboardHeader } from '@/components/cafe-dashboard/DashboardHeader'
import { useGlobalCafeAnalytics, useCafeOrders } from '@/hooks/useCafeOrders'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts'

export default function CafeDashboardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const region = searchParams.get('region') || ''
  const [chartMounted, setChartMounted] = useState(false)
  const [growthMetric, setGrowthMetric] = useState<'revenue' | 'orders' | 'aov'>('revenue')
  const [timeRange, setTimeRange] = useState<'3m' | '6m' | 'all'>('all')

  useEffect(() => {
    setChartMounted(true)
  }, [])

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
    paid: s.paidAmount ?? s.amount,
    pending: Math.max(0, (s.amount ?? 0) - (s.paidAmount ?? 0)),
    orders: s.count,
    aov: s.count > 0 ? Math.round((s.amount ?? 0) / s.count) : 0,
  })) || []

  const filteredRevenueData =
    timeRange === '3m'
      ? revenueData.slice(-3)
      : timeRange === '6m'
        ? revenueData.slice(-6)
        : revenueData

  // Compute actionable insights for Revenue Growth card based on filtered range & metric
  const metricKey = growthMetric
  const peakMonth = filteredRevenueData.reduce(
    (best: any, cur: any) => (!best || cur[metricKey] > best[metricKey] ? cur : best),
    null
  )
  const avgMonthlyMetric =
    filteredRevenueData.length > 0
      ? filteredRevenueData.reduce((sum: number, r: any) => sum + (r[metricKey] || 0), 0) /
      filteredRevenueData.length
      : 0
  const latestMonth =
    filteredRevenueData.length > 0 ? filteredRevenueData[filteredRevenueData.length - 1] : null
  const prevMonth =
    filteredRevenueData.length > 1 ? filteredRevenueData[filteredRevenueData.length - 2] : null
  const momGrowthPct =
    latestMonth && prevMonth && prevMonth[metricKey] > 0
      ? ((latestMonth[metricKey] - prevMonth[metricKey]) / prevMonth[metricKey]) * 100
      : 0
  const rangeTotalInvoiced = filteredRevenueData.reduce(
    (s: number, r: any) => s + (r.revenue || 0),
    0
  )
  const rangeTotalPaid = filteredRevenueData.reduce((s: number, r: any) => s + (r.paid || 0), 0)
  const rangeTotalPending = Math.max(0, rangeTotalInvoiced - rangeTotalPaid)
  const collectionRate =
    rangeTotalInvoiced > 0 ? (rangeTotalPaid / rangeTotalInvoiced) * 100 : 100

  const formatMetricValue = (val: number) =>
    growthMetric === 'orders' ? `${Math.round(val)} orders` : formatCurrency(val)

  // Top products total & max for share bars
  const topProducts = analytics?.topProducts || []
  const maxProductRev = topProducts.reduce(
    (max: number, p: any) => Math.max(max, p.totalRevenue || 0),
    1
  )
  const totalTopProductsRev = topProducts.reduce(
    (sum: number, p: any) => sum + (p.totalRevenue || 0),
    0
  )

  // Sort cafe breakdown by revenue descending
  const sortedBreakdown = [...filteredBreakdown].sort(
    (a: any, b: any) => (b.revenue || 0) - (a.revenue || 0)
  )
  const topCafe = sortedBreakdown[0] || null
  const avgRevenuePerCafe = activeCafes > 0 ? totalRevenue / activeCafes : 0

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

      {/* Full-Width Revenue Growth Chart */}
      <div className="w-full min-w-0 rounded-xl border border-border bg-card p-6 flex flex-col justify-between">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-5">
            <div>
              <h3 className="text-lg font-bold text-foreground">
                {growthMetric === 'revenue'
                  ? 'Revenue Growth'
                  : growthMetric === 'orders'
                    ? 'Monthly Order Volume'
                    : 'Average Order Value Trend'}
              </h3>
              <p className="text-xs text-muted-foreground">
                {growthMetric === 'revenue'
                  ? 'Monthly invoiced vs collected revenue across all cafes'
                  : growthMetric === 'orders'
                    ? 'Total number of cafe orders placed per month'
                    : 'Average basket size per cafe order over time'}
              </p>
            </div>

            {/* Metric & Time-Range Controls */}
            <div className="flex flex-wrap items-center gap-3">
              {growthMetric === 'revenue' && (
                <div className="flex items-center gap-4 text-xs mr-1">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#d4a853' }} />
                    Invoiced
                  </span>
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    Paid
                  </span>
                </div>
              )}

              {/* Metric Switcher */}
              <div className="flex items-center bg-muted/60 border border-border p-0.5 rounded-lg text-[11px]">
                {(
                  [
                    { id: 'revenue', label: 'Revenue' },
                    { id: 'orders', label: 'Orders' },
                    { id: 'aov', label: 'Avg Basket' },
                  ] as const
                ).map((m) => {
                  const active = growthMetric === m.id
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setGrowthMetric(m.id)}
                      className={`px-2.5 py-1 rounded-md font-semibold transition-all ${active
                          ? 'shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                        }`}
                      style={
                        active ? { background: '#d4a853', color: '#1a1713' } : {}
                      }
                    >
                      {m.label}
                    </button>
                  )
                })}
              </div>

              {/* Time Range Switcher */}
              <div className="flex items-center bg-muted/60 border border-border p-0.5 rounded-lg text-[11px]">
                {(
                  [
                    { id: '3m', label: '3M' },
                    { id: '6m', label: '6M' },
                    { id: 'all', label: 'All' },
                  ] as const
                ).map((range) => {
                  const active = timeRange === range.id
                  return (
                    <button
                      key={range.id}
                      type="button"
                      onClick={() => setTimeRange(range.id)}
                      className={`px-2.5 py-1 rounded-md font-semibold transition-all ${active
                          ? 'bg-foreground shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                      {range.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="h-[340px] w-full min-w-0">
            {chartMounted && (
              <ResponsiveContainer width="100%" height={330} minWidth={0} debounce={100}>
                <AreaChart data={filteredRevenueData} margin={{ top: 12, right: 20, left: 4, bottom: 4 }}>
                  <defs>
                    <linearGradient id="cafeRevGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#d4a853" stopOpacity={0.32} />
                      <stop offset="95%" stopColor="#d4a853" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="cafePaidGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    interval={0}
                    tick={{ fontSize: 12, fill: '#a8a29e' }}
                    axisLine={false}
                    tickLine={false}
                    dy={6}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#a8a29e' }}
                    axisLine={false}
                    tickLine={false}
                    width={56}
                    tickFormatter={(v) =>
                      growthMetric === 'orders'
                        ? `${v}`
                        : `₹${(v / 1000).toFixed(0)}k`
                    }
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#1a1713',
                      border: '1px solid rgba(212,168,83,0.25)',
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}
                    formatter={(value: any, name: any) => {
                      const num = Number(value) || 0
                      if (name === 'orders') return [`${num} orders`, 'Order Volume']
                      if (name === 'aov') return [formatCurrency(num), 'Avg Order Value']
                      return [
                        formatCurrency(num),
                        name === 'revenue' ? 'Total Invoiced' : 'Actually Paid',
                      ]
                    }}
                    labelFormatter={(label, payload) => {
                      const row = payload?.[0]?.payload
                      if (!row) return label
                      return `${label} · ${row.orders} orders · ${formatCurrency(row.revenue)}`
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey={growthMetric}
                    stroke="#d4a853"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#cafeRevGrad)"
                    dot={{ r: 4.5, fill: '#d4a853', strokeWidth: 0 }}
                    activeDot={{ r: 6.5 }}
                  />
                  {growthMetric === 'revenue' && (
                    <Area
                      type="monotone"
                      dataKey="paid"
                      stroke="#10b981"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      fillOpacity={1}
                      fill="url(#cafePaidGrad)"
                      dot={{ r: 3.5, fill: '#10b981', strokeWidth: 0 }}
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Bottom Summary KPI Strip */}
        <div className="pt-5 mt-5 border-t border-border/70 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl bg-muted/30 border border-border/60 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Peak Month
              </p>
              <p className="text-sm font-bold text-foreground mt-1">
                {peakMonth ? formatMetricValue(peakMonth[metricKey]) : '—'}
              </p>
              <p className="text-[11px] font-mono mt-0.5" style={{ color: '#d4a853' }}>
                {peakMonth ? `${peakMonth.label} (${peakMonth.orders} orders)` : 'No data'}
              </p>
            </div>

            <div className="rounded-xl bg-muted/30 border border-border/60 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Monthly Avg
              </p>
              <p className="text-sm font-bold text-foreground mt-1">
                {formatMetricValue(avgMonthlyMetric)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Across {filteredRevenueData.length} month{filteredRevenueData.length === 1 ? '' : 's'}
              </p>
            </div>

            <div className="rounded-xl bg-muted/30 border border-border/60 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Latest MoM
              </p>
              <div className="flex items-center gap-1 mt-1">
                {momGrowthPct >= 0 ? (
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                )}
                <span
                  className={`text-sm font-bold ${momGrowthPct >= 0 ? 'text-emerald-500' : 'text-red-500'
                    }`}
                >
                  {momGrowthPct >= 0 ? '+' : ''}
                  {momGrowthPct.toFixed(1)}%
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {latestMonth ? `In ${latestMonth.label}` : '—'}
              </p>
            </div>

            <div className="rounded-xl bg-muted/30 border border-border/60 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Collection Rate
              </p>
              <p className="text-sm font-bold text-emerald-500 mt-1">
                {collectionRate.toFixed(1)}%
              </p>
              <p className="text-[11px] text-amber-500 mt-0.5">
                {rangeTotalPending > 0 ? `${formatCurrency(rangeTotalPending)} due` : 'All settled'}
              </p>
            </div>
          </div>

          {/* Collection Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">
                Period Payment Realization ({formatCurrency(rangeTotalPaid)} collected of {formatCurrency(rangeTotalInvoiced)})
              </span>
              <span className="font-semibold text-emerald-500">{collectionRate.toFixed(1)}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden flex">
              <div
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${Math.min(100, collectionRate)}%` }}
              />
              <div
                className="h-full bg-amber-500/80 transition-all duration-500"
                style={{ width: `${Math.max(0, 100 - collectionRate)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Side-by-Side Leaderboards: Top Products & Revenue by Location */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Top Products */}
        <div className="min-w-0 rounded-xl border border-border bg-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-foreground">Top Products</h3>
                <p className="text-xs text-muted-foreground">Best selling blends across all cafes</p>
              </div>
              {topProducts.length > 0 && (
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {topProducts.length} items
                </span>
              )}
            </div>

            <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
              {topProducts.map((p: any, i: number) => {
                const sharePct =
                  totalTopProductsRev > 0 ? (p.totalRevenue / totalTopProductsRev) * 100 : 0
                const barWidth = maxProductRev > 0 ? (p.totalRevenue / maxProductRev) * 100 : 0

                return (
                  <div key={i} className="space-y-1.5">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                        style={
                          i === 0
                            ? { background: '#d4a853', color: '#1a1713' }
                            : { background: 'rgba(212,168,83,0.12)', color: '#d4a853' }
                        }
                      >
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-foreground truncate" title={p._id}>
                          {p._id}
                        </p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                          {p.totalQty} units sold · {sharePct.toFixed(1)}% share
                        </p>
                      </div>
                      <p className="text-xs sm:text-sm font-bold shrink-0" style={{ color: '#d4a853' }}>
                        {formatCurrency(p.totalRevenue)}
                      </p>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted/60 overflow-hidden ml-10" style={{ width: 'calc(100% - 2.5rem)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${barWidth}%`,
                          background: i === 0 ? '#d4a853' : 'rgba(212,168,83,0.55)',
                        }}
                      />
                    </div>
                  </div>
                )
              })}
              {!topProducts.length && (
                <p className="text-sm text-muted-foreground text-center py-8">No product data yet</p>
              )}
            </div>
          </div>

          {topProducts.length > 0 && (
            <div className="pt-4 mt-4 border-t border-border/60 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                Total Units Sold:{' '}
                <strong className="text-foreground">
                  {topProducts.reduce((s: number, p: any) => s + (p.totalQty || 0), 0)}
                </strong>
              </span>
              <span className="text-muted-foreground">
                Top Blend Share:{' '}
                <strong style={{ color: '#d4a853' }}>
                  {totalTopProductsRev > 0
                    ? `${((topProducts[0].totalRevenue / totalTopProductsRev) * 100).toFixed(0)}%`
                    : '0%'}
                </strong>
              </span>
            </div>
          )}
        </div>

        {/* Cafe Breakdown Chart + Location Leaderboard */}
        <div className="min-w-0 rounded-xl border border-border bg-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="text-lg font-bold text-foreground">Revenue by Location</h3>
                <p className="text-xs text-muted-foreground">
                  Partner cafe revenue comparison & realization status
                </p>
              </div>
              {topCafe && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] font-semibold shrink-0">
                  <Award className="w-3.5 h-3.5" />
                  <span>Top: {topCafe.name}</span>
                </div>
              )}
            </div>

            <div
              style={{
                height: `${Math.max(260, Math.min(360, sortedBreakdown.length * 36))}px`,
              }}
              className="w-full min-w-0"
            >
              {chartMounted && (
                <ResponsiveContainer
                  width="100%"
                  height={Math.max(260, Math.min(360, sortedBreakdown.length * 36))}
                  minWidth={0}
                  debounce={100}
                >
                  <BarChart
                    data={sortedBreakdown}
                    layout="vertical"
                    margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11, fill: '#888' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      interval={0}
                      tick={{ fontSize: 11, fill: '#a8a29e' }}
                      axisLine={false}
                      tickLine={false}
                      width={135}
                      tickFormatter={(name: string) =>
                        name && name.length > 18 ? `${name.slice(0, 17)}…` : name
                      }
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#1a1713',
                        border: '1px solid rgba(96,165,250,0.3)',
                        borderRadius: '12px',
                        fontSize: '12px',
                      }}
                      formatter={(value: any, _name: any, props: any) => {
                        const item = props?.payload
                        return [
                          `${formatCurrency(Number(value) || 0)} (${item?.orders ?? 0} orders)`,
                          'Revenue',
                        ]
                      }}
                    />
                    <Bar dataKey="revenue" fill="#60a5fa" radius={[0, 6, 6, 0]} barSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Location Summary Cards at bottom to fill card & give branch insights */}
          {sortedBreakdown.length > 0 && (
            <div className="pt-4 mt-4 border-t border-border/70 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl bg-muted/30 border border-border/60 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Leading Partner
                </p>
                <p className="text-xs font-bold text-foreground truncate mt-1" title={topCafe?.name}>
                  {topCafe?.name || '—'}
                </p>
                <p className="text-[11px] text-blue-400 font-semibold mt-0.5">
                  {topCafe ? formatCurrency(topCafe.revenue) : '—'}{' '}
                  {totalRevenue > 0 && topCafe
                    ? `(${((topCafe.revenue / totalRevenue) * 100).toFixed(0)}%)`
                    : ''}
                </p>
              </div>

              <div className="rounded-xl bg-muted/30 border border-border/60 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Avg Revenue / Cafe
                </p>
                <p className="text-xs font-bold text-foreground mt-1">
                  {formatCurrency(avgRevenuePerCafe)}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Across {sortedBreakdown.length} active cafes
                </p>
              </div>

              <div className="rounded-xl bg-muted/30 border border-border/60 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Pending Receivables
                </p>
                <p className="text-xs font-bold text-amber-500 mt-1">
                  {formatCurrency(totalPending)}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {sortedBreakdown.filter((c: any) => (c.pendingRevenue || 0) > 0).length} cafe(s) with balance
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Full-Width Monthly Performance Table */}
      <div className="w-full rounded-xl border border-border bg-card overflow-hidden flex flex-col justify-between">
        <div>
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-foreground">Monthly Performance</h3>
              <p className="text-xs text-muted-foreground">Month-by-month billing & realization breakdown</p>
            </div>
            <span className="text-xs font-mono text-muted-foreground">
              {monthlyStats.length} months
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/30 text-muted-foreground">
                  <th className="text-left px-6 py-3 font-medium text-[10px] uppercase">Month</th>
                  <th className="text-left px-6 py-3 font-medium text-[10px] uppercase">Orders</th>
                  <th className="text-right px-6 py-3 font-medium text-[10px] uppercase">Total Invoiced</th>
                  <th className="text-right px-6 py-3 font-medium text-[10px] uppercase">Actually Paid</th>
                  <th className="text-right px-6 py-3 font-medium text-[10px] uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {monthlyStats.map((s: any) => {
                  const due = Math.max(0, (s.amount || 0) - (s.paidAmount || 0))
                  return (
                    <tr key={s.month} className="hover:bg-accent/20 transition-colors">
                      <td className="px-6 py-3 font-mono text-xs font-semibold">{s.month}</td>
                      <td className="px-6 py-3 text-xs">{s.count}</td>
                      <td className="px-6 py-3 text-right font-bold text-foreground">
                        {formatCurrency(s.amount)}
                      </td>
                      <td className="px-6 py-3 text-right font-bold text-emerald-500">
                        {formatCurrency(s.paidAmount)}
                      </td>
                      <td className="px-6 py-3 text-right">
                        {due <= 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" /> Settled
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                            <Clock className="w-3 h-3" /> {formatCurrency(due)} due
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {monthlyStats.length > 0 && (
          <div className="px-6 py-3.5 bg-muted/30 border-t border-border flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
              Cumulative Total ({monthlyStats.reduce((a: number, b: any) => a + (b.count || 0), 0)} orders)
            </span>
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground">
                Invoiced: <strong className="text-foreground">{formatCurrency(totalRevenue)}</strong>
              </span>
              <span className="text-muted-foreground">
                Paid: <strong className="text-emerald-500">{formatCurrency(totalPaid)}</strong>
              </span>
            </div>
          </div>
        )}
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
                    <span className={`px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${order.paymentStatus === 'paid' ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'
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
