# HOCKER Context Bridge v1

Status: **DEPLOYED / ACTIVE OPERATING CONTRACT**  
Freshness policy: `docs/operations/CONTEXT_FRESHNESS_POLICY.md`

## Resultado buscado

Context Bridge permite que Hocker One conserve continuidad verificable entre ChatGPT, Codex, GitHub, Google Drive, Supabase y Vercel sin depender de copiar y pegar conversaciones completas.

No reemplaza a Memory Mirror. Son capas distintas:

- Context Bridge conserva estado operativo: fuentes consultadas, revisión exacta, decisiones, pendientes, cobertura, capacidades disponibles y evidencia.
- Memory Mirror conserva conocimiento reutilizable por las AGIs después de Syntia, NOVA y los controles de seguridad/aprobación existentes.
- GitHub mantiene contratos, código y migraciones versionadas.
- Supabase mantiene el registro operativo y checkpoints.
- Vercel ejecuta APIs stateless; no se convierte en memoria primaria.

## Orden de verdad

Cuando dos fuentes se contradicen:

1. Estado real de producción/configuración verificada.
2. Código y migraciones Git del SHA candidato.
3. Contratos y pruebas verificadas.
4. Canon documental aprobado.
5. Conocimiento externo con procedencia.
6. Conversaciones de ChatGPT o Codex.

Una conversación puede explicar una decisión, pero no demuestra deployment, migración o runtime.

## Adaptadores

| Adaptador | Lectura normalizada | Escritura externa | Evidencia mínima |
| --- | --- | --- | --- |
| ChatGPT | resumen, decisiones, pendientes y refs del proyecto | No directa | handoff normalizado + refs |
| Codex | workspace, rama, SHA, pruebas, decisiones y pendientes | Solo Owner Gate | repo/rama/SHA/tests |
| GitHub | repos, PR, checks, commits, security state | Rama/PR por Owner Gate | repo/PR/SHA/check |
| Google Drive | índice/documentos permitidos y change feed | Desactivada inicialmente | file/change revision + clasificación |
| Supabase | esquema, migrations, RLS, advisors y evidencia AGI | SQL/DDL por gate | project ref + migration/evidence |
| Vercel | proyecto, deployment, logs y dominio | deploy/config por gate | deployment + exact Git SHA |

Un adaptador no se considera sano por estar configurado como plugin. Debe publicar checkpoint válido con evidencia y una revisión concreta.

## Contrato de checkpoint

Cada cliente publica únicamente información normalizada:

- `project_id`, `source_id`, proveedor y tipo de fuente;
- referencia externa y revisión exacta;
- resumen corto;
- decisiones;
- pendientes;
- referencias canónicas;
- cursor no secreto;
- capacidades observadas y evidencia.

No se aceptan conversaciones crudas, historiales de mensajes, cookies, tokens, claves, contraseñas, credenciales, TOTP/KYC/PII ni variables secretas. Los secretos permanecen en su secret manager/llavero y nunca se copian a Context Bridge, Memory Mirror, RAG o memoria AGI.

La ruta `POST /api/context-bridge/checkpoints` requiere Owner/Internal Gate. Escribe solo estado interno; no ejecuta MCP ni modifica proveedores.

## Manifiestos y cobertura

Un manifiesto reúne checkpoints concretos para un alcance (`global`, `repository`, `project`, `conversation` o `release`). Incluye snapshots de capacidades y cobertura y comienza como `draft`.

Cobertura es fail-closed. Los estados son `complete`, `partial`, `missing`, `stale` o `blocked`.

**Regla corregida por Plan A:** recencia de checkpoint por sí sola nunca convierte un proveedor en `complete`. La cobertura del proveedor combina el checkpoint más reciente con su **capability evidence** actual. Un checkpoint fresco con capacidades solamente `partial/configured/missing` permanece `partial`; una capacidad actual `blocked` produce `blocked`; sólo evidencia fresca `verified` sin bloqueo puede completar la cobertura.

La creación y activación mantienen fronteras distintas:

- `POST /api/context-bridge/manifests`: crea drafts internos; `activate=true` falla cerrado.
- `POST /api/context-bridge/manifests/activate`: única ruta web de activación; exige usuario autenticado, membership exacta Owner y `auth.mfa.getAuthenticatorAssuranceLevel().currentLevel = aal2`.
- `/owner/context-bridge`: aplica el mismo gate Owner+AAL2 antes de leer/controlar activación.

Antes de activar:

1. sesión Owner real en AAL2;
2. cobertura completa;
3. `record_owner_gate_approval(jsonb)` registra evidencia estructurada;
4. `activate_context_bridge_manifest_v2(manifest_id, approval_id)` valida acción/recurso/proyecto/actor/expiración/consumo;
5. aprobación one-time y reciente;
6. sin secretos y sin invalidación;
7. manifiesto activo anterior pasa a `superseded`;
8. nueva referencia de aprobación queda vinculada;
9. AGIs reciben sólo contexto filtrado.

