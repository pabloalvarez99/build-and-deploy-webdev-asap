const CACHE_VERSION = 'tf-v2';
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const API_CACHE = `${CACHE_VERSION}-api`;
const OFFLINE_URL = '/offline';
const SHELL_ASSETS = [OFFLINE_URL, '/', '/manifest.json', '/favicon.ico'];

const RUNTIME_MAX = 60;
const API_MAX = 40;
const API_MAX_AGE_MS = 30 * 60 * 1000;

const SAFE_API_RE = /^\/api\/products(\/|$)/;

async function trimCache(name, max) {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  if (keys.length <= max) return;
  for (let i = 0; i < keys.length - max; i++) {
    await cache.delete(keys[i]);
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) =>
      Promise.all(
        SHELL_ASSETS.map((url) =>
          cache.add(url).catch(() => undefined),
        ),
      ),
    ),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => !k.startsWith(CACHE_VERSION))
          .map((k) => caches.delete(k)),
      ),
    ),
  );
  self.clients.claim();
});

function staleWhileRevalidate(event, cacheName, request, fallback) {
  event.respondWith(
    caches.open(cacheName).then(async (cache) => {
      const cached = await cache.match(request);
      const networkPromise = fetch(request)
        .then((res) => {
          if (res && res.status === 200 && res.type !== 'opaque') {
            cache.put(request, res.clone()).then(() => trimCache(cacheName, cacheName === API_CACHE ? API_MAX : RUNTIME_MAX));
          }
          return res;
        })
        .catch(() => null);

      if (cached) {
        const meta = cached.headers.get('sw-cached-at');
        const fresh = meta ? Date.now() - Number(meta) < API_MAX_AGE_MS : true;
        if (cacheName !== API_CACHE || fresh) {
          event.waitUntil(networkPromise);
          return cached;
        }
      }
      const net = await networkPromise;
      if (net) return net;
      if (cached) return cached;
      if (fallback) {
        const fb = await caches.match(fallback);
        if (fb) return fb;
      }
      return new Response('', { status: 504, statusText: 'Offline' });
    }),
  );
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith('/auth/')) return;
  if (url.pathname.startsWith('/admin/') || url.pathname.startsWith('/pos/')) return;
  if (url.pathname.startsWith('/checkout')) return;

  if (url.pathname.startsWith('/api/')) {
    if (SAFE_API_RE.test(url.pathname)) {
      event.respondWith(
        caches.open(API_CACHE).then(async (cache) => {
          const cached = await cache.match(request);
          const networkPromise = fetch(request)
            .then(async (res) => {
              if (res && res.status === 200) {
                const copy = res.clone();
                const body = await copy.blob();
                const headers = new Headers(copy.headers);
                headers.set('sw-cached-at', String(Date.now()));
                const stamped = new Response(body, { status: copy.status, statusText: copy.statusText, headers });
                cache.put(request, stamped).then(() => trimCache(API_CACHE, API_MAX));
              }
              return res;
            })
            .catch(() => null);
          if (cached) {
            const meta = cached.headers.get('sw-cached-at');
            const fresh = meta ? Date.now() - Number(meta) < API_MAX_AGE_MS : false;
            event.waitUntil(networkPromise);
            if (fresh) return cached;
          }
          const net = await networkPromise;
          if (net) return net;
          if (cached) return cached;
          return new Response(JSON.stringify({ error: 'offline' }), {
            status: 503,
            headers: { 'content-type': 'application/json' },
          });
        }),
      );
    }
    return;
  }

  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    staleWhileRevalidate(event, RUNTIME_CACHE, request, OFFLINE_URL);
    return;
  }

  if (
    url.pathname.startsWith('/_next/static') ||
    /\.(?:png|jpg|jpeg|svg|webp|avif|ico|woff2?|ttf|css|js)$/.test(url.pathname)
  ) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((res) => {
            const copy = res.clone();
            caches.open(RUNTIME_CACHE).then((c) => {
              c.put(request, copy).then(() => trimCache(RUNTIME_CACHE, RUNTIME_MAX));
            });
            return res;
          }),
      ),
    );
  }
});
