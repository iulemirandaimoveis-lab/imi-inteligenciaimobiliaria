// IMI Custom Service Worker — Push Notifications
self.addEventListener('push', (event) => {
    if (!event.data) return

    const data = event.data.json()

    // Each notification gets a unique tag so the OS always plays the sound.
    // Using a fixed tag silences subsequent notifications on many browsers.
    const tag = data.tag || `imi-${Date.now()}`

    event.waitUntil(
        self.registration.showNotification(data.title || 'IMI', {
            body: data.body || '',
            icon: data.icon || '/icons/icon-192.png',
            badge: data.badge || '/icons/icon-72.png',
            data: { url: data.url || '/backoffice/hoje' },
            tag,
            // vibrate plays on Android even when in silent/vibrate mode
            vibrate: [200, 80, 200, 80, 100],
            // renotify: true would re-alert on same tag, but we use unique tags above
            requireInteraction: false,
        })
    )
})

self.addEventListener('notificationclick', (event) => {
    event.notification.close()
    const url = event.notification.data?.url || '/backoffice/hoje'
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
            // If a backoffice tab is already open, focus and navigate it
            for (const client of windowClients) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    client.focus()
                    client.navigate(url)
                    return
                }
            }
            return clients.openWindow(url)
        })
    )
})
