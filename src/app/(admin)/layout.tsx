'use client'
import { useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { useAuthStore } from '@/store/authStore'
import { Coffee, Loader2 } from 'lucide-react'

const ROUTE_META: Record<string, { title: string; feature: string }> = {
  '/dashboard':  { title: 'Dashboard',  feature: 'dashboard' },
  '/orders':     { title: 'Orders',     feature: 'orders' },
  '/products':   { title: 'Products',   feature: 'products' },
  '/customers':  { title: 'Customers',  feature: 'customers' },
  '/inventory':  { title: 'Inventory',  feature: 'inventory' },
  '/contact':    { title: 'Contact',    feature: 'contact' },
  '/analytics':  { title: 'Analytics',  feature: 'analytics' },
  '/payments':    { title: 'Payments',         feature: 'payments' },
  '/guests':      { title: 'Guest customers', feature: 'guests' },
  '/complaints':  { title: 'Complaints',        feature: 'complaints' },
  '/blog':        { title: 'Blog',              feature: 'blog' },
  '/settings':   { title: 'Settings',   feature: 'settings' },
}

const PERMISSIONS: Record<string, string[]> = {
  admin:    ['dashboard', 'orders', 'products', 'customers', 'inventory', 'contact', 'analytics', 'payments', 'guests', 'complaints', 'blog', 'settings'],
  subadmin: ['dashboard', 'orders', 'products', 'inventory', 'contact', 'complaints', 'blog'],
}

function getRouteMeta(pathname: string) {
  const base = '/' + pathname.split('/')[1]
  return ROUTE_META[base] || { title: 'Admin', feature: 'dashboard' }
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated, fetchMe } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()
  const fetched = useRef(false)

  useEffect(() => {
    if (!fetched.current) {
      fetched.current = true
      fetchMe()
    }
  }, [fetchMe])

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login')
    }
  }, [isLoading, isAuthenticated, router])

  useEffect(() => {
    if (user && !isLoading) {
      const meta = getRouteMeta(pathname)
      const role = user.role as string
      const allowed = PERMISSIONS[role] ?? []
      if (!allowed.includes(meta.feature)) {
        router.replace('/unauthorized')
      }
    }
  }, [user, isLoading, pathname, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0d0c0a' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: '#d4a853' }}>
            <Coffee className="w-6 h-6" style={{ color: '#1a1713' }} />
          </div>
          <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#d4a853' }} />
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Loading KaapiLibre Admin...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) return null

  const { title } = getRouteMeta(pathname)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar title={title} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
