/* Pulse service worker: always loads the latest app files when online, falls back to cache offline.
   Bump CACHE when releasing changes so phones pick up the new version. */
const CACHE = 'pulse-v4';
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
  // cache: 'reload' skips the browser HTTP cache so the new version is stored, not a stale copy
  event.waitUntil(caches.open(CACHE)
    .then(cache => cache.addAll(APP_SHELL.map(url => new Request(url, { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET' || !request.url.startsWith('http')) return;
  if (request.url.includes('generativelanguage.googleapis.com')) return; // AI API: never cache
  const sameOrigin = new URL(request.url).origin === self.location.origin;

  event.respondWith(caches.open(CACHE).then(async cache => {
    const cached = await cache.match(request, { ignoreSearch: true });

    // App files: network first (revalidated), cache only when offline
    if (sameOrigin) {
      try {
        const response = await fetch(request, { cache: 'no-cache' });
        if (response.ok) cache.put(request, response.clone());
        return response;
      } catch {
        return cached || cache.match('./index.html');
      }
    }

    // CDN files (Chart.js, fonts): cache first, refresh in the background
    const network = fetch(request)
      .then(response => {
        if (response.ok || response.type === 'opaque') cache.put(request, response.clone());
        return response;
      })
      .catch(() => cached);
    return cached || network;
  }));
});
