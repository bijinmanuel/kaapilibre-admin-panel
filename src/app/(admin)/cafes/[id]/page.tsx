'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  ArrowLeft, Store, TrendingUp, ShoppingBag, Calendar, 
  ArrowUpRight, Clock, Star, MapPin, Phone
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { useCafeAnalytics } from '@/hooks/useCafes'
import { formatCurrency } from '@/lib/utils'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell, LineChart, Line
} from 'recharts'

export default function CafeDetailsPage() {
  const { id } = useParams()
  const router = useRouter()
  const { data: analytics, isLoading } = useCafeAnalytics(id as string)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (isLoading || !mounted) return <div className="p-8 animate-pulse text-muted-foreground">Loading analytics...</div>
  if (!analytics) return <div className="p-8 text-red-500">Analytics not found</div>

  const { cafe, totalRevenue, totalOrders, monthlyStats, topMonth } = analytics

  return (
    <>
      <button 
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Cafes
      </button>

      <PageHeader
        title={cafe.name}
        description="Detailed performance and sales analytics"
        action={
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 text-green-500 text-xs font-bold uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5" /> Live Tracking
          </div>
        }
      />

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <TrendingUp className="w-5 h-5" />
            </div>
            <p className="text-sm text-muted-foreground">Total Revenue</p>
          </div>
          <h3 className="text-2xl font-bold text-foreground">{formatCurrency(totalRevenue)}</h3>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <p className="text-sm text-muted-foreground">Total Orders</p>
          </div>
          <h3 className="text-2xl font-bold text-foreground">{totalOrders}</h3>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
              <Calendar className="w-5 h-5" />
            </div>
            <p className="text-sm text-muted-foreground">Top Month</p>
          </div>
          <h3 className="text-2xl font-bold text-foreground">{topMonth ? topMonth.month : '—'}</h3>
          {topMonth && <p className="text-xs text-muted-foreground mt-1">{formatCurrency(topMonth.amount)} sales</p>}
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
              <Star className="w-5 h-5" />
            </div>
            <p className="text-sm text-muted-foreground">Avg Ticket</p>
          </div>
          <h3 className="text-2xl font-bold text-foreground">
            {totalOrders > 0 ? formatCurrency(totalRevenue / totalOrders) : '—'}
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h4 className="text-lg font-bold text-foreground">Sales Performance</h4>
              <p className="text-sm text-muted-foreground">Month-by-month revenue growth</p>
            </div>
          </div>
          
          <div className="h-[300px] w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={100}>
              <BarChart data={monthlyStats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#888' }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#888' }}
                  tickFormatter={(val) => `₹${val/1000}k`}
                />
                <Tooltip 
                  contentStyle={{ background: '#1a1713', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  cursor={{ fill: 'rgba(212, 168, 83, 0.05)' }}
                />
                <Bar 
                  dataKey="amount" 
                  fill="#d4a853" 
                  radius={[6, 6, 0, 0]} 
                  barSize={40}
                  animationDuration={1500}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cafe Info */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-2xl p-6">
            <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-6">Location Details</h4>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="p-2 rounded-lg bg-accent text-muted-foreground h-fit">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Address</p>
                  <p className="text-sm font-medium text-foreground">{cafe.location || 'Not provided'}</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="p-2 rounded-lg bg-accent text-muted-foreground h-fit">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Contact Number</p>
                  <p className="text-sm font-medium text-foreground">{cafe.contactNumber || 'Not provided'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 relative overflow-hidden group">
            <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Performance Summary</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              This cafe has generated a total of <span className="text-primary font-bold">{formatCurrency(totalRevenue)}</span> across 
              <span className="text-primary font-bold"> {totalOrders}</span> orders. 
              The most successful month was <span className="text-primary font-bold">{topMonth?.month}</span>.
            </p>
            <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
              <Store className="w-24 h-24" />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
