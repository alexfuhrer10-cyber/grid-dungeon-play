/* KenKen Dungeon service worker.
   Navigations are network-first so new builds always arrive; hashed assets and art
   are cache-first for instant loads and offline play.

   WHY THIS FILE GREW CATCH BLOCKS (kkd-535). KenKen Reveal "worked on the
   computer and not on the phone", and the assets were never the problem: all 145
   pictures are on disk, all ship in the build, and all return 200 from the live
   site. The difference was NETWORK RELIABILITY, and this worker had no answer for
   a failed request.

     `e.respondWith(fetch(...))` with no catch turns ONE dropped request into a
     hard network error. On desktop wifi that approaches never. On cellular it is
     routine, and the page above turns a failed image into `display: none`, so a
     dropped packet became a permanently missing picture with no retry and no
     message.

     `cache.put()` with no catch throws when the origin is over quota. iOS gives a
     site far less Cache Storage than a desktop, and this game ships 770 files, so
     a phone reaches the ceiling and a desktop does not. An unhandled rejection
     inside a fetch handler is not free on every browser.

   The rule now: NOTHING in here may reject. A miss falls back to the cache, then
   to whatever is there, and the page decides what to do about it. */
const CACHE = "kkd-653";

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(["./", "./index.html", "./manifest.webmanifest"]))
      .catch(() => null)                     // a failed precache must not block install
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .catch(() => null)
      .then(() => self.clients.claim())
  );
});

// Quota is a real ceiling on a phone. A failed write is fine — the response has
// already gone to the page — but it must never surface as a rejection.
const stash = (req, res) => {
  try {
    const copy = res.clone();
    caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
  } catch (e) { /* clone can throw on an already-consumed body */ }
};

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;

  const isNav = e.request.mode === "navigate" || url.pathname.endsWith("/index.html");
  if (isNav) {
    // Network-first: a stale shell must never outlive a deploy.
    e.respondWith(
      fetch(e.request)
        .then((res) => { if (res.ok) stash(e.request, res); return res; })
        .catch(() => caches.match(e.request).then((hit) => hit || caches.match("./index.html")))
    );
    return;
  }

  // Cache-first for everything else, and ONE RETRY before giving up. A single
  // dropped request on a phone is the common case, not the exceptional one.
  e.respondWith(
    caches.match(e.request).then((hit) => {
      if (hit) return hit;
      const go = () => fetch(e.request).then((res) => {
        if (res.ok) stash(e.request, res);      // never cache a failure: a cached 404 wedges the app
        return res;
      });
      return go()
        .catch(() => new Promise((r) => setTimeout(r, 400)).then(go))
        // Out of options: hand back whatever is cached, or a 504 the page can
        // see. Rejecting here is what produced a silently missing picture.
        .catch(() => caches.match(e.request).then((h2) => h2
          || new Response("", { status: 504, statusText: "offline" })));
    })
  );
});
