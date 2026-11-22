/* Fade PWA service worker (T-5027).
 * - App shell: precached, navigation falls back to /offline.
 * - Static build assets: cache-first.
 * - Public catalog GETs: network-first with cache fallback.
 * - Bookings (POST) always go to the network.
 */
const CACHE = 'fade-pwa-v1';
const OFFLINE = '/offline';
const PRECACHE = ['/', '/booking', OFFLINE, '/manifest.webmanifest'];

function isCacheableApiPath(pathname) {
  return (
    pathname.startsWith('/booking/services/') ||
    pathname.startsWith('/booking/barbers/') ||
    pathname.startsWith('/locations/')
  );
}

function isStaticAsset(pathname) {
  return (
    pathname.startsWith('/_next/static/') ||
    pathname.startsWith('/icons/') ||
    /\.(?:css|js|svg|png|jpg|jpeg|webp|woff2?)$/.test(pathname)
  );
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(CACHE);
    cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request, fallbackPath) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (fallbackPath) {
      const fallback = await caches.match(fallbackPath);
      if (fallback) return fallback;
    }
    throw error;
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, OFFLINE));
    return;
  }
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }
  if (isCacheableApiPath(url.pathname)) {
    event.respondWith(networkFirst(request));
  }
});
