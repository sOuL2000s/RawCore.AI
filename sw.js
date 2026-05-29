/**
 * VERSIONING_STRATEGY:
 * To automate this during a "publish" action, you can use a command like:
 * sed -i "s/const VERSION = '.*'/const VERSION = '$(date +%Y%m%d%H%M%S)'/" sw.js
 */
const VERSION = '1.0.1'; 
const CACHE_NAME = `rawcore-v${VERSION}`;

const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/marked/marked.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
  'https://fonts.googleapis.com/css2?family=Fira+Code:wght@300;400;500&display=swap'
];

// Pre-cache static assets for offline App Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('PRE_CACHING_APP_SHELL_V' + VERSION);
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Clean up old caches - Robust Prefix-Based Purge
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter(name => name.startsWith('rawcore-') && name !== CACHE_NAME)
          .map(name => {
            console.log('DELETING_OLD_CACHE:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Cache-First for Shell, Network-Only for APIs
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Exclude Firebase, API calls, and Firestore from caching
  if (
    url.origin.includes('firebase') || 
    url.origin.includes('googleapis') || 
    url.origin.includes('groq.com') ||
    event.request.method !== 'GET'
  ) {
    return event.respondWith(fetch(event.request));
  }

  // Respond with cached asset, fallback to network
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((fetchRes) => {
        // If it's a static asset not in precache (like some fonts), cache it now
        if (fetchRes.status === 200) {
          const resClone = fetchRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
        }
        return fetchRes;
      });
    }).catch(() => {
        // If both fail and it's index.html, return offline notice (optional)
        if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
        }
    })
  );
});