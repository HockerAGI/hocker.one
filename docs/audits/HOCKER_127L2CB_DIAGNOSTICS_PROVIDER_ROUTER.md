# HOCKER ONE · 12.7L-2C-B Diagnostics Provider Router

## Objetivo

Agregar router diagnóstico multi-proveedor sin duplicar el router LLM nativo de NOVA.AGI.

## Orden de proveedores

1. Local Lighthouse
2. PageSpeed Insights
3. GitHub Actions Lighthouse
4. Documented fallback

## Reglas

- Hocker ONE sólo enruta diagnóstico.
- NOVA.AGI conserva el router cognitivo/modelos.
- No se expone selector de proveedor al usuario.
- Fallback documentado no equivale a Lighthouse OK.
- Fase 13 sigue bloqueada sin evidencia real.

## Evidencia esperada

- `diagnostics_summary.json`
- `diagnostics_attempts.json`
- Reportes Lighthouse JSON/HTML o PageSpeed JSON
- Artifact de GitHub Actions si aplica
