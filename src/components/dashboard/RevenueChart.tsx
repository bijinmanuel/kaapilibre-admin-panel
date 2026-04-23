'use client'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '@/lib/utils'
import type { RevenuePoint } from '@/types'

interface Props {
  data?: RevenuePoint[]
  period: 'daily' | 'weekly' | 'monthly'
  onPeriodChange: (p: 'daily' | 'weekly' | 'monthly') => void
  isLoading?: boolean
}

const PERIODS = ['daily', 'weekly', 'monthly'] as const

function formatLabel(point: RevenuePoint, period: string) {
  const { year, month, day, week } = point._id
  if (period === 'monthly') return `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][(month||1)-1]} ${year}`
  if (period === 'weekly') return `W${week} ${year}`
  return `${day}/${month}`
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg px-3 py-2 text-xs border border-border bg-popover shadow-lg">
      <p className="text-muted-foreground mb-1">{label}</p>
      <p className="font-semibold" style={{ color: '#d4a853' }}>{formatCurrency(payload[0].value)}</p>
      <p className="text-muted-foreground">{payload[0].payload.orders} orders</p>
    </div>
  )
}

export function RevenueChart({ data, period, onPeriodChange, isLoading }: Props) {
  const chartData = data?.map(p => ({ ...p, label: formatLabel(p, period) })) || []

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-sm font-medium text-foreground">Revenue</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatCurrency(data?.reduce((s, p) => s + p.revenue, 0) || 0)} total
          </p>
        </div>
        <div className="flex gap-1 p-1 rounded-lg bg-muted">
          {PERIODS.map(p => (
            <button key={p} onClick={() => onPeriodChange(p)}
              className="px-3 py-1 rounded-md text-xs font-medium transition-all capitalize"
              style={period === p ? { background: '#d4a853', color: '#1a1713' } : { color: 'var(--muted-foreground)' }}>
              {p}
            </button>
          ))}
        </div>
      </div>
      {isLoading ? (
        <div className="h-64 rounded-lg bg-muted animate-pulse" />
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="revenue" stroke="#d4a853" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#d4a853' }} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
