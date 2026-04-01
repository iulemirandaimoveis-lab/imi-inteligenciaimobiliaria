// IMI Custom Service Worker — Push Notifications
self.addEventListener('push', (event) => {
    if (!event.data) return

    const data = event.data.json()

    event.waitUntil(
        self.registration.showNotification(data.title || 'IMI', {
            body: data.body || '',
            icon: data.icon || '/icons/icon-192.png',
            badge: data.badge || '/icons/icon-72.png',
            data: { url: data.url || '/backoffice/hoje' },
            tag: 'imi-notification',
            renotify: true,
        })
    )
})

self.addEventListener('notificationclick', (event) => {
    event.notification.close()
    const url = event.notification.data?.url || '/backoffice/hoje'
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then(windowClients => {
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
