const CACHE_NAME = 'explore-its-v8';

// Identifica automaticamente o endereço-base
// do aplicativo, tanto no notebook quanto
// no GitHub Pages.
const BASE_URL = self.registration.scope;

const ASSETS_TO_CACHE = [
  BASE_URL,
  new URL('index.html', BASE_URL).href,
  new URL('manifest.json', BASE_URL).href,
  new URL('logomarca-its-marfim.png', BASE_URL).href,
  new URL('mapa-trilha-app.svg', BASE_URL).href,
  new URL('imagem/pictogramas/arvores.svg', BASE_URL).href,
  new URL('imagem/pictogramas/processos-ecologicos.svg', BASE_URL).href,
  new URL('imagem/pictogramas/formacoes-naturais.svg', BASE_URL).href,
  new URL('imagem/pictogramas/cultura-folclore.svg', BASE_URL).href,
  new URL('imagem/localidades/inicio_trilha.webp', BASE_URL).href
];


// Instalação do Service Worker e armazenamento offline
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      // Arquivos essenciais do aplicativo
      await cache.addAll(ASSETS_TO_CACHE);

      // Arquivos JavaScript e CSS gerados pelo Vite
      const listaURL = new URL('offline-assets.json', BASE_URL);
      const resposta = await fetch(listaURL);

      if (!resposta.ok) {
        throw new Error('Não foi possível carregar offline-assets.json');
      }

      const arquivos = await resposta.json();
      const urls = arquivos.map(
        arquivo => new URL(arquivo, BASE_URL).href
      );

      await cache.addAll(urls);
      await cache.add(listaURL.href);

      await self.skipWaiting();
    })()
  );
});

// Ativação e limpeza de caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});


 // Estratégia Network First com Fallback para Cache
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    (async () => {
      try {
        const resposta = await fetch(event.request);

        if (resposta.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(event.request, resposta.clone());
        }

        return resposta;
      } catch (erro) {
        const respostaCache = await caches.match(event.request, {
          ignoreSearch: true
        });

        if (respostaCache) {
          return respostaCache;
        }

        return new Response('Recurso indisponível offline', {
          status: 503,
          statusText: 'Offline'
        });
      }
    })()
  );
});
