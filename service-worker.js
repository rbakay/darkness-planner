// -------------------------------
// Service Worker for Darkness Planner
// Increase this version string to force an update:
const CACHE_NAME = 'darkness-planner-v1.32';
// -------------------------------

const ASSETS = [
  './',
  './index.html',
  './dark.css',
  './dark.js',
  './lang-en.js',
  './lang-ru.js',
  './StarJs.min.js',
  './manifest.webmanifest',

  // Icons used by the PWA
  './dark-512.png',
  './dark-192.png',
  './dark-180.png',
  './dark-167.png',
  './dark-152.png',
  './dark-120.png',
  './dark-76.png',
  './dark-48.png',
  './dark-32.png',
  './dark-16.png'
];

// --------------------------------------------------
// INSTALL: preload all core assets into the cache
// --------------------------------------------------
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );

  // Activate the new service worker immediately
  self.skipWaiting();
});

// --------------------------------------------------
// ACTIVATE: remove old caches
// --------------------------------------------------
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          // Delete all old Darkness Planner caches except the current one
          .filter(key => key.startsWith('darkness-planner-') && key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );

  // Take control of open pages immediately
  self.clients.claim();
});

// --------------------------------------------------
// FETCH: serve assets from cache first (offline-first)
// --------------------------------------------------
self.addEventListener('fetch', event => {
  const request = event.request;

  // Only cache GET requests
  if (request.method !== 'GET') return;

  event.respondWith(
    caches.match(request).then(cached => {
      // If asset exists in cache, return it
      if (cached) return cached;

      // Otherwise fetch from network
      return fetch(request);
    })
  );
});
