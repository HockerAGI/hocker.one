# HOCKER ONE — 12.7B-0 Fix

Normaliza estados reales de herramientas e integraciones.

Aplicado:
- Crea `/api/agi/runtime/tools` protegido.
- Reconoce `HOCKER_GITHUB_TOKEN` como token real de GitHub.
- Reconoce `VERCEL_OIDC_TOKEN` como señal parcial de Vercel.
- Amplía catálogo a 20 herramientas/integraciones esperadas.
- Estados: configured, partial, missing, blocked.
- Mejora preview owner para mostrar conectado/parcial/faltante.

No ejecuta acciones reales.
No expone secretos.
No toca Owner Gate.
