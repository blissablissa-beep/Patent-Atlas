"use strict";

const CACHE_VERSION = "v1";
const CACHE_PREFIX = "patent-atlas";

const APP_CACHE =
  `${CACHE_PREFIX}-app-${CACHE_VERSION}`;

const DATA_CACHE =
  `${CACHE_PREFIX}-data-${CACHE_VERSION}`;

const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.webmanifest"
];

const OPTIONAL_ASSETS = [
  "./data/index.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png"
];

self.addEventListener(
  "install",
  event => {
    event.waitUntil(
      (async () => {
        const cache =
          await caches.open(APP_CACHE);

        /*
         * アプリ本体はインストール時に
         * 必ずキャッシュします。
         */
        await cache.addAll(APP_SHELL);

        /*
         * 国一覧とアイコンは、制作途中で
         * 存在しなくてもService Workerの
         * インストールを妨げないようにします。
         */
        await Promise.allSettled(
          OPTIONAL_ASSETS.map(
            asset => cache.add(asset)
          )
        );

        await self.skipWaiting();
      })()
    );
  }
);

self.addEventListener(
  "activate",
  event => {
    event.waitUntil(
      (async () => {
        const currentCaches =
          new Set([
            APP_CACHE,
            DATA_CACHE
          ]);

        const cacheNames =
          await caches.keys();

        await Promise.all(
          cacheNames
            .filter(name =>
              name.startsWith(
                `${CACHE_PREFIX}-`
              ) &&
              !currentCaches.has(name)
            )
            .map(name =>
              caches.delete(name)
            )
        );

        await self.clients.claim();
      })()
    );
  }
);

self.addEventListener(
  "fetch",
  event => {
    const { request } = event;

    if (request.method !== "GET") {
      return;
    }

    const url =
      new URL(request.url);

    /*
     * 外部サイトへのアクセスは
     * キャッシュ対象にしません。
     */
    if (
      url.origin !==
      self.location.origin
    ) {
      return;
    }

    /*
     * ページ遷移はネットワークを優先し、
     * オフライン時にキャッシュへ戻します。
     */
    if (request.mode === "navigate") {
      event.respondWith(
        networkFirstNavigation(request)
      );

      return;
    }

    /*
     * 国一覧・国別JSONはネットワーク優先。
     * 一度取得したデータは個別に保存します。
     */
    if (isDataRequest(url)) {
      event.respondWith(
        networkFirstData(request)
      );

      return;
    }

    /*
     * CSS、JavaScript、画像等は
     * キャッシュを直ちに返しつつ、
     * 背景で最新版を取得します。
     */
    event.respondWith(
      staleWhileRevalidate(request)
    );
  }
);

self.addEventListener(
  "message",
  event => {
    if (
      event.data?.type ===
      "SKIP_WAITING"
    ) {
      self.skipWaiting();
    }
  }
);

async function networkFirstNavigation(
  request
) {
  try {
    const response =
      await fetch(request);

    if (isCacheable(response)) {
      const cache =
        await caches.open(APP_CACHE);

      await cache.put(
        request,
        response.clone()
      );
    }

    return response;
  } catch {
    const cachedPage =
      await caches.match(request);

    if (cachedPage) {
      return cachedPage;
    }

    const cachedIndex =
      await caches.match(
        "./index.html"
      );

    if (cachedIndex) {
      return cachedIndex;
    }

    return offlineResponse();
  }
}

async function networkFirstData(
  request
) {
  const cache =
    await caches.open(DATA_CACHE);

  try {
    const response =
      await fetch(request);

    if (isCacheable(response)) {
      await cache.put(
        request,
        response.clone()
      );
    }

    return response;
  } catch {
    const cachedResponse =
      await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    /*
     * data/index.jsonは、インストール時に
     * APP_CACHEへ保存されている場合があります。
     */
    const fallback =
      await caches.match(request);

    if (fallback) {
      return fallback;
    }

    return new Response(
      JSON.stringify({
        error: "offline",
        message:
          "The requested data has not been cached."
      }),
      {
        status: 503,
        statusText: "Offline",
        headers: {
          "Content-Type":
            "application/json; charset=utf-8",
          "Cache-Control": "no-store"
        }
      }
    );
  }
}

async function staleWhileRevalidate(
  request
) {
  const cache =
    await caches.open(APP_CACHE);

  const cachedResponse =
    await cache.match(request);

  const networkResponsePromise =
    fetch(request)
      .then(async response => {
        if (isCacheable(response)) {
          await cache.put(
            request,
            response.clone()
          );
        }

        return response;
      })
      .catch(() => null);

  if (cachedResponse) {
    return cachedResponse;
  }

  const networkResponse =
    await networkResponsePromise;

  if (networkResponse) {
    return networkResponse;
  }

  return new Response(
    "Resource unavailable while offline.",
    {
      status: 503,
      statusText: "Offline",
      headers: {
        "Content-Type":
          "text/plain; charset=utf-8",
        "Cache-Control": "no-store"
      }
    }
  );
}

function isDataRequest(url) {
  const scopePath =
    new URL(
      "./",
      self.location.href
    ).pathname;

  const dataPath =
    `${scopePath}data/`;

  return (
    url.pathname.startsWith(
      dataPath
    ) &&
    url.pathname.endsWith(".json")
  );
}

function isCacheable(response) {
  return (
    response &&
    response.ok &&
    response.type !== "opaque"
  );
}

function offlineResponse() {
  return new Response(
    `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1"
  >
  <meta
    name="theme-color"
    content="#102a43"
  >

  <title>Patent Atlas — Offline</title>

  <style>
    :root {
      font-family:
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        sans-serif;
      color: #17212b;
      background: #f6f8fa;
    }

    body {
      display: grid;
      min-height: 100vh;
      place-items: center;
      margin: 0;
      padding: 24px;
    }

    main {
      width: min(100%, 560px);
      padding: 32px;
      border: 1px solid #d8e0e7;
      border-top: 5px solid #173f5f;
      border-radius: 18px;
      background: #fff;
      box-shadow:
        0 10px 30px
        rgb(16 42 67 / 12%);
    }

    h1 {
      margin-top: 0;
      color: #102a43;
      font-family:
        Georgia,
        "Times New Roman",
        serif;
    }

    p {
      margin-bottom: 0;
      line-height: 1.8;
    }
  </style>
</head>

<body>
  <main>
    <h1>Patent Atlas</h1>

    <p>
      現在オフラインです。初回アクセス後に
      もう一度お試しください。<br>
      You are offline. Please try again
      after opening the app once while online.
    </p>
  </main>
</body>
</html>`,
    {
      status: 503,
      statusText: "Offline",
      headers: {
        "Content-Type":
          "text/html; charset=utf-8",
        "Cache-Control": "no-store"
      }
    }
  );
}
