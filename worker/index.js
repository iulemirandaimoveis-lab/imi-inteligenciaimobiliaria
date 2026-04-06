// IMI Custom Service Worker Extensions -- Push Notifications
// This file is injected into the main SW by next-pwa via customWorkerDir

self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : { title: 'IMI', body: 'Nova notificacao' };
  const options = {
    body: data.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-72.png',
    tag: data.tag || 'imi-' + Date.now(),
    data: { url: data.url || '/backoffice/notificacoes' },
    vibrate: [100, 50, 100],
    actions: data.actions || [],
    requireInteraction: data.requireInteraction || false,
  };
  event.waitUntil(
    self.registration.showNotification(data.title || 'IMI', options).then(function() {
      // Notify all open clients to play notification sound
      return clients.matchAll({ type: 'window' }).then(function(windowClients) {
        windowClients.forEach(function(client) {
          client.postMessage({ type: 'IMI_PLAY_SOUND' });
        });
      });
    })
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/backoffice';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url.includes('/backoffice') && 'focus' in client) return client.focus();
      }
      return clients.openWindow(urlToOpen);
    })
  );
});
