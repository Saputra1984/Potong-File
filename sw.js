const CACHE_NAME = 'filesplitter-v1';
const CORE = [
    './',
    './index.html',
    './manifest.json'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((c) =>
            Promise.allSettled(CORE.map((f) => c.add(f)))
        )
    );
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(Promise.all([
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        ),
        self.clients.claim()
    ]));
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    if (event.request.method !== 'GET') return;
    if (url.origin !== self.location.origin) return;

    event.respondWith(
        caches.match(event.request).then((cached) => {
            if (cached) return cached;
            return fetch(event.request).then((res) => {
                const copy = res.clone();
                caches.open(CACHE_NAME).then((c) => c.put(event.request, copy));
                return res;
            }).catch(() => caches.match('./index.html'));
        })
    );
});
