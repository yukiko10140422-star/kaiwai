// KAIWAI Service Worker - Offline Support
const CACHE_VERSION = "kaiwai-v3";

// Static assets to pre-cache on install
const STATIC_ASSETS = [
  "/",
  "/offline",
  "/manifest.json",
  "/icons/icon.svg",
];

// Install: cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn("SW: Some assets failed to cache:", err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch: network-first for API, cache-first for static
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== "GET") return;

  // Skip Supabase API calls and external URLs
  if (url.hostname.includes("supabase")) return;
  if (url.origin !== self.location.origin) return;

  // Skip auth pages - never cache auth flows
  if (url.pathname.startsWith("/auth")) return;

  // For navigation requests: network-first, fall back to offline page
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match("/offline").then((cached) => {
          return cached || new Response("Offline", {
            status: 503,
            headers: { "Content-Type": "text/html" },
          });
        });
      })
    );
    return;
  }

  // For static assets: cache-first
  if (url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|ico|gif|webp|woff2?|ttf|eot)$/) ||
      url.pathname.startsWith("/_next/static/") ||
      url.pathname.startsWith("/icons/")) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, clone));
          }
          return response;
        }).catch(() => {
          return new Response("", { status: 404 });
        });
      })
    );
    return;
  }

  // Default: network-first with cache fallback
  event.respondWith(
    fetch(event.request).then((response) => {
      if (response.ok) {
        const clone = response.clone();
        caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, clone));
      }
      return response;
    }).catch(() => {
      return caches.match(event.request).then((cached) => {
        return cached || new Response("", { status: 503 });
      });
    })
  );
});
