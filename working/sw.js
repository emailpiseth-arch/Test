// Offline shell: the app's own files are cached as they are fetched, so a reload without signal still opens the app.
// The Demo and the Working copy can sit on the same site (…/Test/ and …/Test/working/): each keeps its own cache,
// named after its scope, and never touches the other's.
const SCOPE = new URL(self.registration.scope).pathname;
const CACHE = 'onemaison-shell-v2:' + SCOPE;
self.addEventListener('install', () => { self.skipWaiting(); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys
    .filter((k) => k !== CACHE && (k === 'onemaison-shell-v1' || (k.startsWith('onemaison-shell-') && k.endsWith(':' + SCOPE))))
    .map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin && !url.pathname.startsWith(SCOPE)) return;
  // copies in a sub-folder (the Working copy, other demos) have their own worker: leave their files alone
  if (url.origin === location.origin && /^(working|dama)\//.test(url.pathname.slice(SCOPE.length))) return;
  const isShell = url.origin === location.origin && (req.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('/'));
  const isAsset = url.origin === location.origin && /\/assets\/|\.webmanifest$|sw\.js$/.test(url.pathname);
  const isFont = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (isShell) {
    // network first, cached copy when offline
    e.respondWith(fetch(req).then((r) => { const c = r.clone(); caches.open(CACHE).then((cache) => cache.put(req, c)); return r; })
      .catch(() => caches.match(req, { cacheName: CACHE }).then((r) => r || caches.match(SCOPE, { cacheName: CACHE }))));
  } else if (isAsset || isFont) {
    // hashed files and fonts never change: cache first
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((r) => { const c = r.clone(); caches.open(CACHE).then((cache) => cache.put(req, c)); return r; })));
  }
});
