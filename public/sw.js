const CACHE_NAME = 'pasar-tegalsari-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Install Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache');
      return cache.addAll(urlsToCache).catch((err) => {
        console.warn('Failed to cache assets during install:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Listener (required for PWA installation)
self.addEventListener('fetch', (event) => {
  // Pass-through strategy with network first fallback to cache for standard pages
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // If valid response, cache it if it's a GET request for a static resource
        if (
          event.request.method === 'GET' &&
          response &&
          response.status === 200 &&
          (event.request.url.startsWith(self.location.origin) || event.request.url.includes('unsplash.com'))
        ) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache if network is down
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If offline and request is document/HTML, return index.html
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
      })
  );
});
