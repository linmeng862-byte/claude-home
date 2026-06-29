const CACHE_NAME = 'claude-home-v1'
const PRECACHE = [
  '/',
  '/index.html',
  '/manifest.json',
]

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(PRECACHE)))
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
  )
  self.clients.claim()
})

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url)
  // API 请求不缓存
  if (url.pathname.startsWith('/api/')) return
  // 静态资源：缓存优先
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(r => {
      if (r.ok && (r.type === 'basic' || url.pathname.match(/\.(js|css|png|jpg|svg|ico|json)$/))) {
        const clone = r.clone()
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone))
      }
      return r
    }))
  )
})
