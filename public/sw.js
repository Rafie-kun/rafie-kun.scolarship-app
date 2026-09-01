const CACHE_NAME = 'scholarpath-v1';
const SHELL = ['/', '/index.html', '/manifest.json', '/favicon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL).catch(()=>{}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Never cache API or data JSON — always network
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/data/')) return;
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE_NAME).then(c=>c.put(req, copy)).catch(()=>{});
      return res;
    }).catch(()=>cached))
  );
});

// Simple push handler (server push can be added later with VAPID)
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : { title: 'ScholarPath', body: 'A scholarship deadline is approaching!' };
  event.waitUntil(
    self.registration.showNotification(data.title || 'ScholarPath', {
      body: data.body || 'Check your deadlines',
      icon: '/favicon.svg',
      badge: '/favicon.svg'
    })
  );
});
