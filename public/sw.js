// diVine Web Service Worker
// Provides offline support and caching for improved performance

const CACHE_NAME = 'divine-web-v1';
const RUNTIME_CACHE = 'divine-web-runtime';
const VIDEO_CACHE = 'divine-web-videos';
const IMAGE_CACHE = 'divine-web-images';

// Assets to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/app_icon.png'
];

// Install event - cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && 
              cacheName !== RUNTIME_CACHE &&
              cacheName !== VIDEO_CACHE &&
              cacheName !== IMAGE_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle video requests
  if (request.destination === 'video' || /\.(mp4|webm|mov)$/i.test(url.pathname)) {
    event.respondWith(
      caches.open(VIDEO_CACHE).then((cache) => {
        return cache.match(request).then((response) => {
          if (response) {
            return response;
          }
          
          return fetch(request).then((response) => {
            // Only cache successful responses
            if (response.status === 200 || response.status === 206) {
              cache.put(request, response.clone());
            }
            return response;
          });
        });
      })
    );
    return;
  }

  // Handle image requests
  if (request.destination === 'image' || /\.(png|jpg|jpeg|svg|gif|webp)$/i.test(url.pathname)) {
    event.respondWith(
      caches.open(IMAGE_CACHE).then((cache) => {
        return cache.match(request).then((response) => {
          return response || fetch(request).then((response) => {
            if (response.status === 200) {
              cache.put(request, response.clone());
            }
            return response;
          });
        });
      })
    );
    return;
  }

  // Handle Nostr media CDNs
  if (url.hostname.includes('nostr.build') ||
      url.hostname.includes('nostrcheck.me') ||
      url.hostname.includes('nostrage.com') ||
      url.hostname.includes('cdn.jb55.com') ||
      url.hostname.includes('cdn.divine.video') ||
      url.hostname.includes('api.openvine.co')) {
    event.respondWith(
      caches.open(IMAGE_CACHE).then((cache) => {
        return cache.match(request).then((response) => {
          return response || fetch(request).then((response) => {
            if (response.status === 200) {
              cache.put(request, response.clone());
            }
            return response;
          }).catch(() => response);
        });
      })
    );
    return;
  }

  // Default: cache-first for same-origin, network-first for cross-origin
  event.respondWith(
    caches.match(request).then((response) => {
      if (response) {
        return response;
      }

      return fetch(request).then((response) => {
        // Only cache successful same-origin requests
        if (response.status === 200 && url.origin === location.origin) {
          const responseToCache = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return response;
      });
    })
  );
});
