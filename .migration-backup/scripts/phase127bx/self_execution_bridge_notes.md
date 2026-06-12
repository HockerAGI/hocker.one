# HOCKER ONE — 12.7B-X Self-Execution Bridge

## Objetivo

Trasladar el proceso manual ChatGPT + Termux hacia Hocker ONE:

1. NOVA/AGI genera intención.
2. Se crea acción en `agi_action_queue`.
3. Owner revisa desde Hocker ONE.
4. Owner aprueba o rechaza.
5. Worker ejecuta solo si `status = approved`.
6. Resultado queda auditado en Supabase.
7. Se mantiene rollback y trazabilidad.

## Implementado

- Approved Execution Worker para GitHub.
- Owner Approval Center en `/owner`.
- API para listar, aprobar, rechazar y ejecutar.
- Context Pack para continuidad NOVA/AGI.
- Auditoría por `execution_result` y `execution_error`.

## Reglas

- Sin sesión: 401.
- Sin rol owner: no hay decisión ni ejecución.
- `main`, `master`, `production`, `prod`: bloqueadas.
- Worker inicial solo ejecuta GitHub.
