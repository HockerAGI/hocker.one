# HOCKER ONE — Operator Manual

## Proposito

Este manual define como operar Hocker ONE en beta privada sin activar ejecucion real.

## Principios

1. No ejecutar acciones reales desde Hocker ONE.
2. Mantener execution_lock = true.
3. Mantener real_execution_enabled = false.
4. Registrar eventos criticos en Supabase.
5. Usar SYNTIA como memoria de decisiones.
6. Usar NOVA como interfaz ejecutiva.
7. Integrar modulos por fases: register, health, events, read-only, dry-run, approval, signature, preflight y policy.

## Rutas principales

- /dashboard
- /status
- /integrations
- /access
- /memory
- /nodes
- /commands
- /governance
- /chido

## Operacion diaria

1. Revisar /status y confirmar critical_offline = 0.
2. Revisar /integrations y confirmar Chido online.
3. Revisar /access y confirmar roles activos.
4. Revisar /memory y confirmar memoria reciente.

## Regla Chido Casino

Cadena obligatoria: Research Gate -> dry-run -> approval request -> guardian approvals -> HMAC signature check -> execution preflight -> execution_lock.

Aunque preflight_passed = true, la ejecucion real sigue bloqueada.
