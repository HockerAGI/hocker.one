# HOCKER ONE — 12.7B-0 Tool Registry Normalization

Objetivo:
Normalizar el catálogo real de herramientas para evitar falsos negativos y mostrar estados honestos.

Cambios:
- Reconoce aliases reales como HOCKER_GITHUB_TOKEN.
- Reconoce NOVA_AGI_URL + NOVA_ORCHESTRATOR_KEY.
- Añade VERCEL_OIDC_TOKEN como señal parcial, sin tratarlo como token API completo.
- Amplía catálogo a 20 integraciones esperadas.
- Estados claros: connected, partial, missing_key, missing_code, blocked.
- Nueva ruta protegida: /api/agi/runtime/tools.
- Owner home muestra conectadas, parciales, falta llave y falta código.

No hace:
- No ejecuta acciones reales.
- No conecta Ads/pagos/dominios sin llaves.
- No expone secretos.
- No elimina Owner Gate.
