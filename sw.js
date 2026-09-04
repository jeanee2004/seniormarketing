const CACHE = "bab-v1";
const ASSETS = ["/", "/style.css", "/script.js", "/assets/grandma-hero-square.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
});

self.addEventListener("fetch", (e) => {
  if (e.request.url.includes("/api/")) return; // 카카오·구글 리뷰 API는 캐싱 제외
  e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request)));
});
