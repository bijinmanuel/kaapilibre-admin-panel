'use client'

import { getToken } from '@/lib/api'

const PUSH_ENABLED_KEY = 'kl_admin_push_enabled'

// Strictly allow only internal relative routes (prevents open-redirect attacks)
export function sanitizeInternalUrl(rawUrl?: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') return '/dashboard'
  const trimmed = rawUrl.trim()
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) {
    return '/dashboard'
  }
  return trimmed
}

export function isPushSupported(): boolean {
  if (typeof window === 'undefined') return false
  return 'Notification' in window && 'serviceWorker' in navigator
}

export function getPushPermission(): NotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'default'
  }
  return Notification.permission
}

export function isPushPreferenceEnabled(): boolean {
  if (typeof window === 'undefined') return false
  const stored = localStorage.getItem(PUSH_ENABLED_KEY)
  // Default to true if permission is already granted and user hasn't explicitly muted
  if (stored === null) {
    return getPushPermission() === 'granted'
  }
  return stored === 'true'
}

export function setPushPreferenceEnabled(enabled: boolean): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(PUSH_ENABLED_KEY, String(enabled))
  }
}

export async function registerAdminServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null
  }
  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    })
    return registration
  } catch (err) {
    console.warn('Service worker registration failed:', err)
    return null
  }
}

export async function clearDeviceNotifications(): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return
  try {
    const reg = await navigator.serviceWorker.getRegistration('/')
    if (reg) {
      const notifications = await reg.getNotifications()
      notifications.forEach((n) => n.close())
      reg.active?.postMessage({ type: 'CLEAR_NOTIFICATIONS' })
    }
  } catch {
    // Ignore errors during cleanup
  }
}

export async function requestAdminPushPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied'
  }

  await registerAdminServiceWorker()
  const permission = await Notification.requestPermission()
  if (permission === 'granted') {
    setPushPreferenceEnabled(true)
  }
  return permission
}

// Subtle two-tone notification chime using Web Audio API (no external audio file needed)
export function playNotificationChime(): void {
  if (typeof window === 'undefined') return
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const now = ctx.currentTime

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(587.33, now) // D5
    osc.frequency.setValueAtTime(880, now + 0.12) // A5

    gain.gain.setValueAtTime(0.08, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38)

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.4)
  } catch {
    // Ignore if browser blocks audio before user interaction
  }
}

export interface PushAlertPayload {
  title: string
  body: string
  url?: string
  tag?: string
}

export async function sendDevicePushNotification(payload: PushAlertPayload): Promise<boolean> {
  if (typeof window === 'undefined') return false

  // Security check: only dispatch notifications when an authenticated admin session token exists
  if (!getToken()) {
    return false
  }

  playNotificationChime()

  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return false
  }
  if (!isPushPreferenceEnabled()) {
    return false
  }

  const targetUrl = sanitizeInternalUrl(payload.url)
  const safeTitle = String(payload.title || 'KaapiLibre Admin').slice(0, 120)
  const safeBody = String(payload.body || '').slice(0, 240)
  const tag = String(payload.tag || `kl-alert-${Date.now()}`).slice(0, 80)

  try {
    if ('serviceWorker' in navigator) {
      const reg =
        (await navigator.serviceWorker.getRegistration('/')) ||
        (await registerAdminServiceWorker())

      if (reg) {
        if (typeof reg.showNotification === 'function') {
          await reg.showNotification(safeTitle, {
            body: safeBody,
            icon: '/brand/logo.png',
            badge: '/brand/logo.png',
            tag,
            vibrate: [200, 100, 200],
            data: { url: targetUrl },
          } as NotificationOptions)
          return true
        }

        if (reg.active) {
          reg.active.postMessage({
            type: 'SHOW_NOTIFICATION',
            payload: {
              title: safeTitle,
              body: safeBody,
              url: targetUrl,
              tag,
            },
          })
          return true
        }
      }
    }

    // Fallback to standard Notification API
    const notif = new Notification(safeTitle, {
      body: safeBody,
      icon: '/brand/logo.png',
      tag,
    })
    notif.onclick = () => {
      window.focus()
      window.location.href = targetUrl
      notif.close()
    }
    return true
  } catch (err) {
    console.warn('Failed to dispatch push notification:', err)
    return false
  }
}
