// CRPD 監督平台 — Service Worker
// 提供基礎離線快取(首頁 / 16 議題 dossier / 搜尋頁)
const CACHE = 'crpd-v1-2026-05-04';

const ESSENTIAL = [
  '/disability-rights-watch/',
  '/disability-rights-watch/index.html',
  '/disability-rights-watch/search.html',
  '/disability-rights-watch/about.html',
  '/disability-rights-watch/methodology.html',
  '/disability-rights-watch/og.svg',
  '/disability-rights-watch/feed.xml',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ESSENTIAL).catch(() => {/* 容錯 */}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // 僅處理 GET + 同源
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;

  // 策略:network-first,fallback to cache
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        // 成功則更新 cache
        const copy = res.clone();
        caches.open(CACHE).then((c) => {
          // 只快取 200 OK
          if (res.ok && res.status === 200) c.put(e.request, copy);
        });
        return res;
      })
      .catch(() => caches.match(e.request).then((m) => m || caches.match('/disability-rights-watch/')))
  );
});
