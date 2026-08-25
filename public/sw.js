// HAFIZ service worker — offline-first for the Mushaf, tafsir & recitations.
const APP = "hafiz-app-v3";      // app shell & static assets
const QURAN = "hafiz-quran-v2";  // Quran text + tafsir (JSON)
const AUDIO = "hafiz-audio-v2";  // recitation mp3s
const CORE = ["/", "/mushaf", "/memorize", "/review", "/plan", "/names", "/adhkar", "/manifest.json", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(APP).then((c) => c.addAll(CORE)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => ![APP, QURAN, AUDIO].includes(k)).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// keep audio cache from growing unbounded
async function trimCache(name, max) {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  if (keys.length > max) {
    for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  // ---- Quran text + tafsir: cache-first (permanent offline) ----
  if (url.hostname.includes("alquran.cloud")) {
    event.respondWith(
      caches.open(QURAN).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const res = await fetch(request);
          if (res.ok) cache.put(request, res.clone());
          return res;
        } catch {
          return cached || Response.error();
        }
      })
    );
    return;
  }

  // ---- Recitation audio: cache-first + trim (offline recitations) ----
  if (url.pathname.endsWith(".mp3") || url.hostname.includes("everyayah") || url.hostname.includes("mp3quran") || url.hostname.includes("islamic.network") || url.hostname.includes("archive.org")) {
    event.respondWith(
      caches.open(AUDIO).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const res = await fetch(request);
          if (res.ok || res.status === 206) { cache.put(request, res.clone()); trimCache(AUDIO, 400); }
          return res;
        } catch {
          return cached || Response.error();
        }
      })
    );
    return;
  }

  // ---- App navigations & API: network-first, fall back to cache ----
  if (request.mode === "navigate" || url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(APP).then((c) => c.put(request, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(request).then((r) => r || caches.match("/")))
    );
    return;
  }

  // ---- Static assets: stale-while-revalidate ----
  event.respondWith(
    caches.open(APP).then(async (cache) => {
      const cached = await cache.match(request);
      const network = fetch(request).then((res) => { if (res.ok) cache.put(request, res.clone()); return res; }).catch(() => cached);
      return cached || network;
    })
  );
});

// Show a review reminder notification (triggered from the page).
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "review-reminder") {
    self.registration.showNotification("حافظ · وقت المراجعة", {
      body: event.data.body || "لديك آيات مستحقّة للمراجعة اليوم. تعاهد القرآن يبقَ في قلبك.",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      dir: "rtl",
      lang: "ar",
      tag: "hafiz-review",
    });
  }
});
