# Hocker ONE · 12.7L-2C-A.1 · Clean Topology Headers

## Decisión

Se limpia topología pública/privada sin tocar el router cognitivo de NOVA.AGI.

## Cambios

- Middleware usa topología central desde `hocker-public-private-topology.ts`.
- Se eliminan arrays duplicados dentro de `middleware.ts`.
- Headers públicos y privados quedan diferenciados:
  - Público: `12.7L-2C-public-indexable-clean`
  - Privado/noindex: `12.7L-2C-private-noindex-clean`
- `/auth/callback` queda como ruta técnica noindex.
- `robots.ts` consume rutas desde topología central.
- Se conserva Provider Orchestrator 12.7L-2C-A.
- NOVA sigue decidiendo proveedor internamente. La UI estándar no muestra selector de modelo.

## Seguridad

- No ejecuta proveedores.
- No dispara acciones.
- No escribe en main.
- No toca el router LLM de NOVA.AGI.

## Siguiente fase

12.7L-2C-B debe agregar router diagnóstico multi-proveedor:
local → PageSpeed → GitHub Actions → fallback documentado.
