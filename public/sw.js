/* Build template: scripts/build-sw.mjs injects the version and complete asset list. */
const BUILD_VERSION = '__BUILD_VERSION__';
const PRECACHE_PATHS = /* __PRECACHE_MANIFEST__ */ [];
const SCOPE = self.registration.scope;
const CACHE_PREFIX = `sugar-spell:${new URL(SCOPE).pathname}:`;
const CACHE_NAME = `${CACHE_PREFIX}${BUILD_VERSION}`;
const PRECACHE_URLS = PRECACHE_PATHS.map((path) => new URL(path, SCOPE).href);
const PRECACHE_SET = new Set(PRECACHE_URLS);
const SHELL_URL = new URL('index.html', SCOPE).href;

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    try {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(PRECACHE_URLS.map((url) => new Request(url, { cache: 'reload' })));
    } catch (error) {
      await caches.delete(CACHE_NAME);
      throw error;
    }
  })());
});
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME).map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') event.waitUntil(self.skipWaiting());
});
self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !url.href.startsWith(SCOPE)) return;
  const canonical = new URL(url.pathname, url.origin).href;
  if (request.mode === 'navigate') {
    event.respondWith((async () => (await (await caches.open(CACHE_NAME)).match(SHELL_URL)) || fetch(request))());
  } else if (PRECACHE_SET.has(canonical)) {
    event.respondWith((async () => (await (await caches.open(CACHE_NAME)).match(canonical)) || fetch(request))());
  }
});
