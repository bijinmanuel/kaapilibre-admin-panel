'use client'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { 
  Target, Mail, Phone, Calendar, ArrowRight, CheckCircle2, ChevronDown, 
  ChevronUp, UserPlus, Users, Sparkles, Filter, AlertTriangle, Edit2
} from 'lucide-react'
import { DashboardHeader } from '@/components/cafe-dashboard/DashboardHeader'
import { useCafeAcquisition } from '@/hooks/useCafeOrders'
import { formatDateTime, formatCurrency } from '@/lib/utils'

export default function CafeAcquisitionPage() {
  const searchParams = useSearchParams()
  const region = searchParams.get('region') || ''
  
  const { data: acquisition, isLoading } = useCafeAcquisition(region)
  
  // State for editable target
  const [target, setTarget] = useState(12)
  const [isEditingTarget, setIsEditingTarget] = useState(false)
  const [tempTarget, setTempTarget] = useState('12')
  
  // Expandable outreach states
  const [expandedOutreach, setExpandedOutreach] = useState<string | null>(null)
  
  // Persist target in localStorage
  useEffect(() => {
    const saved = localStorage.getItem('cafe_acquisition_target')
    if (saved) {
      setTarget(Number(saved))
      setTempTarget(saved)
    }
  }, [])

  const saveTarget = () => {
    const val = parseInt(tempTarget)
    if (!isNaN(val) && val > 0) {
      setTarget(val)
      localStorage.setItem('cafe_acquisition_target', String(val))
    }
    setIsEditingTarget(false)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <DashboardHeader title="Cafe Acquisition" description="Grow the business from 7 cafes" />
        <div className="h-[200px] rounded-xl bg-card border border-border animate-pulse" />
        <div className="h-[400px] rounded-xl bg-card border border-border animate-pulse" />
      </div>
    )
  }

  const funnel = acquisition?.funnel
  const gapAnalysis = acquisition?.gapAnalysis
  const leads = acquisition?.leads || []
  const aiOutreach = acquisition?.aiOutreach || []
  const overallStrategy = acquisition?.overallStrategy || []

  // Check if lead has no activity in 30+ days
  const checkNeedsFollowUp = (lastContactStr?: string) => {
    if (!lastContactStr) return true
    const diffTime = Math.abs(new Date('2026-05-31T00:00:00Z').getTime() - new Date(lastContactStr).getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 30
  }

  // Calculate target progress
  const currentCount = funnel?.regular || 7
  const progressPercent = Math.min(Math.round((currentCount / target) * 100), 100)
  const cafesNeeded = Math.max(target - currentCount, 0)

  return (
    <div className="space-y-6">
      <DashboardHeader 
        title="Cafe Acquisition" 
        description="Strategic intelligence to scale our bulk coffee customer base" 
      />

      {/* Funnel Visualizer */}
      {funnel && (
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Acquisition Funnel</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            <div className="p-4 rounded-xl border border-border bg-muted/20 relative overflow-hidden">
              <div className="text-xs text-muted-foreground uppercase font-bold tracking-wide">1. Approached</div>
              <div className="text-3xl font-extrabold text-foreground mt-2">{funnel.approached}</div>
              <div className="text-[10px] text-muted-foreground mt-1">Cafes contacted in active regions</div>
            </div>

            <div className="p-4 rounded-xl border border-border bg-muted/20 relative overflow-hidden">
              <div className="flex justify-between items-center">
                <div className="text-xs text-muted-foreground uppercase font-bold tracking-wide">2. Trials Placed</div>
                <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full" style={{ color: '#d4a853' }}>
                  {funnel.approachedToTrialRate.toFixed(1)}% Conversion
                </span>
              </div>
              <div className="text-3xl font-extrabold text-foreground mt-2">{funnel.trial}</div>
              <div className="text-[10px] text-muted-foreground mt-1">First bulk trial ordered</div>
            </div>

            <div className="p-4 rounded-xl border border-border bg-muted/20 relative overflow-hidden" style={{ borderLeft: '3px solid #22c55e' }}>
              <div className="flex justify-between items-center">
                <div className="text-xs text-muted-foreground uppercase font-bold tracking-wide">3. Regular Cafes</div>
                <span className="text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">
                  {funnel.trialToRegularRate.toFixed(1)}% Repeat
                </span>
              </div>
              <div className="text-3xl font-extrabold text-green-500 mt-2">{funnel.regular}</div>
              <div className="text-[10px] text-muted-foreground mt-1">Steady bulk coffee accounts</div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Cafe Status List */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-md font-bold text-foreground">Outreach & Leads Directory</h3>
            <span className="text-xs text-muted-foreground font-semibold">Total {leads.length} Leads Logged</span>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1 scrollbar-thin">
            {leads.map((cafe) => {
              const needsFollowUp = checkNeedsFollowUp(cafe.lastContactedAt)
              let statusColor = 'bg-gray-500/10 text-gray-500'
              if (cafe.status === 'active') statusColor = 'bg-green-500/10 text-green-500'
              if (cafe.status === 'trial') statusColor = 'bg-blue-500/10 text-blue-500'
              if (cafe.status === 'approached') statusColor = 'bg-amber-500/10 text-amber-500'
              if (cafe.status === 'not_responded') statusColor = 'bg-purple-500/10 text-purple-500'
              if (cafe.status === 'dropped_off') statusColor = 'bg-red-500/10 text-red-500'

              return (
                <div key={cafe._id} className="bg-card border border-border rounded-xl p-4 space-y-3 hover:border-primary/30 transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-sm text-foreground">{cafe.name}</h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{cafe.location}</p>
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${statusColor}`}>
                        {cafe.status === 'active' ? 'Regular Customer' : cafe.status.replace('_', ' ')}
                      </span>
                      
                      {needsFollowUp && cafe.status !== 'active' && (
                        <span className="text-[8px] font-bold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-red-500 animate-ping" />
                          Needs follow-up
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-muted-foreground pt-2 border-t border-border/50">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> 
                      Contacted: {cafe.lastContactedAt ? new Date(cafe.lastContactedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Never'}
                    </span>
                    
                    {cafe.status === 'active' && (
                      <span className="text-green-500 font-bold uppercase tracking-wide">
                        Steady Ordering
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Target Tracker & Gaps */}
        <div className="lg:col-span-2 space-y-6">

          {/* Editable Target Tracker */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-foreground">Monthly Target Tracker</h3>
                <p className="text-xs text-muted-foreground">Bean sales bulk customer goal</p>
              </div>

              {!isEditingTarget ? (
                <button
                  onClick={() => setIsEditingTarget(true)}
                  className="p-1 hover:bg-accent rounded transition-colors text-primary"
                  style={{ color: '#d4a853' }}
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              ) : (
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    value={tempTarget}
                    onChange={(e) => setTempTarget(e.target.value)}
                    className="w-12 bg-muted border border-border rounded text-center text-xs py-0.5 text-foreground font-bold"
                  />
                  <button
                    onClick={saveTarget}
                    className="text-[10px] uppercase font-bold text-green-500 hover:underline"
                  >
                    Save
                  </button>
                </div>
              )}
            </div>

            <div className="p-4 rounded-xl border border-border bg-muted/30 text-center space-y-1">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Scale Progress</span>
              <div className="text-2xl font-bold flex items-baseline justify-center gap-1">
                <span className="text-green-500 font-extrabold">{currentCount}</span>
                <span className="text-muted-foreground text-sm">/ {target} Cafes</span>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Hit this target to secure <strong className="text-foreground">+{formatCurrency(cafesNeeded * 24000)}</strong> in estimated recurring monthly revenue.
              </p>
            </div>

            {/* Target visual progress */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-muted-foreground">Progress Goal</span>
                <span className="text-foreground">{progressPercent}%</span>
              </div>
              <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden border border-border">
                <div 
                  className="h-full rounded-full transition-all duration-500" 
                  style={{ 
                    width: `${progressPercent}%`,
                    background: '#d4a853'
                  }}
                />
              </div>
              {cafesNeeded > 0 ? (
                <p className="text-[10px] text-muted-foreground text-center mt-1">
                  💡 We need <strong className="text-foreground">{cafesNeeded} new cafe bulk accounts</strong> to achieve this month's growth goal.
                </p>
              ) : (
                <p className="text-[10px] text-green-500 text-center mt-1">
                  🎉 Target achieved! Growth goals fully reached!
                </p>
              )}
            </div>
          </div>

          {/* Gap Analysis */}
          {gapAnalysis && (
            <div className="bg-card border border-border rounded-xl p-5 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-foreground">Acquisition Gap Analysis</h3>
                <p className="text-xs text-muted-foreground">Bottlenecks and untapped potentials</p>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-muted/20 border border-border/50 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Outreach Trend</p>
                    <p className="font-bold text-foreground mt-0.5">
                      {gapAnalysis.approachedThisMonth} contacted <span className="text-[10px] text-muted-foreground">vs {gapAnalysis.approachedLastMonth} last month</span>
                    </p>
                  </div>
                  {gapAnalysis.approachedChange < 0 ? (
                    <span className="text-[9px] font-bold text-red-500 uppercase tracking-widest bg-red-500/10 px-2 py-0.5 rounded">
                      Down MoM
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold text-green-500 uppercase tracking-widest bg-green-500/10 px-2 py-0.5 rounded">
                      Up MoM
                    </span>
                  )}
                </div>

                <div className="p-3 bg-muted/20 border border-border/50 rounded-xl text-xs space-y-1">
                  <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Highest Untapped Territory</span>
                  <div className="flex justify-between items-center">
                    <p className="font-bold text-foreground">{gapAnalysis.untappedRegion}</p>
                    <span className="text-[10px] text-amber-500 bg-amber-500/10 font-bold px-2 py-0.5 rounded-full">
                      {gapAnalysis.untappedCount} approached leads
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-muted/20 border border-border/50 rounded-xl text-xs space-y-1">
                  <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Funnel Bottleneck</span>
                  <p className="font-bold text-foreground">{gapAnalysis.bottleneckStage}</p>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* AI Strategist growth actions */}
      {overallStrategy.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h3 className="text-md font-bold text-foreground flex items-center gap-1.5">
            <Sparkles className="w-5 h-5 text-primary" style={{ color: '#d4a853' }} />
            AI Growth Strategy Recommendations
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {overallStrategy.map((strat: string, idx: number) => {
              const parts = strat.split(':')
              const title = parts[0]
              const desc = parts[1] || ''

              return (
                <div key={idx} className="p-4 rounded-xl border border-primary/10 bg-primary/[0.01] space-y-2 relative overflow-hidden" style={{ borderTop: '3px solid #d4a853' }}>
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary" style={{ color: '#d4a853' }}>{idx+1}</span>
                    {title.replace(/^\*\*|\*\*$/g, '')}
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* AI-Generated Outreach suggestions */}
      {aiOutreach.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-md font-bold text-foreground flex items-center gap-1.5">
              <Sparkles className="w-5 h-5 text-primary" style={{ color: '#d4a853' }} />
              AI Outreach Assistant
            </h3>
            <span className="text-[10px] uppercase font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full tracking-wider" style={{ color: '#d4a853' }}>
              Sales Copy Templates
            </span>
          </div>

          <div className="space-y-4">
            {aiOutreach.map((outreach: any) => (
              <div key={outreach.cafeId} className="border border-border/80 rounded-xl overflow-hidden bg-card">
                <button
                  onClick={() => setExpandedOutreach(expandedOutreach === outreach.cafeId ? null : outreach.cafeId)}
                  className="w-full px-5 py-4 flex items-center justify-between hover:bg-muted/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary" style={{ color: '#d4a853' }}>
                      <Mail className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <h4 className="text-xs font-bold text-foreground">Follow-up Template for {outreach.name}</h4>
                      <p className="text-[10px] text-muted-foreground tracking-wider uppercase mt-0.5">{outreach.region} • Recommended Offer: {outreach.recommendedOffer}</p>
                    </div>
                  </div>
                  {expandedOutreach === outreach.cafeId ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </button>

                {expandedOutreach === outreach.cafeId && (
                  <div className="px-5 pb-5 pt-2 border-t border-border/50 bg-muted/20 space-y-4 animate-fade-in">
                    
                    {/* Subject line */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Email Subject</span>
                      <div className="p-2.5 rounded-lg border border-border bg-card text-xs font-medium text-foreground">
                        {outreach.recommendedSubject}
                      </div>
                    </div>

                    {/* Email body */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest font-mono">Email Body</span>
                      <pre className="p-4 rounded-lg border border-border bg-card text-xs text-muted-foreground font-sans whitespace-pre-wrap leading-relaxed">
                        {outreach.recommendedBody}
                      </pre>
                    </div>

                    <div className="flex items-center gap-2 justify-end text-[10px] text-muted-foreground">
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(outreach.recommendedBody)
                          alert('Email body copied to clipboard!')
                        }}
                        className="px-3 py-1.5 rounded bg-primary text-black font-bold uppercase transition-all hover:opacity-90"
                        style={{ background: '#d4a853' }}
                      >
                        Copy outreach text
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
