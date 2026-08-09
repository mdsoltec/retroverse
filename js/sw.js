const CACHE_NAME = 'retroverse-v7';
const STATIC_ASSETS = [
  'index.html',
  'games.html',
  'play.html',
  'profile.html',
  'css/style.css',
  'assets/rv-icon.png',
  'manifest.json',
  // Base de cheats dinâmica do EmulatorJS
  'cheats/cheats.json',
  'cheats/nes.json',
  'cheats/snes.json',
  'cheats/gba.json',
  'cheats/gbc.json',
  'cheats/gb.json',
  'cheats/n64.json',
  'cheats/pcsx_rearmed.json',
  'cheats/segaMD.json',
  'cheats/segaCD.json',
  'cheats/segaGG.json',
  'cheats/nds.json',
  'cheats/fbneo.json'
];

// Install — cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — network first, fallback to cache
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip external CDN and ROM requests (too large to cache)
  if (url.hostname !== self.location.hostname) return;

  // Skip overlay images and covers (too many, too large)
  if (url.pathname.includes('/overlays/') || url.pathname.includes('/covers/')) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Clone and cache successful responses
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
