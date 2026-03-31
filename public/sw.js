self.addEventListener("install", (event) => {
  // Fuerza la activación inmediata del nuevo ADN visual
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  // Limpia el rastro de versiones anteriores para evitar conflictos
  event.waitUntil(self.clients.claim());
});

// Interceptor de transmisiones (Preparado para futuras notificaciones push)
self.addEventListener("fetch", (event) => {
  // El cacheo se mantiene al mínimo para garantizar datos en tiempo real
});
