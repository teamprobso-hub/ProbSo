const CACHE_NAME = 'probso-cache-v1';
const urlsToCache = [
  '/',
  '/ProbSo/index.html',
  '/ProbSo/manifest.json',
  '/ProbSo/logo-192.png',
  '/ProbSo/Logo-512.png'
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      )
    )
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return (
        response ||
        fetch(event.request).catch(() =>
          caches.match('/ProbSo/index.html')
        )
      );
    })
  );
});