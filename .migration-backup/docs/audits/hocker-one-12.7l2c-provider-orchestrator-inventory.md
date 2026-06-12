# Hocker ONE · 12.7L-2C-A · Provider Orchestrator Inventory + NOVA.AGI Sync

## Decisión

Hocker ONE no duplica el router LLM.

## Arquitectura

- NOVA.AGI decide proveedor cognitivo internamente.
- Hocker ONE consulta inventario y estado.
- Hocker ONE mantiene Owner Gate, Queue Lock, evidencia y rollback.
- La interfaz estándar sólo muestra NOVA, no selector OpenAI/Gemini/Anthropic/Ollama.

## Endpoint nuevo

`GET /api/system/providers`

## Política

- No ejecuta proveedores.
- No dispara acciones.
- No cambia proveedor visible.
- No expone secretos.
- No permite al usuario elegir modelo desde la UI estándar.

## Siguiente fase

12.7L-2C-B debe agregar router diagnóstico multi-proveedor sin duplicar el router cognitivo de NOVA.AGI.
