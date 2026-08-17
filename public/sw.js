/**
 * Service worker — makes the app open without connection.
 *
 * Vite fingerprints its output (index-a1b2c3.js), so a hardcoded precache list
 * would go stale on every build. Instead this caches at runtime: first request
 * for a same-origin GET goes to the network and gets stored; later requests are
 * served from the cache and refreshed in the background.
 *
 * BUMP `CACHE` ON EVERY DEPLOY. Without it, phones that already installed the
 * app keep serving the previous version from their cache — the same trap that
 * bit dryland-test-logger.
 */

const CACHE = "wano-kuni-v6";

self.addEventListener("install", (event) => {
  // Take over as soon as the new worker is ready instead of waiting for every
  // tab to close.
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(["./", "./index.html"]).catch(() => {}))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;
  if (new URL(request.url).origin !== self.location.origin) return;

  // Navigations: try the network first so a deploy is picked up while online,
  // fall back to the cached shell when there is no connection.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then((hit) => hit || caches.match("./index.html")))
    );
    return;
  }

  // Everything else (hashed JS/CSS/images): cache first, they never change
  // under the same filename.
  event.respondWith(
    caches.match(request).then((hit) => {
      if (hit) return hit;
      return fetch(request).then((response) => {
        if (response.ok && response.type === "basic") {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    })
  );
});
