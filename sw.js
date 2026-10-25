/* System service worker - app-shell caching only. Bump VERSION to ship an update. */
const VERSION = 'v2';
const SHELL = `system-shell-${VERSION}`;
const RUNTIME = 'system-runtime';
const SHELL_FILES = ['./', './index.html', './manifest.json',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png', './icons/icon-180.png'];
// Google API / OAuth traffic must never be cached or intercepted.
const BYPASS = ['googleapis.com/upload', 'sheets.googleapis.com', 'www.googleapis.com/drive',
  'accounts.google.com', 'oauth2.googleapis.com', 'youtube.com', 'wa.me'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(SHELL_FILES)));
  // No skipWaiting here: the page decides when to activate an update (see SKIP_WAITING below),
  // so a new version never swaps in mid-edit.
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(k => k.startsWith('system-shell-') && k !== SHELL).map(k => caches.delete(k))
  )).then(() => self.clients.claim()));
});
self.addEventListener('message', e => { if (e.data === 'SKIP_WAITING') self.skipWaiting(); });

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || BYPASS.some(p => req.url.includes(p))) return;
  const url = new URL(req.url);
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(() => caches.match('./index.html')));
    return;
  }
  if (url.origin === location.origin) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req)));
    return;
  }
  // CDN assets (SweetAlert, Google Fonts) and Drive thumbnails: stale-while-revalidate
  e.respondWith(caches.open(RUNTIME).then(async cache => {
    const hit = await cache.match(req);
    const net = fetch(req).then(r => { if (r && (r.ok || r.type === 'opaque')) cache.put(req, r.clone()); return r; }).catch(() => hit);
    return hit || net;
  }));
});
