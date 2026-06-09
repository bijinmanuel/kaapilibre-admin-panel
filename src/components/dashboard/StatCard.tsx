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
    <div className="rounded-2xl p-5 border border-border bg-card hover:border-[#d4a853]/40 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:hover:shadow-[0_8px_30px_rgba(212,168,83,0.04)] transition-all duration-300">
      <div className="flex items-center justify-between mb-3.5">
        <p className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider">{title}</p>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform duration-300 hover:scale-105" style={{ background: `${iconColor}15` }}>
          <Icon className="w-4 h-4" style={{ color: iconColor }} />
        </div>
      </div>
      <p className="text-2xl font-extrabold tracking-tight text-foreground md:text-3xl">{value}</p>
      {trend && (
        <p className={cn('text-xs mt-1.5 font-medium', trend.value >= 0 ? 'text-emerald-500' : 'text-red-400')}>
          {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
        </p>
      )}
    </div>
  )
}
