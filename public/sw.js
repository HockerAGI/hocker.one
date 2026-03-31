self.addEventListener("install", (event) => {
  // Fuerza la activación inmediata del nuevo ADN
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  // Limpia rastros de versiones anteriores
  event.waitUntil(self.clients.claim());
});

// Interceptor de transmisiones
self.addEventListener("fetch", (event) => {
  // En el futuro, aquí gestionaremos las Notificaciones Push de los 'Hijos' de Hocker
});
