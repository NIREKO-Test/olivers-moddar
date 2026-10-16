// Gör att appen fungerar utan internet. Hämtar alltid nytt när det går
// (så uppdateringar kommer direkt) och faller tillbaka på det sparade annars.
const CACHE = "olivers-moddar-v2";
const FILER = [
  "./",
  "index.html",
  "app.css",
  "app.js",
  "rita.js",
  "mallar.js",
  "paket.js",
  "png.js",
  "zip.js",
  "runtime/main.js",
  "manifest.webmanifest",
  "ikoner/ikon-180.png",
  "ikoner/ikon-192.png",
  "ikoner/ikon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILER)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((nycklar) => Promise.all(nycklar.filter((nyckel) => nyckel !== CACHE).map((nyckel) => caches.delete(nyckel))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;
  // "no-cache": fråga alltid servern om det finns nytt, så appens filer aldrig
  // blir en blandning av gammalt och nytt efter en uppdatering.
  event.respondWith(
    fetch(request.url, { cache: "no-cache", credentials: "same-origin" })
      .then((svar) => {
        if (svar.ok) {
          const kopia = svar.clone();
          caches.open(CACHE).then((cache) => cache.put(request, kopia));
        }
        return svar;
      })
      .catch(() => caches.match(request, { ignoreSearch: true })),
  );
});
