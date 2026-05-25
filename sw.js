// Minimal Service Worker for PWA compliance with no caching
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Fetch handler is required for PWA installability, but we perform no caching
self.addEventListener('fetch', (event) => {
  // Pass through to network without interference
  event.respondWith(fetch(event.request));
});