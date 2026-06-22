// Protocol service worker — offline caching.
// Bump CACHE version whenever you change app files so clients update.
const CACHE = "protocol-v13";

// App shell + CDN libs. Videos are cached on first play (runtime cache below).
const SHELL = [
  "./",
  "./index.html",
  "./app.js",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "https://unpkg.com/react@18/umd/react.production.min.js",
  "https://unpkg.com/react-dom@18/umd/react-dom.production.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js",
  "https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js",
  "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth-compat.js",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Web Push: rest-timer alarm fired by the scheduler Worker (works locked/closed).
self.addEventListener("push", (e) => {
  let data = {};
  try { data = e.data ? e.data.json() : {}; } catch (_) {}
  const title = data.title || "Rest's up";
  const body = data.body || "Time for your next set 💪";
  e.waitUntil(self.registration.showNotification(title, {
    body,
    icon: "./icon-192.png",
    badge: "./icon-192.png",
    tag: "rest-timer",
    renotify: true,
    requireInteraction: true,
    vibrate: [300, 120, 300, 120, 300],
  }));
});
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((cls) => {
    for (const c of cls) { if ("focus" in c) return c.focus(); }
    if (self.clients.openWindow) return self.clients.openWindow("./");
  }));
});

// Videos: cache-first (big, immutable — load once then stay offline).
// Everything else (app shell: html/js/manifest/CDN): network-first, so a new
// deploy ALWAYS reaches the user when online; cache is only the offline fallback.
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  const isVideo = url.pathname.includes("/videos/") || url.pathname.endsWith(".mp4");

  if (isVideo) {
    e.respondWith(
      caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
        }
        return res;
      }))
    );
    return;
  }

  // network-first for the app shell
  e.respondWith(
    fetch(e.request).then((res) => {
      if (res && res.status === 200) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
      }
      return res;
    }).catch(() => caches.match(e.request))
  );
});