La aprobación expira a los 15 minutos. No existe fallback de activación por shared key.

## Automatización segura y frescura

El flujo vigente:

```text
ChatGPT/Codex/adaptador
  -> resumen normalizado + revisión + evidencia
  -> checkpoint Context Bridge
  -> draft manifest + coverage evidence-backed
  -> sesión humana Owner + MFA AAL2
  -> aprobación one-time
  -> activación
  -> NOVA/SYNTIA revisan aprendizaje reutilizable
  -> Memory Mirror
  -> feed especializado por AGI
```

La continuidad cercana a tiempo real es **por hitos/eventos**. El cron Vercel `17 8 * * *` es únicamente un backstop diario. GitHub tiene como target un GitHub App/webhook scoped; Google Drive tiene como target un canal renovable `changes.watch` más lectura del change feed. Hasta existir evidencia de esos adapters, se conserva `partial/stale` donde corresponda.

Las lecturas programadas pueden crear checkpoints/drafts mediante identidad interna. Ninguna identidad scheduled/internal puede activar un manifiesto.

## Estado desplegado y autoridad actual

La capa operativa Context Bridge está aplicada en producción. El runtime Hocker One actualmente autoritativo es:

- `main`: `945ed9cdeda909faa9823230d2a4f47ff84173c7`;
- Vercel production: `dpl_BbKA86LqvHBkbTDD2vnnsdRcYmT4` = `READY`;
- PR de cierre Plan A: #216, aislado de `main` hasta exact-head CI/Preview/security gates.

El estado desplegado incluye:

- TypeScript contract + secret detection;
- sources/checkpoints/manifests/coverage/capabilities;
- RLS y backend-only grants/policies aplicables;
- Owner Gate evidence;
- draft-only key-based manifest path;
- ruta de activación Owner+AAL2;
- one-time/15-minute approval evidence;
- Vercel daily reconciliation route fail-closed;
- unified Hocker One/NOVA continuity introduced in #214.

## Evidence cut — Plan A 2026-08-17 00:18Z

Se publicaron checkpoints normalizados e idempotentes, sin secretos, para:

- `github.ecosystem`: 9 repositorios y default heads actuales;
- `supabase.agi-evidence`: 16/16 AGIs guardadas, 39 runs, 34 assignments/15 AGIs y 0 `agi_eval_result`/`agi_tool_eval_result` persistidos;
- `vercel.hocker-one-runtime`: producción `dpl_BbKA...` / `945ed9cd...`;
- `chatgpt-hocker-project-handoff`: Plan A aprobado y ejecución #216;
- `google-drive-canon`: actualizado como **partial**, no como complete.

Codex no fue marcado artificialmente como fresco porque no se observó un handoff actual de workspace/runtime Codex durante este corte.

El manifiesto v3 existente permanece `draft`. Sus blockers de cobertura no se reinterpretan como resueltos sólo porque existan checkpoints más recientes. No se activa automáticamente.

## Memory Mirror

Memory Mirror sigue siendo conocimiento revisado, no operational heartbeat. El corte de producción previo a Plan A mostró 35 memorias activas, 34 con aprobación de seguridad + NOVA/SYNTIA, ninguna activa expirada y última actualización material el 2026-08-04. Esa antigüedad no se “corrige” copiando actividad operativa: nuevos hechos permanecen en Context Bridge hasta que un aprendizaje reutilizable pase el flujo de revisión.

## Límites de evidencia abiertos

- falta ceremonia conectada real de Owner MFA/TOTP/AAL2 para cierre humano;
- faltan eval/tool-eval productivos 16/16;
- `google_drive` conserva cobertura parcial hasta identificar el set editable canónico y/o probar el adapter renovable;
- runtime dedicado `nova.agi` sigue sin exact deployed revision + readiness/logs + authenticated fallback E2E;
- Supabase global security/migration-branch reconciliation sigue abierta;
- no existe attestation criptográfica externa independiente para identidades administrativas.

## Siguiente capa

- terminar fail-closed coverage semantics en #216;
- mantener `CONTEXT_FRESHNESS_POLICY.md` como contrato operativo ejecutable por tests;
- identificar el set editable canónico Drive por IDs y provenance;
- incorporar GitHub App/webhook y Drive `changes.watch` sólo con identidad scoped y lifecycle renewal;
- generar un **nuevo draft manifest** cuando el evidence set sea coherente; no reescribir el active histórico;
- activar únicamente tras cobertura completa + Owner AAL2 real.
