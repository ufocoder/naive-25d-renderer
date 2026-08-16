self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)))),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches
        .keys()
        .then((cacheNames) => Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)))),
      self.registration.unregister(),
      self.clients.claim(),
    ]).then(() =>
      self.clients
        .matchAll({ type: 'window' })
        .then((clients) => clients.forEach((client) => client.navigate(client.url))),
    ),
  );
});
