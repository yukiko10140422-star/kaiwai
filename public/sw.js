// KAIWAI Service Worker
const CACHE_NAME = 'kaiwai-v1';
const STATIC_CACHE = 'kaiwai-static-v1';

// App shell files to cache on install
const APP_SHELL = [
  '/',
  '/dashboard',
  '/manifest.json',
  '/icons/icon.svg',
];

// Install: cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL).catch((err) => {
        console.warn('SW: Some app shell resources failed to cache:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== STATIC_CACHE)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch handler
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) return;

  // Network-first for API calls and Supabase
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Cache-first for static assets (images, fonts, icons)
  if (
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|woff2?|ttf|eot)$/)
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Network-first for everything else (pages, etc.)
  event.respondWith(networkFirst(request));
});

// Network-first strategy
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    // Return offline fallback for navigation requests
    if (request.mode === 'navigate') {
      const fallback = await caches.match('/dashboard');
      if (fallback) return fallback;
    }
    return new Response('オフラインです', {
      status: 503,
      statusText: 'Offline',
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}

// Cache-first strategy
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    return new Response('', { status: 404 });
  }
}
