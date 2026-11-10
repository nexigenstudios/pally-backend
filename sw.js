// Santhom Admin — minimal service worker
// Purpose: satisfy PWA install criteria only.
// No caching — the app talks to Firebase live and must always be fresh.

const CACHE = 'santhom-admin-v1';

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first: always fetch live. Fall back to cache only if offline.
self.addEventListener('fetch', e => {
  // Don't intercept Firebase / external API calls
  const url = new URL(e.request.url);
  if (!url.origin.includes(self.location.origin)) return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Cache the HTML shell only
        if (e.request.url.endsWith('index.html') || e.request.url === self.location.origin + '/') {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
