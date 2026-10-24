// Service Worker Endurecido (AppSec)
// Cachea únicamente el shell estático de la aplicación (HTML/CSS/JS/Iconos)
// y PROHÍBE explícitamente cachear respuestas de APIs clínicas o de Supabase
// para proteger los datos sensibles en caso de extravío del celular (Ley 25.326).

const CACHE_NAME = 'centro-terapeutico-shell-v1';
const STATIC_ASSETS = ['/', '/index.html', '/manifest.webmanifest', '/icon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // JAMÁS cachear llamadas a Supabase, Edge Functions o peticiones que no sean GET
  if (
    event.request.method !== 'GET' ||
    url.hostname.includes('supabase.co') ||
    url.pathname.startsWith('/rest/') ||
    url.pathname.startsWith('/functions/') ||
    url.pathname.startsWith('/auth/')
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
