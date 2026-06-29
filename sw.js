// sw.js
const CACHE = 'workout-v1';
const PRECACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/style.css',
  '/css/app.css',
  '/js/auth.js',
  '/js/router.js',
  '/js/db.js',
  '/js/workout-data.js',
  '/js/load-calculator.js',
  '/js/timer.js',
  '/js/views/dashboard.js',
  '/js/views/workout.js',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
      const clone = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, clone));
      return res;
    }))
  );
});
