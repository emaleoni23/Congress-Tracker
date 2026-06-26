// Congress Trade Tracker — Service Worker
const CACHE_NAME = "congress-tracker-v1";

// File da cachare subito all'installazione
const STATIC_ASSETS = [
  "/Congress-Tracker/",
  "/Congress-Tracker/index.html",
  "https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.5/babel.min.js"
];

// Installazione — precache degli asset statici
self.addEventListener("install", function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Attivazione — rimuove cache vecchie
self.addEventListener("activate", function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

// Fetch — strategia network-first per i dati, cache-first per gli asset
self.addEventListener("fetch", function(event) {
  var url = event.request.url;

  // Dati House Stock Watcher — network first, fallback cache
  if (url.includes("house-stock-watcher-data")) {
    event.respondWith(
      fetch(event.request)
        .then(function(response) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) { cache.put(event.request, clone); });
          return response;
        })
        .catch(function() {
          return caches.match(event.request);
        })
    );
    return;
  }

  // CDN React/Babel — cache first (cambiano raramente)
  if (url.includes("cdnjs.cloudflare.com")) {
    event.respondWith(
      caches.match(event.request).then(function(cached) {
        return cached || fetch(event.request).then(function(response) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) { cache.put(event.request, clone); });
          return response;
        });
      })
    );
    return;
  }

  // App shell (index.html) — network first
  if (url.includes("/Congress-Tracker")) {
    event.respondWith(
      fetch(event.request)
        .then(function(response) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) { cache.put(event.request, clone); });
          return response;
        })
        .catch(function() {
          return caches.match(event.request);
        })
    );
    return;
  }

  // Default — network
  event.respondWith(fetch(event.request).catch(function() {
    return caches.match(event.request);
  }));
});
