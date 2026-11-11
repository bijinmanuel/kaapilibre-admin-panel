// KaapiLibre Admin PWA & Push Notification Service Worker

// Strictly allow only internal relative paths (prevents open-redirect or external URL injection)
function sanitizeInternalUrl(rawUrl) {
  if (typeof rawUrl !== 'string') return '/dashboard'
  const trimmed = rawUrl.trim()
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) {
    return '/dashboard'
  }
  return trimmed
}

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

// Handle Server-Sent Web Push events (VAPID / Push API)
self.addEventListener('push', (event) => {
  let payload = {
    title: 'KaapiLibre Admin Alert',
    body: 'You have a new update in the admin portal.',
    url: '/dashboard',
    tag: 'kl-admin-push',
  }

  if (event.data) {
    try {
      const parsed = event.data.json()
      payload = {
        title: String(parsed.title || payload.title).slice(0, 120),
        body: String(parsed.body || parsed.message || payload.body).slice(0, 240),
        url: sanitizeInternalUrl(parsed.url || parsed.link || payload.url),
        tag: String(parsed.tag || parsed.id || `kl-${Date.now()}`).slice(0, 80),
      }
    } catch {
      payload.body = String(event.data.text() || payload.body).slice(0, 240)
    }
  }

  const options = {
    body: payload.body,
    icon: '/brand/logo.png',
    badge: '/brand/logo.png',
    tag: payload.tag,
    renotify: true,
    vibrate: [200, 100, 200],
    data: {
      url: sanitizeInternalUrl(payload.url),
    },
  }

  event.waitUntil(self.registration.showNotification(payload.title, options))
})

// Handle Client-Dispatched Push Notifications via postMessage (same-origin verified)
self.addEventListener('message', (event) => {
  // Verify message comes from our own origin
  if (event.origin && event.origin !== self.location.origin) return
  if (!event.data) return

  if (event.data.type === 'CLEAR_NOTIFICATIONS') {
    event.waitUntil(
      self.registration.getNotifications().then((list) => {
        list.forEach((n) => n.close())
      })
    )
    return
  }

  if (event.data.type !== 'SHOW_NOTIFICATION') return

  const { title, body, url, tag } = event.data.payload || {}
  const safeUrl = sanitizeInternalUrl(url)

  const options = {
    body: String(body || '').slice(0, 240),
    icon: '/brand/logo.png',
    badge: '/brand/logo.png',
    tag: String(tag || `kl-local-${Date.now()}`).slice(0, 80),
    renotify: true,
    vibrate: [200, 100, 200],
    data: {
      url: safeUrl,
    },
  }

  event.waitUntil(
    self.registration.showNotification(
      String(title || 'KaapiLibre Admin').slice(0, 120),
      options
    )
  )
})

// Focus or open the Admin PWA when user taps a push notification on their phone
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = sanitizeInternalUrl(
    event.notification.data && event.notification.data.url
  )

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) {
            client.focus()
            if ('navigate' in client) {
              return client.navigate(targetUrl)
            }
            client.postMessage({ type: 'NAVIGATE', url: targetUrl })
            return
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl)
        }
      })
  )
})
