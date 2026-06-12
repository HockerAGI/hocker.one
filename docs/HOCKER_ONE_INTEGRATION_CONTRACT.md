# HOCKER ONE — Integration Contract

## Proposito

Este contrato define como integrar futuras AGIs, apps, APIs, endpoints, nodos, webhooks y servicios dentro de Hocker ONE sin romper arquitectura.

## Secuencia obligatoria

1. register
2. health
3. events
4. read-only
5. dry-run
6. approval
7. signature
8. preflight
9. policy
10. controlled execution

## Contrato base

module_id, name, type, status, health_endpoint, dashboard_path, actions_mode, real_execution_enabled=false, execution_lock=true, responsible_agis, capabilities, required_chain y risk_level.

## Reglas

- Toda integracion inicia bloqueada.
- real_execution_enabled inicia en false.
- execution_lock inicia en true.
- Toda accion sensible requiere audit log.
- Acciones financieras requieren NUMIA.
- Acciones compliance requieren JURIX.
- Acciones seguridad requieren VERTX.
- Memorias criticas pasan por SYNTIA.

## Modulo canonico actual

Chido Casino: actions_mode=preflight_locked, real_execution_enabled=false, execution_lock=true, risk_level=critical.

Por defecto, ninguna AGI puede ejecutar acciones reales.
