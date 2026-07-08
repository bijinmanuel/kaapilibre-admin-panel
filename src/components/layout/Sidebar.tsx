'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, ShoppingCart, Package, Users, Archive,
  MessageSquare, BarChart3, Settings, ChevronLeft, ChevronRight, LogOut, BookOpen, Users2, AlertTriangle, CreditCard,
  Coffee, Wallet, Store, ChevronDown, ChevronUp, FileText, FolderLock
} from 'lucide-react'
import { cn, getInitials } from '@/lib/utils'
import { useAuthStore, useCanAccess } from '@/store/authStore'
import { useSidebarStore } from '@/store/sidebarStore'

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard', feature: 'dashboard' },
  { icon: ShoppingCart, label: 'Orders', href: '/orders', feature: 'orders' },
  { icon: Store, label: 'Cafes', href: '/cafes', feature: 'cafe' },
  { icon: Coffee, label: 'Cafe Menu', href: '/cafe-menu', feature: 'cafe-products' },
  { icon: Coffee, label: 'Cafe Orders', href: '/cafe-orders', feature: 'cafe-orders' },
  { icon: BarChart3, label: 'Cafe Analytics', href: '/cafe-dashboard', feature: 'cafe-analytics' },
  { icon: Package, label: 'Products', href: '/products', feature: 'products' },
  { icon: Users, label: 'Customers', href: '/customers', feature: 'customers' },
  { icon: Users2, label: 'Employees', href: '/employees', feature: 'employees' },
  { icon: Archive, label: 'Inventory', href: '/inventory', feature: 'inventory' },
  { icon: MessageSquare, label: 'Contact', href: '/contact', feature: 'contact' },
  { icon: BarChart3, label: 'Analytics', href: '/analytics', feature: 'analytics' },
  { icon: Wallet, label: 'Expenses', href: '/expenses', feature: 'expenses' },
  { icon: CreditCard, label: 'Payments', href: '/payments', feature: 'payments' },
  { icon: Users2, label: 'Guests', href: '/guests', feature: 'guests' },
  { icon: AlertTriangle, label: 'Complaints', href: '/complaints', feature: 'complaints' },
  { icon: FileText, label: 'About Page', href: '/about', feature: 'about' },
  { icon: BookOpen, label: 'Blog', href: '/blog', feature: 'blog' },
  { icon: BarChart3, label: 'Finance', href: '/finance', feature: 'finance' },
  { icon: FolderLock, label: 'Company Docs', href: '/documents', feature: 'documents' },
  { icon: Settings, label: 'Settings', href: '/settings', feature: 'settings' },
]

const FINANCE_SUBLINKS = [
  { label: 'Dashboard', href: '/finance' },
  { label: 'Revenue', href: '/finance/revenue' },
  { label: 'Expenses', href: '/finance/expenses' },
  { label: 'Ledger', href: '/finance/ledger' },
  { label: 'Accounts', href: '/finance/accounts' },
  { label: 'Transfers', href: '/finance/transfers' },
  { label: 'Setup', href: '/finance/accounts-setup' },
  { label: 'Liabilities', href: '/finance/liabilities' },
  { label: 'Profitability', href: '/finance/profitability' },
  { label: 'Cash Flow', href: '/finance/cash-flow' },
  { label: 'Reports', href: '/finance/reports' },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuthStore()
  const { collapsed, toggle } = useSidebarStore()
  const canAccess = useCanAccess()
  const [financeOpen, setFinanceOpen] = useState(false)
  const financeSublinksRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (pathname.startsWith('/finance')) {
      setFinanceOpen(true)
    }
  }, [pathname])

  useEffect(() => {
    if (financeOpen && !collapsed) {
      const timer = setTimeout(() => {
        financeSublinksRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [financeOpen, collapsed])

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

          if (item.feature === 'finance' && !collapsed) {
            const isFinanceActive = pathname.startsWith('/finance');
            return (
              <div key="finance-menu" className="space-y-1">
                <button
                  onClick={() => setFinanceOpen(!financeOpen)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all duration-150',
                    isFinanceActive
                      ? 'text-primary font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  )}
                  style={isFinanceActive ? { background: 'rgba(212,168,83,0.15)', color: '#d4a853', borderLeft: '2px solid #d4a853' } : {}}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {financeOpen ? (
                    <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                </button>
                {financeOpen && (
                  <div ref={financeSublinksRef} className="pl-6 space-y-1 border-l border-white/5 ml-4">
                    {FINANCE_SUBLINKS.map((sub) => {
                      const subActive = pathname === sub.href;
                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          className={cn(
                            'block px-3 py-1.5 rounded-md text-xs transition-colors',
                            subActive
                              ? 'text-primary font-semibold'
                              : 'text-muted-foreground hover:text-foreground'
                          )}
                          style={subActive ? { color: '#d4a853' } : {}}
                        >
                          {sub.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

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
