// Johanns Wunscherfüller – Offline-Speicher für die App-Dateien (nicht für Johanns Einträge, die liegen im Browser-Speicher)
const CACHE = 'wunscherfueller-1.1';
const CORE = ['./', 'index.html', 'manifest.webmanifest', 'roboto.woff', 'icon-180.png', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  if (req.mode === 'navigate') {
    // Seite: erst aus dem Netz (damit Updates ankommen), ohne Netz aus dem Speicher
    e.respondWith(fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put('index.html', copy)); }
      return res;
    }).catch(() => caches.match('index.html').then(r => r || caches.match('./'))));
    return;
  }
  // Schrift, Symbole, Manifest: aus dem Speicher, sonst aus dem Netz
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  })));
});
