// Service Worker for Darkness Planner
const CACHE_NAME = 'darkness-planner-v1.1';

const ASSETS = [
  './',
  './index.html',
  './dark.css',
  './dark.js',
  './lang-en.js',
  './lang-ru.js',
  './StarJs.min.js',
  './manifest.webmanifest'
  // Icons can be added later, for example:
  // './dark-192.png',
  // './dark-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) {
        return cached;
      }
      return fetch(request);
    })
  );
});
