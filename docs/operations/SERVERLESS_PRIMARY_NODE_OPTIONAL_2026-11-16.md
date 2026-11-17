# HOCKER ONE — núcleo serverless primario; Node Agent físico opcional

Checkpoint del 16 de noviembre de 2026 (America/Tijuana). **No constituye certificación operativa del 100 %.** Revalidar hechos mutables contra GitHub, Vercel, Supabase y Cron antes de reutilizar.

## Decisión arquitectónica

- El control plane primario es Hocker One en Vercel, Supabase y el Cloudflare Worker coordinador ya existente.
- Las 16 AGIs conservan sus perfiles, memoria, pruebas y gobernanza de Hocker One. Sus modelos y ejecuciones requieren autorización, presupuesto y trazabilidad por separado.
- `nova.agi` dedicado es una extensión/fallback opcional. El `hocker-node-agent` físico es una extensión local opcional y no bloquea el núcleo serverless ni la ingeniería GitHub/Vercel.
- No encender, comprar, simular, marcar online ni crear dependencia de un host que no existe o no ha sido verificado. No duplicar Workers, cronjobs ni proveedores.
- Todo cambio material sigue sujeto a Owner Gate y la cadena rama → propuesta de código → PR → exact-head CI → revisión → Preview READY → autorización → merge/deploy → rollback.

## Contrato de salud y sus límites

`/api/system/status` sigue privado y ahora usa `health_scope=hocker_one_serverless_core`: web, Vercel, Supabase y API son esenciales; NOVA dedicada, Node Agent físico, PWA y Android son capacidades opcionales que **siguen apareciendo en los checks** pero no obligan al núcleo a reportar caída.

El indicador global debe marcar núcleo saludable únicamente si existen los cuatro checks esenciales identificados con `required:true` y están activos. Faltantes/desconocidos nunca son evidencia de salud. Las capacidades opcionales ausentes permanecen visibles como no verificadas en el tooltip.

`/api/health` conserva sus comprobaciones de compatibilidad, pero su campo `status` y código HTTP se limitan a DB, URL Supabase y clave pública configurada. La existencia de URLs/tokens HMAC, Langfuse o NOVA dedicada no equivale a uptime, inferencia o ejecución AGI real.

**Importante**: `core healthy` significa que los checks definidos del *control plane* respondieron, **no** que el Cron, las 16 AGIs, el runtime dedicado o el Node Agent estén ejecutando tareas autónomas. Los fallos de esos subsistemas necesitan alertas y SLO separados.

## Evidencia de arranque observada

- Hocker One main `488595d3d6dadd98292ad234a351de25c983b954`, Vercel production `dpl_3HhFSZCkEEwext1FrM4NUkvFudYy` READY.
- `nova.agi/main=8f52a0ad6402085c8a877418996c304491bacefc`; `hocker-node-agent/main=6401aad71a5552a6e331d83d8b0b4ab62a967aa2`.
- Supabase: 16 AGIs, 0 habilitaciones materiales globales, 0 tareas activas, 0 acciones pendientes, 0 tareas `owner-free-inventory-v1:%` persistidas.
- Vercel logs: coordinador autenticado `outcome=ok`, `fresh_nodes=0`, `model_requests=0`, `task_claims=0`; presencia del Cron no demuestra inferencia continua.
- `hocker-node-1.last_seen_at` permanece en 2026-05-16; `nova-runtime-1` no tiene heartbeat actual verificado.
- Tres repositorios sin PR abiertos al inicio de este trabajo; no se ha desplegado host ni habilitado escritura autónoma.

## Aceptación restante para autonomía de ingeniería serverless

1. Solicitud autenticada del Owner en NOVA de Hocker One para proponer un cambio reversible en un repo permitido, sin acceso directo a main.
2. Registro real NOVA→especialista, inspección MCP de GitHub al SHA actual y procedencia/coste/hashes auditables.
3. Borradores de acciones en `agi_action_queue` con autorización humana para ejecutar secuencialmente rama, archivos y PR; nunca simular su ejecución.
4. CI exact-head, revisión de seguridad sin hallazgos, Preview READY, aprobación humana de liberación, deploy al SHA aprobado y prueba de rollback.
5. Alertas de fallos de ejecución, Supabase y Cron entregadas a un canal real; evidencia de recuperación, reintento sin duplicación y ausencia de escrituras no autorizadas.

El expediente [hocker.one #306](https://github.com/HockerAGI/hocker.one/issues/306) conserva el estado global. [nova.agi #31](https://github.com/HockerAGI/nova.agi/issues/31) conserva el gate del runtime dedicado **opcional**; no elevarlo artificialmente a requisito del núcleo.
