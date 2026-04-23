'use client'
import { useTheme } from 'next-themes'
import { Sun, Moon, ChevronDown, Bell, CheckCheck, Trash2, ShoppingCart, AlertTriangle, MessageSquare, Package, CreditCard, FileText } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useNotifications, useMarkOneRead, useMarkAllRead, useClearAll } from '@/hooks/useNotifications'
import { getInitials, formatDateTime } from '@/lib/utils'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const TYPE_ICON: Record<string, any> = {
  new_order:             ShoppingCart,
  order_status_changed:  Package,
  payment_received:      CreditCard,
  new_complaint:         AlertTriangle,
  new_contact:           MessageSquare,
  low_stock:             FileText,
}

const TYPE_COLOR: Record<string, string> = {
  new_order:             '#d4a853',
  order_status_changed:  '#60a5fa',
  payment_received:      '#22c55e',
  new_complaint:         '#ef4444',
  new_contact:           '#a78bfa',
  low_stock:             '#f59e0b',
}

export function Topbar({ title }: { title?: string }) {
  const { theme, setTheme } = useTheme()
  const { user, logout }    = useAuthStore()
  const router              = useRouter()
  const [dropOpen,  setDropOpen]  = useState(false)
  const [bellOpen,  setBellOpen]  = useState(false)
  const bellRef  = useRef<HTMLDivElement>(null)
  const dropRef  = useRef<HTMLDivElement>(null)

  const { data: notifData } = useNotifications()
  const markOne    = useMarkOneRead()
  const markAll    = useMarkAllRead()
  const clearAll   = useClearAll()

  const notifications = notifData?.notifications ?? []
  const unreadCount   = notifData?.unreadCount ?? 0

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node))  setBellOpen(false)
      if (dropRef.current  && !dropRef.current.contains(e.target as Node))  setDropOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleNotifClick = (n: any) => {
    if (!n.isRead) markOne.mutate(n._id)
    if (n.link) { router.push(n.link); setBellOpen(false) }
  }

  return (
    <header className="h-14 border-b border-border/40 flex items-center justify-between px-6 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
      <div>
        {title && <h1 className="text-sm font-semibold text-foreground">{title}</h1>}
      </div>

      <div className="flex items-center gap-1">
        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notification bell */}
        <div className="relative" ref={bellRef}>
          <button
            onClick={() => setBellOpen(!bellOpen)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors relative">
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center text-white"
                style={{ background: '#ef4444' }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {bellOpen && (
            <div className="absolute right-0 top-10 w-80 bg-popover border border-border rounded-xl shadow-xl z-50 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                      style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="flex gap-1">
                  {unreadCount > 0 && (
                    <button onClick={() => markAll.mutate()} title="Mark all read"
                      className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                      <CheckCheck className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button onClick={() => clearAll.mutate()} title="Clear all"
                      className="p-1.5 rounded text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* List */}
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-10 text-center text-muted-foreground">
                    <Bell className="w-6 h-6 mx-auto mb-2 opacity-30" />
                    <p className="text-xs">No notifications</p>
                  </div>
                ) : notifications.map(n => {
                  const Icon = TYPE_ICON[n.type] ?? Bell
                  const color = TYPE_COLOR[n.type] ?? '#d4a853'
                  return (
                    <div
                      key={n._id}
                      onClick={() => handleNotifClick(n)}
                      className={`flex gap-3 px-4 py-3 border-b border-border last:border-0 cursor-pointer transition-colors ${
                        !n.isRead ? 'bg-primary/3 hover:bg-primary/5' : 'hover:bg-accent/40'
                      }`}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: `${color}15` }}>
                        <Icon className="w-3.5 h-3.5" style={{ color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1">
                          <p className={`text-xs leading-snug ${!n.isRead ? 'font-semibold text-foreground' : 'text-foreground'}`}>
                            {n.title}
                          </p>
                          {!n.isRead && <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1 flex-shrink-0" />}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{n.message}</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-1">{formatDateTime(n.createdAt)}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* User dropdown */}
        {user && (
          <div className="relative ml-1" ref={dropRef}>
            <button
              onClick={() => setDropOpen(!dropOpen)}
              className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-lg hover:bg-accent transition-colors">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: '#d4a853', color: '#1a1713' }}>
                {getInitials(user.name)}
              </div>
              <span className="text-xs text-muted-foreground hidden sm:block">{user.name}</span>
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            </button>
            {dropOpen && (
              <div className="absolute right-0 top-10 w-40 bg-popover border border-border rounded-lg shadow-lg py-1 z-50">
                <button onClick={() => { setDropOpen(false); logout() }}
                  className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-accent transition-colors">
                  Sign out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
