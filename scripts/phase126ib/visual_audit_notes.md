# 12.6I-B — Cinematic Real-Data UX

Cambios aplicados:
- Mapa visual rediseñado sin tarjetas encimadas.
- NOVA queda como núcleo claro.
- Métricas reales: memoria, AGIs, deduplicación y errores prevenidos.
- Ruta de memoria fuera del canvas para que el dock no la tape.
- Fondo VFX global CSS-only: orbes, rejilla, scan, ruido ligero.
- Respeta prefers-reduced-motion.
- No usa canvas pesado, WebGL, dependencias externas ni datos simulados.

Validación esperada:
- npm run typecheck
- npm run build
- rutas privadas devuelven 307 a /login sin sesión.

Lighthouse:
- Auditar /login en público.
- Auditar /map, /live, /chat y /commands desde Chrome DevTools con sesión owner iniciada.
