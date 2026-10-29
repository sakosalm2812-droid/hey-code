// HEY web-push service worker (push-only; the app's offline/install SW is sw.js).
self.addEventListener('push', (event) => {
  let data = { title: 'HEY', body: '', url: '/', tag: 'hey-notification' };
  try {
    const parsed = event.data ? event.data.json() : null;
    if (parsed && parsed.title) {
      data = { title: 'HEY', body: '', url: '/', tag: 'hey-notification', ...parsed };
    }
  } catch {}

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body || undefined,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: data.tag,
      data: { url: data.url },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data && event.notification.data.url ? event.notification.data.url : '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});