// FutureMe - service worker. Zet dit bestand naast index.html.
// Strategie: eerst het netwerk, anders de opgeslagen kopie. Zo heb je altijd
// de nieuwste versie als je online bent, en werkt de app gewoon als je dat niet bent.
const C = 'futureme-v1';

self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(self.clients.claim()); });

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then(r => {
      const kopie = r.clone();
      caches.open(C).then(c => c.put(e.request, kopie)).catch(() => {});
      return r;
    }).catch(() => caches.match(e.request).then(m => m || caches.match(self.registration.scope)))
  );
});
