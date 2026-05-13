// ============================================================
//  BLUE DOOR ARCHITECTS — Accounts Platform
//  sw.js  |  Service Worker  v1.5
//  Caches app shell for offline access
// ============================================================

var CACHE_NAME = "bluedoor-accounts-v1.5.1";

// Files to cache on install — the app shell
var APP_SHELL = [
  "/bluedoor-accounts/",
  "/bluedoor-accounts/index.html",
  "/bluedoor-accounts/app.html",
  "/bluedoor-accounts/admin.html",
  "/bluedoor-accounts/manifest.json",
  "/bluedoor-accounts/icon-192.png",
  "/bluedoor-accounts/icon-512.png"
];

// ── INSTALL — cache app shell ──────────────────────────────
self.addEventListener("install", function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(APP_SHELL);
    })
  );
  self.skipWaiting();
});

// ── ACTIVATE — clean up old caches ────────────────────────
self.addEventListener("activate", function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) { return key !== CACHE_NAME; })
            .map(function(key)   { return caches.delete(key);  })
      );
    })
  );
  self.clients.claim();
});

// ── FETCH ──────────────────────────────────────────────────
self.addEventListener("fetch", function(event) {
  var url = event.request.url;

  // Always network for API calls
  if (url.includes("script.google.com")) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Always network-first for HTML/JS/JSON — never serve stale versions
  if (url.endsWith(".html") || url.endsWith(".js") || url.endsWith(".json") ||
      event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request, {cache: "no-store"}).catch(function() {
        return caches.match("/bluedoor-accounts/index.html");
      })
    );
    return;
  }

  // Cache-first only for icons and manifest
  event.respondWith(
    caches.match(event.request).then(function(cached) {
      return cached || fetch(event.request);
    })
  );
});