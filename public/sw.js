// Service Worker for "حقائق العلوم" PWA
const CACHE_VERSION = 'v3.2.0-science-facts';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `runtime-${CACHE_VERSION}`;

// Core assets to precache for offline shell
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/favicon.svg',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png',
  '/apple-touch-icon.png'
];

// Install Event: Precache offline shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[PWA SW] Precaching offline shell assets');
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[PWA SW] Precache partial error (non-fatal):', err);
      });
    })
  );
  // Do not automatically skipWaiting here so user gets "New update available" prompt
});

// Activate Event: Clean up legacy caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== STATIC_CACHE && key !== RUNTIME_CACHE) {
            console.log('[PWA SW] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Message Event: Listen for update commands from UI (e.g. user clicked "تحديث الآن")
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[PWA SW] Skip waiting triggered by user');
    self.skipWaiting();
  }
});

// Fetch Event: Safe caching rules (CRITICAL SECURITY & DATA INTEGRITY)
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Non-GET requests (POST, PUT, DELETE, PATCH): Always Network Only, Never Cache!
  if (request.method !== 'GET') {
    return;
  }

  // 2. CRITICAL SECURITY: Never cache API, Supabase, Firebase, or Auth calls
  if (
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('googleapis.com/identitytoolkit') ||
    url.hostname.includes('securetoken.googleapis.com') ||
    url.hostname.includes('accounts.google.com') ||
    url.pathname.startsWith('/auth')
  ) {
    // Network-only without touch
    return;
  }

  // 3. Navigation Requests (HTML Page Loading)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          // If valid response, update cache copy of index.html
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put('/index.html', responseClone);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          // Network failed (device is offline)
          console.warn('[PWA SW] Navigation offline, returning offline fallback');
          const cache = await caches.open(STATIC_CACHE);
          const cachedOffline = await cache.match('/offline.html');
          if (cachedOffline) {
            return cachedOffline;
          }
          const cachedIndex = await cache.match('/index.html');
          return cachedIndex || new Response('Offline - No connection', {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
          });
        })
    );
    return;
  }

  // 4. Static Asset Requests (Fonts, Scripts, Styles, Images)
  // Cache First with Network Revalidation for static files
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|webp|woff|woff2|ttf|ico)$/) ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com')
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(RUNTIME_CACHE).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // 5. Default: Network with Cache Fallback
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
