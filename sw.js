/* Pulse service worker: offline support via stale-while-revalidate caching.
   Bump CACHE when releasing changes so old files are cleaned up. */
const CACHE = 'pulse-v2';
const APP_SHELL = [
  './',
  './index.html',
  './styles.css',
  './script.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Serve from cache instantly, refresh the cache in the background (includes Chart.js and fonts from CDNs).
self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET' || !request.url.startsWith('http')) return;

  event.respondWith(caches.open(CACHE).then(async cache => {
    const cached = await cache.match(request, { ignoreSearch: true });
    const network = fetch(request)
      .then(response => {
        if (response.ok || response.type === 'opaque') cache.put(request, response.clone());
        return response;
      })
      .catch(() => cached);
    return cached || network;
  }));
});
