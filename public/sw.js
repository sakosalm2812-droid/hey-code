// Generated from the current HEY build. Never cache account or API data.
const CACHE = "hey-shell-source";
const ASSETS = ["/index.html","/site.webmanifest","/icons/hey-192.png","/icons/hey-512.png","/icons/hey-maskable-512.png"];
const ALLOWED = new Set(ASSETS);
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    // Remove obsolete HEY/Next caches, including old cached private API data.
    await Promise.all(names.filter(name => name !== CACHE &&
      (name.startsWith('hey-') || name.startsWith('workbox-') ||
       ['apis', 'others', 'images', 'google-fonts-webfonts', 'google-fonts-static', 'start-url', 'next-data', 'next-static-js-assets', 'static-js-assets', 'static-style-assets', 'static-font-assets', 'static-image-assets'].includes(name)))
      .map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
self.addEventListener('push', event => {
  let data = {};
  try { data = event.data?.json() || {}; } catch { /* Invalid push payload. */ }
  event.waitUntil(self.registration.showNotification('HEY', {
    body: typeof data.body === 'string' ? data.body.slice(0, 500) : '',
    icon: '/icons/hey-192.png', badge: '/icons/hey-192.png',
    tag: typeof data.tag === 'string' ? data.tag.slice(0, 100) : 'hey-notification',
    data: { url: typeof data.url === 'string' ? data.url : '/chat' },
  }));
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  let url = new URL('/chat', self.location.origin);
  try {
    const candidate = new URL(event.notification.data?.url || '/chat', self.location.origin);
    if (candidate.origin === self.location.origin && candidate.protocol === 'https:') url = candidate;
  } catch { /* Use the conversation surface. */ }
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const client = windows.find(item => item.url === url.href);
    if (client) return client.focus();
    return self.clients.openWindow(url.href);
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin ||
      request.headers.has('Authorization') || url.pathname.startsWith('/api/') ||
      url.pathname.startsWith('/auth/')) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(async () => {
      return await (await caches.open(CACHE)).match('/index.html') || Response.error();
    }));
    return;
  }
  // Only build-listed immutable/public assets can enter the offline cache.
  if (!url.search && ALLOWED.has(url.pathname)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      return await cache.match(url.pathname) || fetch(request);
    })());
  }
});
