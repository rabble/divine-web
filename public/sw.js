// diVine Web Service Worker
// Minimal service worker for PWA installation - no offline caching

// Install event - skip waiting immediately
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

// Activate event - claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Fetch event - always use network, no caching
self.addEventListener('fetch', (event) => {
  // Just pass through to network, no caching
  event.respondWith(fetch(event.request));
});
