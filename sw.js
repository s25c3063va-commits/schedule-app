const CACHE_NAME = 'smart-schedule-v16';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css?v=16',
  './Script.js?v=16',
  './manifest.json',
  './icons/icon-192.svg',
  './icons/icon-512.svg'
];

// インストール時にキャッシュ
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// 古いキャッシュを即座に削除
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// ネットワーク優先 (Network-First) 戦略: 常に最新を取得し、オフライン時のみキャッシュを利用
self.addEventListener('fetch', (event) => {
  event.respondWith(
    (async () => {
      let networkResponse;
      try {
        networkResponse = await fetch(event.request);
      } catch (networkError) {
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) return cachedResponse;
        if (event.request.mode === 'navigate') {
          const fallback = await caches.match('./index.html');
          if (fallback) return fallback;
        }
        throw networkError;
      }

      if (
        event.request.method === 'GET' &&
        (networkResponse.ok || networkResponse.type === 'opaque')
      ) {
        try {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(event.request, networkResponse.clone());
        } catch (error) {
          console.error('キャッシュへの保存に失敗しました。', error);
        }
      }
      return networkResponse;
    })()
  );
});
