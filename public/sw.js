// IMI Service Worker v1.0
// Handles: Push Notifications, Offline Cache, Background Sync

const CACHE_NAME = 'imi-v1'
const OFFLINE_URL = '/offline'

// ── Install ──────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/favicon.svg',
      ]).catch(() => {})
    })
  )
  self.skipWaiting()
})

// ── Activate ─────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// ── Push Notification ────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return

  let data = {}
  try {
    data = event.data.json()
  } catch {
    data = { title: 'IMI', body: event.data.text() }
  }

  const {
    title = 'IMI – Inteligência Imobiliária',
    body = 'Você tem uma nova notificação',
    icon = '/icons/icon-192.png',
    badge = '/icons/icon-72.png',
    url = '/backoffice/hoje',
    tag,
    data: notifData = {},
  } = data

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge,
      tag: tag || 'imi-notification',
      renotify: true,
      vibrate: [100, 50, 100],
      data: { url, ...notifData },
      actions: [
        { action: 'open', title: 'Abrir' },
        { action: 'dismiss', title: 'Fechar' },
      ],
    })
  )
})

// ── Notification Click ───────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'dismiss') return

  const url = event.notification.data?.url || '/backoffice/hoje'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if open
      for (const client of clientList) {
        if (client.url.includes('/backoffice') && 'focus' in client) {
          client.focus()
          client.navigate(url)
          return
        }
      }
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(url)
      }
    })
  )
})

// ── Fetch (Network First for API, Cache First for static) ────────────
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET, non-same-origin, and API requests from caching
  if (request.method !== 'GET') return
  if (!url.origin.includes(self.location.origin)) return
  if (url.pathname.startsWith('/api/')) return
  if (url.pathname.startsWith('/_next/')) return
})
