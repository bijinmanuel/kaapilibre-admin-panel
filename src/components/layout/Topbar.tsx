'use client'
import { useTheme } from 'next-themes'
import {
  Sun,
  Moon,
  ChevronDown,
  Bell,
  BellRing,
  BellOff,
  CheckCheck,
  Trash2,
  ShoppingCart,
  AlertTriangle,
  MessageSquare,
  Package,
  CreditCard,
  FileText,
  Store,
  Smartphone,
  Send,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import {
  useNotifications,
  useMarkOneRead,
  useMarkAllRead,
  useClearAll,
  useOpenComplaintsSummary,
} from '@/hooks/useNotifications'
import {
  isPushSupported,
  getPushPermission,
  isPushPreferenceEnabled,
  setPushPreferenceEnabled,
  registerAdminServiceWorker,
  requestAdminPushPermission,
  sendDevicePushNotification,
} from '@/lib/pushNotifications'
import { getInitials, formatDateTime } from '@/lib/utils'
import { useState, useRef, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

const TYPE_ICON: Record<string, any> = {
  new_order:             ShoppingCart,
  order_status_changed:  Package,
  payment_received:      CreditCard,
  new_complaint:         AlertTriangle,
  new_cafe_complaint:    Store,
  new_contact:           MessageSquare,
  low_stock:             FileText,
}

const TYPE_COLOR: Record<string, string> = {
  new_order:             '#d4a853',
  order_status_changed:  '#60a5fa',
  payment_received:      '#22c55e',
  new_complaint:         '#ef4444',
  new_cafe_complaint:    '#f97316',
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

  // Push Notification & PWA states
  const [pushSupported, setPushSupported] = useState(false)
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default')
  const [pushEnabled, setPushEnabled] = useState(false)
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null)
  const [isStandalone, setIsStandalone] = useState(false)

  const { data: notifData } = useNotifications()
  const { data: liveSummary } = useOpenComplaintsSummary()
  const markOne    = useMarkOneRead()
  const markAll    = useMarkAllRead()
  const clearAll   = useClearAll()

  // Track seen IDs so only newly arriving items trigger live push & toast alerts
  const seenIdsRef = useRef<Set<string>>(new Set())
  const initializedSourcesRef = useRef<{
    notifs: boolean
    cafeComplaints: boolean
    custComplaints: boolean
    contacts: boolean
    cafeOrders: boolean
  }>({
    notifs: false,
    cafeComplaints: false,
    custComplaints: false,
    contacts: false,
    cafeOrders: false,
  })

  // Initialize Service Worker, Push Permission state, and PWA install prompt
  useEffect(() => {
    setPushSupported(isPushSupported())
    setPushPermission(getPushPermission())
    setPushEnabled(isPushPreferenceEnabled())

    const standalone =
      window.matchMedia?.('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    setIsStandalone(Boolean(standalone))

    registerAdminServiceWorker()

    // Listen for service worker navigation messages when user taps a push notification
    const handleSwMessage = (event: MessageEvent) => {
      if (event.data?.type === 'NAVIGATE' && event.data?.url) {
        router.push(event.data.url)
      }
    }
    navigator.serviceWorker?.addEventListener('message', handleSwMessage)

    // Capture Android/Chrome Add to Home Screen prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredInstallPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleSwMessage)
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [router])

  // 1. Watch /notifications for new D2C orders, payments, complaints, contacts, low stock
  useEffect(() => {
    if (!notifData?.notifications) return
    const list = notifData.notifications

    if (!initializedSourcesRef.current.notifs) {
      list.forEach((n) => seenIdsRef.current.add(`notif-${n._id}`))
      initializedSourcesRef.current.notifs = true
      return
    }

    list.forEach((n) => {
      const key = `notif-${n._id}`
      if (!seenIdsRef.current.has(key)) {
        seenIdsRef.current.add(key)
        if (!n.isRead) {
          const targetUrl = n.link || '/dashboard'
          sendDevicePushNotification({
            title: n.title || 'KaapiLibre Admin Alert',
            body: n.message || 'You have a new admin notification',
            url: targetUrl,
            tag: key,
          })
          toast.info(n.title || 'New Notification', {
            description: n.message,
            action: {
              label: 'View',
              onClick: () => router.push(targetUrl),
            },
          })
        }
      }
    })
  }, [notifData, router])

  // 2. Watch liveSummary for Cafe Complaints, Customer Complaints, Contact Inquiries, and B2B Cafe Orders
  useEffect(() => {
    if (!liveSummary) return

    // 2a. Open Cafe Complaints
    const cafeList = liveSummary.openCafeComplaints ?? []
    if (!initializedSourcesRef.current.cafeComplaints) {
      cafeList.forEach((c: any) => seenIdsRef.current.add(`cafe-comp-${c._id}`))
      initializedSourcesRef.current.cafeComplaints = true
    } else {
      cafeList.forEach((c: any) => {
        const key = `cafe-comp-${c._id}`
        if (!seenIdsRef.current.has(key)) {
          seenIdsRef.current.add(key)
          const cafeName = c.cafe?.name || 'Partner Cafe'
          const title = `New Cafe Complaint: ${cafeName}`
          const body = c.subject || 'New quality feedback submitted'
          sendDevicePushNotification({
            title,
            body,
            url: '/cafe-complaints',
            tag: key,
          })
          toast.warning(title, {
            description: body,
            action: {
              label: 'Open',
              onClick: () => router.push('/cafe-complaints'),
            },
          })
        }
      })
    }

    // 2b. Open Customer Complaints
    const custList = liveSummary.openCustomerComplaints ?? []
    if (!initializedSourcesRef.current.custComplaints) {
      custList.forEach((c: any) => seenIdsRef.current.add(`cust-comp-${c._id}`))
      initializedSourcesRef.current.custComplaints = true
    } else {
      custList.forEach((c: any) => {
        const key = `cust-comp-${c._id}`
        if (!seenIdsRef.current.has(key)) {
          seenIdsRef.current.add(key)
          const title = `Customer Complaint #${c.ticketNumber || ''}`
          const body = `${c.customerName || 'Customer'}: ${c.subject || 'New support ticket'}`
          sendDevicePushNotification({
            title,
            body,
            url: '/complaints',
            tag: key,
          })
          toast.error(title, {
            description: body,
            action: {
              label: 'View',
              onClick: () => router.push('/complaints'),
            },
          })
        }
      })
    }

    // 2c. Unread Contact Inquiries
    const contactList = liveSummary.unreadContacts ?? []
    if (!initializedSourcesRef.current.contacts) {
      contactList.forEach((m: any) => seenIdsRef.current.add(`contact-${m._id}`))
      initializedSourcesRef.current.contacts = true
    } else {
      contactList.forEach((m: any) => {
        const key = `contact-${m._id}`
        if (!seenIdsRef.current.has(key)) {
          seenIdsRef.current.add(key)
          const title = `New Contact Inquiry from ${m.name || 'Visitor'}`
          const body = m.subject || m.message || 'New website inquiry received'
          sendDevicePushNotification({
            title,
            body,
            url: '/contact',
            tag: key,
          })
          toast.info(title, {
            description: body,
            action: {
              label: 'Read',
              onClick: () => router.push('/contact'),
            },
          })
        }
      })
    }

    // 2d. Recent B2B Cafe Orders
    const cafeOrders = liveSummary.recentCafeOrders ?? []
    if (!initializedSourcesRef.current.cafeOrders) {
      cafeOrders.forEach((o: any) => seenIdsRef.current.add(`cafe-order-${o._id}`))
      initializedSourcesRef.current.cafeOrders = true
    } else {
      cafeOrders.forEach((o: any) => {
        const key = `cafe-order-${o._id}`
        if (!seenIdsRef.current.has(key)) {
          seenIdsRef.current.add(key)
          const cafeName = o.cafe?.name || o.cafeName || 'Partner Cafe'
          const title = `New B2B Cafe Order: ${cafeName}`
          const body = `Order ${o.orderNumber || ''} placed`
          sendDevicePushNotification({
            title,
            body,
            url: '/cafe-orders',
            tag: key,
          })
          toast.success(title, {
            description: body,
            action: {
              label: 'View Order',
              onClick: () => router.push('/cafe-orders'),
            },
          })
        }
      })
    }
  }, [liveSummary, router])

  // Merge standard notifications with open Cafe Complaints and Unread Contacts for the Bell dropdown
  const notifications = useMemo(() => {
    const baseNotifs = notifData?.notifications ?? []
    const cafeItems = (liveSummary?.openCafeComplaints ?? []).map((c: any) => ({
      _id: `cafe-complaint-${c._id}`,
      type: 'new_cafe_complaint',
      title: `Cafe Complaint: ${c.cafe?.name || 'Partner Cafe'}`,
      message: `${c.ticketNumber ? `[${c.ticketNumber}] ` : ''}${c.subject || 'New quality complaint'}`,
      link: '/cafe-complaints',
      isRead: false,
      isVirtual: true,
      createdAt: c.createdAt || new Date().toISOString(),
    }))

    const existingContactLinks = new Set(
      baseNotifs.filter((n) => n.type === 'new_contact').map((n) => n.title)
    )
    const contactItems = (liveSummary?.unreadContacts ?? [])
      .filter((m: any) => !existingContactLinks.has(`New Contact: ${m.name}`))
      .slice(0, 5)
      .map((m: any) => ({
        _id: `contact-inquiry-${m._id}`,
        type: 'new_contact',
        title: `Contact Inquiry: ${m.name || 'Website Visitor'}`,
        message: m.subject || m.message || 'Unread contact message',
        link: '/contact',
        isRead: false,
        isVirtual: true,
        createdAt: m.createdAt || new Date().toISOString(),
      }))

    return [...cafeItems, ...contactItems, ...baseNotifs].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }, [notifData, liveSummary])

  const unreadCount =
    (notifData?.unreadCount ?? 0) + (liveSummary?.openCafeCount ?? 0)

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
    if (!n.isRead && !n.isVirtual) markOne.mutate(n._id)
    if (n.link) {
      router.push(n.link)
      setBellOpen(false)
    }
  }

  const handleTogglePush = async () => {
    if (!pushSupported) {
      toast.error('Push notifications require HTTPS or adding this app to your Home Screen (iOS 16.4+ / Android).')
      return
    }

    if (pushPermission !== 'granted') {
      const perm = await requestAdminPushPermission()
      setPushPermission(perm)
      if (perm === 'granted') {
        setPushEnabled(true)
        toast.success('Push notifications enabled on this device!')
        await sendDevicePushNotification({
          title: 'KaapiLibre Push Alerts Active',
          body: 'You will now receive instant alerts for new orders, complaints & contact inquiries.',
          url: '/dashboard',
          tag: 'kl-push-welcome',
        })
      } else {
        toast.error('Notification permission was blocked. Please allow notifications in your browser/phone settings.')
      }
      return
    }

    const next = !pushEnabled
    setPushPreferenceEnabled(next)
    setPushEnabled(next)
    toast.success(next ? 'Device push notifications turned ON' : 'Device push notifications muted')
  }

  const handleTestPush = async () => {
    if (pushPermission !== 'granted') {
      await handleTogglePush()
      return
    }
    if (!pushEnabled) {
      setPushPreferenceEnabled(true)
      setPushEnabled(true)
    }
    const ok = await sendDevicePushNotification({
      title: 'Test Alert — KaapiLibre Admin',
      body: 'Push notifications are working for Orders, Complaints & Contact Inquiries!',
      url: '/dashboard',
      tag: `kl-test-${Date.now()}`,
    })
    if (ok) {
      toast.success('Test push notification sent to your device!')
    } else {
      toast.error('Could not send push alert. Ensure system notifications are enabled for your browser/app.')
    }
  }

  const handleInstallPwa = async () => {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt()
      const choice = await deferredInstallPrompt.userChoice
      if (choice?.outcome === 'accepted') {
        setDeferredInstallPrompt(null)
        toast.success('KaapiLibre Admin added to your Home Screen!')
      }
    } else {
      toast.info(
        'To add to your phone Home Screen: tap browser Menu (⋮) or Share (↑) and select "Add to Home Screen".'
      )
    }
  }

  const isPushActive = pushPermission === 'granted' && pushEnabled

  return (
    <header className="h-14 border-b border-border/40 flex items-center justify-between px-6 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
      <div>
        {title && <h1 className="text-sm font-semibold text-foreground">{title}</h1>}
      </div>

      <div className="flex items-center gap-1.5">
        {/* Quick Push Status Pill */}
        <button
          onClick={handleTogglePush}
          title={
            isPushActive
              ? 'Push alerts active on this device (click to mute)'
              : 'Enable push notifications on this device'
          }
          className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors ${
            isPushActive
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/20'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/25 hover:bg-amber-500/20'
          }`}
        >
          {isPushActive ? (
            <>
              <BellRing className="w-3 h-3" />
              <span>Push On</span>
            </>
          ) : (
            <>
              <BellOff className="w-3 h-3" />
              <span>Enable Push</span>
            </>
          )}
        </button>

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
            <div className="absolute right-0 top-10 w-80 sm:w-96 bg-popover border border-border rounded-xl shadow-xl z-50 overflow-hidden">
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

              {/* Device Push & Home Screen PWA Control Bar */}
              <div className="px-4 py-2.5 bg-muted/40 border-b border-border flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        isPushActive ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                    />
                    <span className="text-[11px] font-medium text-foreground truncate">
                      {isPushActive
                        ? 'Phone/Browser Push Active'
                        : pushPermission === 'denied'
                        ? 'Push Blocked in Browser'
                        : 'Enable Device Push Alerts'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={handleTogglePush}
                      className={`px-2 py-1 rounded text-[10px] font-semibold transition-colors ${
                        isPushActive
                          ? 'bg-muted text-muted-foreground hover:text-foreground'
                          : 'bg-primary text-primary-foreground'
                      }`}
                      style={!isPushActive ? { background: '#d4a853', color: '#1a1713' } : {}}
                    >
                      {isPushActive ? 'Mute' : 'Enable'}
                    </button>
                    <button
                      onClick={handleTestPush}
                      title="Send a test push notification to your device"
                      className="px-2 py-1 rounded text-[10px] font-medium bg-accent hover:bg-accent/80 text-foreground flex items-center gap-1 transition-colors"
                    >
                      <Send className="w-2.5 h-2.5" />
                      Test
                    </button>
                  </div>
                </div>

                {!isStandalone && (
                  <button
                    onClick={handleInstallPwa}
                    className="w-full flex items-center justify-center gap-1.5 py-1 px-2 rounded-md text-[10px] font-medium bg-primary/10 hover:bg-primary/15 border border-primary/20 transition-colors"
                    style={{ color: '#d4a853' }}
                  >
                    <Smartphone className="w-3 h-3" />
                    <span>Add Admin App to Phone Home Screen</span>
                  </button>
                )}
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
