'use client'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, ShoppingCart, Package, Users, Archive,
  MessageSquare, BarChart3, Settings, ChevronLeft, ChevronRight, LogOut, BookOpen, Users2, AlertTriangle, CreditCard,
  Coffee, Wallet, Store
} from 'lucide-react'
import { cn, getInitials } from '@/lib/utils'
import { useAuthStore, useCanAccess } from '@/store/authStore'
import { useSidebarStore } from '@/store/sidebarStore'

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard',  href: '/dashboard',  feature: 'dashboard' },
  { icon: ShoppingCart,    label: 'Orders',     href: '/orders',     feature: 'orders' },
  { icon: Store,           label: 'Cafes',      href: '/cafes',      feature: 'cafe' },
  { icon: Coffee,          label: 'Cafe Menu',   href: '/cafe-menu',  feature: 'cafe-products' },
  { icon: Coffee,          label: 'Cafe Orders', href: '/cafe-orders', feature: 'cafe-orders' },
  { icon: Package,         label: 'Products',   href: '/products',   feature: 'products' },
  { icon: Users,           label: 'Customers',  href: '/customers',  feature: 'customers' },
  { icon: Archive,         label: 'Inventory',  href: '/inventory',  feature: 'inventory' },
  { icon: MessageSquare,   label: 'Contact',    href: '/contact',    feature: 'contact' },
  { icon: BarChart3,       label: 'Analytics',  href: '/analytics',  feature: 'analytics' },
  { icon: Wallet,          label: 'Expenses',   href: '/expenses',   feature: 'expenses' },
  { icon: CreditCard,      label: 'Payments',   href: '/payments',   feature: 'payments' },
  { icon: Users2,          label: 'Guests',     href: '/guests',     feature: 'guests' },
  { icon: AlertTriangle,   label: 'Complaints',  href: '/complaints',  feature: 'complaints' },
  { icon: BookOpen,        label: 'Blog',       href: '/blog',       feature: 'blog' },
  { icon: Settings,        label: 'Settings',   href: '/settings',   feature: 'settings' },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuthStore()
  const { collapsed, toggle } = useSidebarStore()
  const canAccess = useCanAccess

  return (
    <aside
      className={cn(
        'flex flex-col h-screen transition-all duration-300 ease-in-out flex-shrink-0',
        'border-r border-border',
        'bg-card',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center h-16 px-4 border-b border-border', collapsed ? 'justify-center' : 'gap-3')}>
        <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
          <Image src="/brand/logo.png" alt="KaapiLibre Logo" width={32} height={32} className="w-full h-full object-cover" />
        </div>
        {!collapsed && (
          <div>
            <p className="text-sm font-semibold text-foreground leading-tight">KaapiLibre</p>
            <p className="text-[10px]" style={{ color: '#d4a853' }}>Admin Panel</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {NAV_ITEMS.filter(item => canAccess(item.feature)).map((item) => {
          const Icon = item.icon
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150',
                collapsed ? 'justify-center' : '',
                active
                  ? 'text-primary font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
              style={active ? { background: 'rgba(212,168,83,0.15)', color: '#d4a853', borderLeft: '2px solid #d4a853' } : {}}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* User + Collapse */}
      <div className="border-t border-border p-2 space-y-1">
        {!collapsed && user && (
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: '#d4a853', color: '#1a1713' }}>
              {getInitials(user.name)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{user.name}</p>
              <p className="text-[10px] capitalize" style={{ color: '#d4a853' }}>{user.role}</p>
            </div>
          </div>
        )}
        <button
          onClick={() => logout()}
          className={cn('flex items-center gap-3 w-full px-3 py-2 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors text-sm', collapsed ? 'justify-center' : '')}
          title={collapsed ? 'Sign out' : undefined}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && 'Sign out'}
        </button>
        <button
          onClick={toggle}
          className={cn('flex items-center gap-3 w-full px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors text-sm', collapsed ? 'justify-center' : '')}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <><ChevronLeft className="w-4 h-4" /><span>Collapse</span></>}
        </button>
      </div>
    </aside>
  )
}
