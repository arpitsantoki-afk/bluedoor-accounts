// ============================================================
//  BLUE DOOR ARCHITECTS — Accounts Platform
//  sw.js  |  Service Worker  v1.5
//  Caches app shell for offline access
// ============================================================

var CACHE_NAME = "bluedoor-accounts-v1.5";

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

// ── FETCH — cache-first for app shell, network-first for API ──
self.addEventListener("fetch", function(event) {
  var url = event.request.url;

  // Always go to network for API calls (Apps Script)
  if (url.includes("script.google.com")) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Cache-first for app shell files
  event.respondWith(
    caches.match(event.request).then(function(cached) {
      if (cached) return cached;
      return fetch(event.request).then(function(response) {
        // Cache valid responses for app shell files
        if (response && response.status === 200 && response.type === "basic") {
          var responseClone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      }).catch(function() {
        // Offline fallback — return index.html for navigation requests
        if (event.request.mode === "navigate") {
          return caches.match("/bluedoor-accounts/index.html");
        }
      });
    })
  );
});
