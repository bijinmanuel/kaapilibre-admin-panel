'use client'
import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts'
import { 
  Sparkles, Coffee, Users, Map, CheckCircle2, ChevronDown, ChevronUp, 
  TrendingUp, TrendingDown, RefreshCw, AlertTriangle, ShieldCheck, HeartPulse
} from 'lucide-react'
import { DashboardHeader } from '@/components/cafe-dashboard/DashboardHeader'
import { useSalesIntelligence } from '@/hooks/useCafeOrders'
import { formatCurrency } from '@/lib/utils'

export default function SalesIntelligencePage() {
  const searchParams = useSearchParams()
  const region = searchParams.get('region') || ''
  
  const { data: sales, isLoading } = useSalesIntelligence(region)
  
  // States for expandable AI cards
  const [expandedPromo, setExpandedPromo] = useState<boolean>(false)
  const [expandedHealthCafe, setExpandedHealthCafe] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <DashboardHeader title="Sales Intelligence" description="Analyzing bean trends and buyer profiles" />
        <div className="h-[250px] rounded-xl bg-card border border-border animate-pulse" />
        <div className="h-[400px] rounded-xl bg-card border border-border animate-pulse" />
      </div>
    )
  }

  const beans = sales?.beansPerformance || []
  const behavior = sales?.customerBehavior
  const regions = sales?.regionSales || []
  const healthScores = sales?.healthScores || []
  const promos = sales?.aiPromotions || []

  const toggleExpandCafe = (id: string) => {
    setExpandedHealthCafe(expandedHealthCafe === id ? null : id)
  }

  return (
    <div className="space-y-6">
      <DashboardHeader 
        title="Sales Intelligence" 
        description="Deep product metrics, buyer behaviors, and regional sales performance" 
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Bean Type Performance */}
        <div className="lg:col-span-3 bg-card border border-border rounded-xl p-6 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-md font-bold text-foreground">Bean Performance & Velocity</h3>
              <p className="text-xs text-muted-foreground">Unit sales and revenue contribution MoM</p>
            </div>
            <span className="text-[10px] uppercase font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full tracking-wider" style={{ color: '#d4a853' }}>
              May vs April
            </span>
          </div>

          <div className="space-y-4 overflow-y-auto max-h-[400px] pr-1 scrollbar-thin">
            {beans.map((bean) => {
              const isSlow = bean.isSlowMoving
              return (
                <div key={bean.name} className={`p-4 rounded-xl border ${
                  isSlow ? 'border-red-500/20 bg-red-500/[0.02]' : 'border-border bg-muted/10'
                } space-y-3`}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                        <Coffee className="w-4 h-4 text-primary" style={{ color: '#d4a853' }} />
                        {bean.name}
                      </h4>
                      {isSlow && (
                        <span className="text-[8px] font-bold uppercase tracking-wider text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded mt-1 inline-block border border-red-500/20">
                          ⚠️ Slow-Moving Item (Units &lt; 50% MoM)
                        </span>
                      )}
                    </div>
                    
                    <div className="text-right">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Revenue Contribution</p>
                      <p className="text-sm font-extrabold text-foreground" style={{ color: '#d4a853' }}>{formatCurrency(bean.currentRevenue)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs pt-2 border-t border-border/50">
                    <div>
                      <span className="text-muted-foreground text-[10px]">Volume MoM</span>
                      <div className="font-semibold text-foreground flex items-center gap-1.5 mt-0.5">
                        {bean.currentQty} kg <span className="text-[10px] text-muted-foreground">vs {bean.prevQty} kg</span>
                        {bean.trend === 'up' && <TrendingUp className="w-3.5 h-3.5 text-green-500" />}
                        {bean.trend === 'down' && <TrendingDown className="w-3.5 h-3.5 text-red-500" />}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <span className="text-muted-foreground text-[10px]">Prior Revenue</span>
                      <p className="font-semibold text-muted-foreground mt-0.5">{formatCurrency(bean.prevRevenue)}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Region wise sales and Promo trigger */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Region-wise Sales Performance */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-foreground">Regional Sales & Tastes</h3>
              <p className="text-xs text-muted-foreground">Territory metrics and popular beans</p>
            </div>

            <div className="space-y-3">
              {regions.map((r) => (
                <div key={r.region} className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">{r.region}</span>
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      r.trend === 'growing' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 
                      r.trend === 'dropped' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 
                      'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                    }`}>
                      {r.trend}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-muted-foreground text-[10px]">Sales:</span>
                      <p className="font-semibold text-foreground mt-0.5">
                        {formatCurrency(r.currentRevenue)} <span className="text-muted-foreground font-medium text-[10px]">vs {formatCurrency(r.prevRevenue)}</span>
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[10px]">Favored Varieties:</span>
                      <p className="font-bold text-primary mt-0.5 flex gap-1.5 flex-wrap" style={{ color: '#d4a853' }}>
                        {r.popularBeans.map(b => (
                          <span key={b} className="bg-primary/5 px-2 py-0.5 rounded border border-primary/10 text-[9px]">{b.replace(' Blend', '').replace(' Single Origin', '')}</span>
                        ))}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Promotion suggestions */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-3" style={{ borderLeft: '3px solid #d4a853' }}>
            <button
              onClick={() => setExpandedPromo(!expandedPromo)}
              className="w-full flex items-center justify-between text-left focus:outline-none"
            >
              <div className="flex items-center gap-2 text-xs font-bold text-primary" style={{ color: '#d4a853' }}>
                <Sparkles className="w-4 h-4" />
                AI Promotion & Bundle Engine
              </div>
              {expandedPromo ? <ChevronUp className="w-4 h-4 text-primary" style={{ color: '#d4a853' }} /> : <ChevronDown className="w-4 h-4 text-primary" style={{ color: '#d4a853' }} />}
            </button>

            {expandedPromo && (
              <div className="space-y-3 pt-2 border-t border-border/30 text-xs text-muted-foreground leading-relaxed animate-fade-in">
                {promos.map((promo: string, index: number) => {
                  const formatted = promo.replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>')
                  return (
                    <div key={index} className="flex gap-2.5 items-start">
                      <span className="text-primary font-bold mt-0.5" style={{ color: '#d4a853' }}>•</span>
                      <p dangerouslySetInnerHTML={{ __html: formatted }} />
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Customer behavior comparison side-by-side */}
      {behavior && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Individual/Home Buyers */}
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" />
              Retail & Home Buyers
            </h3>

            <div className="grid grid-cols-2 gap-4 py-2 border-y border-border/50 text-xs">
              <div>
                <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Avg Order Value</span>
                <p className="text-lg font-bold text-foreground mt-1">{formatCurrency(behavior.retail.avgOrderValue)}</p>
              </div>
              <div>
                <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Repeat Order Rate</span>
                <p className="text-lg font-bold text-foreground mt-1">{behavior.retail.repeatOrderRate.toFixed(0)}%</p>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Top Preferred Varieties</span>
              <div className="space-y-2">
                {behavior.retail.preferredBeans.map((bean, idx) => (
                  <div key={bean} className="flex items-center gap-2.5 text-xs text-muted-foreground">
                    <span className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-400 font-bold flex items-center justify-center text-[10px]">
                      {idx+1}
                    </span>
                    {bean}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Cafe Customers */}
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Coffee className="w-4 h-4 text-primary" style={{ color: '#d4a853' }} />
              Cafe Customers Behavior
            </h3>

            <div className="space-y-3 text-xs leading-relaxed max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
              
              {behavior.cafes.increased.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-green-500 flex items-center gap-1">
                    📈 Increased Bulk Orders
                  </span>
                  <div className="space-y-1 pl-3.5">
                    {behavior.cafes.increased.map(c => (
                      <p key={c.name} className="text-muted-foreground text-xs">
                        <strong className="text-foreground">{c.name}</strong> increased monthly volume by <span className="text-green-500 font-bold font-mono">+{c.change} orders</span>.
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {behavior.cafes.reduced.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-border/30">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-red-400 flex items-center gap-1">
                    📉 Reduced Volume
                  </span>
                  <div className="space-y-1 pl-3.5">
                    {behavior.cafes.reduced.map(c => (
                      <p key={c.name} className="text-muted-foreground text-xs">
                        <strong className="text-foreground">{c.name}</strong> dropped monthly volume by <span className="text-red-400 font-bold font-mono">-{c.change} orders</span>.
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {behavior.cafes.silent.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-border/30">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1">
                    🔇 Silent / Dormant Cafes
                  </span>
                  <div className="space-y-1 pl-3.5">
                    {behavior.cafes.silent.map(c => (
                      <p key={c.name} className="text-muted-foreground text-xs">
                        <strong className="text-foreground">{c.name}</strong> went silent. Last order was <span className="text-orange-400 font-bold font-mono">{c.days} days ago</span>.
                      </p>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>
      )}

      {/* Sales Health Scores */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div>
          <h3 className="text-md font-bold text-foreground">Sales Health Tracker</h3>
          <p className="text-xs text-muted-foreground">Scoring our 7 regular cafe partners on churn and retention metrics</p>
        </div>

        <div className="space-y-3">
          {healthScores.map((c) => {
            let scoreColor = 'bg-green-500/10 text-green-500 border-green-500/20'
            if (c.score === 'At Risk') scoreColor = 'bg-orange-500/10 text-orange-500 border-orange-500/20 animate-pulse'
            if (c.score === 'Churning') scoreColor = 'bg-red-500/10 text-red-500 border-red-500/20'

            return (
              <div key={c.cafeId} className="p-4 rounded-xl border border-border bg-muted/10 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-muted border border-border flex items-center justify-center overflow-hidden">
                      {c.logo ? (
                        <img src={c.logo} alt={c.name} className="w-full h-full object-cover" />
                      ) : (
                        <Coffee className="w-4 h-4 text-primary" style={{ color: '#d4a853' }} />
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-foreground">{c.name}</h4>
                      <p className="text-[9px] text-muted-foreground mt-0.5">{c.region} • Last ordered {c.orderFrequencyDays} days ago</p>
                    </div>
                  </div>

                  <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${scoreColor}`}>
                    {c.score}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-1">
                    <HeartPulse className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground text-[10px]">Volume trend:</span>
                    <strong className={`font-bold ${c.volumeTrend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {c.volumeTrend >= 0 ? '+' : ''}{c.volumeTrend.toFixed(0)}%
                    </strong>
                  </div>

                  {c.score !== 'Healthy' && (
                    <button
                      onClick={() => toggleExpandCafe(c.cafeId)}
                      className="text-[10px] uppercase font-bold text-primary hover:underline flex items-center gap-1"
                      style={{ color: '#d4a853' }}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      {expandedHealthCafe === c.cafeId ? 'Hide AI Retention Plan' : 'AI Save Action'}
                      {expandedHealthCafe === c.cafeId ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  )}
                </div>

                {expandedHealthCafe === c.cafeId && c.score !== 'Healthy' && (
                  <div className="p-3.5 rounded-lg border border-primary/20 bg-primary/[0.02] text-xs text-muted-foreground leading-relaxed animate-fade-in" style={{ borderLeft: '3px solid #d4a853' }}>
                    <div className="font-bold text-primary mb-1 flex items-center gap-1" style={{ color: '#d4a853' }}>
                      <Sparkles className="w-3.5 h-3.5" />
                      Claude retention strategy:
                    </div>
                    {c.aiSaveAction}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
