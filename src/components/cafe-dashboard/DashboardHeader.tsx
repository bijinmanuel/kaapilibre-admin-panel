'use client'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { MapPin, BarChart3, TrendingDown, Target, Lightbulb } from 'lucide-react'

interface DashboardHeaderProps {
  title: string;
  description: string;
  showBanner?: boolean;
  bannerGap?: number;
}

export function DashboardHeader({ title, description, showBanner = false, bannerGap = 0 }: DashboardHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentRegion = searchParams.get('region') || ''

  const regions = [
    { label: 'All Regions', value: '' },
    { label: 'Kerala', value: 'Kerala' },
    { label: 'Bangalore', value: 'Bangalore' },
    { label: 'Hyderabad', value: 'Hyderabad' }
  ]

  const tabs = [
    { label: 'Overview', href: '/cafe-dashboard', icon: BarChart3 },
    { label: 'Performance Insights', href: '/cafe-dashboard/insights', icon: TrendingDown },
    { label: 'Cafe Acquisition', href: '/cafe-dashboard/acquisition', icon: Target },
    { label: 'Sales Intelligence', href: '/cafe-dashboard/sales-intelligence', icon: Lightbulb }
  ]

  const handleRegionChange = (val: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (val) {
      params.set('region', val)
    } else {
      params.delete('region')
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  const getTabUrl = (href: string) => {
    if (currentRegion) {
      return `${href}?region=${currentRegion}`
    }
    return href
  }

  return (
    <div className="space-y-6">
      {/* Header and Region Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        {/* Region Filter */}
        <div className="flex items-center gap-2 bg-card border border-border px-3 py-1.5 rounded-lg w-fit self-end">
          <MapPin className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-muted-foreground mr-1">Region:</span>
          <select
            value={currentRegion}
            onChange={(e) => handleRegionChange(e.target.value)}
            className="bg-transparent text-xs font-bold text-foreground focus:outline-none cursor-pointer pr-4"
          >
            {regions.map((r) => (
              <option key={r.value} value={r.value} className="bg-card text-foreground">
                {r.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* MoM Drop Banner */}
      {showBanner && bannerGap > 0 && pathname === '/cafe-dashboard' && (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-fade-in">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-red-400 flex items-center gap-2">
              ⚠️ Month-over-Month Revenue Drop Detected
            </h4>
            <p className="text-xs text-muted-foreground">
              Total monthly revenue across all cafes dropped by <strong className="text-foreground">₹{bannerGap.toLocaleString('en-IN')}</strong> (-29.3%) compared to last month.
            </p>
          </div>
          <Link
            href={getTabUrl('/cafe-dashboard/insights')}
            className="px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-[1.02] border whitespace-nowrap"
            style={{ borderColor: '#d4a853', color: '#d4a853', background: 'rgba(212, 168, 83, 0.05)' }}
          >
            View Insights & Actions
          </Link>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-border">
        <div className="flex overflow-x-auto gap-2 -mb-px scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const active = pathname === tab.href
            return (
              <Link
                key={tab.href}
                href={getTabUrl(tab.href)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                  active
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
                style={active ? { borderColor: '#d4a853', color: '#d4a853' } : {}}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {tab.label}
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
