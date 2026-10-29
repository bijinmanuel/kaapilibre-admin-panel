'use client'
import { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, ShoppingCart, Package, Users, Archive,
  MessageSquare, BarChart3, Settings, ChevronLeft, ChevronRight, LogOut, BookOpen, Users2, AlertTriangle, CreditCard,
  Coffee, Wallet, Store, ChevronDown, ChevronUp, FileText, FolderLock, HelpCircle, ShieldCheck, Star, Search, X, Landmark, UtensilsCrossed
} from 'lucide-react'
import { cn, getInitials } from '@/lib/utils'
import { useAuthStore, useCanAccess } from '@/store/authStore'
import { useSidebarStore } from '@/store/sidebarStore'
import { useReviewStats } from '@/hooks/useReviews'

interface NavSublink {
  label: string
  href: string
}

interface NavItem {
  icon: any
  label: string
  href: string
  feature: string
  sublinks?: NavSublink[]
}

interface NavSection {
  id: string
  title: string
  defaultOpen?: boolean
  items: NavItem[]
}

const FINANCE_SUBLINKS: NavSublink[] = [
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

const NAV_SECTIONS: NavSection[] = [
  {
    id: 'overview',
    title: 'Overview',
    defaultOpen: true,
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard', feature: 'dashboard' },
      { icon: BarChart3, label: 'Store Analytics', href: '/analytics', feature: 'analytics' },
    ],
  },
  {
    id: 'storefront',
    title: 'Storefront (D2C)',
    defaultOpen: true,
    items: [
      { icon: ShoppingCart, label: 'Orders', href: '/orders', feature: 'orders' },
      { icon: Package, label: 'Products', href: '/products', feature: 'products' },
      { icon: Archive, label: 'Inventory', href: '/inventory', feature: 'inventory' },
      { icon: Users, label: 'Customers', href: '/customers', feature: 'customers' },
      { icon: Users2, label: 'Guests', href: '/guests', feature: 'guests' },
      { icon: Star, label: 'Reviews', href: '/reviews', feature: 'reviews' },
    ],
  },
  {
    id: 'cafe-b2b',
    title: 'Cafe Portal (B2B)',
    defaultOpen: true,
    items: [
      { icon: Store, label: 'Partner Cafes', href: '/cafes', feature: 'cafe' },
      { icon: UtensilsCrossed, label: 'Cafe Menu', href: '/cafe-menu', feature: 'cafe-products' },
      { icon: Coffee, label: 'Cafe Orders', href: '/cafe-orders', feature: 'cafe-orders' },
      { icon: BarChart3, label: 'Cafe Analytics', href: '/cafe-dashboard', feature: 'cafe-analytics' },
      { icon: AlertTriangle, label: 'Cafe Complaints', href: '/cafe-complaints', feature: 'cafe-complaints' },
    ],
  },
  {
    id: 'support',
    title: 'Support & CRM',
    defaultOpen: true,
    items: [
      { icon: AlertTriangle, label: 'Customer Complaints', href: '/complaints', feature: 'complaints' },
      { icon: MessageSquare, label: 'Contact Inquiries', href: '/contact', feature: 'contact' },
    ],
  },
  {
    id: 'finance',
    title: 'Finance & Billing',
    defaultOpen: true,
    items: [
      { icon: Landmark, label: 'Finance Suite', href: '/finance', feature: 'finance', sublinks: FINANCE_SUBLINKS },
      { icon: CreditCard, label: 'Payments', href: '/payments', feature: 'payments' },
      { icon: Wallet, label: 'Expenses', href: '/expenses', feature: 'expenses' },
    ],
  },
  {
    id: 'cms',
    title: 'Website CMS',
    defaultOpen: false,
    items: [
      { icon: BookOpen, label: 'Blog', href: '/blog', feature: 'blog' },
      { icon: FileText, label: 'About Page', href: '/about', feature: 'about' },
      { icon: HelpCircle, label: 'FAQs', href: '/faq', feature: 'faq' },
      { icon: ShieldCheck, label: 'Policies', href: '/policies', feature: 'policies' },
    ],
  },
  {
    id: 'organization',
    title: 'Organization',
    defaultOpen: false,
    items: [
      { icon: Users2, label: 'Employees', href: '/employees', feature: 'employees' },
      { icon: FolderLock, label: 'Company Docs', href: '/documents', feature: 'documents' },
      { icon: Settings, label: 'Settings', href: '/settings', feature: 'settings' },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuthStore()
  const { collapsed, toggle } = useSidebarStore()
  const canAccess = useCanAccess()
  const { data: reviewStats } = useReviewStats()

  const [searchQuery, setSearchQuery] = useState('')
  const [financeOpen, setFinanceOpen] = useState(false)
  const [openSectionId, setOpenSectionId] = useState<string | null>(() => {
    const activeSection = NAV_SECTIONS.find((s) =>
      s.items.some((item) => pathname === item.href || pathname.startsWith(item.href + '/'))
    )
    return activeSection?.id ?? 'overview'
  })
  const financeSublinksRef = useRef<HTMLDivElement>(null)

  const isItemActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/')

  // Automatically open only the section matching the current route (and Finance submenu if in /finance)
  useEffect(() => {
    const isFinanceRoute = pathname.startsWith('/finance')
    setFinanceOpen(isFinanceRoute)

    const activeSection = NAV_SECTIONS.find((section) =>
      section.items.some((item) => isItemActive(item.href))
    )
    if (activeSection) {
      setOpenSectionId(activeSection.id)
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

  const toggleSection = (id: string) => {
    setOpenSectionId((prev) => {
      const next = prev === id ? null : id
      if (next !== 'finance') {
        setFinanceOpen(false)
      }
      return next
    })
  }

  const filteredSections = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return NAV_SECTIONS.map((section) => {
      const accessibleItems = section.items.filter((item) => canAccess(item.feature))
      if (!q) return { ...section, items: accessibleItems }

      const matchedItems = accessibleItems.filter(
        (item) =>
          item.label.toLowerCase().includes(q) ||
          section.title.toLowerCase().includes(q) ||
          item.sublinks?.some((sub) => sub.label.toLowerCase().includes(q))
      )
      return { ...section, items: matchedItems }
    }).filter((section) => section.items.length > 0)
  }, [canAccess, searchQuery])

  const isSearching = searchQuery.trim().length > 0

  return (
    <aside
      className={cn(
        'relative flex flex-col h-screen transition-all duration-300 ease-in-out flex-shrink-0 select-none',
        'border-r border-border bg-card',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Floating Edge Toggle Button (always visible in both states) */}
      <button
        onClick={toggle}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className="absolute -right-3 top-5 z-20 w-6 h-6 rounded-full bg-card border border-border shadow-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all"
      >
        {collapsed ? (
          <ChevronRight className="w-3.5 h-3.5" style={{ color: '#d4a853' }} />
        ) : (
          <ChevronLeft className="w-3.5 h-3.5" />
        )}
      </button>

      {/* Brand Header */}
      <div
        className={cn(
          'flex items-center h-14 px-3 border-b border-border/60 flex-shrink-0',
          collapsed ? 'justify-center' : 'justify-between'
        )}
      >
        <div
          onClick={collapsed ? toggle : undefined}
          title={collapsed ? 'Click to expand sidebar' : undefined}
          className={cn(
            'flex items-center',
            collapsed ? 'justify-center cursor-pointer' : 'gap-3'
          )}
        >
          <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 ring-1 ring-border">
            <Image
              src="/brand/logo.png"
              alt="KaapiLibre Logo"
              width={32}
              height={32}
              className="w-full h-full object-cover"
            />
          </div>
          {!collapsed && (
            <div>
              <p className="text-sm font-semibold text-foreground leading-tight">KaapiLibre</p>
              <p className="text-[10px] font-medium tracking-wider uppercase" style={{ color: '#d4a853' }}>
                Admin Portal
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Filter Input (Expanded Mode) */}
      {!collapsed && (
        <div className="px-3 pt-3 pb-1 flex-shrink-0">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Jump to section..."
              style={{ paddingLeft: '2rem', paddingRight: searchQuery ? '1.75rem' : '0.75rem' }}
              className="w-full h-8 text-xs rounded-lg bg-muted/50 border border-border/60 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Navigation Sections */}
      <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-2 scrollbar-thin">
        {filteredSections.map((section, sectionIdx) => {
          const isSectionOpen = isSearching || openSectionId === section.id
          const hasActiveChild = section.items.some((i) => isItemActive(i.href))

          return (
            <div key={section.id} className="space-y-0.5">
              {/* Section Header or Collapsed Divider */}
              {collapsed ? (
                sectionIdx > 0 && <div className="my-2 mx-2 border-t border-border/60" />
              ) : (
                <button
                  type="button"
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center justify-between px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/75 hover:text-foreground transition-colors group"
                >
                  <span className="flex items-center gap-1.5">
                    {section.title}
                    {!isSectionOpen && hasActiveChild && (
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: '#d4a853' }}
                      />
                    )}
                  </span>
                  <ChevronDown
                    className={cn(
                      'w-3 h-3 text-muted-foreground/50 group-hover:text-foreground transition-transform duration-200',
                      !isSectionOpen && '-rotate-90'
                    )}
                  />
                </button>
              )}

              {/* Section Links */}
              {(collapsed || isSectionOpen) && (
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const Icon = item.icon
                    const active = isItemActive(item.href)

                    // Expandable item with sublinks (Finance Suite)
                    if (item.sublinks && !collapsed) {
                      const subMenuOpen = isSearching || financeOpen
                      return (
                        <div key={item.href} className="space-y-0.5">
                          <button
                            onClick={() => setFinanceOpen(!financeOpen)}
                            className={cn(
                              'w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-all duration-150',
                              active
                                ? 'text-primary font-semibold'
                                : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'
                            )}
                            style={
                              active
                                ? {
                                    background: 'rgba(212,168,83,0.14)',
                                    color: '#d4a853',
                                    borderLeft: '2px solid #d4a853',
                                  }
                                : {}
                            }
                          >
                            <div className="flex items-center gap-2.5">
                              <Icon className="w-4 h-4 flex-shrink-0" />
                              <span>{item.label}</span>
                            </div>
                            {subMenuOpen ? (
                              <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                            )}
                          </button>

                          {subMenuOpen && (
                            <div
                              ref={financeSublinksRef}
                              className="pl-4 ml-4 py-1 space-y-0.5 border-l border-border"
                            >
                              {item.sublinks
                                .filter(
                                  (sub) =>
                                    !isSearching ||
                                    sub.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    item.label.toLowerCase().includes(searchQuery.toLowerCase())
                                )
                                .map((sub) => {
                                  const subActive = pathname === sub.href
                                  return (
                                    <Link
                                      key={sub.href}
                                      href={sub.href}
                                      className={cn(
                                        'block px-2.5 py-1.5 rounded-md text-xs transition-colors',
                                        subActive
                                          ? 'font-semibold bg-primary/10'
                                          : 'text-muted-foreground hover:text-foreground hover:bg-accent/40'
                                      )}
                                      style={subActive ? { color: '#d4a853' } : {}}
                                    >
                                      {sub.label}
                                    </Link>
                                  )
                                })}
                            </div>
                          )}
                        </div>
                      )
                    }

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        title={collapsed ? item.label : undefined}
                        className={cn(
                          'flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all duration-150',
                          collapsed ? 'justify-center px-0 py-2.5' : '',
                          active
                            ? 'text-primary font-semibold'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'
                        )}
                        style={
                          active
                            ? {
                                background: 'rgba(212,168,83,0.14)',
                                color: '#d4a853',
                                borderLeft: collapsed ? undefined : '2px solid #d4a853',
                              }
                            : {}
                        }
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                        {!collapsed &&
                          item.feature === 'reviews' &&
                          (reviewStats?.pending ?? 0) > 0 && (
                            <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                              {reviewStats?.pending}
                            </span>
                          )}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}

        {filteredSections.length === 0 && !collapsed && (
          <div className="py-8 text-center text-xs text-muted-foreground">
            No matching navigation items
          </div>
        )}
      </nav>

      {/* Footer: User Profile & Actions */}
      <div className="border-t border-border/60 p-2 space-y-1 flex-shrink-0 bg-card">
        {!collapsed && user && (
          <div className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg bg-muted/40 border border-border/50">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: '#d4a853', color: '#1a1713' }}
              >
                {getInitials(user.name)}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{user.name}</p>
                <p className="text-[10px] capitalize font-medium" style={{ color: '#d4a853' }}>
                  {user.role}
                </p>
              </div>
            </div>
            <button
              onClick={() => logout()}
              title="Sign out"
              className="p-1.5 rounded-md text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {collapsed && (
          <button
            onClick={() => logout()}
            className="flex items-center justify-center w-full p-2 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={toggle}
          className={cn(
            'flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors text-xs font-medium',
            collapsed ? 'justify-center px-0' : ''
          )}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" style={{ color: '#d4a853' }} />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>Collapse Sidebar</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}
