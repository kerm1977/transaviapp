// Nombre de la caché (incrementar este número cuando cambien los archivos estáticos)
const CACHE_NAME = 'transavi-app-cache-v1';

// Lista de archivos para pre-cachear (archivos esenciales para la experiencia offline)
// Esto debe incluir todas las rutas estáticas y plantillas esenciales (como base, login, index, perfil)
const urlsToCache = [
    '/', // Ruta principal
    '/index', // Página de inicio pública
    '/auth/login', // Página de login
    '/auth/register', // Página de registro
    '/static/css/styles.css', // Asumiendo que tienes un archivo CSS principal
    '/static/js/main.js', // Asumiendo que tienes un archivo JS principal
    '/static/manifest.json',
    // URLs de los íconos (ajusta si las rutas son diferentes)
    '/static/img/icon-192.png',
    '/static/img/icon-512.png',
    // Librería de íconos que usas en perfil.html
    'https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.esm.js',
    'https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.js'
];

// 1. Instalar el Service Worker (Guardar los recursos estáticos en caché)
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Instalando y precacheando shell...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Pre-cache abierto, añadiendo recursos: ', urlsToCache);
                return cache.addAll(urlsToCache);
            })
            .catch(err => {
                console.error('[Service Worker] Error al precachear:', err);
            })
    );
});

// 2. Activar el Service Worker (Limpiar cachés viejas)
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activando y limpiando cachés viejas.');
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        console.log('[Service Worker] Eliminando caché vieja: ', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// 3. Interceptar peticiones y servir desde la caché (Estrategia Cache-First/Network-Fallback)
self.addEventListener('fetch', (event) => {
    // Si es una petición a la ruta de perfil, intenta primero la red para obtener datos actualizados.
    // Aunque el perfil es dinámico, si falla la red, serviremos la última versión cacheada.
    const isProfile = event.request.url.includes('/profile');
    const isAuth = event.request.url.includes('/auth');
    
    // Para todas las peticiones (especialmente estáticas y páginas HTML)
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Cache hit - retorna la respuesta cacheada
                if (response) {
                    // Si estamos offline y es una página, la servimos
                    console.log(`[Service Worker] Sirviendo desde caché: ${event.request.url}`);
                    return response;
                }
                
                // Si no está en caché, intentar obtener desde la red
                console.log(`[Service Worker] Fetching desde red: ${event.request.url}`);
                return fetch(event.request).then(
                    (response) => {
                        // Verifica si recibimos una respuesta válida
                        if(!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        // Si la respuesta es buena, clonarla para ponerla en la caché
                        const responseToCache = response.clone();
                        
                        // NO cacheamos el perfil ni rutas de autenticación, ya que son dinámicas/privadas
                        // Pero sí cacheamos todas las URLs que se listaron arriba
                        if (!isProfile && !isAuth && event.request.method === 'GET') {
                            caches.open(CACHE_NAME)
                                .then((cache) => {
                                    cache.put(event.request, responseToCache);
                                });
                        }

                        return response;
                    }
                ).catch((error) => {
                    console.error('[Service Worker] Fetch falló, y no hay caché disponible para:', event.request.url, error);
                    // Opcionalmente, puedes retornar una página HTML de "offline" aquí si el fetch falla
                    // return caches.match('/offline.html');
                });
            })
    );
});
