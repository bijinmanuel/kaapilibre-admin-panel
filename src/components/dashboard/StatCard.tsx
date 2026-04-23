import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  iconColor?: string
  trend?: { value: number; label: string }
  isLoading?: boolean
}

export function StatCard({ title, value, icon: Icon, iconColor = '#d4a853', trend, isLoading }: StatCardProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl p-5 border border-border bg-card animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-3 w-24 rounded bg-muted" />
          <div className="w-9 h-9 rounded-lg bg-muted" />
        </div>
        <div className="h-7 w-20 rounded bg-muted mb-2" />
        <div className="h-3 w-16 rounded bg-muted" />
      </div>
    )
  }

  return (
    <div className="rounded-xl p-5 border border-border bg-card hover:border-primary/20 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${iconColor}15` }}>
          <Icon className="w-4 h-4" style={{ color: iconColor }} />
        </div>
      </div>
      <p className="text-2xl font-semibold text-foreground">{value}</p>
      {trend && (
        <p className={cn('text-xs mt-1', trend.value >= 0 ? 'text-green-500' : 'text-red-400')}>
          {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
        </p>
      )}
    </div>
  )
}
