/**
 * MUTE-WEB 서비스 워커 — 오프라인 재생 지원
 *
 * - 앱 화면(HTML/CSS/JS): 네트워크 우선 → 실패하면 저장본. (수정 사항이 바로 반영되도록)
 * - 사운드·이미지(assets/): 저장본 우선 → 없으면 받아서 저장. 한 번 들은 테마는 인터넷 없이도 재생됩니다.
 * - 외부 서체(Pretendard CDN): 저장본을 먼저 쓰고 뒤에서 갱신.
 *
 * 화면 파일 구성이 바뀌면 CACHE_VERSION을 올려 주세요. 이전 저장본은 자동으로 정리됩니다.
 */
const CACHE_VERSION = 'v2';
const SHELL_CACHE = `mute-shell-${CACHE_VERSION}`;
const ASSET_CACHE = `mute-assets-${CACHE_VERSION}`;
const FONT_CACHE = `mute-fonts-${CACHE_VERSION}`;

const SHELL_FILES = [
  './',
  'index.html',
  'css/style.css',
  'js/i18n.js',
  'js/script.js',
  'manifest.webmanifest',
  'assets/images/background1.png',
  'assets/icons/icon-192.png',
  'assets/icons/icon-512.png',
  'assets/icons/favicon-32.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  const keep = [SHELL_CACHE, ASSET_CACHE, FONT_CACHE];
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('mute-') && !keep.includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || request.headers.has('range')) return;
  const url = new URL(request.url);

  if (url.origin === self.location.origin) {
    if (url.pathname.includes('/assets/')) event.respondWith(cacheFirst(request, ASSET_CACHE));
    else event.respondWith(networkFirst(request));
  } else if (url.hostname === 'cdn.jsdelivr.net') {
    event.respondWith(staleWhileRevalidate(request, FONT_CACHE));
  }
});

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok && response.status === 200) {
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok && response.status === 200) {
      const cache = await caches.open(SHELL_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request, { ignoreSearch: true });
    if (cached) return cached;
    // 오프라인에서 처음 보는 주소로 들어오면 첫 화면을 보여줌
    if (request.mode === 'navigate') return caches.match('index.html');
    throw err;
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => { if (response.ok || response.type === 'opaque') cache.put(request, response.clone()); return response; })
    .catch(() => cached);
  return cached || network;
}
