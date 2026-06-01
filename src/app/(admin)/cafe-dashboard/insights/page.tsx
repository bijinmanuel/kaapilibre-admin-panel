'use client'
import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { TrendingDown, Calendar, AlertTriangle, ArrowRight, CheckCircle2, ChevronDown, ChevronUp, Landmark, ShieldAlert, Sparkles, TrendingUp, Minus } from 'lucide-react'
import { DashboardHeader } from '@/components/cafe-dashboard/DashboardHeader'
import { usePerformanceInsights } from '@/hooks/useCafeOrders'
import { formatCurrency } from '@/lib/utils'

export default function PerformanceInsightsPage() {
  const searchParams = useSearchParams()
  const region = searchParams.get('region') || ''

  const { data: insights, isLoading } = usePerformanceInsights(region)
  const [expandedCafe, setExpandedCafe] = useState<string | null>(null)

  const toggleExpandCafe = (id: string) => {
    setExpandedCafe(expandedCafe === id ? null : id)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <DashboardHeader title="Performance Insights" description="Deep dive into revenue drops and action plans" />
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-card border border-border animate-pulse" />
          ))}
        </div>
        <div className="h-[400px] rounded-xl bg-card border border-border animate-pulse" />
      </div>
    )
  }

  const summary = insights?.summary
  const regionBreakdown = insights?.regionBreakdown || []
  const slowCafes = insights?.slowCafes || []
  const recovery = insights?.recoveryEstimate

  const isGrowth = summary!.revChangePercent > 0;
  const isDrop = summary!.revChangePercent < 0;
  // Find which region dropped the most
  const sortedRegionsByDrop = [...regionBreakdown].sort((a, b) => b.revenueGap - a.revenueGap)
  const worstRegion = sortedRegionsByDrop[0]

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Performance Insights"
        description="Triggered MoM revenue drop analysis and recovery actions"
      />

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {/* <div className="bg-card border border-border rounded-xl p-5 relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Revenue MoM</span>
              <TrendingDown className="w-4 h-4 text-red-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold">{formatCurrency(summary.currentRevenue)}</span>
              <span className="text-xs text-muted-foreground">vs {formatCurrency(summary.prevRevenue)}</span>
            </div>
            <div className="mt-2 text-xs font-bold text-red-500">
              {summary.revChangePercent > 0 ? '+' : ''}{summary.revChangePercent.toFixed(1)}% revenue change
            </div>
          </div> */}

          <div className="bg-card border border-border rounded-xl p-5 relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                Revenue MoM
              </span>

              {isGrowth ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : isDrop ? (
                <TrendingDown className="w-4 h-4 text-red-500" />
              ) : (
                <Minus className="w-4 h-4 text-gray-500" />
              )}
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold">
                {formatCurrency(summary.currentRevenue)}
              </span>
              <span className="text-xs text-muted-foreground">
                vs {formatCurrency(summary.prevRevenue)}
              </span>
            </div>

            <div
              className={`mt-2 text-xs font-bold ${isGrowth
                  ? "text-green-500"
                  : isDrop
                    ? "text-red-500"
                    : "text-gray-500"
                }`}
            >
              {isGrowth && "+"}
              {summary.revChangePercent.toFixed(1)}%
              {isGrowth
                ? " revenue growth"
                : isDrop
                  ? " revenue decline"
                  : " no change"}
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Orders Change</span>
              <AlertTriangle className="w-4 h-4 text-orange-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold">{summary.currentOrders} orders</span>
              <span className="text-xs text-muted-foreground">vs {summary.prevOrders} last month</span>
            </div>
            <div className="mt-2 text-xs font-bold text-orange-500">
              {summary.ordersChange} bulk orders from cafes
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Slow Cafes</span>
              <ShieldAlert className="w-4 h-4 text-yellow-500" />
            </div>
            <div className="text-xl font-bold">{summary.slowCafesCount} Cafes</div>
            <div className="mt-2 text-xs text-muted-foreground">
              Cafes with volume drop this month
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5" style={{ borderLeft: '3px solid #d4a853' }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Potential Recovery</span>
              <Landmark className="w-4 h-4" style={{ color: '#d4a853' }} />
            </div>
            <div className="text-xl font-bold text-primary" style={{ color: '#d4a853' }}>
              {formatCurrency(recovery?.potentialRecovery ?? 0)}
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              If slow cafes restore normal volume
            </div>
          </div>
        </div>
      )}

      {/* Urgent Warning Block */}
      {worstRegion && worstRegion.revenueGap > 0 && (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 animate-bounce" />
          <div className="text-xs text-muted-foreground">
            🚨 <strong className="text-red-400 font-bold uppercase tracking-wider">{worstRegion.region} region</strong> is experiencing the highest drop. Revenue fell by <strong className="text-foreground">{formatCurrency(worstRegion.revenueGap)}</strong>, primarily driven by a <strong className="text-foreground">"{worstRegion.rootCauseTag}"</strong>. Immediate intervention is required.
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Slow Cafes Breakdown */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-md font-bold text-foreground">Slow Cafe Breakdown</h3>
            <span className="text-[10px] uppercase font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full tracking-wider">
              Requires attention
            </span>
          </div>

          {slowCafes.length === 0 ? (
            <div className="py-12 bg-card border border-border rounded-xl text-center text-muted-foreground">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="font-medium text-foreground">No slow cafes detected</p>
              <p className="text-xs mt-1">All cafes are performing at or above last month's volume.</p>
            </div>
          ) : (
            slowCafes.map((cafe) => (
              <div key={cafe.cafeId} className="bg-card border border-border rounded-xl p-5 space-y-4 hover:border-amber-500/30 transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center overflow-hidden">
                      {cafe.logo ? (
                        <img src={cafe.logo} alt={cafe.name} className="w-full h-full object-cover" />
                      ) : (
                        <Landmark className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground">{cafe.name}</h4>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{cafe.region}</p>
                    </div>
                  </div>

                  {cafe.isFlaggedNoOrder && (
                    <span className="text-[9px] font-bold uppercase tracking-widest bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full border border-red-500/20 animate-pulse">
                      No order in 14+ days
                    </span>
                  )}
                </div>

                {/* Stats comparison */}
                <div className="grid grid-cols-3 gap-2 py-2 border-y border-border/50 text-xs">
                  <div>
                    <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Orders MoM</p>
                    <p className="font-bold mt-1 text-foreground flex items-center gap-1.5">
                      {cafe.currentOrders} <span className="text-[10px] font-medium text-muted-foreground">vs {cafe.prevOrders}</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Avg Order Value</p>
                    <p className="font-bold mt-1 text-foreground">
                      {formatCurrency(cafe.currentAvgOrderValue)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-[10px] uppercase tracking-wider text-right">Revenue Gap</p>
                    <p className="font-bold mt-1 text-red-500 text-right">
                      -{formatCurrency(cafe.revenueGap)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    Last Order: {cafe.lastOrderDate ? new Date(cafe.lastOrderDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Never'}
                  </span>

                  <button
                    onClick={() => toggleExpandCafe(cafe.cafeId)}
                    className="flex items-center gap-1 font-bold text-primary hover:underline uppercase text-[10px] tracking-wider"
                    style={{ color: '#d4a853' }}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {expandedCafe === cafe.cafeId ? 'Hide AI Actions' : 'AI Action Plan'}
                    {expandedCafe === cafe.cafeId ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>

                {/* Expanded AI Recommendations */}
                {expandedCafe === cafe.cafeId && (
                  <div className="p-4 rounded-xl border border-primary/20 bg-primary/[0.02] space-y-3 animate-fade-in" style={{ borderLeft: '3px solid #d4a853' }}>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-primary" style={{ color: '#d4a853' }}>
                      <Sparkles className="w-4 h-4" />
                      Claude-Generated Revenue Recovery Recommendations
                    </div>
                    <div className="space-y-2.5">
                      {cafe.aiActions.map((action: string, index: number) => {
                        // format bold text in markdown
                        const formattedAction = action.replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>')
                        return (
                          <div key={index} className="flex gap-2.5 items-start text-xs text-muted-foreground leading-relaxed">
                            <span className="text-primary font-bold mt-0.5" style={{ color: '#d4a853' }}>{index + 1}.</span>
                            <p dangerouslySetInnerHTML={{ __html: formattedAction }} />
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Region Breakdown & Recovery Estimates */}
        <div className="lg:col-span-2 space-y-6">

          {/* Per Region Breakdown */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-foreground">Per-Region Performance</h3>
              <p className="text-xs text-muted-foreground">MoM coffee bean sales per territory</p>
            </div>

            <div className="space-y-4">
              {regionBreakdown.map((r) => {
                const isDropped = r.revenueGap > 0
                return (
                  <div key={r.region} className="p-3.5 rounded-xl border border-border/50 bg-muted/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">{r.region}</span>
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${isDropped ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'
                        }`}>
                        {r.rootCauseTag}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-muted-foreground text-[10px]">Revenue MoM</span>
                        <div className="font-medium mt-0.5 text-foreground flex items-center gap-1.5">
                          {formatCurrency(r.currentRevenue)}
                          <span className="text-[10px] text-muted-foreground">vs {formatCurrency(r.prevRevenue)}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-[10px] block text-right">Orders MoM</span>
                        <div className="font-medium mt-0.5 text-foreground text-right">
                          {r.currentOrders} <span className="text-muted-foreground">vs {r.prevOrders}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Revenue Recovery Estimate dial */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-foreground">Revenue Recovery Projection</h3>
              <p className="text-xs text-muted-foreground">Estimated growth once slow cafes are resolved</p>
            </div>

            {summary && recovery && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-border bg-muted/30 text-center space-y-1">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Target Monthly Revenue</span>
                  <div className="text-2xl font-bold flex items-center justify-center gap-2">
                    <span className="text-muted-foreground line-through text-lg">{formatCurrency(summary.currentRevenue)}</span>
                    <ArrowRight className="w-4 h-4 text-primary" style={{ color: '#d4a853' }} />
                    <span className="text-green-500 font-extrabold">{formatCurrency(recovery.recoveredTotalRevenue)}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Regaining normal volume secures <strong className="text-foreground">+{formatCurrency(recovery.potentialRecovery)}</strong>
                  </p>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-muted-foreground">Current Progress</span>
                    <span className="text-foreground">
                      {((summary.currentRevenue / recovery.recoveredTotalRevenue) * 100).toFixed(0)}% of Max
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden border border-border">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(summary.currentRevenue / recovery.recoveredTotalRevenue) * 100}%`,
                        background: 'linear-gradient(90deg, #d4a853, #22c55e)'
                      }}
                    />
                  </div>
                </div>

                <div className="p-3 bg-green-500/5 border border-green-500/10 rounded-xl text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-green-500 flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    High Revenue Recovery Feasibility
                  </span>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    None of our slow cafes are structurally churned; they simply require routine re-engagement or calibration assistance.
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  )
}
