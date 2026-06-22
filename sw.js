// CH-149-615 W&B App — Service Worker
// Cache strategy:
//   config.js  → network-first (custodian updates must propagate promptly)
//   everything else → cache-first (stable assets: app logic, libraries, images)
//
// To force all clients to pick up a new service worker after a push,
// increment the CACHE_VERSION string.

const CACHE_VERSION = 'wb615-v1';

const STATIC_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './compute.js',
  './pdf.js',
  './editor.js',
  './mcdu.js',
  './jspdf.umd.min.js',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  './images/Schematic_SAR_Crew.png',
  './images/Schematic_Pax_Seats.png'
];

// ── Install: pre-cache all static assets ─────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => {
      // Cache static assets; don't fail install if an optional image is missing
      return cache.addAll(STATIC_ASSETS).catch(err => {
        console.warn('[SW] Pre-cache partial failure (non-fatal):', err);
      });
    })
  );
  // Take control immediately — don't wait for old SW to expire
  self.skipWaiting();
});

// ── Activate: delete any old cache versions ───────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_VERSION)
          .map(key => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      )
    )
  );
  // Claim all open clients so the new SW takes effect without a reload
  self.clients.claim();
});

// ── Fetch: route by asset type ────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Only handle same-origin requests (app makes no external calls, but be safe)
  if (url.origin !== self.location.origin) return;

  const isConfig = url.pathname.endsWith('/config.js');

  if (isConfig) {
    // Network-first for config.js: always try to get the latest custodian export.
    // Fall back to cache only if the network is unreachable (e.g. fully offline).
    event.respondWith(networkFirstConfig(event.request));
  } else {
    // Cache-first for everything else: stable assets load instantly offline.
    // Background-refresh keeps the cache current for next load.
    event.respondWith(cacheFirstWithRefresh(event.request));
  }
});

// ── Network-first (config.js) ─────────────────────────────────────────────────
async function networkFirstConfig(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_VERSION);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    // Network unavailable — serve from cache so app still loads offline
    const cached = await caches.match(request);
    if (cached) return cached;
    // No cache either — return a minimal fallback so the app fails gracefully
    return new Response('// config.js unavailable offline', {
      headers: { 'Content-Type': 'application/javascript' }
    });
  }
}

// ── Cache-first with background refresh (static assets) ──────────────────────
async function cacheFirstWithRefresh(request) {
  const cached = await caches.match(request);
  // Kick off a background fetch to keep the cache current
  const networkFetch = fetch(request).then(async response => {
    if (response.ok) {
      const cache = await caches.open(CACHE_VERSION);
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => { /* network unavailable — cached copy is fine */ });

  return cached || networkFetch;
}
